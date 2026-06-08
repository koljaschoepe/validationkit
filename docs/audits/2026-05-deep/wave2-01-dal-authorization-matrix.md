# Wave-2 / Deep-Audit-01 — DAL Authorization Matrix

**Author:** automated deep-audit (Claude Opus 4.7, 1M)
**Scope:** every DAL function · every Server-Action · every API-Route handler · every page.tsx Server-Component data-fetch
**Method:** systematic file:line walk of `apps/web/src/lib/**`, `apps/web/src/app/api/**/route.ts`, `apps/web/src/app/**/page.tsx`. Read-only.
**Baseline:** `wave1-03-auth-security.md` §B (5 IDOR + 1 RBAC inconsistency)
**Target:** complete authorization-matrix; find what Wave-1 missed

---

## TL;DR

Wave-1 found 5 Kill-tier cross-tenant IDORs (`pollSolution`, `getRepo`, `audit-trail-export` ×2, `revokeMember`) and 1 owner-only RBAC inconsistency (`getScanStatus` + `generateFixesForScan`). Wave-2 systematically walked **every** export in the lib tree and **every** route handler.

**Wave-2 net:**

- **3 new Kill-tier IDOR/integrity findings** Wave-1 missed:
  1. **`listApplyActionsForFinding`** — fully unauthenticated, returns full apply-history including PR URLs + commit SHAs for ANY findingId (`apply-dal.ts:355-376`).
  2. **`getSolution`** (read API) — fully unauthenticated, called publicly by `pollSolution` AND callable directly as a `"use server"` export from `solution-dal.ts:112-124`.
  3. **`listSolutionStatusByFinding`** — bulk read with no auth gate, takes any array of findingIds and returns status+confidence for all (`solution-dal.ts:127-151`). Lower stakes than B1 but useful as an enumeration oracle against galaxie-page tag-cache.
- **2 new Weak-tier IDORs:**
  4. **`addRepo`** (`customers.ts:42-89`) — `"use server"` export with **no `getSessionUser` gate**. Trusts the caller (`addRepoUnderCustomer` route) but is callable as a Server Action directly from any client.
  5. **`listMembers`** (`membership.ts:43-65`) — no membership-gate; takes any workspaceId and dumps members (email + role + invitedBy). Currently called from a page.tsx that does its own gate, but as a `"use server"` export it's callable directly.
- **1 new Mid-tier privilege-escalation:**
  6. **`claimPendingMemberships`** elevates email-keyed pending invites without verifying invite-token freshness. An attacker who acquires a recycled email-domain inherits any prior pending invites for that address (`membership.ts:170-197`). This is the documented design (Wave-1 §A8 "Strong"), but the **per-call invocation in `/dashboard/page.tsx:47`** runs on every dashboard mount, with no IP/UA logging — so the elevation is silent + un-audited.
- **2 new architectural findings:**
  7. **`getScanStatus` + `generateFixesForScan`** owner-only bug Wave-1 caught — but Wave-2 confirms `scan-status.ts:45` + `fix-actions.ts:40` are **the only two** places that join via `workspace.ownerId = user.id`. Every other surface uses `userIsMember`. Fix is a 2-line each rewrite.
  8. **SSE `/api/events/stream` workspace-ambiguity** — uses `ensureDefaultWorkspace(user.id)` to derive the workspace (`events/stream/route.ts:43`). A user who owns 2 workspaces ALWAYS gets the alphabetically-first one's event stream — even while viewing the second workspace's pages. Cross-workspace event leak via the user's own session.
- **3 helper-duplication findings to consolidate:** `userIsMember` is defined identically in 3 files (`apply-dal.ts:28`, `solution-dal.ts:82`, `dal/galaxie.ts:114`). All three accept legacy `workspace.ownerId` as fallback — drift-risk if anyone updates one and forgets the others. Wave-2 recommends a `@/lib/authz` consolidation.

**Severity bands:** 3 new Kill · 2 new Weak · 1 new Mid · 2 architectural (Mid). Wave-1's 5 Kill IDORs are confirmed; nothing was downgraded.

---

## Part A · Authorization-Matrix Table (complete tree)

Legend for IDOR-Risk column:
- `OK` — workspace-scoped + role-checked correctly
- `SURF` — could be hardened (defense-in-depth) but no exploit today
- `IDOR` — cross-tenant data leak risk
- `RBAC-INC` — owner/admin/member inconsistency
- `N/A` — public/un-authed (intentional)
- `WEBHOOK` — webhook with signature verification

### A.1 — DAL: `apps/web/src/lib/dal/galaxie.ts`

| File:Line | Function | Auth | Role Check | Workspace-Scope | Resource-Owner-Verify | Risk | Notes |
|---|---|---|---|---|---|---|---|
| `dal/galaxie.ts:33-80` | `getWorkspaceCounts` | none in fn | none | takes `workspaceId` param | Trusts caller (layout gates) | SURF | exported but only called server-side after `resolveWorkspaceFromSlug` |
| `dal/galaxie.ts:114-142` | `userIsMember` (private) | n/a | n/a | n/a | n/a | OK | canonical helper; **duplicated in apply-dal.ts + solution-dal.ts** |
| `dal/galaxie.ts:144-257` | `loadWorkspaceData` (private) | none | none | filters scan/repo by `workspaceId` ✓ | Yes | OK | inner-only |
| `dal/galaxie.ts:264-295` | `getGalaxieDataForWorkspace` | required (userId param) | role resolved | gates via `userIsMember(ws.id, userId)` ✓ | Yes | OK | Wave-1 confirmed Strong |
| `dal/galaxie.ts:297-317` | `resolveRole` (private) | n/a | n/a | n/a | n/a | OK | helper |
| `dal/galaxie.ts:320-364` | `listUserWorkspaces` | required (userId param) | owner/admin/member resolved | scopes by joining membership.userId ✓ | Yes | OK | inner-only, returns only workspaces user belongs to |

### A.2 — Server-Actions module: `apps/web/src/lib/membership.ts` (`"use server"`)

| File:Line | Function | Auth | Role Check | Workspace-Scope | Resource-Owner-Verify | Risk | Notes |
|---|---|---|---|---|---|---|---|
| `membership.ts:22-41` | `getUserRole` | no `getSessionUser` | reads role from DB | scoped to (`workspaceId`, `userId`) | Yes | OK | callers pass workspaceId+userId |
| `membership.ts:43-65` | `listMembers` | **NONE** | NONE | takes `workspaceId` param | **NO** | **IDOR (Weak)** | `"use server"` export. Currently called from `/settings/members/page.tsx` which gates upstream. But ANY client can invoke directly via Server-Action RPC mechanism if they know a workspaceId. **Returns email + role + invitedBy for every member.** Adds membership-gate or move to private helper. |
| `membership.ts:80-163` | `inviteAdmin` | `getSessionUser` ✓ | owner\|admin only ✓ | scoped to `workspaceId` param ✓ | Yes | OK (Wave-1 B7 flagged: no seat-limit) |
| `membership.ts:170-197` | `claimPendingMemberships` | takes userId + email params | no actor-check | scope-broad (all pending matching email) | trusts caller | **PrivEsc-Mid** | **No IP/UA logged.** Documented Strong by Wave-1, but: recycled-email-domain attack vector. Should write an `audit-log` row per claim. |
| `membership.ts:199-227` | `revokeMember` | `getSessionUser` ✓ | owner ✓ | **MISSING `workspaceId` in target-query** | **NO** | **IDOR (Kill, Wave-1 B6)** | Confirmed. |
| `membership.ts:229-242` | `requireRole` | takes userId param | enforces allow-list | scoped ✓ | Yes | OK | helper, throws on mismatch |

### A.3 — Server-Actions module: `apps/web/src/lib/customer-dal.ts` (`"use server"`)

| File:Line | Function | Auth | Role Check | Workspace-Scope | Resource-Owner-Verify | Risk | Notes |
|---|---|---|---|---|---|---|---|
| `customer-dal.ts:37-93` | `listCustomers` | **NONE** | NONE | takes `workspaceId` param + filters | trusts caller | SURF | called from page.tsx that gates via `resolveWorkspaceFromSlug`. `"use server"` exposure: callable directly with any workspaceId. **Adds defense-in-depth membership check.** |
| `customer-dal.ts:100-165` | `getCustomerById` | NONE | NONE | compound `AND(customerId, workspaceId)` ✓ | Yes | OK (Wave-1 B9 confirmed) | Comment explicit: "caller MUST have validated workspace membership" |
| `customer-dal.ts:173-205` | `addCustomer` | NONE | NONE | takes `workspaceId` param | trusts caller | **IDOR (Weak)** | `"use server"`-exported but no `getSessionUser`. Action wrapper `customer-actions.ts:22-36` does gate it. Direct Server-Action RPC bypass theoretically possible. |
| `customer-dal.ts:218-247` | `updateCustomerApplyMode` | NONE | NONE | compound `AND(customerId, workspaceId)` ✓ | Yes | OK | Comment explicit: caller validates |
| `customer-dal.ts:249-303` | `addRepoUnderCustomer` | NONE | NONE | compound `AND(customerId, workspaceId)` ✓ | Yes | OK | Comment explicit: caller validates; wrapper `customer-actions.ts:51-74` gates with `resolveWorkspaceFromSlug` |

### A.4 — Server-Actions module: `apps/web/src/lib/customers.ts` (`"use server"`)

| File:Line | Function | Auth | Role Check | Workspace-Scope | Resource-Owner-Verify | Risk | Notes |
|---|---|---|---|---|---|---|---|
| `customers.ts:42-89` | `addRepo` | **NONE** | NONE | takes `workspaceId` param | trusts caller | **IDOR (Weak)** | `"use server"` export with NO `getSessionUser`. **No wrapper in customer-actions.ts** — this is the orphan export. Tier-quota check happens but not workspace-membership. **Block GA: add `getSessionUser`+`resolveWorkspaceFromSlug` gate or convert to private fn.** |
| `customers.ts:96-150` | `listRepos` | NONE | NONE | filters by `workspaceId` ✓ | Yes | SURF | scoped but no membership-check; comment says "caller MUST have validated" |
| `customers.ts:156-192` | `getRepo` | NONE | NONE | compound check on repo ✓ | scans join by **rootPath only** | **IDOR (Kill, Wave-1 B2)** | Confirmed. |

### A.5 — Server-Actions module: `apps/web/src/lib/apply-dal.ts` (`"use server"`)

| File:Line | Function | Auth | Role Check | Workspace-Scope | Resource-Owner-Verify | Risk | Notes |
|---|---|---|---|---|---|---|---|
| `apply-dal.ts:28-56` | `userIsMember` (private) | n/a | n/a | n/a | n/a | OK | duplicated helper |
| `apply-dal.ts:61-216` | `applySolution` | requires userId param | `userIsMember(scan.workspaceId, userId)` ✓ | resolves via solution→finding→scan join | Yes | OK | wrapper `apply-actions.ts:13-19` calls `getSessionUser` |
| `apply-dal.ts:218-260` | `dismissFinding` | requires userId param | `userIsMember` ✓ | resolves via finding→scan | Yes | OK |
| `apply-dal.ts:262-299` | `undoDismiss` | requires userId param | `userIsMember` ✓ | resolves via finding→scan | Yes | OK |
| `apply-dal.ts:301-341` | `snoozeFinding` | requires userId param | `userIsMember` ✓ | resolves via finding→scan | Yes | OK |
| `apply-dal.ts:355-376` | **`listApplyActionsForFinding`** | **NONE** | **NONE** | takes only `findingId` param | **NO** | **IDOR (Kill — NEW)** | **No `userId` parameter, no membership check.** Returns `targetUrl` (PR url), `targetRef` (PR number), `targetSha` (commit SHA), `reason` (apply rationale), `decidedAt` for **any findingId**. Findings are UUIDs but leak via screenshots, support tickets, browser history. This is the apply-history equivalent of Wave-1's `pollSolution` bug — **same shape, Wave-1 missed it**. Fix: add `userId` param + `userIsMember(scan.workspaceId)` gate after a finding→scan join. |
| `apply-dal.ts:378-394` | `pollPRStatus` | **NONE** | NONE | takes only `applyActionId` | **NO** | **IDOR (Weak, Wave-1 B10)** | Confirmed. Returns only `state` string; lower stakes than B1. |

### A.6 — Server-Actions module: `apps/web/src/lib/solution-dal.ts` (`"use server"`)

| File:Line | Function | Auth | Role Check | Workspace-Scope | Resource-Owner-Verify | Risk | Notes |
|---|---|---|---|---|---|---|---|
| `solution-dal.ts:82-110` | `userIsMember` (private) | n/a | n/a | n/a | n/a | OK | duplicated helper |
| `solution-dal.ts:112-124` | **`getSolution`** | **NONE** | NONE | none — direct findingId lookup | **NO** | **IDOR (Kill — NEW)** | `"use server"`-exported, no auth at all. **Returns full `patch`, `rationale`, `confidence`, `filesTouched`, `failureReason`.** Wave-1 §B1 caught `pollSolution` which is a thin wrapper around this — but **`getSolution` is also a `"use server"` export and is callable directly as Server-Action RPC**. Same severity. Fix: add `userId` + membership-gate, OR mark it private and only expose through the gated `pollSolution` (which itself must also be fixed). |
| `solution-dal.ts:127-151` | **`listSolutionStatusByFinding`** | **NONE** | NONE | none — accepts arbitrary findingId list | **NO** | **IDOR (Weak — NEW)** | `"use server"`-exported. Takes `findingIds: string[]` and returns status+confidence per finding. Bulk enumeration vector — given a galaxie page leak, an attacker can probe 100 findings/call and learn which ones have ready/failed/pending solutions across all tenants. Status itself is low-stakes but it's an oracle. Fix: scope to a workspace-membership upstream check. |
| `solution-dal.ts:157-280` | `getOrGenerateSolution` | requires userId param | `userIsMember` ✓ | finding→scan join | Yes | OK | wrapper `solution-actions.ts:10-16` calls `getSessionUser` |

### A.7 — Server-Actions module: `apps/web/src/lib/solution-actions.ts` (`"use server"`)

| File:Line | Function | Auth | Role Check | Workspace-Scope | Resource-Owner-Verify | Risk | Notes |
|---|---|---|---|---|---|---|---|
| `solution-actions.ts:10-16` | `requestSolution` | `getSessionUser` ✓ | via `getOrGenerateSolution` ✓ | scoped | Yes | OK |
| `solution-actions.ts:18-24` | `pollSolution` | **NONE — deliberate** | NONE | none | **NO** | **IDOR (Kill, Wave-1 B1)** | Confirmed. |

### A.8 — Server-Actions module: `apps/web/src/lib/install-requests.ts` (`"use server"`)

| File:Line | Function | Auth | Role Check | Workspace-Scope | Resource-Owner-Verify | Risk | Notes |
|---|---|---|---|---|---|---|---|
| `install-requests.ts:31-63` | `requestInstall` | `getSessionUser` ✓ | none (any member) | `resolveWorkspaceFromSlug` ✓ | Yes | OK (Wave-1 B8 flagged: no admin gate on write-scope) |
| `install-requests.ts:72-172` | `decideInstall` | `getSessionUser` ✓ | owner\|admin ✓ via `getUserRole` | derived from request-row via inner-join | Yes | OK | Append-only audit-log with IP+UA ✓ |
| `install-requests.ts:178-200` | `listRequestsForWorkspace` | NONE | NONE | takes `workspaceId` param | trusts caller | SURF | called from page.tsx that gates upstream. `"use server"`-exposed — add defense-in-depth. |
| `install-requests.ts:206-233` | `listPendingRequestsForWorkspace` | NONE | NONE | takes `workspaceId` param | trusts caller | SURF | same exposure pattern |
| `install-requests.ts:244-270` | `listDecisionsForWorkspace` | NONE | NONE | inner-joined to `installRequest.workspaceId` ✓ | Yes | OK | scoped via join |

### A.9 — Server-Actions module: `apps/web/src/lib/audit-action.ts` (`"use server"`)

| File:Line | Function | Auth | Role Check | Workspace-Scope | Resource-Owner-Verify | Risk | Notes |
|---|---|---|---|---|---|---|---|
| `audit-action.ts:55-80` | `resolveActor` (private) | n/a | n/a | resolves via `ensureDefaultWorkspace` | Yes | OK | anonymous → no workspaceId; signed-in → default ws |
| `audit-action.ts:82-200` | `auditAction` | optional (anonymous OK) | tier-based | scoped on signed-in path | Yes | OK | anonymous bucket gets `intensity: "quick"`; rate-limit applied; Wave-1 §D6 noted SSRF surface |
| `audit-action.ts:202-256` | `auditGithubUrl` (private) | n/a | n/a | n/a | n/a | OK | inner-only |
| `audit-action.ts:258-291` | `enqueueBackgroundAudit` (private) | n/a | n/a | scoped to actor.workspaceId | Yes | OK | inner-only |
| `audit-action.ts:293-418` | `runForegroundAudit` (private) | n/a | n/a | scoped to actor.workspaceId | Yes | OK | inner-only |

### A.10 — Server-Actions module: `apps/web/src/lib/billing-actions.ts` (`"use server"`)

| File:Line | Function | Auth | Role Check | Workspace-Scope | Resource-Owner-Verify | Risk | Notes |
|---|---|---|---|---|---|---|---|
| `billing-actions.ts:37-92` | `createCheckoutSession` | `getSessionUser` ✓ | none (any signed-in user) | `ensureDefaultWorkspace` ✓ | Yes | OK | always operates on the user's own default workspace |
| `billing-actions.ts:94-104` | `startCheckoutAction` (form) | indirect via above | none | inherited | Yes | OK |
| `billing-actions.ts:106-139` | `createBillingPortalSession` | `getSessionUser` ✓ | none | `ensureDefaultWorkspace` ✓ | Yes | OK |
| `billing-actions.ts:141-149` | `openBillingPortalAction` (form) | indirect | none | inherited | Yes | OK |
| `billing-actions.ts:154-212` | `createPrepaidPackCheckoutSession` | `getSessionUser` ✓ | none | `ensureDefaultWorkspace` ✓ | Yes | OK |
| `billing-actions.ts:214-231` | `buyPrepaidPackAction` (form) | indirect | none | inherited | Yes | OK |

**Architectural note:** all billing actions use `ensureDefaultWorkspace(user.id)` — which returns the alphabetically/insertion-first workspace owned by the user. **A user who is an admin/member of a different workspace cannot trigger billing actions on it** (only the legacy-owner can). This is by-design but inconsistent with the membership-as-RBAC-source-of-truth model the rest of the codebase follows. Pre-GA: confirm the design or add `workspaceSlug` param to all billing actions.

### A.11 — Server-Actions module: `apps/web/src/lib/customer-actions.ts` (`"use server"`)

| File:Line | Function | Auth | Role Check | Workspace-Scope | Resource-Owner-Verify | Risk | Notes |
|---|---|---|---|---|---|---|---|
| `customer-actions.ts:22-36` | `addCustomerAction` | `getSessionUser` ✓ | `resolveWorkspaceFromSlug` (membership gate) ✓ | Yes | Yes | OK | calls into `addCustomer` |
| `customer-actions.ts:38-49` | `updateCustomerApplyModeAction` | `getSessionUser` ✓ | `resolveWorkspaceFromSlug` ✓ | Yes | Yes | OK |
| `customer-actions.ts:51-74` | `addRepoAction` | `getSessionUser` ✓ | `resolveWorkspaceFromSlug` ✓ | Yes | Yes | OK |

### A.12 — Server-Actions module: `apps/web/src/lib/apply-actions.ts` (`"use server"`)

| File:Line | Function | Auth | Role Check | Workspace-Scope | Resource-Owner-Verify | Risk | Notes |
|---|---|---|---|---|---|---|---|
| `apply-actions.ts:13-19` | `applySolutionAction` | `getSessionUser` ✓ | inherited via `applySolution` `userIsMember` ✓ | Yes | Yes | OK |
| `apply-actions.ts:21-28` | `dismissFindingAction` | `getSessionUser` ✓ | inherited ✓ | Yes | Yes | OK |
| `apply-actions.ts:30-36` | `undoDismissAction` | `getSessionUser` ✓ | inherited ✓ | Yes | Yes | OK |
| `apply-actions.ts:38-45` | `snoozeFindingAction` | `getSessionUser` ✓ | inherited ✓ | Yes | Yes | OK |
| `apply-actions.ts:47-51` | **`pollPRStatusAction`** | **NONE** | NONE | inherited (none) | **NO** | **IDOR (Weak, Wave-1 B10)** | Confirmed — the action wrapper doesn't even call `getSessionUser`. |

### A.13 — Server-Actions module: `apps/web/src/lib/workspace-ai-actions.ts` (`"use server"`)

| File:Line | Function | Auth | Role Check | Workspace-Scope | Resource-Owner-Verify | Risk | Notes |
|---|---|---|---|---|---|---|---|
| `workspace-ai-actions.ts:22-28` | `loadWorkspace` (private) | `getSessionUser` ✓ | `resolveWorkspaceFromSlug` ✓ | Yes | Yes | OK | canonical pattern |
| `workspace-ai-actions.ts:30-97` | `updateByokSettings` | via `loadWorkspace` ✓ | **none (any member)** | scoped ✓ | Yes | **RBAC-INC** | **Any member (not just owner/admin) can change BYOK keys.** Should be owner-only per Wave-1's framing — BYOK ciphertext is a credential. Add `requireRole(ws.id, user.id, ['owner', 'admin'])`. |
| `workspace-ai-actions.ts:99-114` | `toggleAutoOverage` | via `loadWorkspace` ✓ | none (any member) | scoped ✓ | Yes | **RBAC-INC** | Member can toggle overage billing on the workspace. Same fix. |
| `workspace-ai-actions.ts:116-145` | `setSpendCap` | via `loadWorkspace` ✓ | none (any member) | scoped ✓ | Yes | **RBAC-INC** | Member can change the spend-cap. Same fix. Plus a math bug at line 128 (`microcents` initial calc is wrong but overwritten at 137 — clean up the dead code). |
| `workspace-ai-actions.ts:147-165` | `setDefaultIntensity` | via `loadWorkspace` ✓ | none (any member) | scoped ✓ | Yes | RBAC-INC (low) | Less critical — just a default. Still should be admin-gated. |

### A.14 — Server-Actions module: `apps/web/src/lib/fix-actions.ts` (`"use server"`)

| File:Line | Function | Auth | Role Check | Workspace-Scope | Resource-Owner-Verify | Risk | Notes |
|---|---|---|---|---|---|---|---|
| `fix-actions.ts:19-84` | `generateFixesForScan` | `getSessionUser` ✓ | **`workspace.ownerId === user.id` ONLY** | scoped via JOIN with ownerId match | Yes | **RBAC-INC (Kill — Wave-1 B5)** | Confirmed. Admin/member of the workspace gets a silent 401. |

### A.15 — Server-Actions module: `apps/web/src/lib/scan-status.ts` (`"use server"`)

| File:Line | Function | Auth | Role Check | Workspace-Scope | Resource-Owner-Verify | Risk | Notes |
|---|---|---|---|---|---|---|---|
| `scan-status.ts:22-59` | `getScanStatus` | `getSessionUser` ✓ | **`workspace.ownerId === user.id` ONLY** | scoped via JOIN with ownerId match | Yes | **RBAC-INC (Kill — Wave-1 B5)** | Confirmed. Same shape as `generateFixesForScan`. |

### A.16 — Server-Actions module: `apps/web/src/lib/dpa-actions.ts` (`"use server"`)

| File:Line | Function | Auth | Role Check | Workspace-Scope | Resource-Owner-Verify | Risk | Notes |
|---|---|---|---|---|---|---|---|
| `dpa-actions.ts:16-47` | `getDpaAcceptanceState` | `getSessionUser` ✓ | n/a (user-scoped) | n/a (no workspace) | Yes (userId) | OK | per-user record |
| `dpa-actions.ts:53-90` | `acceptDpaAction` | `getSessionUser` ✓ | n/a | n/a | Yes | OK | unique-index dedupe |

**Architectural note:** `dpa_acceptance.user_id` is now `ON DELETE SET NULL` (schema.ts:579). The `uniqueIndex` on `(userId, dpaVersion)` may break when userId becomes NULL — Postgres unique-indexes treat NULL as distinct by default, so the constraint still tolerates NULL-NULL, but the foreign-key integrity is lost (orphaned DPA acceptances). Acceptable for compliance audit-trail but document the lookup semantics: orphaned rows count as "accepted by deleted user" not "accepted by current user".

### A.17 — Server-Actions module: `apps/web/src/lib/audit-trail-export.ts` (`"use server"`)

| File:Line | Function | Auth | Role Check | Workspace-Scope | Resource-Owner-Verify | Risk | Notes |
|---|---|---|---|---|---|---|---|
| `audit-trail-export.ts:34-159` | `exportAuditTrail` | `getSessionUser` ✓ | **owner-only via `workspace.ownerId`** | single workspace (`.limit(1)`) | partial | **Kill (Wave-1 B3 + B4)** | Confirmed × 2: missing `WHERE workspaceId` on `webhook_event`; owner-only single-workspace selection. |
| `audit-trail-export.ts:161-178` | `exportAuditTrailCsv` | inherited from above ✓ | inherited | inherited | inherited | inherited | wrapper |

### A.18 — Other server-only modules

| File:Line | Function | Auth | Role Check | Workspace-Scope | Resource-Owner-Verify | Risk | Notes |
|---|---|---|---|---|---|---|---|
| `workspaces.ts:14-34` | `ensureDefaultWorkspace` | requires userId param | n/a | filters by ownerId | Yes | OK | uses legacy owner-pointer — does NOT account for users who are admin/member-only of another workspace |
| `workspace-context.ts:25-55` | `resolveWorkspaceFromSlug` | requires userId param | membership OR legacy owner | scoped ✓ | Yes | OK | canonical workspace-resolver |
| `session.ts:17-31` | `getSessionUser` | n/a (returns null if no session) | n/a | n/a | n/a | OK | Wave-1 §A2 noted error-swallowing |
| `apply-mode.ts:*` | pure helpers | n/a | n/a | n/a | n/a | OK | no DB access |
| `scan-status.ts` | covered in A.15 | | | | | | |

### A.19 — API Routes

| File:Line | Method | Auth Position | Workspace Resolution | Risk | Notes |
|---|---|---|---|---|---|
| `api/auth/[...all]/route.ts:1-17` | GET/POST | delegated to Better-Auth `auth.handler(req)` | n/a | OK | catch-all handler; Better-Auth's CSRF + cookie-handling apply |
| `api/audit-trail/route.ts:17-47` | GET | inherited from `exportAuditTrail` (`getSessionUser`) | owner-only single workspace | **Kill (Wave-1 B3+B4)** | route-level: no `workspaceId` query param accepted — entire surface is "current user's first workspace". |
| `api/events/stream/route.ts:34-131` | GET | `getSessionUser` at line 38 ✓ | **`ensureDefaultWorkspace(user.id)` at line 43** | **Mid — NEW** | **Workspace ambiguity.** SSE stream is hard-coded to the user's legacy-owner workspace. A user who is admin of workspace-B but legacy-owner of workspace-A will receive **workspace-A's events while viewing workspace-B's pages**. Cross-workspace event-leak via the user's own session. Fix: accept `workspaceSlug` query param + gate via `resolveWorkspaceFromSlug`. |
| `api/inngest/route.ts:1-4` | GET/POST/PUT | delegated to inngest SDK `serve()` | n/a | OK if signing-key set | Wave-1 §D3 flagged: confirm `INNGEST_SIGNING_KEY` is enforced. Out-of-scope here. |
| `api/install-webhook/route.ts:22-123` | POST | `verifyWebhookSignature` at line 38-48 ✓ | derived from payload (`installation.repositories[*].fullName`) — **trusts GitHub** | WEBHOOK-OK | Wave-1 confirmed Exceptional. Idempotent via `delivery_id` PK. ⚠ Sub-finding: `pickWorkspaceForInstallation` (line 284-301) picks the **first** workspace matching the installationId — if two workspaces share the same install (shouldn't happen, but installationId could collide on re-install), the repo is silently attached to the wrong workspace. |
| `api/notify-update/route.ts:41-152` | POST | per-repo HMAC at line 95-104 ✓ | resolved from `repo.id` lookup | WEBHOOK-OK | Wave-1 confirmed Exceptional. |
| `api/stripe/webhook/route.ts:65-159` | POST | `stripe.webhooks.constructEvent` at line 93 ✓ | derived from `metadata.workspaceId` or `client_reference_id` or `lookupWorkspaceByCustomer` | WEBHOOK-OK | Wave-1 confirmed Exceptional. Idempotent via `stripe_event` PK. |

### A.20 — Page-Components (data-fetch in Server-Components)

| File:Line | Page | Auth Gate | Workspace Gate | Resource-Owner-Verify | Risk | Notes |
|---|---|---|---|---|---|---|
| `app/page.tsx` | `/` (landing) | none | none | n/a | N/A | anonymous-friendly |
| `app/login/page.tsx:48-49` | `/login` | redirects if signed-in | n/a | n/a | OK | Wave-1 §A5 noted weak `safeNext` |
| `app/auth/verify/page.tsx` | `/auth/verify` | magic-link callback | n/a | n/a | OK | Wave-1 §A5 |
| `app/pricing/page.tsx` | `/pricing` | none | none | n/a | N/A | public |
| `app/status/page.tsx` | `/status` | none | none | n/a | N/A | health-check page |
| `app/trust/page.tsx` | `/trust` | none | none | n/a | N/A | public |
| `app/trust/dpa/page.tsx:37-50` | `/trust/dpa` | `getSessionUser` (optional, accept button gated) | n/a | n/a | OK | user-scoped DPA |
| `app/trust/eval/page.tsx` | `/trust/eval` | n/a | n/a | n/a | N/A | public eval-history |
| `app/legal/*/page.tsx` | various | none | none | n/a | N/A | public legal copy |
| `app/billing/page.tsx:20-37` | `/billing` (redirect) | `getSessionUser` ✓ | `ensureDefaultWorkspace` | Yes (legacy owner) | OK | redirect-only |
| `app/dashboard/page.tsx:19-70` | `/dashboard` | `getSessionUser` ✓ | `listUserWorkspaces` ✓ | Yes | OK | calls `claimPendingMemberships` (see Mid finding above) |
| `app/account/settings/layout.tsx:54-70` | account layout | `getSessionUser` ✓ | n/a | Yes | OK | user-scoped |
| `app/account/settings/profile/page.tsx` | profile | `getSessionUser` ✓ | n/a | Yes | OK |
| `app/account/settings/sessions/page.tsx` | sessions | static stub | n/a | n/a | N/A | Wave-1 §A3 noted not-implemented |
| `app/account/settings/delete/page.tsx` | delete | static stub | n/a | n/a | N/A | Wave-1 §A3 |
| `app/account/settings/notifications/page.tsx` | notifications | not gated explicitly (covered by layout) | n/a | Yes | OK | layout-gate covers |
| `app/account/settings/connections/page.tsx` | connections | covered by layout | n/a | Yes | OK |
| `app/[workspace]/layout.tsx:16-36` | workspace layout | `getSessionUser` ✓ + `listUserWorkspaces` membership-check ✓ | YES — gate at layout level | Yes | OK | **canonical pattern: all `/[workspace]/*` children inherit this gate.** Returns `notFound()` (NOT 403) to avoid leaking workspace-slug existence. |
| `app/[workspace]/page.tsx:15-69` | workspace home | inherited from layout + `getGalaxieDataForWorkspace` ✓ | Yes | Yes | OK | sets a cookie on every mount — minor side-channel for `vk_default_workspace_slug` (line 39-44) |
| `app/[workspace]/customers/page.tsx:25-36` | customers list | layout + `resolveWorkspaceFromSlug` ✓ | Yes | Yes | OK | calls `listCustomers(ws.id)` |
| `app/[workspace]/customers/[customerId]/page.tsx:25-42` | customer detail | layout + `resolveWorkspaceFromSlug` ✓ + `getCustomerById(ws.id, customerId)` ✓ | Yes | Yes | OK |
| `app/[workspace]/scans/page.tsx:24-49` | scans list | layout + `resolveWorkspaceFromSlug` ✓ | Yes | Yes | OK | direct DB query with `eq(scan.workspaceId, ws.id)` |
| `app/[workspace]/scans/[id]/page.tsx:12-77` | scan detail | layout + `resolveWorkspaceFromSlug` ✓ + compound `AND(id, workspaceId)` ✓ | Yes | Yes | OK |
| `app/[workspace]/repos/[repoId]/page.tsx:19-103` | repo detail | layout + `resolveWorkspaceFromSlug` + `getRepo(ws.id, repoId)` | Yes | partial | **Kill (Wave-1 B2)** | `getRepo` itself joins scans by rootPath; confirmed. |
| `app/[workspace]/repos/[repoId]/access/page.tsx:32-93` | repo access | layout + `resolveWorkspaceFromSlug` ✓ + compound `AND(repo.id, repo.workspaceId)` ✓ + `getUserRole` admin-gate ✓ | Yes | Yes | OK | proper admin-gating pattern (Wave-2 reference impl) |
| `app/[workspace]/requests/page.tsx:25-37` | requests list | layout + `resolveWorkspaceFromSlug` ✓ | Yes | Yes | OK | calls `listRequestsForWorkspace(ws.id)` |
| `app/[workspace]/settings/layout.tsx:68-89` | settings layout | `getSessionUser` ✓ | **NO explicit workspace-slug check at this layout** | inherited from parent `[workspace]/layout.tsx` | OK | parent layout-gate covers; defense-in-depth would call `resolveWorkspaceFromSlug` here too |
| `app/[workspace]/settings/page.tsx` | settings root | redirect to `/general` | n/a | n/a | N/A | redirect-only |
| `app/[workspace]/settings/general/page.tsx` | general | static stub | n/a | n/a | N/A | "Coming with nova-2-settings-backend" |
| `app/[workspace]/settings/members/page.tsx:17-30` | members | `getSessionUser` ✓ + `listUserWorkspaces` membership-check ✓ | Yes | Yes | OK | calls `listMembers(ws.id)` |
| `app/[workspace]/settings/billing/page.tsx:53-87` | billing | layout + `resolveWorkspaceFromSlug` ✓ + reads subscription `eq(workspaceId)` ✓ | Yes | Yes | OK | also reads `prepaidCreditGrant` filtered by `workspaceId` ✓ |
| `app/[workspace]/settings/integrations/page.tsx:8-12` | integrations | `getSessionUser` ✓ | inherited | n/a | OK | static config display, no DB row dependent on workspace |
| `app/[workspace]/settings/api-keys/page.tsx` | api keys | static stub | n/a | n/a | N/A |
| `app/[workspace]/settings/ai/page.tsx:42-67` | AI settings | layout + `resolveWorkspaceFromSlug` ✓ + subscription scoped ✓ | Yes | Yes | OK | but mutation-actions are RBAC-INC (see A.13) |
| `app/[workspace]/settings/audit-apply/page.tsx` | audit-apply | static stub | n/a | n/a | N/A |
| `app/[workspace]/settings/galaxie/page.tsx` | galaxie | static stub | n/a | n/a | N/A |
| `app/[workspace]/settings/notifications/page.tsx` | notifications | static stub | n/a | n/a | N/A |
| `app/[workspace]/settings/webhooks/page.tsx` | webhooks | static stub | n/a | n/a | N/A |
| `app/[workspace]/settings/danger/page.tsx` | danger | static stub | n/a | n/a | N/A |

---

## Part B · Cross-Tenant IDOR Survey (per resource type)

For each resource, every **read** and **write** path. ✓ = correct workspace-scoping. ⚠ = scoping present but reliant on caller. 🔴 = missing scoping.

### B.1 `workspace`

- **Read**: `resolveWorkspaceFromSlug` (slug → ws + membership-gate) ✓ · `listUserWorkspaces` (returns only joined-membership rows) ✓
- **Write**: `ensureDefaultWorkspace` (creates new ws when none owned) ✓ · `applyTierToWorkspace` (Stripe-webhook only, payload-derived) ✓
- **Verdict:** ✓ clean

### B.2 `membership`

- **Read**: `listMembers(workspaceId)` ⚠ — `"use server"` exported, no auth gate on the helper itself · `getUserRole(workspaceId, userId)` ✓
- **Write**: `inviteAdmin` ✓ (owner\|admin gate) · `revokeMember` 🔴 (**Kill: Wave-1 B6**) · `claimPendingMemberships` ⚠ (email-keyed, no audit-log)
- **Verdict:** Wave-1 found revokeMember. Wave-2 adds: `listMembers` is `"use server"`-callable, no gate. Mid follow-up: `claimPendingMemberships` needs audit-log + IP/UA capture.

### B.3 `customer`

- **Read**: `listCustomers(workspaceId)` ⚠ (caller-trusted) · `getCustomerById` ✓ (compound)
- **Write**: `addCustomer(workspaceId)` ⚠ (caller-trusted; `customer-actions.ts` wrapper gates) · `updateCustomerApplyMode` ✓ (compound) · `addRepoUnderCustomer` ✓
- **Verdict:** Read-paths rely on caller. As `"use server"`-exports they're RPC-callable; add defense-in-depth.

### B.4 `repo`

- **Read**: `listRepos(workspaceId)` ⚠ · `getRepo(workspaceId, repoId)` 🔴 (**Kill: Wave-1 B2** — scans-join by rootPath) · `pickWorkspaceForInstallation` (webhook-internal) ⚠
- **Write**: `addRepo(workspaceId)` 🔴 (**Weak: NEW** — no auth at all) · `addRepoUnderCustomer` ✓ · install-webhook auto-inserts ✓ (workspace derived from request-row)
- **Verdict:** Wave-1 found `getRepo`. Wave-2 adds: `addRepo` is `"use server"`-callable with NO auth. Has tier-quota check but trusts the workspaceId arg.

### B.5 `scan`

- **Read**: `scan-status.ts:getScanStatus` 🔴 (**Kill: Wave-1 B5** — owner-only) · scan-detail page (compound id+workspaceId) ✓ · `scans/page.tsx` `eq(workspaceId)` ✓
- **Write**: `audit-action.ts:runForegroundAudit` ✓ (scoped to actor.workspaceId) · Inngest worker (out-of-scope) · `notify-update` route (scoped via repo lookup) ✓
- **Verdict:** Wave-1 found getScanStatus. Wave-2 confirms write-paths clean.

### B.6 `finding`

- **Read**: filtered by `inArray(scanId, scanIds)` in `loadWorkspaceData` ✓ (scans pre-filtered by workspace) · `generateFixesForScan` 🔴 (owner-only via scan)
- **Write**: `audit-action.ts` inserts ✓ (via report path) · `apply-dal.ts:dismiss/snooze/undo` ✓ (membership-gated)
- **Verdict:** Wave-1 covered `generateFixesForScan`. Nothing new.

### B.7 `solution`

- **Read**: `getSolution(findingId)` 🔴 (**Kill: NEW** — `"use server"`-callable, no auth) · `getOrGenerateSolution` ✓ · `listSolutionStatusByFinding` 🔴 (**Weak: NEW** — bulk enumeration oracle)
- **Write**: `getOrGenerateSolution` ✓
- **Verdict:** Wave-1 caught `pollSolution`. Wave-2 adds the underlying `getSolution` AND the bulk-list `listSolutionStatusByFinding` — same shape, also exposed.

### B.8 `apply_action`

- **Read**: `listApplyActionsForFinding(findingId)` 🔴 (**Kill: NEW** — no auth at all) · `pollPRStatus(applyActionId)` 🔴 (**Weak: Wave-1 B10**)
- **Write**: `applySolution` ✓ · `dismissFinding` ✓ · `snoozeFinding` ✓ · `undoDismiss` ✓ — all userIsMember-gated
- **Verdict:** Wave-2's biggest miss-from-Wave-1: `listApplyActionsForFinding` returns FULL apply-history (PR URLs, commit SHAs, decision rationale) with no auth.

### B.9 `install_request`

- **Read**: `listRequestsForWorkspace` ⚠ · `listPendingRequestsForWorkspace` ⚠ — both `"use server"`-exposed with no auth-gate
- **Write**: `requestInstall` ✓ · `decideInstall` ✓ (owner\|admin) · install-webhook ✓
- **Verdict:** read-paths trust caller; defense-in-depth recommended.

### B.10 `install_decision`

- **Read**: `listDecisionsForWorkspace` ✓ (scoped via inner-join with `installRequest.workspaceId`)
- **Write**: only inside `decideInstall` ✓
- **Verdict:** ✓ clean

### B.11 `credit_ledger`

- **Read**: not exposed via DAL — read only inside `@vk/billing` (out-of-scope, but confirm)
- **Write**: `grantCredits` / `consumeCredits` (in `@vk/billing`, called from server-actions with workspaceId derived from session) ✓
- **Verdict:** ✓ (subject to `@vk/billing` audit)

### B.12 `prepaid_credit_grant`

- **Read**: `billing/page.tsx:78-87` filters by `workspaceId` ✓
- **Write**: only inside Stripe-webhook `grantPrepaidPack` ✓ (workspaceId derived from `session.metadata.workspaceId`)
- **Verdict:** ✓ clean

### B.13 `stripe_event`

- **Read**: not exposed in user-facing surfaces
- **Write**: only stripe-webhook upsert ✓
- **Verdict:** ✓ clean (Wave-1 confirmed Exceptional)

### B.14 `webhook_event`

- **Read**: `audit-trail-export.ts:129-148` 🔴 (**Kill: Wave-1 B3** — no workspace filter)
- **Write**: only `install-webhook` route ✓
- **Verdict:** Wave-1 caught it. Confirmed.

### B.15 `audit_run_cost`

- **Read**: not currently exposed via DAL
- **Write**: only inside `audit-action.ts:runForegroundAudit` ✓
- **Verdict:** ✓ clean (read-path TBD when billing dashboard surfaces it)

### B.16 `event` (SSE)

- **Read**: `/api/events/stream` 🔴 (**Mid: NEW** — uses `ensureDefaultWorkspace`, hard-coded to legacy-owner workspace)
- **Write**: `publishEvent` inside Inngest functions + install-webhook ✓ (workspaceId derived from request context)
- **Verdict:** Wave-2 adds the SSE workspace-ambiguity finding.

### B.17 `notification` (planned)

- Not yet implemented (settings-backend sub-plan)
- **Verdict:** N/A

### B.18 `byok_secret` (lives on `subscription` row)

- **Read**: decrypted only inside `@vk/billing` provider-resolution (server-side, never returned)
- **Write**: `updateByokSettings` ⚠ (any-member writes; RBAC-INC)
- **Verdict:** Wave-2 flags member-can-rotate-key as RBAC-INC. Owner/admin only.

### B.19 `dpa_acceptance`

- **Read**: `getDpaAcceptanceState` ✓ (per-user, scoped to userId)
- **Write**: `acceptDpaAction` ✓ (per-user, idempotent)
- **Verdict:** ✓ clean. Architectural note: `ON DELETE SET NULL` on userId leaves orphan rows; that's intentional for audit-trail.

---

## Part C · Privilege-Escalation Surface

### C.1 — Owner/Admin/Member inconsistencies

Wave-1 found 2 surfaces hard-gate on `workspace.ownerId`:
- `getScanStatus` (`scan-status.ts:45`)
- `generateFixesForScan` (`fix-actions.ts:40`)

Wave-2 systematic walk confirms **these are the only two** that take this shortcut. Every other workspace-scoped function uses `userIsMember` or `getUserRole`. **Fix surface: 4 LOC total.**

Wave-2 adds a NEW class of inconsistency in `workspace-ai-actions.ts`:
- `updateByokSettings`, `toggleAutoOverage`, `setSpendCap`, `setDefaultIntensity` are **any-member writable**. BYOK key and spend-cap should be owner-only (or owner+admin). 4 surfaces × 1 LOC each.

### C.2 — Self-vs-others actions

- **Members updating others?** `revokeMember` allows owner-only revoke of any non-owner (correctly gated within workspace if Wave-1 B6 is fixed). No self-revoke surface (a member can't leave their own membership — should ship in nova-2-settings-backend).
- **Members updating workspace billing?** `billing-actions.ts` always uses `ensureDefaultWorkspace(user.id)` which returns the user's own legacy-owned workspace. **A member-only user of another workspace cannot trigger Stripe checkout for it** (correct by-design).

### C.3 — Cross-workspace privilege-leak

Wave-1 found `revokeMember`. Wave-2 searched for the same anti-pattern:
- `decideInstall` joins `installRequest → workspace` and reads `workspace.ownerId` AS `isLegacyOwner` — but only AFTER the join via `installRequest.id`. The role-check is then on the joined workspace's role. **No cross-workspace leak.** ✓
- `inviteAdmin` operates on `workspaceId` param and gates with `getUserRole(workspaceId, inviter.id)`. **Correct.** ✓
- `updateCustomerApplyMode` operates on `customerId + workspaceId` compound. **Correct.** ✓

### C.4 — Invite-flow privilege-escalation

`claimPendingMemberships(userId, email)`:
- Idempotent. ✓
- Triggered by every dashboard mount in `/dashboard/page.tsx:47`. ✓
- Email-keyed lookup with `eq(invitedEmail, email.toLowerCase())`.
- **No audit-log row** when a claim flips a `pending` → `active` membership.

**Threat:** if Alice was invited to workspace-A at `alice@old-corp.com`, then `old-corp.com` lets the domain lapse and Bob registers `alice@old-corp.com`, Bob inherits the pending invite. The same is true for any acquisition where an attacker gains control of the email. Not "Kill" because it requires the email-takeover, but **Mid**: the claim should write an audit-log entry with IP+UA, and there should be a UI surface to "review pending invites awaiting first sign-in" so workspace owners can revoke stale invites.

### C.5 — Magic-link-as-RCE-vector

Wave-1 §A4 / §A5 covered. Wave-2 spot-check: the `/auth/verify` callback writes the session and then bounces to `safeNext`. If `safeNext` returns `/dashboard?intent=audit&repo=...`, dashboard runs `auditAction` with the user's session (`dashboard/page.tsx:52-63`). **The repo URL comes from `searchParams`, which comes from the magic-link recipient — so the email-receiver IS the attacker-controlled input.** SSRF surface (Wave-1 §D6) applies here directly. Acceptable today (parsing is github-only), but logged.

---

## Part D · Better-Auth + Session-Validation

### D.1 — `getSessionUser()` callers

Wave-2 grep: 18 call-sites across:
- Server-Actions (all `"use server"` modules): consistent pattern of `const user = await getSessionUser(); if (!user) return { ok:false, error:"Sign in first." }`. ✓
- Page-components: `const user = await getSessionUser(); if (!user) redirect("/login")`. ✓
- API-routes: 1 SSE (`api/events/stream/route.ts:38`); 1 audit-trail (`api/audit-trail/route.ts` via DAL call). ✓
- Webhooks: don't call `getSessionUser` — they verify HMAC signatures instead. ✓ correct semantic.

**No surface that should call `getSessionUser` doesn't.** ✓

### D.2 — Server-Actions running without `getSessionUser`

Wave-2 systematic find of `"use server"` exports that DON'T call `getSessionUser` directly OR through a wrapper:

| Function | Why no `getSessionUser`? | Risk |
|---|---|---|
| `customer-dal.ts:listCustomers` | "caller MUST have validated" — wrapper-pattern | SURF |
| `customer-dal.ts:getCustomerById` | "caller MUST have validated" | SURF |
| `customer-dal.ts:addCustomer` | wrapper `addCustomerAction` gates | SURF |
| `customer-dal.ts:updateCustomerApplyMode` | wrapper gates | SURF |
| `customer-dal.ts:addRepoUnderCustomer` | wrapper gates | SURF |
| `customers.ts:addRepo` | **NO WRAPPER** | **IDOR (NEW)** |
| `customers.ts:listRepos` | called from page.tsx | SURF |
| `customers.ts:getRepo` | "caller MUST have validated" — but bug in scan join | Kill (Wave-1 B2) |
| `apply-dal.ts:listApplyActionsForFinding` | **NO WRAPPER, NO PARAM** | **Kill (NEW)** |
| `apply-dal.ts:pollPRStatus` | wrapper `pollPRStatusAction` also doesn't gate | Weak (Wave-1 B10) |
| `solution-dal.ts:getSolution` | wrapper `pollSolution` deliberately doesn't gate | Kill (Wave-1 B1 partly; full surface NEW) |
| `solution-dal.ts:listSolutionStatusByFinding` | no wrapper | Weak (NEW) |
| `solution-actions.ts:pollSolution` | deliberate auth-bypass | Kill (Wave-1 B1) |
| `apply-actions.ts:pollPRStatusAction` | inherits | Weak |
| `audit-trail-export.ts:*` | calls `getSessionUser` but owner-only ↓ | Kill (Wave-1 B3+B4) |
| `install-requests.ts:listRequestsForWorkspace` | callee-trusted pattern | SURF |
| `install-requests.ts:listPendingRequestsForWorkspace` | callee-trusted pattern | SURF |
| `install-requests.ts:listDecisionsForWorkspace` | inner-join scope ✓ | OK |
| `membership.ts:listMembers` | callee-trusted | **IDOR (NEW)** |
| `membership.ts:getUserRole` | helper, callee-trusted | OK |
| `dal/galaxie.ts:getWorkspaceCounts` | callee-trusted | SURF |

**Net new findings:** `customers.ts:addRepo` (Weak), `apply-dal.ts:listApplyActionsForFinding` (Kill), `solution-dal.ts:getSolution` (Kill direct path), `solution-dal.ts:listSolutionStatusByFinding` (Weak), `membership.ts:listMembers` (Weak).

### D.3 — page.tsx Server-Components missing workspace-slug gate

Wave-2 walked every `/[workspace]/**` page:
- All page-components inside `/[workspace]/` inherit the `app/[workspace]/layout.tsx:16-36` gate (calls `listUserWorkspaces` + checks slug membership).
- **`app/[workspace]/settings/layout.tsx:68-89` does NOT call `resolveWorkspaceFromSlug`** — relies entirely on the parent `[workspace]/layout.tsx` gate. Acceptable as long as the parent layout always wraps it (Next.js layout-nesting guarantees this), but consider defense-in-depth.
- Individual pages that do their own slug-resolution (e.g. `customers/page.tsx`, `scans/page.tsx`, `billing/page.tsx`) call `resolveWorkspaceFromSlug` — **double-gated**. ✓
- `settings/members/page.tsx` uses `listUserWorkspaces` + `.find(slug)` instead of `resolveWorkspaceFromSlug`. Same effect, different idiom — pre-GA: pick one canonical pattern and refactor.

**No page.tsx is missing a workspace gate.** ✓

### D.4 — `redirect("/login")` vs `notFound()` vs `forbidden()` semantic correctness

- Workspace-not-found OR not-a-member → `notFound()` (`app/[workspace]/layout.tsx:33`). **Correct** — avoids leaking slug existence.
- Not-signed-in on a workspace page → `redirect("/login?next=...")`. **Correct.**
- Signed-in but not-authorized on a sub-action (e.g. `revokeMember`) → returns `{ok:false, error:"..."}`. **Acceptable** — no `forbidden()` semantic needed because server-actions don't have HTTP status codes; the error surfaces via the client toast.
- Auth-disabled (anonymous mode) on a workspace page → `notFound()` in some places, `redirect("/login")` in others. **Inconsistent** — pre-GA: pick one.
- No code path uses Next 16's `forbidden()` or `unauthorized()` primitives at all. Wave-2 follow-up: consider adopting them for auth-server-action error paths once Next 16 stabilizes them.

---

## Part E · API Routes — Detailed per-route

### E.1 — `/api/auth/[...all]` (GET + POST)

- **Auth gate:** delegated to Better-Auth `auth.handler(req)`. CSRF protection + cookie handling done by upstream.
- **Workspace resolution:** n/a (auth endpoints).
- **Position:** after `isAuthEnabled` check; returns 503 if `DATABASE_URL`/`AUTH_SECRET` missing.
- **Wave-1 verdict:** Strong with caveats (A1-A5 noted hardening gaps).
- **Wave-2:** unchanged.

### E.2 — `/api/audit-trail` (GET)

- **Auth gate:** inherited from `exportAuditTrail` → `getSessionUser()` at line 36.
- **Workspace resolution:** owner-only via `eq(workspace.ownerId, user.id)` (NOT membership). **Bug per Wave-1 B4.**
- **Position:** auth in DAL, after format-parse. **Move auth BEFORE format-parse** for defense — if a non-auth case yields a 4xx, format-parse should never even run. Marginal hardening.
- **Wave-1 verdict:** Kill (B3+B4).
- **Wave-2:** confirmed.

### E.3 — `/api/events/stream` (GET, SSE)

- **Auth gate:** `getSessionUser()` at line 38. ✓
- **Workspace resolution:** `ensureDefaultWorkspace(user.id)` at line 43.
- **Position:** auth + workspace BEFORE the event-stream starts. ✓
- **NEW finding:** workspace-ambiguity. A user with multiple workspaces always gets the **legacy-owner workspace's** events. If they're viewing workspace-B in the UI but legacy-own workspace-A, they receive workspace-A's audit/scan/install events streamed into workspace-B's UI surfaces. **Mid IDOR**: cross-workspace event-leak via the user's own session.
- **Fix:** accept `workspaceSlug` query param + use `resolveWorkspaceFromSlug` instead of `ensureDefaultWorkspace`.

### E.4 — `/api/inngest` (GET/POST/PUT)

- **Auth gate:** delegated to Inngest SDK `serve()`. Relies on `INNGEST_SIGNING_KEY` being set on the inngest client.
- **Workspace resolution:** payload-derived (event handlers receive `data.workspaceId`).
- **Wave-1 verdict:** Mid — confirm signing-key is enforced at startup.
- **Wave-2:** confirms the request signature is the only gate. The Inngest functions themselves DO run with workspaceId derived from the event payload (`audit-requested.ts`, `stripe-reconcile.ts`); since the events are produced server-side from gated actions, the chain is intact provided the signing-key blocks external posts.

### E.5 — `/api/install-webhook` (POST)

- **Auth gate:** `verifyWebhookSignature` at line 38-48 ✓. 503 if secret unset.
- **Workspace resolution:** derived from `installRequest.targetRepoLabel` match OR `pickWorkspaceForInstallation` looking up `repo.githubInstallationId`.
- **Position:** signature-check BEFORE body-parse. ✓
- **Wave-1 verdict:** Exceptional.
- **Wave-2:** ✓ confirmed. One sub-finding for future: `pickWorkspaceForInstallation:284-301` `LIMIT 1` could pick the wrong workspace if the same installationId is recycled across workspaces (shouldn't happen, but defensive: pass `targetRepoLabel` for the disambiguation).

### E.6 — `/api/notify-update` (POST)

- **Auth gate:** per-repo HMAC SHA-256 timing-safe-equal at line 95-104 ✓. 401 on bad signature.
- **Workspace resolution:** derived from `repo.workspaceId` lookup based on `body.repoId`.
- **Position:** signature-check AFTER body-read (HMAC needs the body) but BEFORE business logic. ✓
- **Wave-1 verdict:** Exceptional.
- **Wave-2:** ✓ confirmed.

### E.7 — `/api/stripe/webhook` (POST)

- **Auth gate:** `stripe.webhooks.constructEvent(rawBody, signature, secret)` at line 93 ✓.
- **Workspace resolution:** from `metadata.workspaceId` OR `client_reference_id` OR `lookupWorkspaceByCustomer(stripeCustomerId)`.
- **Position:** signature BEFORE event-parsing. ✓. Idempotent via `stripe_event` PK upsert.
- **Wave-1 verdict:** Exceptional.
- **Wave-2:** ✓ confirmed.

---

## Part F · Recommended Authorization-Helper Refactor

Wave-1 §K noted: *"`apps/web/src/lib/dal/galaxie.ts` — canonical `userIsMember` (also duplicated in `apply-dal.ts`, `solution-dal.ts`)"*. Wave-2 confirms and proposes consolidation.

### F.1 — Current state (drift surface)

Three identical `userIsMember` implementations:
1. `apps/web/src/lib/dal/galaxie.ts:114-142` (canonical — but private to the module)
2. `apps/web/src/lib/apply-dal.ts:28-56` (duplicate, accepts ownerId fallback)
3. `apps/web/src/lib/solution-dal.ts:82-110` (duplicate, accepts ownerId fallback)

All three:
- Query `membership` for active row matching `(workspaceId, userId)`.
- Fall back to `workspace.ownerId = userId` for legacy.
- Return `boolean`.

If any one of them is updated (e.g. tighten "active" to also exclude soft-deleted memberships, or add role-filtering), the others drift silently. Pre-GA risk.

Plus `workspace-context.ts:resolveWorkspaceFromSlug:38-51` has yet another shape of the same logic (returns the workspace row + throws `notFound()`).

Plus `membership.ts:getUserRole:22-41` returns the role instead of bool.

### F.2 — Proposed `@/lib/authz` module

```ts
// apps/web/src/lib/authz.ts
import "server-only";
import { cache } from "react";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@vk/db";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getAuth, isAuthEnabled } from "@vk/auth";

export type Role = "owner" | "admin" | "member";

export interface AuthCtx {
  user: { id: string; email: string };
  workspaceId: string;
  workspaceSlug: string;
  role: Role;
}

/**
 * Canonical workspace + membership resolver. Memoized per-request.
 *
 * Throws notFound() when:
 *   - auth disabled, or
 *   - no session, or
 *   - workspace slug not found, or
 *   - user is neither an active member NOR legacy owner.
 *
 * Use this from EVERY workspace-scoped page + server-action. Returns
 * AuthCtx with role pre-computed so callers don't need a second query.
 */
export const requireWorkspaceAccess = cache(
  async (slug: string): Promise<AuthCtx> => {
    if (!isAuthEnabled()) notFound();
    const session = await getAuth().api.getSession({ headers: await headers() });
    if (!session?.user) notFound();
    const db = getDb();

    const wsRows = await db
      .select()
      .from(schema.workspace)
      .where(eq(schema.workspace.slug, slug))
      .limit(1);
    const ws = wsRows[0];
    if (!ws) notFound();

    const memberRows = await db
      .select({ role: schema.membership.role })
      .from(schema.membership)
      .where(
        and(
          eq(schema.membership.workspaceId, ws.id),
          eq(schema.membership.userId, session.user.id),
          eq(schema.membership.status, "active"),
        ),
      )
      .limit(1);

    const isLegacyOwner = ws.ownerId === session.user.id;
    if (memberRows.length === 0 && !isLegacyOwner) notFound();

    const role: Role =
      memberRows[0]?.role === "owner" ||
      memberRows[0]?.role === "admin" ||
      memberRows[0]?.role === "member"
        ? (memberRows[0]!.role as Role)
        : isLegacyOwner
        ? "owner"
        : "member";

    return {
      user: { id: session.user.id, email: session.user.email },
      workspaceId: ws.id,
      workspaceSlug: ws.slug,
      role,
    };
  },
);

/**
 * Resource-level membership check by workspaceId (for DAL functions that
 * receive a resolved workspaceId rather than a slug).
 */
export async function requireMembership(
  workspaceId: string,
  userId: string,
): Promise<{ role: Role }> {
  const db = getDb();
  const rows = await db
    .select({ role: schema.membership.role })
    .from(schema.membership)
    .where(
      and(
        eq(schema.membership.workspaceId, workspaceId),
        eq(schema.membership.userId, userId),
        eq(schema.membership.status, "active"),
      ),
    )
    .limit(1);
  if (rows[0]) {
    const r = rows[0].role;
    return { role: (r === "owner" || r === "admin" ? r : "member") as Role };
  }
  // Legacy-owner fallback.
  const owner = await db
    .select({ id: schema.workspace.id })
    .from(schema.workspace)
    .where(
      and(
        eq(schema.workspace.id, workspaceId),
        eq(schema.workspace.ownerId, userId),
      ),
    )
    .limit(1);
  if (owner[0]) return { role: "owner" };
  throw new Error("Forbidden: not a member of this workspace.");
}

/** Boolean variant — kept for back-compat with old `userIsMember` call sites. */
export async function userIsMember(
  workspaceId: string,
  userId: string,
): Promise<boolean> {
  try {
    await requireMembership(workspaceId, userId);
    return true;
  } catch {
    return false;
  }
}

/** Require role to be in allow-list; throws otherwise. */
export async function requireRole(
  workspaceId: string,
  userId: string,
  allow: Role[],
): Promise<Role> {
  const { role } = await requireMembership(workspaceId, userId);
  if (!allow.includes(role)) {
    throw new Error(
      `Forbidden: role=${role} not in [${allow.join(", ")}]`,
    );
  }
  return role;
}
```

### F.3 — Migration plan

1. Create `@/lib/authz.ts` with the API above.
2. Replace `userIsMember` callers in `apply-dal.ts:28`, `solution-dal.ts:82`, `dal/galaxie.ts:114` → import from `@/lib/authz`. Delete the duplicates. (5 min × 3 files.)
3. Replace `resolveWorkspaceFromSlug` callers with `requireWorkspaceAccess` (returns the role too — eliminates a separate `getUserRole` call in pages like `repo/access/page.tsx:64`). (15 min.)
4. Replace `membership.ts:requireRole` with `@/lib/authz:requireRole`. (5 min.)
5. Update `getScanStatus` + `generateFixesForScan` to use `requireMembership` instead of the `workspace.ownerId = user.id` join. (10 min.) — fixes Wave-1 B5.
6. Apply `requireMembership` defense-in-depth to every "callee-trusted" `"use server"` DAL function in §D.2 (listCustomers, listRepos, addRepo, listMembers, listRequestsForWorkspace, listPendingRequestsForWorkspace, getCustomerById, getRepo, addCustomer, updateCustomerApplyMode, addRepoUnderCustomer, listApplyActionsForFinding, getSolution, listSolutionStatusByFinding, pollPRStatus, getWorkspaceCounts, getOrGenerateSolution). (1 hour bulk.)

**Total effort:** ~2 hours dev + 30 min smoke tests. **Removes 3 drift-prone duplicates, plugs 3 Kill + 3 Weak IDORs, makes the authorization-matrix a single grep-able call site.**

---

## Part G · NEW Findings Summary (Wave-2 net)

| # | File:Line | Function | Severity | Notes |
|---|---|---|---|---|
| W2-01 | `apply-dal.ts:355-376` | `listApplyActionsForFinding` | **Kill** | NO auth, returns full apply-history incl. PR URLs + commit SHAs. Same shape as Wave-1 B1 but applied to apply_action table. |
| W2-02 | `solution-dal.ts:112-124` | `getSolution` | **Kill** | `"use server"`-exported with NO auth. Wave-1 caught the `pollSolution` wrapper; underlying function is also directly callable. |
| W2-03 | `solution-dal.ts:127-151` | `listSolutionStatusByFinding` | **Weak** | Bulk enumeration oracle — status+confidence per finding without auth. |
| W2-04 | `customers.ts:42-89` | `addRepo` | **Weak** | `"use server"`-exported with NO auth. Has tier-quota check but trusts workspaceId arg. **No action-wrapper exists** for this export. |
| W2-05 | `membership.ts:43-65` | `listMembers` | **Weak** | `"use server"`-exported, returns email + role + invitedBy. Caller-trusted but RPC-callable. |
| W2-06 | `api/events/stream/route.ts:43` | SSE stream | **Mid** | Hard-coded to legacy-owner workspace via `ensureDefaultWorkspace`. Cross-workspace event-leak when user owns ≥2 workspaces. |
| W2-07 | `workspace-ai-actions.ts:30-165` | BYOK + spend-cap + intensity actions | **Mid** | Any-member writable. Should be owner+admin only. 4 sites, 1 LOC each. |
| W2-08 | `membership.ts:170-197` | `claimPendingMemberships` | **Mid** | Email-keyed claim has no audit-log + no IP/UA. Recycled-email-domain attack. |
| W2-09 | `dal/galaxie.ts:114` + `apply-dal.ts:28` + `solution-dal.ts:82` | `userIsMember` duplicates | **Mid (arch)** | Drift surface. Consolidate per §F. |
| W2-10 | `install-webhook/route.ts:284` | `pickWorkspaceForInstallation` | **Mid (low)** | `LIMIT 1` could pick wrong workspace on installationId collision. Defensive: pass repo-name for disambiguation. |
| W2-11 | `app/[workspace]/settings/members/page.tsx:26-28` | uses `listUserWorkspaces.find()` not `resolveWorkspaceFromSlug` | **Low** | Idiom-inconsistency. Refactor to canonical helper post §F. |
| W2-12 | `audit-trail-export.ts:165-178` + `api/audit-trail/route.ts` | format-parse before auth | **Low** | Marginal: parsing happens before auth (auth is in DAL). Move auth higher for defense. |
| W2-13 | `dpa_acceptance.userId` ON DELETE SET NULL | schema-level | **Low** | Orphan rows; uniqueness via `(userId, dpaVersion)` allows NULL-NULL pairs. Document semantic for compliance auditors. |
| W2-14 | `billing-actions.ts:*` | always uses `ensureDefaultWorkspace` | **Low** | Admin-of-other-workspace can't trigger billing. By-design but inconsistent with membership-RBAC. Confirm or parameterize. |

---

## Part H · Wave-1 Findings — Confirmed/Updated

All 5 Wave-1 Kill IDORs and the RBAC inconsistency are **CONFIRMED** as of 2026-06-06:

| Wave-1 ID | Location | Wave-2 Status |
|---|---|---|
| W1-B1 `pollSolution` IDOR | `solution-actions.ts:18-24` | **Confirmed.** Plus W2-02 (`getSolution` direct path) expands the surface. |
| W1-B2 `getRepo` rootPath join | `customers.ts:178-189` | **Confirmed.** No change. |
| W1-B3 `audit-trail-export` cross-tenant webhook | `audit-trail-export.ts:129-148` | **Confirmed.** No change. |
| W1-B4 `audit-trail-export` owner-only single ws | `audit-trail-export.ts:41-46` | **Confirmed.** No change. |
| W1-B5 RBAC ownerId-only | `scan-status.ts:45` + `fix-actions.ts:40` | **Confirmed.** Wave-2 verified these are the ONLY two surfaces with this anti-pattern. |
| W1-B6 `revokeMember` cross-workspace | `membership.ts:211-223` | **Confirmed.** No change. |
| W1-B7 no seat-limit on invite | `membership.ts:80-163` | **Confirmed.** Wave-2 doesn't re-rank. |
| W1-B8 no admin-gate on requestInstall | `install-requests.ts:31-63` | **Confirmed.** |
| W1-B9 spot-check of read surfaces | various | **Mostly confirmed.** Wave-2 adds W2-01, W2-02, W2-03 to the list (Wave-1 missed them). |
| W1-B10 `pollPRStatus` no auth | `apply-dal.ts:378-394` | **Confirmed.** |

---

## Part I · Pre-GA Required-Fix Checklist (Wave-2 additions)

Adding to Wave-1's checklist (renumbered from the top of §I):

| # | Severity | Fix | LOC |
|---|---|---|---|
| W2-01 | Kill | Add userId param + `requireMembership(scan.workspaceId)` gate to `listApplyActionsForFinding` (`apply-dal.ts:355`) | ~12 |
| W2-02 | Kill | Mark `getSolution` private (rename to `_getSolutionUnsafe`) and only expose via the gated `pollSolution` (which must also be fixed per W1-B1) | ~5 |
| W2-03 | Weak | Add userId + membership gate to `listSolutionStatusByFinding` (`solution-dal.ts:127`) | ~8 |
| W2-04 | Weak | Add `getSessionUser` + `resolveWorkspaceFromSlug` to `addRepo` (`customers.ts:42`) OR convert to private fn | ~10 |
| W2-05 | Weak | Add membership-gate to `listMembers` (`membership.ts:43`) | ~8 |
| W2-06 | Mid | Accept `workspaceSlug` query param on `/api/events/stream`, replace `ensureDefaultWorkspace` with `requireWorkspaceAccess` | ~8 |
| W2-07 | Mid | Owner-only role-gate on `updateByokSettings`, `toggleAutoOverage`, `setSpendCap`, `setDefaultIntensity` | ~4 × 4 sites |
| W2-08 | Mid | Add audit-log row + IP/UA capture in `claimPendingMemberships` | ~15 |
| W2-09 | Mid (arch) | Consolidate per §F — single `@/lib/authz` module | ~2 hours |

**Total new Wave-2 effort:** ~3 hours of dev + smoke tests. Combine with Wave-1's ~5 dev-days and a single PR-cycle clears every authorization finding before GA.

---

## Part J · Open Questions for Wave-3+

- `@vk/billing` internals (consumeCredits / grantCredits / canConsume) — confirm they always operate on the workspaceId passed by the caller AND don't leak cross-workspace via reference-id collisions in `credit_ledger`.
- `@vk/inngest/functions/*` — confirm every Inngest function reads `data.workspaceId` from the event payload (not from a hard-coded `ensureDefaultWorkspace`).
- Better-Auth's organization plugin behavior is NOT used. Confirm no leakage via Better-Auth's user-by-email lookup endpoints (e.g. password-reset enumeration).
- Drizzle's RLS support is not enabled. Consider a Postgres RLS policy `WHERE workspace_id = current_setting('app.workspace_id')` as a final defense-in-depth layer once `@vk/authz` is in place.

---

## Part K · References

- Wave-1 baseline: `docs/audits/2026-05-deep/wave1-03-auth-security.md`
- DAL canonical: `apps/web/src/lib/dal/galaxie.ts`
- Workspace resolver: `apps/web/src/lib/workspace-context.ts`
- Membership ground-truth: `apps/web/src/lib/membership.ts`
- Schema: `packages/db/src/schema.ts`
- Workspace layout (canonical gate): `apps/web/src/app/[workspace]/layout.tsx`
