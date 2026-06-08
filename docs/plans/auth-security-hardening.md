# Plan — Bundle A · Auth-Security-Hardening + Authz-Helper-Refactor

> Erstellt: 2026-06-08
> Status: 🔵 Skelett — /execute bereit
> Master: `docs/plans/production-launch-readiness.md`
> Slug: `auth-security-hardening`
> Confidence: **High** — basiert auf wave1-03 + wave2-01 (zusammen 13 Kill-IDORs + verifiziert mit file:line)

## 1. Ziel

Alle 13 Auth+DAL-IDORs schließen, Authorization-Logik auf Single-Source konsolidieren, Better-Auth + Security-Headers + Magic-Link-Rate-Limit production-hardenen, Account/Workspace-Delete + Session-Revoke (GDPR Art. 17) implementieren inkl. PII-Scrub auf retained Audit-Rows. Vitest-CVE-Bump.

**Erfolgs-Metrik:** 0 Cross-Tenant-Read-Path ohne `requireWorkspaceAccess()`. Multi-Workspace-Integration-Test bestätigt: Workspace-A-User darf kein einziges Workspace-B-Resource sehen.

## 2. User-Entscheidungen

Vom Master-Plan §2 vererbt (Q1-Q8). Bundle-spezifische Discovery in Phase 0 via Block-Resolver bei Unklarheit (z.B. Account-Delete soft vs hard).

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

### Phase 1 — Authz-Helper-Refactor (~3h)
- [ ] `apps/web/src/lib/authz.ts` erstellen mit `requireWorkspaceAccess(userId, workspaceId)` + `requireMembership(userId, workspaceId, role?)` + `requireRole(userId, workspaceId, role)`
- [ ] `userIsMember` aus `dal/galaxie.ts` extrahieren, `apply-dal.ts` + `solution-dal.ts` Duplikate löschen, alle Caller auf neuen Helper umstellen
- [ ] Integration-Test pro Helper

### Phase 2 — 13 IDOR-Fixes (~6h)
- [ ] K1 `pollSolution` — `requireWorkspaceAccess` via `findingId → scanId → workspaceId`
- [ ] K2 `getRepo` — Join via `repoId` statt `rootPath`
- [ ] K3 `audit-trail-export.ts:129-148` — `eq(webhookEvent.workspaceId, ctx.workspaceId)` AND
- [ ] K4 `exportAuditTrail` — Param `workspaceId`, gate via membership
- [ ] K5 `revokeMember` — `eq(membership.workspaceId, workspaceId)` AND
- [ ] K6 `getScanStatus` + `generateFixesForScan` — `requireMembership` statt `ownerId===userId`
- [ ] K11 `listApplyActionsForFinding` — `requireWorkspaceAccess` via finding-chain
- [ ] K12 `getSolution` direct RPC — `requireWorkspaceAccess`
- [ ] K13 `listSolutionStatusByFinding` — `requireWorkspaceAccess` pro findingId

### Phase 3 — Better-Auth + Headers + Rate-Limit (~4h)
- [ ] K7 Better-Auth-Hardening (rateLimit/cookies/trustedOrigins)
- [ ] K8 `next.config.ts` headers() — CSP, HSTS, X-Frame, Referrer, Permissions
- [ ] K9 Magic-Link-Server-Rate-Limit (Better-Auth `magicLink.rateLimit` 3/email/10min + 20/IP/hour)
- [ ] K10 Rate-Limiter → Upstash/KV (+1 env-var)

### Phase 4 — GDPR Art. 17 (~6h)
- [ ] Migration: `ip_address` + `user_agent` NULL'able auf `install_decision`/`apply_action`/`dpa_acceptance` (sind sie schon? Verify)
- [ ] `lib/account-actions.ts` `deleteAccount()` server-action + `scrubUserPii()` helper
- [ ] `lib/workspace-actions.ts` `deleteWorkspace()` server-action (Owner-only, Cascade-Cleanup)
- [ ] `lib/session-actions.ts` `listActiveSessions()` + `revokeSession(sessionId)`
- [ ] UI: `account/delete/`, `workspace/delete/`, `account/sessions/`
- [ ] Confirmation-Email (Bundle G überlappt — koordinieren)

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
