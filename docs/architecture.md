# Architektur — ValidationKit

> Datum: 2026-05-21
> Zweck: "Wie liest man diesen Code?" — eine A4-Onboarding-Map für jemanden, der frisch ins Repo kommt. Kein Tutorial.

Volle Vision: [`docs/vision.md`](./vision.md). Tech-Stack-Constraints: [`.claude/CLAUDE.md`](../.claude/CLAUDE.md). Architektur-Decisions: [`docs/adrs/`](./adrs/).

---

## 1. Multi-Tenant-Datenmodell

URL-Slug-getrieben statt Subdomain. Workspaces in eigener Drizzle-Tabelle, **nicht** via Better-Auth Organization-Plugin (Build-vs-Buy-Begründung in [ADR-0006](./adrs/0006-workspace-tables-vs-betterauth-org.md)).

```
user ─┐
      ├── membership (role: admin|member) ── workspace ─┬── customer ── repo ── scan
      │                                                 ├── api_key  (geplant, nova-2-settings-backend)
      │                                                 ├── membership-invites (V2)
      │                                                 └── audit-trail events
session, account, verification (Better-Auth managed)
```

- **Routing:** Alles unter `/[workspace]/*` ist tenant-scoped. Layout (`apps/web/src/app/[workspace]/layout.tsx`) macht den Membership-Gate via `listUserWorkspaces(userId)`.
- **Slug-Hijacking-Schutz:** Layout validiert Membership pro Request, sonst `forbidden()`.
- **Single-Workspace-pro-User** ist Initial-Annahme — Multi-Workspace-Switch über URL-Change, keine `setActive`-Session-State.

## 2. Data-Access-Layer (DAL) + Cache-Tags

Vorbild-Funktion: `getGalaxieDataForWorkspace()` in [`apps/web/src/lib/dal/galaxie.ts:264–295`](../apps/web/src/lib/dal/galaxie.ts) — schichtet vier Concerns:

1. **Membership-Gate** (mit Legacy-`ownerId`-Fallback)
2. **Role-Resolve** (admin vs member)
3. **Lazy-Snooze-Expiry** inline (für gesnoozte Findings)
4. **Bulk-Loading** + `listSolutionStatusByFinding`

Plus **`unstable_cache` mit `revalidateTag(galaxieWorkspaceTag(id))`** — Cache pro Workspace, invalidiert beim Apply/Dismiss/Snooze.

### Cache-Tag-Konvention

- Feingranular: `workspace:<id>:<resource>` — z.B. `workspace:abc:scans`, `workspace:abc:findings`.
- Bulk: `workspace:<id>` — invalidiert ALLES für diesen Workspace.
- User-bound: `user:<id>:workspaces` — Membership-List-Cache.

Helper-Funktionen in [`apps/web/src/lib/cache-tags.ts`](../apps/web/src/lib/cache-tags.ts). Tests dort.

### Pattern für neue DAL-Funktionen

```ts
import { unstable_cache } from "next/cache";
import { workspaceTag } from "@/lib/cache-tags";

export const getXForWorkspace = unstable_cache(
  async (workspaceId: string) => {
    // 1. Membership-Gate (oder vor unstable_cache, je nach Auth-Layer)
    // 2. Direct Drizzle query mit eq(table.workspaceId, workspaceId)
    // 3. Return shape (kein leak)
  },
  ["dal-x-by-workspace"],
  { tags: [workspaceTag(workspaceId)] }
);
```

Server-Actions (z.B. `applyAction`) müssen `revalidateTag(workspaceTag(id))` aufrufen.

## 3. Multi-Tool-Parser-Pipeline

Audit-Eingang ist ein Repo-Pfad. `scanRepository(rootPath)` aus [`@vk/parser`](../packages/parser/) liefert `ParserResult` mit `ParsedAgentFile[]`. Erkennt 12 Vendor-Surfaces:

| MUST-5 (load-bearing) | SHOULD/MAY |
|-----------------------|------------|
| CLAUDE.md             | gemini-md  |
| AGENTS.md             | cursor-rule-mdc + cursor-rules-legacy |
| .claude/agents/*      | windsurf-rule |
| .claude/commands/*    | cline-rule + codex-rule |
| .claude/skills/*      | aider-conf |

Parser-Spezifika:

- **Frontmatter:** YAML via `gray-matter`. Body separat. Token-Count via `js-tiktoken`.
- **Outlinks:** Markdown-Links + `@`-Mentions werden extrahiert für Stale-Reference-Audit.
- **Cursor-Activation-Modes:** `always / auto-attached / agent-requested / manual` — geparst aus `.mdc`-Frontmatter.
- **Token-Budget:** Pro File + Per-Repo via `MUST_KINDS`-Filter.

## 4. Audit-Rule-Pipeline (5 deterministisch + 1 LLM)

`runAudit(parserResult)` in [`@vk/audit/run.ts`](../packages/audit/src/run.ts) executes rules in fixed order:

1. **unused-agents** (`@vk/audit/rules/unused-agents.ts`) — Files mit `0 outlinks` + `0 inlinks`.
2. **duplicate-guidance** (`duplicate-guidance.ts`) — Trigram-Jaccard ≥0.85.
3. **context-bloat** (`context-bloat.ts`) — Token-Count über Per-File-Budget.
4. **stale-references** (`stale-references.ts`) — Outlinks ohne Target-File.
5. **token-budget** (`token-budget.ts`) — Repo-weite Token-Summe vs. Per-Repo-Budget.
6. **conflicting-rules** (LLM, [`@vk/llm/rules/conflicting-rules.ts`](../packages/llm/src/rules/conflicting-rules.ts)) — Provider-agnostisch via `selectModel()` + `providerModel()` ([ADR-0005](./adrs/0005-llm-multi-provider.md)). Confidence-Banding: nur Findings ≥`mid` werden gerendert.

LLM-augmented Fix-Suggestion für Context-Bloat: [`@vk/llm/rules/context-bloat-llm.ts`](../packages/llm/src/rules/context-bloat-llm.ts) — BOUNDED-LLM (LLM wählt aus vorgegebener Heading-Liste, kein Free-Form-Diff).

## 5. Render-Strategien

- **Landing-Hero** (`/`, `/pricing`, `/login`, marketing surfaces): **SVG + motion** — ([ADR-0004](./adrs/0004-landing-svg-stack.md)). Statische Composition, niedrige FCP, a11y-freundlich.
- **Workspace-Galaxie** (`/[workspace]/*`): **PixiJS v8 + @pixi/react** ([ADR-0002](./adrs/0002-ui-render-stack.md)) — Pan/Zoom über echte Daten, 60fps @ 10k+ Sprites. Lädt via `dynamic(ssr: false)` (Pixi nutzt `window` at module-eval).
- **App-Pages** (`/dashboard`, `/billing`, `/[workspace]/scans`, etc.): **Next 16 RSC + Cache Components** (siehe `cacheTag`/`cacheLife`-Pattern in Layouts).
- **Mobile:** Vaul Bottom-Sheet Inspector + Accordion-RepoTreeView (`<768px` heuristic via media-query + container-query).
- **Reduced-Motion:** `<StaticGalaxieSVG>` als Fallback auch im Workspace, gegated über `prefers-reduced-motion`.

## 6. Auth-Pipeline

- **Better-Auth 1.6** mit `magicLink`-Plugin only ([`packages/auth/src/server.ts`](../packages/auth/src/server.ts)). Tokens SHA-256-hashed, 10min Expiry, cookieCache 5min.
- **Email-Transport:** Über `nodemailer` SMTP. `RESEND_API_KEY` schaltet auf `smtp.resend.com:465`, ohne den Wert → Mailpit-Fallback `127.0.0.1:1025`. **Kein** Resend-Node-SDK.
- **Magic-Link-Body:** React-Email-Component in [`packages/auth/src/emails/MagicLinkEmail.tsx`](../packages/auth/src/emails/MagicLinkEmail.tsx).
- **Routes:** `/login` → Magic-Link versenden; `/auth/verify` → Token-Verify + Server-Side Session-Lookup + safeNext-redirect.

## 7. Background-Jobs (Inngest)

- **Functions** in [`packages/inngest/src/functions/`](../packages/inngest/src/functions/): `audit-requested`, `repo-updated`, etc.
- **Dispatch:** API-Routes (`/api/install-webhook`, `/api/notify-update`) publishen Events via `inngest.send()`.
- **Threshold-Background-Enqueue:** Audits mit ≥`BACKGROUND_THRESHOLD` Files (~50) laufen via Inngest statt Server-Action.
- **Dev:** Inngest Dev-Server auf `localhost:8288` via Docker.

## 8. Webhook-Härte-Pattern (Production-Vorbild)

Drei externe Webhooks teilen das gleiche Härte-Pattern:

| Route | Provider | HMAC | Idempotency | Rate-Limit |
|-------|----------|------|-------------|------------|
| `/api/install-webhook` | GitHub App | SHA-256, `x-hub-signature-256` | `x-github-delivery` ID | — |
| `/api/notify-update` | Repo-Sync | SHA-256 per-Repo-Secret | `last_commit_sha` | yes |
| `/api/stripe/webhook` | Stripe | Stripe-Sig | Stripe Event-ID | — |

Alle drei:

- Lesen Raw-Body, **nicht** parsed.
- `timingSafeEqual` für HMAC-Vergleich.
- Idempotenz über DB-stored Event-IDs.
- Dispatch via Inngest-Send, nicht direkt verarbeitet.

**Für neue Webhooks: dieses Pattern kopieren, nicht ad-hoc schreiben.**

## 9. App-Router-Boundaries

Vorbild für Server-Component / Client-Component-Split: [`apps/web/src/components/SiteNav.tsx`](../apps/web/src/components/SiteNav.tsx) (Server, liest Session) + `SiteNavLinks.tsx` (Client, rendert active-state via `usePathname`).

- **Server-Components** machen den DAL-Call. Daten flow via Props.
- **Client-Components** sind nur dort, wo State (`usePathname`, `useState`, `useEffect`) wirklich nötig ist.
- **Server-Actions** in `apps/web/src/lib/` mit `"use server"`. Cache-Invalidation via `revalidateTag`.

## 10. Wo finde ich was

Siehe [`.claude/CLAUDE.md`](../.claude/CLAUDE.md) §"Wo finde ich was".
