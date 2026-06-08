# Plan — Bundle A · Auth-Security-Hardening + Authz-Helper-Refactor

> Erstellt: 2026-06-08
> Status: 🟡 In Arbeit — Phase 1 + 2 + 3 (K7/K8/K9) + 4 ✅ (2026-06-08). Offen: K10 (Vercel-KV-Blocker), Confirmation-Email (→ Bundle G), Phase 5 (Tests), Phase 6 (Acceptance + CSP-Enforce-Flip).
> Master: `docs/plans/production-launch-readiness.md`
> Slug: `auth-security-hardening`
> Confidence: **High** — basiert auf wave1-03 + wave2-01 (zusammen 13 Kill-IDORs + verifiziert mit file:line)

## 1. Ziel

Alle 13 Auth+DAL-IDORs schließen, Authorization-Logik auf Single-Source konsolidieren, Better-Auth + Security-Headers + Magic-Link-Rate-Limit production-hardenen, Account/Workspace-Delete + Session-Revoke (GDPR Art. 17) implementieren inkl. PII-Scrub auf retained Audit-Rows. Vitest-CVE-Bump.

**Erfolgs-Metrik:** 0 Cross-Tenant-Read-Path ohne `requireWorkspaceAccess()`. Multi-Workspace-Integration-Test bestätigt: Workspace-A-User darf kein einziges Workspace-B-Resource sehen.

## 2. User-Entscheidungen

Vom Master-Plan §2 vererbt (Q1-Q8). Bundle-spezifische Entscheidungen (2026-06-08 Pre-Flight, AskUserQuestion):
- **Account-Delete:** Hard-Delete sofort + PII-Scrub auf retained Audit-Rows (kein Soft-Delete-Grace). → §13 Alt-B verworfen.
- **CSP-Mode:** Report-Only erst 24h, dann enforce. → §13 bestätigt.
- **Rate-Limit-Backend:** Vercel KV (Marketplace-Upstash). → §13 bestätigt.

**Pre-Flight Sub-Step-Adjustments (2026-06-08):**
- **Arg-Order:** Plan-§6 skizzierte `requireWorkspaceAccess(userId, workspaceId)`, aber 100% des Repos nutzt `(workspaceId, userId)`. `authz.ts` folgt der Repo-Konvention `(workspaceId, userId, ...)` — kein Arg-Swap-Footgun.
- **DB-Migration 0016 entfällt:** §8 nahm an, `ip_address`/`user_agent` seien `TEXT NOT NULL`. Schema-Verify zeigt: alle 3 Tabellen (`install_decision`/`apply_action`/`dpa_acceptance`) sind bereits `text(...)` ohne `.notNull()` → nullable. Wave-2-DB-K-DB-2-Annahme war falsch. PII-Scrub kann direkt `SET NULL` schreiben (Phase 4).

## 3. Existing-Patterns im Repo

- `userIsMember()` in `apps/web/src/lib/dal/galaxie.ts` ist canonical, dupliziert in `apply-dal.ts`, `solution-dal.ts` (wave2-01 S23) — wird Single-Source-Refactor
- `requireRole()` in `apps/web/src/lib/membership.ts` — RBAC ground truth
- Better-Auth `magicLink.rateLimit` Config-Option (1.6) — siehe https://better-auth.com/docs
- Migration-Pattern aus Nova-3a Bundle A (Migration 0015) für GDPR-Cascades
- `radix-ui/focus-scope` ist bereits dependency — nutzen für K-Wave1-R3

## 4. Alternativen, die wir NICHT wählen

- **Alt-A: IDOR-Fixes ohne Authz-Refactor** → Verworfen — Drift-Surface (3× `userIsMember`) bleibt. Authz-Single-Module ist ~2h extra, plugged 3 Kill + 3 Weak per defense-in-depth.
- **Alt-B: Account-Soft-Delete mit 30-day-grace** → Verschoben in §13 Open — user-decision. Default: hard-delete sofort + PII-scrub auf retained-Rows (GDPR-konform, kürzester Pfad).
- **Alt-C: Vitest komplett aus dev-deps entfernen statt Bump** → Test-Infrastruktur kaputt. Bump auf ≥4.1.0 (CVE-fix).
- **Alt-D: CSP per Middleware statt next.config.ts** → Verworfen — `next.config.ts headers()` ist Next-Pattern.

## 5. Endzustand

- `apps/web/src/lib/authz.ts` Single-Module exportiert `requireWorkspaceAccess()`, `requireMembership()`, `requireRole()`. `userIsMember`-Duplikate aus `apply-dal.ts` + `solution-dal.ts` entfernt.
- Alle 13 IDOR-Funktionen rufen `requireWorkspaceAccess()` als erster Statement.
- `apps/web/next.config.ts` exportiert `async headers()` mit CSP (Report-Only zunächst) + HSTS + X-Frame-Options + Referrer-Policy + Permissions-Policy.
- `packages/auth/src/server.ts` Better-Auth-Config hat: `rateLimit` block, `__Host-` cookie-prefix, `trustedOrigins`, `magicLink.rateLimit: { window, max }`.
- `apps/web/src/lib/rate-limit.ts` nutzt `@upstash/ratelimit` ODER Vercel KV — global, multi-region-safe.
- `apps/web/src/app/[workspace]/settings/account/delete/` UI + Server-Action implementiert: löscht User-Row, scrubbed `ip_address`+`user_agent` in `install_decision`/`apply_action`/`dpa_acceptance` auf NULL, revokt alle Sessions, sendet Confirmation-Email.
- `apps/web/src/app/[workspace]/settings/workspace/delete/` analog (nur Owner darf).
- `apps/web/src/app/[workspace]/settings/account/sessions/` listet aktive Sessions + Revoke-Button.
- `vitest` auf ≥4.1.0 gebumpt.
- Integration-Tests für alle 13 IDORs: Workspace-A-User-Negative + Workspace-B-User-Positive.

## 6. Schritte

### Phase 1 — Authz-Helper-Refactor (~3h) ✅ 2026-06-08
- [x] `apps/web/src/lib/authz.ts` erstellt: `userIsMember` + `getUserRole` + `requireWorkspaceAccess` + `requireMembership` + `requireRole`, alle `(workspaceId, userId, ...)`
- [x] `userIsMember`-Duplikate aus `dal/galaxie.ts` + `apply-dal.ts` + `solution-dal.ts` gelöscht → Import aus authz. `getUserRole`/`requireRole` aus `membership.ts` nach authz konsolidiert; `Role`-Type re-exported. 2 externe Importer (`access/page.tsx`, `install-requests.ts`) umgestellt.
- [x] `authz.integration.test.ts` — 5 Helper × member/non-member/legacy-owner/pending/allow-list. Unit-Gate grün (293 passed), Integration-Gate läuft auf main-push (Postgres-Service).

### Phase 2 — 13 IDOR-Fixes (~6h) ✅ 2026-06-08

**Architektur-Entscheidung (load-bearing):** Diese DAL-Reads lagen in `"use server"`-Files = direkt als Server-Action vom Client aufrufbar. Ein `userId`-**Parameter** wäre dabei angreifer-kontrolliert. Pattern: Identität **immer** aus `getSessionUser()` ableiten (nie Client-Param). `solution-dal.ts` → `server-only` umgestellt (nur server-importiert; AISolutionPlaceholder nimmt nur den `SolutionRow`-Type) → Reads von der Action-Surface entfernt, Gating an der Action-Boundary.

- [x] K1 `pollSolution` — Session-Gate: `getSessionUser` → `getFindingWorkspaceId` → `userIsMember`
- [x] K2 `getRepo` — Scans via `eq(scan.repoId, repoId)` statt `rootPath` (rootPath kann cross-tenant kollidieren)
- [x] K3 `audit-trail-export` webhook-Block — **Drift:** `webhook_event` hat KEIN `workspaceId`/`repoId` (globaler GitHub-Delivery-Log), DB-Scoping unmöglich → Block komplett aus dem per-Workspace-Export entfernt (Leak eliminiert). Proper-Webhook-Surface = post-launch (§12).
- [x] K4 `exportAuditTrail` — Membership-basierte Workspace-Resolution (active membership OR legacy owner) statt `ownerId`-only. Kein neuer Param (trust-page-Surface ist single-workspace).
- [x] K5 `revokeMember` — `and(eq(membership.id, …), eq(membership.workspaceId, workspaceId))` auf target-lookup UND update
- [x] K6 `getScanStatus` + `generateFixesForScan` — `userIsMember(scan.workspaceId, …)` statt `ownerId===userId` (Member waren fälschlich ausgesperrt)
- [x] K11 `listApplyActionsForFinding` — Session-Gate via finding→scan→workspace + `userIsMember` (war callerlos, aber exponiert)
- [x] K12 `getSolution` — durch `server-only`-Umstellung nicht mehr direkt aufrufbar; zusätzlich Cache-Fast-Path-Hole in `getOrGenerateSolution` gefixt (Gate vor Cache-Read)
- [x] K13 `listSolutionStatusByFinding` — `workspaceId`-Param + JOIN finding→scan-Filter (caching-kompatibel, kein Session-Call im `unstable_cache`-Pfad)

### Phase 3 — Better-Auth + Headers + Rate-Limit (~4h) — K7/K8/K9 ✅ 2026-06-08, K10 deferred
- [x] K7 Better-Auth-Hardening — `trustedOrigins` (env-driven `AUTH_TRUSTED_ORIGINS`, kein hardcoded Domain), `advanced.useSecureCookies` (prod-gated). **`__Host-`-Cookie-Prefix deferred** — koppelt an die offene Domain/Subdomain-Entscheidung; falsch gesetzt bricht Sign-in.
- [x] K8 `next.config.ts` `async headers()` — CSP **Report-Only** (24h-Observe, dann enforce per §9) + HSTS (2y, preload) + X-Frame-Options SAMEORIGIN + X-Content-Type-Options nosniff + Referrer-Policy + Permissions-Policy. CSP lässt Stripe-iframes + PixiJS-blob-Worker durch; `connect-src https:` bleibt im Report-Only locker (vor enforce auf exakte Hosts einengen).
- [x] K9 Magic-Link-Rate-Limit — Better-Auth top-level `rateLimit.customRules["/sign-in/magic-link"] = { window: 600, max: 3 }` (3/10min/**IP**). **Adjustment:** Better-Auth rate-limit ist IP-keyed; per-**email** (Email-Bombing eines Opfers über verteilte IPs) braucht Custom-Storage → späteres Refinement. Global default `window:60, max:100`.
- [ ] **K10 Rate-Limiter → Vercel KV — DEFERRED (externer Blocker).** Better-Auth-`rateLimit`-Storage ist aktuell in-memory (per-Instance, auf Fluid Compute nicht global). K10 = User provisioniert Vercel-KV-Store → `rateLimit.storage: "secondary-storage"` + `apps/web/src/lib/rate-limit.ts` von in-memory `Map` auf KV. Braucht KV-Store-Anlage + Env-Var auf Vercel.

### Phase 4 — GDPR Art. 17 (~6h) ✅ 2026-06-08

**Entscheidung (load-bearing):** Account-Delete wird **geblockt**, wenn der User Sole-Owner eines Workspaces ist → erst Ownership transferieren/Workspace löschen. Schützt andere Member, keine Orphans. **Pfad-Drift:** Pages existierten bereits als Stubs unter `/account/settings/{delete,sessions}` + `[workspace]/settings/danger` (nicht `[workspace]/settings/account/...` wie §7) → Stubs implementiert statt neue Pages. **Migration entfällt** (PII-Spalten schon nullable, s. §2).

- [x] `lib/pii-scrub.ts` `scrubUserPii()` — NULL ip/ua auf install_decision/apply_action/dpa_acceptance, läuft VOR User-Delete (FK SET NULL löscht sonst den Key)
- [x] `lib/account-actions.ts` `deleteAccount()` (email-typed-confirm + sole-owner-block + scrub + delete + signOut) + `listSoleOwnedWorkspaces()`
- [x] `lib/workspace-actions.ts` `deleteWorkspace()` (owner-only via `requireRole`, slug-typed-confirm; alle 13 workspace-FKs sind `cascade` → 1 Delete reicht)
- [x] `lib/session-actions.ts` `listActiveSessions()` + `revokeSession()` — Revoke via Better-Auth-API (nicht roher DB-Delete, sonst ≤300s Cookie-Cache-Lücke); IDOR-safe via id+userId
- [x] UI: `account/settings/sessions` (SessionList + Revoke), `account/settings/delete` (typed-confirm + Block-Liste), `[workspace]/settings/danger` (owner-gated typed-confirm). Typecheck/Lint/293 Tests grün, Routen kompilieren (307 → /login).
- [ ] **Confirmation-Email — DEFERRED an Bundle G** (besitzt Email-Templates + Transport-Infra). `deleteAccount` ruft aktuell keine Email.

### Phase 5 — Vitest-Bump + Test-Suite (~3h)
- [ ] K35 `pnpm up vitest@latest @vitest/coverage-v8 @vitest/ui` — verify 4.1.0+
- [ ] Multi-Workspace-Integration-Test-Setup-Helper
- [ ] 13 Negative-Tests (Workspace-A-User → 403 auf Workspace-B-Resource)

### Phase 6 — Acceptance
- [ ] `pnpm test` + `pnpm test:integration` green
- [ ] `pnpm typecheck` + `pnpm lint` green
- [ ] Manual: Inspect CSP-Report-Only logs für 24h, dann auf enforce
- [ ] `git mv` → `done/production-launch-readiness/`

## 7. Files-to-Change

**New:**
- `apps/web/src/lib/authz.ts`
- `apps/web/src/lib/account-actions.ts`
- `apps/web/src/lib/workspace-actions.ts` (oder Erweiterung)
- `apps/web/src/lib/session-actions.ts`
- `apps/web/src/lib/pii-scrub.ts`
- `apps/web/src/app/[workspace]/settings/account/delete/page.tsx`
- `apps/web/src/app/[workspace]/settings/workspace/delete/page.tsx`
- `apps/web/src/app/[workspace]/settings/account/sessions/page.tsx`
- `apps/web/src/lib/rate-limit.test.ts` + multi-workspace-Integration-Tests

**Modified:**
- `apps/web/src/lib/solution-actions.ts:18-24` (K1)
- `apps/web/src/lib/customers.ts:178-189` (K2)
- `apps/web/src/lib/audit-trail-export.ts:41-46, 129-148` (K3, K4)
- `apps/web/src/lib/membership.ts:211-223` (K5)
- `apps/web/src/lib/scan-status.ts:41-46`, `fix-actions.ts:37-41` (K6)
- `apps/web/src/lib/apply-dal.ts:355-376` (K11)
- `apps/web/src/lib/solution-dal.ts:112-124, 127-151` (K12, K13)
- `packages/auth/src/server.ts:61-120` (K7, K9)
- `apps/web/next.config.ts` (K8)
- `apps/web/src/lib/rate-limit.ts` (K10)
- `package.json` (K35 vitest bump)

## 8. DB-Migration

Migration 0016 (Bundle A):
```sql
-- PII-scrub-readiness: verify ip_address/user_agent are nullable
-- (Wave-2-DB K-DB-2 said: they are TEXT NOT NULL → MUST be ALTER COLUMN ... DROP NOT NULL first)
ALTER TABLE install_decision ALTER COLUMN ip_address DROP NOT NULL;
ALTER TABLE install_decision ALTER COLUMN user_agent DROP NOT NULL;
ALTER TABLE apply_action ALTER COLUMN ip_address DROP NOT NULL;
ALTER TABLE apply_action ALTER COLUMN user_agent DROP NOT NULL;
ALTER TABLE dpa_acceptance ALTER COLUMN ip_address DROP NOT NULL;
ALTER TABLE dpa_acceptance ALTER COLUMN user_agent DROP NOT NULL;
```

## 9. Test-Plan

- Unit: pro Helper in `authz.ts`
- Integration (Postgres-Service): 13 Negative-Tests + 13 Positive-Tests + GDPR-PII-Scrub-Verify
- Manual: CSP Report-Only-Mode 24h, dann auf `report-uri` + enforce

## 10. Risiken

| Risiko | Mitigation |
|---|---|
| CSP zu eng → bricht Stripe-iframes / Pixi-WebGL | Report-Only 24h, dann nach Logs nachjustieren |
| Authz-Refactor bricht bestehende DAL-Tests | Phase 1 first, Tests adapten before Phase 2 |
| Magic-link rate-limit zu strikt → legit User blocked | 3/email/10min + 20/IP/hour mit error-toast |
| GDPR PII-Scrub Performance auf Million-Row-DB | Index auf `user_id` Spalten verifizieren |

## 11. Aufwand

**7-8 dev-days** Multi-Session.

## 12. Out-of-Scope

- Soft-delete-mit-30-day-grace — siehe §13 Open
- Audit-log auf privilegierte Operationen (eigenes Logging-Plan)
- 2FA — V2 post-launch
- SSO/SAML — Enterprise-Tier later
- Account-Recovery-Codes — V2

## 13. Open Items

- **Account-Delete: hard vs soft-delete-mit-grace?** Default-Vorschlag: hard-delete sofort + PII-scrub. User entscheidet.
- **CSP-Mode: Report-Only-Default 24h vs sofort enforce?** Vorschlag: Report-Only-first.
- **Rate-Limit-Backend: Upstash vs Vercel KV?** Vercel KV (= Vercel Marketplace Upstash unter der Haube) ist Integration-bequemer.
