# Audit Sub-5 — Security

> Generated: 2026-05-21
> Domain: Secrets · Auth · RBAC · CSRF · Webhooks · OWASP
> Convention: Severity-Bänder {Kill, Strong, Mid, Weak, Exceptional}

## Summary
- **Secrets scanned**: 13 pattern hits — **0 real leaks** (committed), 11 documentation/test/redacted placeholders, 2 sit only in untracked `.env.local`.
- **NEXT_PUBLIC vars**: 1 (`NEXT_PUBLIC_APP_URL`) — URL only, no secret leak.
- **DAL functions w/o workspace-check**: 0 hard leaks in user-scoped DAL; **2 helpers (SSE stream + audit-trail-export) assume `ownerId === userId`** — invitee-as-`admin` members get the wrong workspace context (not a cross-tenant leak, but a feature bug + side-channel for the export).
- **Webhook endpoints w/o signing**: 0 (Stripe + GitHub-App both verify HMAC; Inngest signing via `serve()`; `/api/notify-update` uses per-repo HMAC with `timingSafeEqual`).
- **Rate-limited endpoints**: 2/3 mutating public endpoints (audit + notify-update); **Better-Auth `[...all]` magic-link request endpoint relies entirely on Better-Auth's internal throttling** — no explicit IP-rate-limit at the route boundary.

Overall posture: **Strong**. Webhook plumbing, BYOK envelope-crypto, raw-body signature verification, and the workspace-membership gate in every server-action are textbook. The two genuine smells are: (1) the `ensureDefaultWorkspace(userId)` shortcut that silently picks the owner-row when the user is also a member of multiple workspaces, and (2) a couple of legal-export side-channels that fall back to `ownerId` instead of going through `resolveWorkspaceFromSlug`.

---

## Findings

### [Mid] FN-SEC-01 — `ensureDefaultWorkspace` is owner-only; member-only users get the wrong workspace silently
**File:** `apps/web/src/lib/workspaces.ts:14-34`, callers in `apps/web/src/lib/audit-action.ts:69`, `apps/web/src/lib/billing-actions.ts:66,118,175`, `apps/web/src/app/api/events/stream/route.ts:43`
**Issue:** The function filters with `where(eq(schema.workspace.ownerId, userId))`. A user who was invited as `admin` to a workspace (and has no workspace of their own) will hit the `if (found) return` miss, then **create a brand-new workspace** owned by themselves on the very next call. That new workspace then becomes their "default" for billing-checkouts, SSE event-stream, and audit-trail-export — none of those will ever surface the membership-workspace they were invited into.
**Why Mid (not Kill):** No cross-tenant data-leak — the membership-workspace's data stays gated by `userIsMember` / `resolveWorkspaceFromSlug`. The damage is functional + a side-channel (the auto-created workspace is empty, so the SSE / audit-trail return empty streams — looks like a bug to the invitee).
**Suggested Fix:** Replace `ensureDefaultWorkspace` with `resolveSelectedWorkspace(userId)` that reads the `vk_default_workspace_slug` cookie (the proxy already sets it) and falls back to `listUserWorkspaces(userId)[0]`. Auto-create only when the user has zero memberships. Bonus: pass the workspaceSlug explicitly from the calling page so server-actions don't have to guess.

---

### [Mid] FN-SEC-02 — `exportAuditTrail` selects workspace by `ownerId` only — non-owner admins can't export, and the webhook stream is unscoped
**File:** `apps/web/src/lib/audit-trail-export.ts:41-46,128-139`
**Issue:** Two problems in one helper:
1. `where(eq(schema.workspace.ownerId, user.id)).limit(1)` — admins/members never get an export of the workspace they belong to; only owners do.
2. The `webhookEvent` query has **no `where` clause** — it orders by `receivedAt desc` and returns up to 500 most-recent webhook events **across all workspaces**. The comment says "workspace-implicit via repo" and shipping it is "fine for the Compliance-Frame customer" — but `delivery_id`, `event_name`, `action`, and `status` of every customer's GitHub install/uninstall/repo-add events bleed into every owner's compliance export.
**Why Mid:** Webhook payload itself isn't dumped — only metadata (delivery_id, event_name, action, status). Still, install/uninstall timing per workspace is a competitive/operational signal that doesn't belong in another tenant's export.
**Suggested Fix:** Join `webhookEvent` against `repo` on `github_installation_id` and filter to the exporter's workspace. Same for the role-gate: use `listUserWorkspaces(userId)` + an explicit slug picker rather than `ownerId === userId`.

---

### [Mid] FN-SEC-03 — Better-Auth magic-link request endpoint has no explicit rate-limit at the route boundary
**File:** `apps/web/src/app/api/auth/[...all]/route.ts:1-17`
**Issue:** The route handler hands every `GET`/`POST` straight to `auth.handler(req)`. There is no IP-keyed throttle around the magic-link request path (e.g. `/api/auth/magic-link/send`). Better-Auth ships internal protections, but they aren't pinned to anything we control — and the `audit-action` rate-limit explicitly *only* covers `/audit` form submissions.
**Why Mid:** Resend can survive bursts and Better-Auth de-dupes by email, but an attacker can still walk a known email list to (a) cause an inbox-noise DoS and (b) burn the Resend daily quota.
**Suggested Fix:** Wrap `handle` with `checkRateLimit({ key: ip:<addr>, tier: "anonymous" })` for any path containing `/magic-link/send` (or all POSTs). The in-memory limiter from `lib/rate-limit.ts` is fine for v0.0.19; KV-backed swap is the Phase-2 follow-up already documented in the file header.

---

### [Mid] FN-SEC-04 — `/api/notify-update` rate-limit is per-region in-memory (Vercel Fluid Compute)
**File:** `apps/web/src/app/api/notify-update/route.ts:10-34, 106`
**Issue:** The `inFlight` Map sits in module scope. On Vercel Fluid Compute each region keeps its own map, so the documented "max 10/min/repo" is actually "max 10/min/repo/region". HMAC keeps it from being a forgery surface, but a colluding/multi-region caller (or just an unlucky burst) bypasses the soft cap.
**Why Mid:** Same shape as the audit rate-limiter — already acknowledged as a Phase-2 KV swap in `lib/rate-limit.ts`. The HMAC verification is the real load-bearing defence; the limiter is just a soft buffer.
**Suggested Fix:** Same as FN-SEC-03 — move both limiters to Vercel KV / Upstash when budget allows. No change urgent today.

---

### [Weak] FN-SEC-05 — No security headers (CSP, X-Frame-Options, Strict-Transport-Security, Referrer-Policy)
**File:** `apps/web/next.config.ts:1-77`, `apps/web/src/proxy.ts:1-49`, `vercel.json:1-5`
**Issue:** Neither `next.config.ts` (`headers()` is missing entirely) nor the proxy adds CSP, HSTS, X-Frame-Options, X-Content-Type-Options, or Referrer-Policy. Vercel sends a default `Strict-Transport-Security` on the platform domain only — custom-domain visitors get nothing until configured.
**Why Weak:** Phase-Nova-2 ships Trust-pages + DPA — security headers are exactly the soft-trust signal compliance-frame customers grep for. No active exploit path today (no untrusted user-content rendered as HTML; `dangerouslySetInnerHTML` is unused), but XSS-defence-in-depth + click-jack defence + referer-stripping are baseline expectations.
**Suggested Fix:** Add a `headers()` block to `next.config.ts`:
```ts
async headers() {
  return [{
    source: "/(.*)",
    headers: [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ],
  }];
}
```
CSP is the bigger lift (PixiJS + Better-Auth need careful `script-src`); ship the cheap four first.

---

### [Weak] FN-SEC-06 — Better-Auth cookie config relies on framework defaults; `secure` / `sameSite` / domain are not explicitly pinned
**File:** `packages/auth/src/server.ts:61-120`
**Issue:** The `betterAuth({...})` config sets `secret`, `baseURL`, `session.cookieCache`, and the magic-link plugin — but **does not pass an explicit `advanced.cookies` / `advanced.cookiePrefix` / `advanced.useSecureCookies` / `advanced.crossSubDomainCookies` block**. Better-Auth 1.6 defaults to `secure=true` + `httpOnly=true` + `sameSite='lax'` when `baseURL` is HTTPS, but the local-dev `http://localhost:3000` fallback (line 63) flips secure off — a self-hosted deployment that forgets to set `AUTH_BASE_URL=https://...` keeps secure=false in prod.
**Why Weak:** Vercel deploys auto-set `AUTH_BASE_URL` via `secrets-rotation.md`, so this is a footgun for self-hosters, not for us today.
**Suggested Fix:** Pin defensively:
```ts
advanced: {
  useSecureCookies: process.env.NODE_ENV === "production",
  defaultCookieAttributes: { sameSite: "lax", httpOnly: true },
}
```
…and add a `health-check.ts` check that warns when `NODE_ENV=production` and `AUTH_BASE_URL` doesn't start with `https://`.

---

### [Weak] FN-SEC-07 — `/api/events/stream` doesn't check that the workspace-derived from `ensureDefaultWorkspace` matches the cookie-selected workspace
**File:** `apps/web/src/app/api/events/stream/route.ts:34-47`
**Issue:** Same root cause as FN-SEC-01 — the SSE picks `ensureDefaultWorkspace(user.id)` (owner-only). A member-only user gets either an empty stream from an auto-created phantom workspace, or — if they happen to also own a different workspace — events from the wrong tenant. The membership gate is correctly enforced in `getGalaxieDataForWorkspace`, but the SSE side-channel doesn't go through the slug-resolver.
**Why Weak:** Doesn't leak across tenants — every event row is filtered by `event.workspaceId = workspaceId`. The risk is the wrong workspace + the same cross-tenant footgun seeded by FN-SEC-01.
**Suggested Fix:** Take `workspaceSlug` as a `?workspace=<slug>` query param + resolve through `resolveWorkspaceFromSlug` so the membership gate is the same one used by every page.

---

### [Exceptional] FN-SEC-08 — Webhook signing is correct on all three webhook entry-points
**Files:**
- `apps/web/src/app/api/stripe/webhook/route.ts:88-100` — `stripe.webhooks.constructEvent(rawBody, sig, secret)` with raw-body via `req.text()` *before* JSON parse, `runtime="nodejs"`, idempotent on `stripe_event.id`.
- `apps/web/src/app/api/install-webhook/route.ts:38-48` + `packages/github-app/src/webhook.ts:18-37` — `createHmac("sha256", secret).update(rawBody)` + `crypto.timingSafeEqual(...)`, only SHA-256 header trusted (SHA-1 explicitly rejected), idempotent on `webhook_event.delivery_id`.
- `apps/web/src/app/api/notify-update/route.ts:14-23,95-104` — per-repo `notify_secret` HMAC + `timingSafeEqualHex`.
- `apps/web/src/app/api/inngest/route.ts:1-4` — `serve({ client, functions })` enforces `INNGEST_SIGNING_KEY` internally.
**Why Exceptional:** Raw-body + `timingSafeEqual` + idempotency-key + node-runtime is the textbook setup. The `notify_secret` per-repo design is even better than a shared secret — compromising one repo's webhook doesn't compromise anything else.

---

### [Exceptional] FN-SEC-09 — BYOK envelope encryption (AES-256-GCM)
**File:** `packages/billing/src/byok-crypto.ts:1-73`
**Issue (none):** Random 12-byte IV per encrypt, GCM auth-tag stored separately, key-length asserted at load, `BYOK_ENCRYPTION_KEY` required and base64-validated. The plaintext never leaves the server; decrypt only happens when assembling provider clients. Mirrors ADR-0007 + ADR-0008.
**Why Exceptional:** Most teams reach for `crypto.createCipher` (broken) or roll their own IV-as-counter. This is the right primitive used correctly.

---

### [Exceptional] FN-SEC-10 — Workspace-membership gating is consistent across every mutating server-action
**Pattern:** Every mutating `"use server"` file (apply-dal, customer-actions, install-requests, membership, fix-actions, solution-dal, audit-action, billing-actions, dpa-actions, workspace-ai-actions, scan-status) starts with:
1. `getSessionUser()` → null-check → `{ ok: false, error: "Not signed in." }`
2. Either `resolveWorkspaceFromSlug(slug, user.id)` (which 404s when the user is not a member or legacy owner) **or** `userIsMember(workspaceId, userId)` (membership-table active + legacy owner fallback).
3. RBAC on the role for elevated actions: `decideInstall` checks `owner | admin` (install-requests.ts:92-99), `revokeMember` checks `owner` (membership.ts:205-208), `inviteAdmin` checks `owner | admin` (membership.ts:87-93), and a shared `requireRole(workspaceId, userId, [...])` helper exists (membership.ts:230-242) ready for further use.

**Why Exceptional:** Zero raw-`db.update`/`db.insert` calls escape the gate — even `addRepoUnderCustomer` re-checks `(customer.id, workspaceId)` *and* the quota before insert. The membership-row + legacy-owner fallback is consistent in three independent helpers (`apply-dal.ts:28-56`, `solution-dal.ts:82-110`, `dal/galaxie.ts:114-142`).

The only nitpick: three copies of `userIsMember` exist instead of one shared helper (apply-dal, solution-dal, dal/galaxie). Extracting to `lib/membership.ts` would reduce drift risk over time.

---

## Sub-Scan Notes (no findings, useful context)

**Secret scan hits (all benign):**
- `docs/plans/production-live-connect-stub.md:25`, `docs/operations/stripe-go-live.md:62,66,67`, `docs/operations/secrets-rotation.md:55,56` — runbook placeholders.
- `scripts/stripe-test-setup.ts:97,99` — `key.startsWith("sk_test_")` assertion (defence, not a leak).
- `packages/llm/src/select.test.ts:74,77`, `packages/billing/src/byok-crypto.test.ts:25`, `packages/llm/src/rules/conflicting-rules.test.ts`, `eval/conflicts/README.md:23`, `apps/web/src/lib/repo-galaxie/demo-data.ts:388` (`"sk-ant-api03-redacted"`) — explicit test fixtures or redacted demo data.
- `.env.local` is gitignored (`/.gitignore:1-3`) and `git ls-files | grep .env` confirms only `.env.example` is tracked. The base64 `AUTH_SECRET` and hex `GITHUB_APP_WEBHOOK_SECRET` I observed live only on the developer's machine.

**NEXT_PUBLIC_ scan:** Only `NEXT_PUBLIC_APP_URL` (4 server-side reads — `apps/web/src/app/api/stripe/webhook/route.ts:17`, `apps/web/src/app/trust/sub-processors.xml/route.ts:7`, `apps/web/src/lib/stripe.ts:112`, `packages/inngest/src/functions/prepaid-credit-expirer.ts:33`). It is a URL, not a secret.

**SQL-injection surface:** Five `sql\`...\`` template-literal call-sites; all are static SQL with no user-input interpolation (`SELECT 1` in health-check; `'[]'::jsonb` literal defaults in schema; static SELECT in `credits.ts:126` and the credit-aggregator). Drizzle parameterises everything else.

**XSS surface:** Zero `dangerouslySetInnerHTML`, zero `eval(`, zero `new Function(`. React's default escaping plus the absence of HTML-pass-through means the XSS surface is effectively closed at the framework level.

**CORS:** No `Access-Control-Allow-Origin` is set anywhere in the codebase. All API routes are same-origin only — correct for the webhook + SSE + audit-trail surfaces.

**CSRF:** Next.js Server Actions auto-mint + verify a CSRF token via the `Next-Action` header + origin check. Custom POST routes are signature-verified (webhooks) or session-gated (`/api/events/stream`, `/api/audit-trail`). No CSRF gap.

**Prototype pollution:** Two `JSON.parse(rawBody)` call-sites (install-webhook, notify-update) feed payloads into Drizzle inserts with explicit column projection — no `Object.assign({}, untrusted)` anywhere. Safe.

---

## Suggested Follow-Ups (priority order)
1. **Unify "selected workspace" resolution** — replace `ensureDefaultWorkspace` callers with a slug-aware helper (kills FN-SEC-01, -02, -07 in one shot).
2. **Add the four cheap headers** in `next.config.ts` (FN-SEC-05).
3. **Pin Better-Auth advanced cookie defaults** (FN-SEC-06) and add a `health-check` warning for non-HTTPS `AUTH_BASE_URL`.
4. **Rate-limit the `/api/auth/[...all]` POST path** by IP for `/magic-link/send` (FN-SEC-03).
5. **Extract a single `userIsMember`** to `lib/membership.ts` so the three copies don't drift (cosmetic, but cheap insurance).
