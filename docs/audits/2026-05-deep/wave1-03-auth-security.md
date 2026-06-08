# Wave-1 / Deep-Audit-03 — Auth + Security Surface

**Author:** automated deep-audit (Claude Opus 4.7, 1M)
**Scope:** Better-Auth config · session/DAL · authorization-matrix · BYOK crypto · CSRF/XSS/SSRF/injection · rate-limit/DoS · prod headers · OWASP Top 10
**Method:** read-only line-by-line scan; every claim is cited `file:line`
**Baseline:** `docs/audits/2026-05/05-security.md` (surface pass) — this wave digs deeper
**Target:** paying customers in 2–4 weeks (DACH-B2B SaaS)

## TL;DR

The auth foundation is **structurally sound but operationally not ready for paying customers**:

- Better-Auth + magic-link, BYOK AES-256-GCM, Stripe webhook-verify, GitHub-webhook-verify, internal `/api/notify-update` HMAC, signed-session-cookie cache — all the textbook controls exist.
- **Five Kill-tier bugs** block GA: (1) cross-workspace patch-leak via `pollSolution`, (2) IDOR in `getRepo` via `rootPath`-keyed scan join, (3) audit-trail-export leaks cross-workspace webhook rows, (4) production has **zero security headers** (no CSP / HSTS / X-Frame-Options), (5) `vitest@<4.1.0` carries a critical CVE in the dev-dep tree.
- **RBAC is half-implemented.** Two surfaces still hard-gate on `workspace.ownerId` (`getScanStatus`, `generateFixesForScan`) — admin/member roles are denied work they should have. Conversely `revokeMember` lets owner-A revoke a membership in owner-B's workspace because no `(membership.workspaceId === workspaceId)` join is enforced.
- **Account deletion + workspace deletion + session-listing are NOT IMPLEMENTED** (all marked "Coming with nova-2-settings-backend"). GA legal copy promises GDPR-Art.17 erasure; the only delivery channel is `mailto:support`.
- **SSRF surface is small but real**: `audit-action` lets anonymous users hand the server a GitHub URL string; `fetchRepoZipball` runs the request with `redirect: "follow"`. The URL regex is GitHub-only, but `parseGithubUrl` accepts arbitrary `ref` strings that are unsanitised before going into `https://codeload.github.com/.../zip/refs/heads/${branch}` — path-traversal into other branches/tags is possible, and one `Location:` redirect could exit the codeload subdomain.

The bands are explicit: 5 Kill · 11 Weak · 9 Mid · 3 Strong. Detail in §A-G + §H summary table.

---

## A · Better-Auth + Session

### A1 (Kill) — Session/Cookie config has zero hardening overrides

**Where:** `packages/auth/src/server.ts:61-120`

Only `secret`, `baseURL`, `database`, `emailAndPassword.enabled=false`, `session.cookieCache`, and the `magicLink` plugin are passed. The Better-Auth `session.cookie`, `advanced.crossSubDomainCookies`, `rateLimit`, `trustedOrigins`, and `cookies.session.attributes` sections are all **unset**. We rely entirely on upstream defaults — which means in 2 weeks, when a 1.7 release changes a default, we ship that drift to paying customers without noticing.

What's missing (load-bearing for production):
- No explicit `cookie.sameSite` (defaults to `lax` in better-auth 1.6 but verify per release).
- No `cookie.secure: true` override — relies on the Set-Cookie heuristic over `AUTH_BASE_URL=https://…`. Make it explicit.
- No `cookie.prefix: "__Host-"` for session-cookie hardening. We have no sub-domain story yet, so `__Host-` is free.
- No `rateLimit` block. Better-Auth offers built-in per-endpoint rate-limit; we let it default-off. Anyone can call `/api/auth/magic-link/send` repeatedly to (a) flood Resend quota, (b) brute-force email-enumeration via timing.
- No `trustedOrigins` whitelist — without it Better-Auth's CSRF cross-origin protection won't reject e.g. `https://attacker.example/`-originating POSTs to `/api/auth/*` if the browser sends the cookie (Same-Site Lax is the only mitigation here).
- `magicLink.expiresIn: 600` ✓ — but no `magicLink.disableSignUp` flag → anyone who clicks a magic-link creates an account. For DACH-B2B you want explicit allow-listing of invited emails.

**Recommendation (pre-GA, ≤1d):**
```ts
betterAuth({
  ...,
  advanced: {
    cookies: {
      session: {
        attributes: {
          sameSite: "lax",
          secure: true,
          httpOnly: true,
          path: "/",
        },
      },
    },
    crossSubDomainCookies: { enabled: false },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 10,
    storage: "memory",         // KV upgrade in V2
  },
  trustedOrigins: [process.env.AUTH_BASE_URL!],
})
```

### A2 (Weak) — `getSession()` swallows all errors as null

**Where:** `apps/web/src/lib/session.ts:17-31`

```ts
try { ... } catch { return null; }
```

A DB outage, an expired session, a corrupted cookie — all collapse to "anonymous user". This means a DAL function downstream that branches "if no session → anonymous flow" will silently service an anonymous request to a logged-in user during a transient incident. Surface the distinction: return `{ status: "anon" } | { status: "error" } | { status: "user", user }` and let callers decide.

### A3 (Kill) — No session-revocation surface; logout doesn't kill all devices

**Where:** `packages/db/src/schema.ts:30-41` + `apps/web/src/app/account/settings/sessions/page.tsx:1-32`

`session` table has `ipAddress`, `userAgent`, `expiresAt`, `token` — Better-Auth fills these. The product UI is a stub: "Coming with nova-2-settings-backend." Without a revoke-all-sessions surface, a compromised-laptop story has no remediation other than waiting for natural expiry (Better-Auth default 7d).

**For GA**: ship `/account/settings/sessions` with row-per-session + revoke. Better-Auth exposes `auth.api.revokeSession` and `auth.api.revokeOtherSessions` — both are server-side. Add a `revoke-all-after-password-change`-style "Sign out everywhere" button on the same page.

### A4 (Weak) — No email-verification step in magic-link sign-up

**Where:** `packages/auth/src/server.ts:81-118`

Better-Auth's `magicLink` plugin already proves email-ownership at sign-in time (you cannot get the link without inbox access). However, `user.emailVerified` (schema.ts:24) is set to `false` by default and never flipped. Any code path that checks `emailVerified` (none yet — but ADR-0007/DPA mention compliance flows that will) will treat all paying customers as unverified. Fix: set `magicLink.markEmailVerifiedOnFirstLink: true` (or whatever the 1.6-equivalent flag is — verify exact name in Better-Auth 1.6 docs).

### A5 (Weak) — Magic-link callback URL accepts only same-origin `/`-prefix, but no host-pinning

**Where:** `apps/web/src/app/auth/verify/page.tsx:23-29`

```ts
function safeNext(raw) {
  if (!raw) return "/dashboard";
  if (!raw.startsWith("/")) return "/dashboard";
  if (raw.startsWith("//")) return "/dashboard";
  return raw;
}
```

Good: blocks `//evil.example` and `http://...`. Weak spot: a path like `/api/auth/...?...` would be a same-origin redirect into an auth-sensitive endpoint with the user's freshly-set session cookie. Not exploitable today (no such API route exists that takes a `next` query and acts dangerously), but tighten further by allow-listing only known route prefixes (`/dashboard`, `/[workspace]`, `/account/settings`, `/billing`).

### A6 (Mid) — Magic-link email leaks request-IP + UA to recipient

**Where:** `packages/auth/src/server.ts:91-106`

The `MagicLinkEmail` shows the **requester's IP + UA** in the email body — pulled from `x-forwarded-for` / `x-real-ip` / `user-agent`. The intent is "transparency for the receiver if they didn't request it." Reality: if Alice signs Bob in (Alice typed Bob's email by mistake), Bob receives Alice's IP. Acceptable, but flag it in the privacy notice.

### A7 (Strong) — Magic-link replay defence

`storeToken: "hashed"` (server.ts:90) — DB stores `sha256(token)`, plaintext only travels in the email + URL. Better-Auth's plugin enforces single-use semantics + expiry (verified at the `verification` row level). Token is unguessable (Better-Auth uses crypto.randomBytes via Node's `randomUUID`/crypto subtle). ✓

### A8 (Strong) — Workspace-membership claim flow

**Where:** `apps/web/src/lib/membership.ts:170-197`

`claimPendingMemberships(userId, email)` runs on every dashboard mount, finds rows with `invited_email = lower(email) AND status = pending`, and back-fills `userId + accepted_at`. Idempotent. ✓

Edge case worth thinking about (Mid follow-up): the lookup is case-insensitive only because `invitedEmail` is always stored `.toLowerCase()`-ed in `inviteAdmin` (membership.ts:95). A future code-path that inserts an `invitedEmail` without normalising will silently fail to claim. Add a Drizzle Zod validator that enforces lower-case on insert.

---

## B · Authorization-Matrix

### B1 (Kill) — IDOR: `pollSolution` deliberately bypasses auth

**Where:** `apps/web/src/lib/solution-actions.ts:18-24`

```ts
export async function pollSolution(findingId: string): Promise<SolutionRow | null> {
  // Poll variant — no auth required because it's a read-only lookup and
  // the inspector already proved access via requestSolution.
  return getSolution(findingId);
}
```

The justification is a fallacy: "the inspector already proved access" — but the inspector proved access for the **session that first called `requestSolution`**. Any signed-in or anonymous user who learns a `findingId` (UUID is unguessable, but they leak via URLs, screenshots, support tickets, browser-history exports) can call `pollSolution(findingId)` and receive the full `patch`, `rationale`, `confidence`, `filesTouched`, and `failureReason` — all of which contain customer-confidential code-change proposals and LLM-generated reasoning over the repo. This is a multi-tenant capability leak.

Fix: gate `pollSolution` identically to `requestSolution` (`userIsMember(scan.workspaceId, userId)`).

### B2 (Kill) — IDOR: `getRepo` joins scans by `rootPath` not `repoId`/`workspaceId`

**Where:** `apps/web/src/lib/customers.ts:170-192`

```ts
const rows = await db.select().from(schema.repo).where(eq(schema.repo.id, repoId)).limit(1);
const row = rows[0];
if (!row || row.workspaceId !== workspaceId) return null;

const scans = await db
  .select(...)
  .from(schema.scan)
  .where(eq(schema.scan.rootPath, row.rootPath))     // ← no workspaceId filter
  .orderBy(desc(schema.scan.createdAt))
  .limit(20);
```

Two workspaces that both audit `https://github.com/torvalds/linux` end up with `scan.rootPath = "github.com/torvalds/linux"` in BOTH workspace-rows. Workspace-A opens its `/repos/[id]` page and receives workspace-B's scan-IDs in the list — clicking opens a 404 (scan-detail page does compound-check on `scanId × workspaceId`, scans/[id]/page.tsx:36), so no deep leak — but **the scan-IDs themselves leak** and the count (`scans.length`) leaks. With public GitHub URLs the cross-workspace correlation is trivial.

Fix: `eq(schema.scan.repoId, row.id)` (the schema added `repoId` in Sprint 0.8 backfill — use it), or compound `(workspaceId, rootPath)`.

### B3 (Kill) — `audit-trail-export` leaks cross-workspace webhook_event rows

**Where:** `apps/web/src/lib/audit-trail-export.ts:129-148`

```ts
const webhooks = await db
  .select(...)
  .from(schema.webhookEvent)
  .orderBy(desc(schema.webhookEvent.receivedAt))
  .limit(500);
```

There is **no `WHERE workspaceId = ?`** filter — the `webhookEvent` table is global by design (deliveryId is the PK across all GitHub installs). The export hands every authenticated user the last 500 GitHub-webhook deliveries across **all customers**, including `payload` summaries that include other tenants' repo names, install-IDs, and webhook actions. Combined with the route at `/api/audit-trail` (which is auth-gated only by `getSessionUser`), this is a Tier-1 cross-tenant breach.

Fix: scope to `JOIN repo ON repo.githubInstallationId = ...` against `repo.workspaceId = ws.id`, or stop emitting `webhook_event` rows in the export until a per-workspace mapping table exists.

### B4 (Kill) — `audit-trail-export` only returns ONE workspace + owner-only gate

**Where:** `apps/web/src/lib/audit-trail-export.ts:41-46`

```ts
const workspaces = await db
  .select({ id: schema.workspace.id })
  .from(schema.workspace)
  .where(eq(schema.workspace.ownerId, user.id))
  .limit(1);
```

- A user who owns multiple workspaces gets data only for the alphabetically/insertion-first one.
- An admin/member who is NOT the legacy owner of any workspace gets `rows: []` even though their workspace has audit-relevant history.

This is both a **functional bug** (missing data → compliance-frame customer sees "0 rows" on a workspace with 100 scans) and an **authz model violation** (RBAC owner-only without justification in the DPA). Fix: parameterise on `workspaceId` (path or query), gate via `resolveWorkspaceFromSlug`.

### B5 (Weak) — `getScanStatus` + `generateFixesForScan` hard-gate on `workspace.ownerId`

**Where:** `apps/web/src/lib/scan-status.ts:41-46` + `apps/web/src/lib/fix-actions.ts:37-41`

Both functions JOIN `scan → workspace` on `workspace.ownerId = user.id`. Admin / member roles cannot poll scan status or generate fixes — but the rest of the codebase (`apply-dal`, `solution-dal`, `customer-dal`) accepts `userIsMember` as the gate.

Effect: invite a teammate as admin → they can browse the dashboard but the inspector's "Generate fix" button silently 401s. Inconsistent authz model, confusing UX, and one of the two B5 functions also exposes a future-risk: if a workspace transfers ownership (Nova-3 plan), the original owner retains ScanStatus + Fix-Gen access until the schema is migrated.

Fix: replace both `eq(schema.workspace.ownerId, user.id)` with `userIsMember(workspaceId, userId)`. Keep one canonical helper (`apply-dal.ts:28-56` already has it; lift to `@/lib/membership` shared module).

### B6 (Kill) — `revokeMember` doesn't pin `membershipId` to the supplied `workspaceId`

**Where:** `apps/web/src/lib/membership.ts:199-227`

```ts
export async function revokeMember(workspaceId, membershipId) {
  const actor = await getSessionUser();
  const role = await getUserRole(workspaceId, actor.id);
  if (role !== "owner") return { ok: false, error: "Only owner can revoke memberships." };
  const target = await db
    .select({ role: schema.membership.role, userId: schema.membership.userId })
    .from(schema.membership)
    .where(eq(schema.membership.id, membershipId))       // ← no workspaceId AND-clause
    .limit(1);
  ...
  await db.update(schema.membership).set({ status: "revoked" })
    .where(eq(schema.membership.id, membershipId));      // ← no workspaceId AND-clause
}
```

Alice is owner of workspace-A. She passes (workspaceId = A, membershipId = some-uuid-from-workspace-B). The role-check passes because she's owner of A. The membership row's `workspaceId` is never compared. She can revoke a membership in workspace-B.

Fix: add `eq(schema.membership.workspaceId, workspaceId)` to both queries (or check `target[0].workspaceId === workspaceId` before update).

### B7 (Weak) — `inviteAdmin` doesn't check tier quota / seat limit

**Where:** `apps/web/src/lib/membership.ts:80-163`

`inviteAdmin` runs the role-gate (owner | admin only) and inserts a membership row with no seat-limit check. The billing pack defines `creditsPerCycle` but no `seatsIncluded`. For DACH-B2B you want a hard cap per tier (free = 1, starter = 3, pro = 10, agency = unlimited) — otherwise free-tier customers invite their whole team and the per-seat economics break.

### B8 (Weak) — `requestInstall` allows `requestedScope: "write"` without admin check

**Where:** `apps/web/src/lib/install-requests.ts:31-63`

Any workspace member can submit a write-scope install-request. The decision happens via `decideInstall` (which is correctly admin-gated). The request itself is harmless, but it pollutes the request queue and could be used to social-engineer a workspace admin into clicking "approve" on a fake-looking line item. Add an admin-only gate to the *request* surface as well, or rate-limit per requester to ≤3 pending requests.

### B9 (Strong) — Workspace-scoped resources mostly fine

Spot-check of every "read" surface I touched:
- `getCustomerById` (`customer-dal.ts:100-117`) — `AND(customerId, workspaceId)` ✓
- `addRepoUnderCustomer` — `AND(customerId, workspaceId)` ✓
- `updateCustomerApplyMode` — `AND(customerId, workspaceId)` ✓
- `applySolution / dismissFinding / snoozeFinding / undoDismiss` — all `userIsMember(scan.workspaceId)` gated ✓
- `getOrGenerateSolution` — `userIsMember` ✓ (but `pollSolution` is the back-door — see B1)
- `getScanStatus / generateFixesForScan` — buggy as per B5 but not IDOR-leaky
- `getGalaxieDataForWorkspace` — `userIsMember` ✓
- `requestSolution` (action) — `userIsMember` via `getOrGenerateSolution` ✓
- `decideInstall` — owner|admin only, workspace derived from request row ✓
- `auditAction` — anonymous bucket gets `intensity: "quick"` only, signed-in via `ensureDefaultWorkspace` ✓
- `applyAction.pollPRStatus` (apply-dal.ts:378-394) — **NO auth check** ⚠ (same shape as pollSolution: applyActionId UUIDs leak across workspaces — Weak-tier IDOR because returns only the `state` string)

### B10 (Weak) — `pollPRStatus` accepts any `applyActionId` without membership check

**Where:** `apps/web/src/lib/apply-dal.ts:378-394` + action wrapper `apply-actions.ts:47-51`

Returns `{ state: "open" | "merged" | "closed" | ... }`. Lower-stakes than B1 (no patch leak), but still a cross-workspace inference vector — and the *cost* of fixing it is 5 lines of `userIsMember`.

---

## C · BYOK + Secrets

### C1 (Strong) — BYOK AES-256-GCM is correct

**Where:** `packages/billing/src/byok-crypto.ts:1-73`

- 256-bit key from `BYOK_ENCRYPTION_KEY` env, base64-decoded, length-checked (32B).
- 96-bit random IV per encrypt call (NIST-recommended for GCM, IV freshness asserted in test).
- 128-bit auth-tag stored separately, fed to `setAuthTag` on decrypt; tampered ciphertext + tampered authTag both throw on decrypt (tests cover both).
- Plaintext-empty rejected.
- Decrypt-on-demand only; column is in `subscription.byokKeyCiphertext` (not logged anywhere I could find).

This is the strongest part of the system. **Stays Strong** even after deep-scrutiny.

### C2 (Mid) — No master-key rotation procedure exists yet

**Where:** `byok-crypto.ts:21-36` + `.env.example:91-96` ("Rotation procedure: docs/operations/byok-key-rotation.md (V2)")

Rotation requires versioning the encrypted column (`byokKeyKeyId`) + re-encrypt-on-read with current key + background re-encrypt sweep. The doc says "V2" — fine for pre-revenue. **Block GA on**: write the playbook even if you don't ship the code, so a key-compromise incident has a runbook.

### C3 (Strong) — No hardcoded secrets in source

grep over `sk_test`, `sk_live`, `sk-ant-api`, `sk-proj-`, `AKIA`, `AIza`: 1 hit, in `apps/web/src/lib/repo-galaxie/demo-data.ts:388` — explicitly redacted demo string `"sk-ant-api03-redacted"`. Clean ✓.

### C4 (Strong) — No env-var leakage via console

grep over `console.log.*process\.env` and similar: 0 hits in `apps/web`, `packages/auth`, `packages/billing`. ✓

### C5 (Weak) — `ANTHROPIC_API_KEY` (server-default) is still global

The fallback path (`audit-action.ts:343` → `runAudit` with no BYOK) uses `process.env.ANTHROPIC_API_KEY`. That's correct — it's the platform's pay-cost. But the value is read every request (no cache), and in error messages from `@vk/audit` (not audited here) any thrown LLM-error tends to include the request payload. Spot-check `packages/audit` + `packages/llm` for `error.message` that includes the API key — out of scope for this wave, file a follow-up.

---

## D · CSRF / XSS / Injection / SSRF

### D1 (Strong) — CSRF on Server-Actions

Next.js 16 Server Actions are CSRF-protected by default (request-origin check against `Origin` / `Host` header — see Next docs). All `'use server'` modules in this audit (`audit-action.ts`, `apply-actions.ts`, `customer-actions.ts`, `membership.ts`, `billing-actions.ts`, etc.) are protected by that framework default. ✓

### D2 (Mid) — Webhook endpoints are exempt from CSRF — but we verify signatures

- `/api/stripe/webhook` — `stripe.webhooks.constructEvent(rawBody, signature, secret)` ✓ (route.ts:93). 503 if `STRIPE_WEBHOOK_SECRET` missing.
- `/api/install-webhook` — `verifyWebhookSignature` on `x-hub-signature-256` ✓ (route.ts:38-48). 401 on invalid.
- `/api/notify-update` — repo-specific HMAC SHA256, `timingSafeEqual` ✓ (route.ts:14-22, 95-104).

All three handle missing secret env-vars correctly (503 vs 401 distinction).

### D3 (Mid) — `/api/inngest` exposes Inngest SDK's `serve()` without explicit signing-key

**Where:** `apps/web/src/app/api/inngest/route.ts:1-4`

```ts
export const { GET, POST, PUT } = serve({ client: inngest, functions });
```

In production this needs `INNGEST_SIGNING_KEY` (set in `inngest.ts`'s client config inside `@vk/inngest` — not audited here, but `.env.example:53` calls it out). Without it, anyone can POST `audit/requested` events and trigger background scans. Verify the Inngest client construction in `packages/inngest/src/client.ts` (not in scope) enforces signing-key presence at startup, not just at runtime.

### D4 (Strong) — XSS

No `dangerouslySetInnerHTML` anywhere in `apps/web/src` or `packages/auth/src`. ✓

The magic-link email is rendered via `@react-email/render` — react-email escapes children by default. The injected `requestIp` + `userAgent` flow into the email body as text props (server.ts:101-106) — react-email renders them as text nodes, not attributes. ✓

### D5 (Strong) — SQL Injection

Drizzle ORM is used everywhere; the only raw `sql\`\`` use is `db.execute(sql\`SELECT 1\`)` in the health-check (`health-check.ts:75`) and `sql\`'[]'::jsonb\`` for defaults in schema (`db/src/schema.ts:309,449,496`). All static. ✓

### D6 (Weak) — SSRF surface: `audit-action` → `fetchRepoZipball`

**Where:** `apps/web/src/lib/github-fetch.ts:23-113` + `apps/web/src/lib/audit-action.ts:202-256`

`auditAction` accepts user-supplied raw URL. `parseGithubUrl` only matches:
```ts
/^https?:\/\/github\.com\/([^/\s]+)\/([^/\s.]+?)(?:\.git)?\/?$/
```
plus tree-suffix + git@ + `github:owner/repo` variants. Good: any non-github.com URL is rejected. Then `fetchRepoZipball` builds three URLs (`codeload.github.com`, fallback `master`, `api.github.com/zipball`) — all hard-coded subdomains.

But:
- **Branch/ref is unsanitised** (github-fetch.ts:53): `\`zip/refs/heads/${branch === "HEAD" ? "main" : branch}\``. The matched `ref` from `/tree/<ref>` regex captures `[^/\s]+` — so `ref` cannot contain `/` or whitespace, but **can contain** `..` (path-traversal in the zip URL: `?ref=..%2fmaster` won't match the regex because `%2f` decodes — but `..` literal is fine and lets you fetch a branch named "..", which is harmless). Worth tightening the ref-regex to `/^[A-Za-z0-9._-]+$/`.
- **Redirect follow**: `fetch(tryUrl, { headers, redirect: "follow" })` (github-fetch.ts:68). GitHub redirects are codeload→codeload, but a malicious GitHub-org could create a `301` to internal Vercel infrastructure. The CWE-918 attack vector is small because we can't influence GitHub's redirect chain, but pin it to `redirect: "manual"` and re-issue against `Location:` only if `new URL(loc).hostname === "codeload.github.com" || "api.github.com"`.
- **No size cap on the zipball**: `Buffer.from(await response.arrayBuffer())` (github-fetch.ts:91). Comment says "up to ~50 MB zipped". A repo with a 500MB zip would OOM-kill the function. Apply `response.body.getReader()` + streaming-into-temp-file with an early-abort at e.g. 100MB.
- **Zip-bomb**: `AdmZip.extractAllTo(extractDir, true)` (github-fetch.ts:96) — no per-entry size or total-extracted-size check. A 50MB zip with a recursive nested zip-bomb can expand to GBs. Inspect `zip.getEntries()` first, sum `entry.header.size`, abort > 1GB.

Net: **Weak** under realistic adversary; would be **Kill** if rendered repos contained user-uploaded content. For GitHub-public-repos the risk is bounded by GitHub's own zip-size limits.

### D7 (Strong) — No prototype-pollution surfaces

No spread-merge of user JSON into prototypable targets in the scanned modules. The DAL paths use Drizzle insert objects (typed), not generic merges. ✓

---

## E · Rate-limit + DoS

### E1 (Kill at scale, Weak today) — In-memory rate-limiter doesn't survive multi-region

**Where:** `apps/web/src/lib/rate-limit.ts:39 + 4-22`

```ts
const buckets = new Map<string, number[]>();
```

The Vercel Fluid Compute deployment model means each region (and each cold-start) has its own `Map`. A determined attacker hitting the IPv6-loadbalanced edge will get N× the rate-limit (N = number of regions). Today (pre-revenue) this is **Weak** — bots aren't targeting us. Day-1 of revenue: it's **Kill** because a single bot can drain the platform's `ANTHROPIC_API_KEY` quota at a multiplier.

Documented as "Phase 2 swaps to KV" in the comment block (rate-limit.ts:21). Block GA on this. KV / Upstash Ratelimit is ~30 lines.

### E2 (Kill) — No magic-link rate-limit at the auth layer

**Where:** `packages/auth/src/server.ts` (no `rateLimit` block — see A1)

`/api/auth/magic-link/send` will email any address you POST without throttle. The only existing throttle is the **client-side 30s** countdown in `LoginForm.tsx:23,86`. Server-side it's wide open. Attacker can:
- Burn Resend quota → email-deliverability degraded for paying customers.
- Email-enumeration via timing/error-response differential.
- Inbox-flood any DACH-B2B customer email by scripting POSTs.

Fix: Better-Auth `rateLimit.customRules` or `magicLink.rateLimit` (1.6 has both — confirm exact name). Cap to 3 sends per email per 10 minutes + 20 per IP per hour.

### E3 (Weak) — `/api/notify-update` rate-limit is per-process

**Where:** `apps/web/src/app/api/notify-update/route.ts:10-34`

Same Map-in-memory issue. Per-repo HMAC binds the surface; not a critical DoS path.

### E4 (Strong) — Stripe webhook + Inngest already idempotent

`stripeEvent` PK upsert (`webhook/route.ts:104-115`) + `webhook_event.deliveryId` PK (`install-webhook/route.ts:76-86`). Replay-safe. ✓

### E5 (Mid) — Audit action rate-limit doesn't include workspace dimension

`audit-action.ts:108-114` keys on `user:<userId>` OR `ip:<ip>`. If userA owns 2 workspaces, their personal bucket caps both. Fine for solo-dev, weird for agency-tier customers running parallel-jobs on multiple workspaces. Move to `user:<id>+ws:<wsId>`.

---

## F · Headers + Cookies

### F1 (Kill) — `next.config.ts` ships ZERO security headers

**Where:** `apps/web/next.config.ts:1-72`

No `async headers()` block, no CSP, no HSTS, no X-Frame-Options, no Referrer-Policy, no Permissions-Policy. A vanilla Next 16 deploy on Vercel gives you `X-Powered-By: Next.js`, `X-Content-Type-Options: nosniff`, and HSTS via Vercel — but NOT CSP, NOT X-Frame-Options, NOT Permissions-Policy.

The proxy at `apps/web/src/proxy.ts` doesn't set any headers either; matcher excludes `/api/*` (`proxy.ts:22`).

For DACH-B2B you need:
```ts
async headers() {
  return [{
    source: "/(.*)",
    headers: [
      { key: "Content-Security-Policy", value: "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://api.stripe.com https://*.inngest.com https://api.resend.com; frame-ancestors 'none';" },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ],
  }];
}
```
(Tighten CSP after Stripe checkout iframes + react-email previews + future-galaxie PixiJS canvases are accounted for — easiest is to start in `Content-Security-Policy-Report-Only` mode, observe via report-uri, then promote.)

### F2 (Strong) — Cookies: Better-Auth defaults are sane

Better-Auth 1.6 sets `httpOnly: true, sameSite: "lax", secure: true (under https)` by default. The only gap is the missing `__Host-` prefix (covered in A1).

### F3 (Strong) — CORS not configured = locked down

No `Access-Control-Allow-Origin` set on any API route. Browsers will block cross-origin XHR by default. ✓ (When you eventually expose a programmatic API, do it explicitly per-route with a whitelist.)

---

## G · OWASP Top-10 Map

| # | Category | Status | Notes |
|---|----------|--------|-------|
| A1 | Broken Access Control | **FAIL** | 5 findings: B1, B2, B3, B5, B6 |
| A2 | Cryptographic Failures | **PASS** | BYOK GCM correct; key-rotation playbook missing (C2) |
| A3 | Injection | **PASS** | Drizzle everywhere; no raw SQL with user input |
| A4 | Insecure Design | **FAIL** | `pollSolution` deliberate auth-bypass; rate-limiter not multi-region; in-memory state on Fluid Compute |
| A5 | Security Misconfig | **FAIL** | F1 zero security headers; A1 zero Better-Auth hardening |
| A6 | Vulnerable Components | **FAIL** | `vitest <4.1.0` (CRITICAL CVE-2025), `postcss` (moderate), `tmp` (HIGH, in @lhci/cli dev-dep), `esbuild`, `diff`, `uuid` — full list below |
| A7 | Identification + Auth Failures | **PARTIAL** | Magic-link replay defence ✓; missing session-revoke surface (A3); no rate-limit on magic-link (E2) |
| A8 | Software + Data Integrity | **PASS** | Webhook signatures verified for Stripe + GitHub + notify-update; idempotent replay protection |
| A9 | Logging + Monitoring | **PARTIAL** | `install_decision` + `apply_action` capture IP + UA ✓; `webhook_event` ✓; no central security-event log; no alerting on multiple-failed-magic-link-sends, no audit row on `revokeMember` (only schema update with no actor-IP-UA) |
| A10 | SSRF | **PARTIAL** | D6 — branch/ref unsanitised; redirect follow; no size-cap; no zip-bomb defence |

### G6 — `pnpm audit` findings (severity sort)

| Module | Sev | Patched | Path |
|--------|-----|---------|------|
| `vitest` | **CRITICAL** | ≥4.1.0 | `.>vitest` (dev) |
| `tmp` | HIGH | ≥0.2.6 | `.>@lhci/cli>tmp` (dev) |
| `tmp` | LOW | ≥0.2.4 | duplicate path |
| `esbuild` | MODERATE | ≥0.25.0 | `packages__db>drizzle-kit>…>esbuild` |
| `postcss` | MODERATE | ≥8.5.10 | `apps__web>next>postcss` |
| `uuid` | MODERATE | ≥11.1.1 | `.>@lhci/cli>uuid` |
| `diff` | LOW | ≥8.0.3 | `packages__fixes>diff` |

The `vitest` CVE only fires when `vitest --ui` is running — not in CI, not in prod. **But** the project has Husky pre-commit hooks (`.husky/`) and Lighthouse CI (`.lhci/`) — both could plausibly trigger vitest UI in a dev's local environment. Bump vitest to `^4.1.0` (breaking-change check required) before any new contributors clone.

---

## H · Severity Matrix Summary

| Band | # | Items |
|------|---|-------|
| **Kill** | **5** | A1 Better-Auth hardening missing · A3 no session-revoke surface · B1 `pollSolution` IDOR · B2 `getRepo` rootPath join · B3 `audit-trail` cross-tenant webhook leak · B4 `audit-trail` owner-only single-workspace · B6 `revokeMember` cross-workspace · F1 zero security headers · E1 rate-limiter per-region · E2 no magic-link rate-limit |
| **Weak** | **11** | A2 swallow-all-error session · A4 emailVerified never flipped · A5 `safeNext` not allow-listed · B5 ownerId-only ScanStatus + FixGen · B7 no seat-limit on invite · B8 no admin-gate on requestInstall · B10 pollPRStatus no auth · D6 SSRF surface (unsanitised ref, redirect-follow, no zip-bomb) · E3 notify-update per-process limit · A6.tmp (HIGH dev-dep) |
| **Mid** | **9** | A6 magic-link leaks requestor IP · C2 no key-rotation runbook · C5 ANTHROPIC_API_KEY in error-paths (file follow-up) · D2 inngest signing-key trust · D3 inngest /api/inngest exposed · E5 rate-limit ignores workspace dim · F2 missing `__Host-` cookie prefix · A8.6 invitedEmail case-normalisation drift · A6.esbuild + .postcss + .uuid moderate |
| **Strong** | **3** | A7 magic-link replay · A8 membership-claim flow · C1 BYOK AES-256-GCM · C3 no hardcoded secrets · C4 no env-leak via console · D1 CSRF on Server Actions · D4 no XSS surfaces · D5 SQL injection clean · D7 no proto-pollution · E4 webhook idempotency · F2 cookie defaults sane · F3 no CORS leak |

(`Strong` collapsed — multiple positive findings rolled into one row.)

---

## I · Pre-GA Required-Fix Checklist (paying-customers track)

In priority order — Kill-band first, every item is ≤1d effort unless noted:

1. **[Kill]** Fix `pollSolution` to call `userIsMember` — `solution-actions.ts:18`. 5 LOC.
2. **[Kill]** Fix `getRepo` to scope scans by `repoId` not `rootPath` — `customers.ts:178-189`. 2 LOC.
3. **[Kill]** Scope `webhook_event` query in `exportAuditTrail` to workspace's repos OR drop the table from export — `audit-trail-export.ts:129-148`. 10 LOC.
4. **[Kill]** Make `exportAuditTrail` take `workspaceId` parameter, gate via membership not ownerId — `audit-trail-export.ts:41-46` + `api/audit-trail/route.ts:17-47`. 15 LOC.
5. **[Kill]** Add `eq(membership.workspaceId, workspaceId)` AND-clause in `revokeMember` queries — `membership.ts:211-223`. 4 LOC.
6. **[Kill]** Replace `workspace.ownerId === user.id` with `userIsMember` in `getScanStatus` + `generateFixesForScan` — `scan-status.ts:41-46` + `fix-actions.ts:37-41`. 10 LOC.
7. **[Kill]** Add `rateLimit` block to Better-Auth config — `packages/auth/src/server.ts:61`. 8 LOC.
8. **[Kill]** Add CSP + HSTS + X-Frame-Options + Referrer-Policy + Permissions-Policy via `next.config.ts` headers() — start in `CSP-Report-Only`. 30 LOC.
9. **[Kill]** Swap in-memory rate-limit Map for `@upstash/ratelimit` or Vercel KV — `lib/rate-limit.ts`. 50 LOC + 1 env var.
10. **[Kill]** Bump `vitest` to ≥4.1.0 (or remove vitest --ui from dev workflow + document) — `package.json`.
11. **[Weak]** Gate `pollPRStatus` + `pollSolution` (already in #1) on membership.
12. **[Weak]** SSRF hardening in `fetchRepoZipball`: ref-regex tightening, `redirect: "manual"` + host re-check, size-cap + zip-bomb defence.
13. **[Weak]** Implement `/account/settings/sessions` + revoke flow.
14. **[Weak]** Implement `/account/settings/delete` (GDPR Art. 17) — even if 7-day-retention is honoured by background job.
15. **[Mid]** Write `docs/operations/byok-key-rotation.md` runbook.
16. **[Mid]** Force-flip `user.emailVerified=true` on first magic-link sign-in.
17. **[Mid]** Tighten `safeNext` allow-list to known route prefixes.

Total: ~5 dev-days for the 10 Kill items (no design work, just code-and-test). The remaining Weak/Mid items can ship in week 3-4.

---

## J · Things I would dig into in Wave-2

- `packages/inngest/src/client.ts` — confirm `INNGEST_SIGNING_KEY` is enforced at startup, not deferred to request-time. Today's surface lets anyone hit `/api/inngest` if the env is unset in production.
- `packages/llm/*` — confirm error messages do NOT include the API key or the BYOK ciphertext on decrypt-failure. Out of scope here but follow-up.
- `packages/pr-workflow/src/local-git-client.ts` — does the local-patch path write to a workspace-shared temp dir without isolation? `apply-dal.ts:166-173` passes `path.join(LOCAL_PATCH_DIR, workspaceId)` — looks fine but the `LocalGitClient` internals weren't read.
- `packages/db/src/migrations/*` — verify all `ON DELETE CASCADE` chains terminate at user/workspace; foreign-key cleanup determinism for GDPR Art. 17 erasure.
- Drizzle adapter mapping — confirm Better-Auth's "anonymous account handling" defaults are off (we don't want anonymous Better-Auth user rows created on every magic-link request before email-click).

---

## K · References

- `packages/auth/src/server.ts` — Better-Auth instance
- `apps/web/src/lib/session.ts` — `getSessionUser()`
- `apps/web/src/lib/workspace-context.ts` — `resolveWorkspaceFromSlug`
- `apps/web/src/lib/dal/galaxie.ts` — canonical `userIsMember` (also duplicated in `apply-dal.ts`, `solution-dal.ts`)
- `apps/web/src/lib/membership.ts` — RBAC ground truth (`getUserRole`, `requireRole`, `inviteAdmin`, `revokeMember`)
- `packages/billing/src/byok-crypto.ts` + `.test.ts` — BYOK envelope
- `apps/web/src/app/api/{auth,stripe,install-webhook,notify-update,events/stream,audit-trail,inngest}/*` — every API route
- `apps/web/next.config.ts` — headers() block (currently empty)
- `apps/web/src/proxy.ts` — middleware (Next 16 renamed)
- `packages/db/src/schema.ts` — schema + foreign-key cascade behaviour
- `SECURITY.md` — disclosure policy
- `docs/audits/2026-05/05-security.md` — Wave-0 baseline (surface pass)
