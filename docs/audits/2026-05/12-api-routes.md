# Audit Sub-12 — API-Routes + Webhooks

> Generated: 2026-05-21
> Domain: Routes · Server-Actions · Webhooks · Inngest · Idempotenz
> Convention: Severity-Bänder {Kill, Strong, Mid, Weak, Exceptional}

## Summary

- **API-Routes:** 7 (auth, inngest, install-webhook, notify-update, audit-trail, events/stream, stripe/webhook)
- **Webhook-Endpoints mit Signing-Verify:** 3/3 (`stripe/webhook` ✓, `install-webhook` ✓, `notify-update` ✓)
- **Idempotent (PK-Replay-Drop):** 3/3 (`stripeEvent.id`, `webhookEvent.deliveryId`, `repo.lastCommitSha`)
- **503-Fallback bei fehlenden Keys:** 6/7 — `inngest/route.ts` schwächste Stelle (siehe FN-04)
- **Server-Actions:** 8 Files, ~25 exportierte Actions — **0 mit zod/strukturierter Input-Validation** (manuell via `String()`-Coercion)
- **Inngest-Functions:** 5 (1 Event-Trigger, 4 Crons) — alle mit eindeutigen Step-Names auf statischer Ebene; `submit-${row.ledgerId}` und `poll-${r.id}` sind dynamisch aber durch PK eindeutig
- **SSE-Stream:** korrekt konfiguriert (no-store implizit via `no-cache, no-transform` + `Connection: keep-alive` + `X-Accel-Buffering: no`)

**Headline:** Webhook-Layer ist **exceptional** — Signing + Idempotenz + 503-Pattern überall sauber. **Schwachstelle:** Server-Actions ohne strukturierte Input-Validation und `inngest/route.ts` ohne explizite `signingKey`-Konfiguration / 503-Guard.

---

## Findings

### [Exceptional] FN-01 — Stripe-Webhook Idempotenz + Signing-Verify Best-Practice

**File:** `apps/web/src/app/api/stripe/webhook/route.ts:65–116`

**Issue:** Pattern ist textbook:
- `req.text()` BEFORE JSON-parse (Edge würde Body re-encoden und Signatur brechen) — explizit `runtime = "nodejs"` (Z39).
- `stripe.webhooks.constructEvent(rawBody, signature, secret)` mit explizitem 400 bei Signaturfehler (Z93–99).
- Idempotenz via `INSERT … ON CONFLICT DO NOTHING` auf `stripeEvent.id` PK (Z104–116) — Replay returnt `{ ok: true, duplicate: true }`.
- 503-Fallback wenn `STRIPE_WEBHOOK_SECRET` fehlt (Z72–78) UND wenn `isStripeEnabled()` false (Z66–71).

**Why Exceptional:** Genau die Reihenfolge (rawText → constructEvent → DB-PK-dedupe → handler) verhindert double-billing und ermöglicht Retry-Safety. Kommentar Z42–64 dokumentiert load-bearing Constraints lückenlos. Vorbild für andere Webhook-Endpoints.

---

### [Exceptional] FN-02 — Install-Webhook HMAC-Verify + Delivery-ID-Replay

**File:** `apps/web/src/app/api/install-webhook/route.ts:22–117`

**Issue:**
- 503 bei `!secret` (Z23–32) und `!isDbEnabled()` (Z50–55).
- HMAC-SHA-256 Verify via `@vk/github-app` `verifyWebhookSignature` (Z38–48), 401 bei invalid.
- `x-github-delivery` als Idempotenz-Key (Z64–86) — `webhookEvent`-Tabelle als Audit-Trail mit `status`-Lifecycle (`processing` → `processed`/`failed`).
- Pflicht-Header `x-github-delivery` → 400 wenn fehlt (Z65–69).

**Why Exceptional:** Identischer Standard wie Stripe-Webhook, sogar mit `failureReason`-Audit-Log-Pattern. Comment Z11–21 dokumentiert die drei Guard-Layer-Strategie.

---

### [Exceptional] FN-03 — Notify-Update Timing-Safe HMAC + Per-Repo-Rate-Limit

**File:** `apps/web/src/app/api/notify-update/route.ts:14–34, 95–115`

**Issue:**
- `crypto.timingSafeEqual` mit length-check (Z14–23) verhindert timing-attacks.
- Per-repo Rate-Limit (`inFlight`-Map, 10 req/min) ist die einzige Public-API-Route mit Rate-Limit (Z106–111).
- SHA-skip wenn unverändert (Z113–115) — kein no-op Audit-Run.

**Why Exceptional:** Einzige Route mit per-resource Rate-Limit (`audit-trail` und Stripe-Webhook nicht, was OK ist — Trail ist auth-gated, Stripe wird durch Stripe selbst rate-limited).

---

### [Strong] FN-04 — `inngest/route.ts` ohne `signingKey` und ohne 503-Guard

**File:** `apps/web/src/app/api/inngest/route.ts:1–4`

**Issue:**
```ts
import { serve } from "inngest/next";
import { inngest, functions } from "@vk/inngest";
export const { GET, POST, PUT } = serve({ client: inngest, functions });
```
- Kein `signingKey` an `serve()` übergeben — Inngest-SDK liest `INNGEST_SIGNING_KEY` aus env, aber **kein 503-Fallback** wenn unset (im Gegensatz zu allen anderen Webhook-Routes).
- Kein `runtime = "nodejs"` deklariert (Inngest-Endpoint braucht Node — Edge würde Body-Signing brechen, gleiche Failure-Mode wie Stripe).
- Auf Vercel-Prod ohne `INNGEST_SIGNING_KEY` würden Inngest-Cloud Webhook-Calls unauthentifiziert akzeptiert oder mit 5xx fehlschlagen — beides Strong-Severity (Replay-Risiko bzw. silent broken Cron-Jobs).

**Suggested Fix:** 
```ts
import { serve } from "inngest/next";
import { inngest, functions } from "@vk/inngest";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
  signingKey: process.env.INNGEST_SIGNING_KEY,
});
```
Falls Dev-Server (`pnpm stack:up`) ohne Signing laufen soll: Conditional-503 in einem Wrapper-Handler analog zu `auth/[...all]/route.ts`.

**Why Strong:** Inkonsistenz zum Rest des Codebase — alle anderen Webhook-Routes haben den 503-Guard explizit. Production ohne signing-key wäre still kaputt.

---

### [Strong] FN-05 — Server-Actions ohne strukturierte Input-Validation

**Files:** 
- `apps/web/src/lib/audit-action.ts:82–199`
- `apps/web/src/lib/customer-actions.ts:22–74`
- `apps/web/src/lib/billing-actions.ts:94–104, 214–231`
- `apps/web/src/lib/workspace-ai-actions.ts:30–165`
- `apps/web/src/lib/fix-actions.ts:19`
- `apps/web/src/lib/apply-actions.ts:13–51`

**Issue:** Kein zod (auch nicht im Workspace installiert — `grep zod` returnt nichts). Alle FormData-Inputs werden manuell mit `String(fd.get("…") ?? "")` extrahiert + ad-hoc-Checks:
- `audit-action.ts:86` — `raw = String(formData.get("path") ?? "").trim()` → keine max-length, kein URL-format-check (außer via `looksLikeGithubUrl`).
- `workspace-ai-actions.ts:39` — `apiKey = String(formData.get("apiKey") ?? "").trim()` → kein min-length, kein format-check (BYOK-Keys werden encryptet ohne Validation).
- `customer-actions.ts:23` — `label = String(fd.get("label") ?? "")` → kein length-cap, kein trim, kein sanitize.
- `billing-actions.ts:215–221` — `sizeNum` numeric-coerce, aber explizit `if (sizeNum !== 100 && sizeNum !== 500)` (richtig, aber pattern könnte schiefgehen wenn Werte wachsen).
- `fix-actions.ts:19` — `findingIds: string[]` direkt von client → kein UUID-format-check, kein size-cap (DoS via 10k-Element-Array möglich).

**Why Strong:** Server-Actions sind Public-Surface (vom Client triggerbar). Ohne Schema-Validation:
- DoS: unbounded string-lengths / arrays.
- Type-Confusion: `formData.get` kann `File | string | null` returnen.
- Stored-XSS via `label`/`workspaceName` wenn diese unsanitized rendered werden.

**Suggested Fix:** zod installieren + Validation-Wrapper:
```ts
import { z } from "zod";
const AuditInput = z.object({
  path: z.string().min(1).max(1024).trim(),
  intensity: z.enum(["quick", "deep"]).optional(),
});
function parseFormData<T extends z.ZodTypeAny>(fd: FormData, schema: T) { … }
```
Alternativ valibot (smaller bundle) wenn zod-Bundle-Cost ein Issue ist.

---

### [Strong] FN-06 — `applySolutionAction` / `pollSolution` ohne Ownership-Check

**File:** `apps/web/src/lib/solution-actions.ts:18–24`

**Issue:**
```ts
export async function pollSolution(findingId: string): Promise<SolutionRow | null> {
  // Poll variant — no auth required because it's a read-only lookup and
  // the inspector already proved access via requestSolution.
  return getSolution(findingId);
}
```
Kommentar gibt zu: kein Auth-Check. Annahme "inspector already proved access" ist load-bearing aber **untestbar** und brüchig — falls Client `findingId` direkt aus URL/Form sniped, ist Daten-Leak möglich. Selbst wenn `getSolution` nur Status returnt, ist Existence-Confirmation ein Side-Channel (findingId-Enumeration).

**Why Strong:** Information-Disclosure-Vector. Solo-Developer-Projekt = noch wenig Impact, aber bei Multi-Tenancy mit Agency-Customers wäre das Compliance-Issue.

**Suggested Fix:** `getSolution(user.id, findingId)` mit ownership-join — selbe Pattern wie `applySolution(user.id, …)`.

---

### [Strong] FN-07 — `workspace-ai-actions.ts` setSpendCap — dead-code + magic-math

**File:** `apps/web/src/lib/workspace-ai-actions.ts:116–145`

**Issue:** Z125–132 enthält explizit kommentierten Math-Bug:
```ts
const microcents = num === null || ... ? null : Math.round(num * 100 * 100 * 100);
// EUR → microcents: 1 EUR = 100 cents = 10_000 microcents... wait.
// Convention used in DB: 1 USD-cent = 1000 microcents (Sub-Plan-A).
// So 1 EUR = 100 cents = 100_000 microcents. Redo the math.
…
const microcentsCorrected = … Math.round(num * 100_000);
…
void microcents;
```
- Dead-code (`microcents` wird via `void` markiert, nur `microcentsCorrected` geschrieben).
- Mental-Math-Trail im Production-Code.

**Why Strong:** Selbst wenn das korrekte Resultat geschrieben wird — nächster Refactor liest das Comment-Trail, ändert die Falsche Variable. Klassischer Money-Math-Footgun.

**Suggested Fix:** Dead-code löschen, Konvention in @vk/billing als `eurToMicrocents(n: number)` extrahieren mit Test.

---

### [Mid] FN-08 — Stripe-Webhook handler-Errors returnen 500 statt selektives 2xx

**File:** `apps/web/src/app/api/stripe/webhook/route.ts:155–158`

**Issue:**
```ts
} catch (err) {
  console.error(`[stripe-webhook] handler failed for ${event.type}`, err);
  return NextResponse.json({ error: "Handler error." }, { status: 500 });
}
```
Bei handler-failure (z.B. transient DB-error in `applyTierToWorkspace`) wird 500 returned — Stripe retried den Webhook bis zu 3 Tage. **ABER:** Die `stripeEvent`-Row wurde bereits via `ON CONFLICT DO NOTHING` ge-INSERTed (Z104–116). Das bedeutet: Auf Retry returnt der Webhook `{ duplicate: true, ok: true }` und der handler-Fehler wird **niemals retried**.

**Why Mid:** Idempotency-Dedupe vor handler-Execution ist anti-pattern für recoverable Errors. Best-Practice ist: erst dedupe-check (SELECT), dann handle, dann insert.

**Suggested Fix:** Re-order:
1. SELECT auf `stripeEvent.id` — wenn vorhanden, return 200.
2. Handle event in try/catch.
3. Bei success: INSERT `stripeEvent` row.
4. Bei failure: 500 ohne INSERT — Stripe retried, nächster Versuch hat saubere Row.

Alternativ Status-Spalte `processed_at` führen wie `webhookEvent` (siehe FN-02).

---

### [Mid] FN-09 — `audit-trail/route.ts` ohne Rate-Limit + ohne 503-Header-Convention

**File:** `apps/web/src/app/api/audit-trail/route.ts:17–47`

**Issue:**
- Kein Rate-Limit — anonymer User kann via `/api/audit-trail?format=csv` Loop auslösen.
- 404 statt 401/403 wenn `getSessionUser()` null returnt (im Lib-Helper). Kommentar Z14 begründet "so anonymous mode doesn't expose empty payloads" — verständlich, aber inkonsistent zu anderen Routes (`/api/events/stream` returnt 401).
- Kein `runtime = "nodejs"` deklariert (default für route.ts aber explicit ist besser für Audit-Trail-Compliance).

**Why Mid:** Kein direkter Exploit, aber Inkonsistenz zur Rest-Convention und fehlender Rate-Limit-Layer.

**Suggested Fix:** Rate-Limit + explicit runtime + erwäge 401 statt 404 wenn Session-fail.

---

### [Mid] FN-10 — `events/stream` SSE — heartbeat-controller-error wird verschluckt

**File:** `apps/web/src/app/api/events/stream/route.ts:99–106`

**Issue:**
```ts
heartbeatTimer = setInterval(() => {
  if (stopped) return;
  try {
    controller.enqueue(encoder.encode(`: heartbeat ${Date.now()}\n\n`));
  } catch {
    stopped = true;
  }
}, HEARTBEAT_INTERVAL_MS);
```
Wenn `controller.enqueue` throws (z.B. closed stream), wird `stopped=true` gesetzt, aber `heartbeatTimer` selbst nicht ge-cleared. Bei langem Stream akkumuliert das setInterval-Calls die alle no-op-en aber den Event-Loop nicht freigeben.

Ähnlich: `tick()` Z91–93 `catch (err) { console.error(...) }` — bei wiederholten DB-Failures keine Circuit-Breaker / kein Stream-Close.

**Why Mid:** Memory-Leak-Vector + missing Circuit-Breaker. Fluid Compute hat 300s max-Duration als safety-net (Z12), aber 300s × N concurrent Streams können DB-Pool drainen.

**Suggested Fix:** In catch-Block `clearInterval(heartbeatTimer)` + `clearTimeout(pollTimer)` + `controller.close()` aufrufen.

---

### [Mid] FN-11 — `auto-track-repos` Inngest-Cron — Step-Names mit Repo-ID nicht idempotent über Re-runs

**File:** `packages/inngest/src/functions/auto-track-repos.ts:48`

**Issue:**
```ts
const outcome = await step.run(`poll-${r.id}`, async () => { … });
```
Step-Names mit Resource-IDs sind innerhalb eines Function-Runs eindeutig (OK), aber:
- Inngest-Steps innerhalb einer Cron-Run sind nicht "Run-Once-Across-Time" — sie sind nur innerhalb der gleichen Run idempotent.
- Wenn die Cron mid-iteration crasht (z.B. nach `poll-repo-42` aber vor `poll-repo-43`), wird Inngest die gesamte Function von vorne starten und `poll-repo-42` re-runnen. Innerhalb des `step.run`-Body wird trotzdem ein neuer `scan`-Row inserted weil `inserted = await db.insert(schema.scan).values(...)` keinen ON CONFLICT hat (Z65–77).

**Why Mid:** Doppel-Scan-Risk bei Inngest-Replay. Geringe Wahrscheinlichkeit (Cron failt selten mid-iteration), aber Symptom wäre doppelte Audit-Credits-Charge.

**Suggested Fix:** Entweder `inngest.send({ name: "audit/requested", … })` mit `id` aus SHA (Inngest dedupe-key), oder Scan-Insert mit UNIQUE-Constraint auf `(repoId, sha)` und ON CONFLICT DO NOTHING.

---

### [Mid] FN-12 — `inngest/createFunction` mit `: any` Return-Type

**Files:** 
- `packages/inngest/src/functions/audit-requested.ts:34`
- `packages/inngest/src/functions/credit-aggregator.ts:104`
- `packages/inngest/src/functions/stripe-reconcile.ts:36`
- `packages/inngest/src/functions/auto-track-repos.ts:22`
- `packages/inngest/src/functions/prepaid-credit-expirer.ts:154`

**Issue:** Alle 5 Inngest-Functions deklariert als:
```ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const auditRequested: any = inngest.createFunction(...)
```
Comment Z29–32 (`audit-requested.ts`): "Inngest's generated type references internal `inngest/api/api.js` paths that aren't portable across project boundaries (TS2742)". Verständlich, aber:
- Verlust aller Type-Safety bei `event.data` (cast als `payload = event.data as AuditRequestedPayload`).
- `({ event, step }: any)` löscht auch Step-API-Typen — `step.run` Argumente sind nicht type-checked.

**Why Mid:** Audit-Pipeline-Code mit `any` ist gefährlich (Billing-Side-Effects). 

**Suggested Fix:** Wrapper-Type extrahieren: `type InngestRun<T> = (ctx: { event: { data: T }; step: StepTools }) => Promise<unknown>` und nur das `any` ans Function-Object selbst lassen. Oder Inngest-Version upgraden falls TS2742 in neuer Version fixed.

---

### [Mid] FN-13 — `notify-update` In-Memory-Rate-Limit per-region

**File:** `apps/web/src/app/api/notify-update/route.ts:10–13, 25–34`

**Issue:** `inFlight = new Map<string, number[]>()` ist process-local. Auf Vercel Fluid Compute hat jede Region ihre eigene Map — 10 req/min wird zu 10 × N regions/min global.

**Why Mid:** Bekannte Sprint-1.4-Limitation (siehe `rate-limit.ts` Z19–22: "swaps to KV when MRR justifies"). Konsistent mit globaler Rate-Limit-Strategy.

**Suggested Fix:** Phase 2 Migration nach Vercel KV / Upstash — bereits im rate-limit.ts dokumentiert.

---

### [Weak] FN-14 — Logging-Inkonsistenz: `console.error` ohne strukturiertes Format

**Files:** Multiple
- `apps/web/src/app/api/stripe/webhook/route.ts:95, 156, 311`
- `apps/web/src/app/api/install-webhook/route.ts:280`
- `apps/web/src/app/api/events/stream/route.ts:92`
- `apps/web/src/app/api/notify-update/route.ts:132`

**Issue:** Alle 7 Routes nutzen `console.error("[prefix] message", err)` mit Bracket-Tag-Prefix. Kein strukturiertes Logger (pino/winston/Vercel-Log-Drain-Format). Vercel parsed stdout aber strukturiert wäre besser für Datadog/Axiom-Integration in Sprint 2+.

**PII-Risk:** `console.error("[stripe-webhook] handler failed for ${event.type}", err)` — `err` kann Stripe-Objekt mit `customer_email` enthalten.

**Why Weak:** Stylistisch konsistent (Bracket-Prefix-Pattern), aber strukturierter Logger würde Observability deutlich verbessern.

**Suggested Fix:** Sprint 2 — `@vk/logger` Package mit pino + redact-rules für email/key-Felder.

---

### [Weak] FN-15 — `unstable_after` / `after` nicht verwendet

**Issue:** `grep unstable_after` returnt 0 Treffer. Server-Actions mit Side-Effects (Email senden in `stripe/webhook/route.ts` Z236, Z284, Z380) blockieren die Response. Bei langsamen SMTP/Resend-Responses ist das ein 10s+ Webhook-Round-trip.

**Why Weak:** Stripe gibt 10s budget bevor es retried; aktuell knapp aber funktional. Best-Practice mit Next.js 16 `import { after } from "next/server"` wäre Email-Send post-response.

**Suggested Fix:** Im Stripe-Webhook:
```ts
import { after } from "next/server";
…
after(async () => {
  await sendTransactionalEmail({ … });
});
```
für non-critical Side-Effects (Plan-Change-Email, Past-Due-Email).

---

## Endpoint-Compliance-Matrix

| Route | Signing | Idempotency | 503-Fallback | Rate-Limit | Runtime | Auth-Check | Status |
|-------|---------|-------------|--------------|------------|---------|------------|--------|
| `/api/stripe/webhook` | ✓ HMAC | ✓ PK `stripeEvent.id` | ✓ (no key + no DB) | n/a (Stripe-side) | ✓ nodejs | n/a | **Exceptional** |
| `/api/install-webhook` | ✓ HMAC-SHA256 | ✓ `delivery_id` UNIQUE | ✓ (no key + no DB) | ✗ | default | n/a | **Exceptional** |
| `/api/notify-update` | ✓ HMAC + timingSafe | ✓ SHA-skip | ✓ (no DB + no Inngest) | ✓ per-repo 10/min | ✓ nodejs | secret-based | **Strong** |
| `/api/inngest` | ⚠ via env (no fallback) | ✓ Inngest-internal | ✗ **no 503** | n/a | ⚠ no explicit | Inngest-signing | **Mid** |
| `/api/auth/[...all]` | n/a (Better-Auth) | ✓ Better-Auth internal | ✓ | ✗ (Better-Auth internal) | default | self | **Strong** |
| `/api/events/stream` | n/a (SSE) | n/a | ✓ (no DB) | ✗ (max 300s) | ✓ nodejs | ✓ session | **Strong** |
| `/api/audit-trail` | n/a | n/a | 404-fallback | ✗ | default | ✓ in helper | **Mid** |

---

## Inngest-Function-Compliance-Matrix

| Function | Trigger | Steps Unique | Idempotency-Key | Failure-Handler | 503 (no key) |
|----------|---------|--------------|-----------------|-----------------|--------------|
| `audit-requested` | Event | ✓ static + dyn | ✓ scanId in inputs | ✓ mark-failed step | n/a |
| `credit-aggregator` | Cron `*/5` | ✓ `submit-${ledgerId}` | ✓ Stripe identifier + log table | ⚠ no try/catch around row-loop | ✓ skipped if no key |
| `stripe-reconcile` | Cron `0 3` | ✓ `page-${count}` | ✓ detect-only (no mutation) | ⚠ no per-page try/catch | ✓ skipped if no key |
| `auto-track-repos` | Cron `0 */4` | ⚠ `poll-${repoId}` (see FN-11) | ✗ no dedupe on scan-insert | ✗ silent fail in `fetchLatestCommitSha` | n/a |
| `prepaid-credit-expirer` | Cron `0 2` | ✓ single step | ✓ recent-warning-check + tx | ✗ no try/catch | n/a |

---

## Server-Action-Compliance-Matrix

| File | Actions | Validation | Auth-Check | Workspace-Scope | Side-Effects |
|------|---------|------------|------------|-----------------|--------------|
| `audit-action.ts` | 1 | ⚠ String-coerce + manual checks | ✓ optional (anon path) | ✓ ensureDefault | DB+Inngest+Email |
| `billing-actions.ts` | 5 | ⚠ String-coerce + tier-enum-check | ✓ getSessionUser | ✓ ensureDefault | Stripe-Checkout-redirect |
| `customer-actions.ts` | 3 | ⚠ String-coerce, no length-cap | ✓ getSessionUser | ✓ resolveWorkspace | DB + revalidatePath |
| `workspace-ai-actions.ts` | 4 | ⚠ String-coerce + provider-enum | ✓ getSessionUser | ✓ resolveWorkspace | DB + BYOK-encrypt |
| `audit-action.ts` (anon) | 1 | ⚠ minimal path-resolve | ✗ anon allowed | ✗ no workspace | local-fs scan |
| `solution-actions.ts` | 2 | ✗ findingId pass-through | ⚠ `pollSolution` no auth (FN-06) | ✗ no ownership check | DB+LLM |
| `fix-actions.ts` | 1 | ⚠ findingIds: string[] no cap | ✓ getSessionUser | ✓ via workspace-join | LLM |
| `apply-actions.ts` | 5 | ⚠ ID pass-through | ✓ getSessionUser | ✓ via DAL | DB+GitHub-PR |
| `dpa-actions.ts` | 2 | n/a (no params) | ✓ getSessionUser | n/a (user-scoped) | DB-insert |

---

## Prioritised Action Items (für Sprint 2 / Sub-Plan)

1. **FN-04** — `inngest/route.ts` runtime + signingKey + 503-Guard (5 LOC, **Strong**)
2. **FN-05** — zod-Schema-Layer für Server-Action FormData (M-Effort, **Strong**, blockt Phase-2-Multi-Tenancy)
3. **FN-06** — `pollSolution` Ownership-Check (3 LOC, **Strong**)
4. **FN-07** — `setSpendCap` dead-code + extract `eurToMicrocents` (XS-Effort, **Strong**)
5. **FN-08** — Stripe-Webhook: dedupe-before-handle ordering (M-Effort, **Mid**)
6. **FN-10** — SSE clearInterval in catch (XS-Effort, **Mid**)
7. **FN-11** — `auto-track-repos` UNIQUE-Constraint auf scan (S-Effort, **Mid**)
8. **FN-12** — Inngest-Function generic-wrapper (M-Effort, **Mid**)
9. **FN-15** — `after()` für Email-Side-Effects in webhooks (S-Effort, **Weak** but DX-win)

**Out-of-scope für Sub-12 (handled by Sub-13/14):**
- Better-Auth session-validation depth → Sub-Auth-Audit
- DB-Migration für `webhookEvent`-Table-Size-Management
- LLM-Cost-Cap-Enforcement-Hardening (FN-07 dead-code-Symptom)
