# Plan — Production-Launch-Readiness Master

> Erstellt: 2026-06-05, Wave-2-Update 2026-06-08
> Status: 🔵 Draft — Wave-1 + Wave-2 komplett (13 Reports, 7191 LOC Audit). Sub-Plan-Skelette werden im Anschluss geschrieben.
> Slug: `production-launch-readiness`
> Confidence: **High** — basiert auf 8 User-Entscheidungen aus 2 Discovery-Runden + 36 verifizierte Kill-Items aus 12 Sub-Agent-Reports.
> Source-of-Truth-Findings: `docs/audits/2026-05-deep/_wave2-synthesis.md` (konsolidierte Master-Liste) + 12 Detail-Reports

## 1. Ziel

Repo von Code-State "Solid mit 36 NEUEN load-bearing Bugs" auf "GA-ready für zahlende DACH-B2B-Kunden auf eigener Domain" heben. Konkret:

- Alle 36 NEUEN Kill-Items aus Wave-1+2-Audit gefixt:
  - 13 Cross-Tenant-IDORs + Auth-Hardening (Wave-1 + Wave-2 DAL)
  - 3 Payment + Inngest-Cross-Instance-Bug
  - 3 Production-Infra (Inngest-Signing, Sentry, Domain/DKIM)
  - 2 DB-Schema (rootPath-Pattern, PII-survives-delete)
  - 3 Frontend (Scan-Page, CLS, Orphan-Modals)
  - 6 Legal-DSGVO (Impressum, Datenschutz, Art.17, Email-Footer, TIA, DPA-Contact)
  - 4 Email-Deliverability (Resend-Webhook, Suppression-Table, Member-Invite-Mail, Invoice-Paid+Credit-Low)
  - 2 Tests+Build (vitest-CVE, Test-Gaps)
- Stripe von Test- auf Live-Mode (eigener Account, Tax-DE, Live-Bootstrap)
- Domain registriert, DKIM/SPF/DMARC live, Vercel-Prod-Env gesetzt
- Observability/Sentry installiert, Email-Reputation gesichert
- Frontend-Polish auf credible-B2B-Niveau
- Legal-Pages komplett (Impressum, Datenschutz, AGB-de, AVV-PDF, Subprozessoren-Liste, OSS-Notice)

**Out-of-Scope** (separate /plan-Cycles): Cache-Components-Adoption (`'use cache'`-Roll-Out), Nova-3c residual DAL-Tests (apply-dal/install-requests test-write — Bundle A schreibt nur IDOR-Negative-Tests), Workspace-Hub-Polish-Phase-3 (UI-Phase-3 mit Sub-11 Polish-Liste), B2C-Compliance-Cookie-Banner (DACH-B2B-Tool), Marketing-Launch-Material, pgvector + Embeddings-Roadmap.

## 2. User-Entscheidungen (Audit-Trail aus Discovery)

| ID | Runde | Frage | Antwort |
|---|---|---|---|
| Q1 | 1.1 | Audit-Verhältnis zu 2026-05 + Nova-3a/3b | Fresh-Sweep + Diff (Baseline-bewusst, keine Doppelarbeit) |
| Q2 | 1.2 | Scope-Bereiche | Alle 5: Payment-E2E + Auth-Security + Prod-Infra + Bug-Hunting + Frontend |
| Q3 | 1.3 | Output-Form | Audit-Report + Master-Plan + Sub-Pläne pro Kill-Cluster |
| Q4 | 1.4 | Launch-Horizont | 2-4 Wochen bis zahlende Kunden (revidiert auf 4-6 Wochen nach Wave-1) |
| Q5 | 2.1 | Stripe-Status | Test-Mode-only, kein Live-Account vorhanden |
| Q6 | 2.2 | Domain + Vercel-Prod-Env | Domain NOCH NICHT registriert |
| Q7 | 2.3 | Markt/Legal-Surface | DACH-first, B2B, später EU |
| Q8 | 2.4 | Agent-Strategie | 12-15 fokussierte Agents in 3 Waves |

## 3. Existing-Patterns im Repo (Vorbild)

- **2026-05-Audit + Synthesis-Datei** — `docs/audits/2026-05/_synthesis.md` als Pattern für `docs/audits/2026-05-deep/_wave1-synthesis.md` (jetzt geschrieben)
- **Severity-Bänder** — `{Kill, Strong, Mid, Weak, Exceptional}` aus `packages/core/src/severity.ts` durchgängig
- **Master + Sub-Plan-Split** — Nova-3b Sub-A/B/C Pattern (`docs/plans/done/nova-3b-sub-*.md`) als Vorbild für Bundle-Sub-Pläne hier
- **Stripe-Webhook-Idempotenz-Pattern** — `INSERT ... ON CONFLICT DO NOTHING` mit `stripeEvent.id` als PK; Bundle B baut darauf auf
- **BYOK-Crypto-Pattern** — `packages/billing/src/byok-crypto.ts` (AES-256-GCM + random IV + auth-tag) ist textbook; Bundle A baut auf gleichen Standards für Security-Headers
- **DAL-Membership-Gate** — `userIsMember()` in `apps/web/src/lib/dal/galaxie.ts` ist canonical; Bundle A re-aligns ALLE DAL-Calls auf diesen Helper
- **Production-Live-Connect-Stub** — `docs/plans/production-live-connect-stub.md` (Status: 🔵 Out-of-Scope) wird mit Bundle C+E concretized
- **CI-Workflow + Lighthouse-CI** — `.github/workflows/ci.yml` als Backbone; Bundle C tightens Thresholds

## 4. Alternativen, die wir bewusst NICHT wählen

- **Alt-A: Einen Mega-Plan statt Master+Sub-Pläne** → Verworfen (Q3) — 18 Kills × ~22-30 dev-days in einem `/execute` nicht realistisch. Sub-Pläne erlauben fokussierten Block-Resolver pro Bundle.
- **Alt-B: ASAP-Launch mit nur Kill-Minimal-Cut** → Verworfen (Q4 ursprünglich 2-4 Wochen, Wave-1 zeigt 4-6 realistisch). Auth-Cross-Tenant-IDORs sind nicht "deferred", die müssen vor zahlenden Kunden zu.
- **Alt-C: Cache-Components-Adoption in diesem Plan** → Verworfen — eigener Folge-Plan nach Launch. Performance-Strong, nicht Launch-Kill.
- **Alt-D: Nova-3c residual DAL-Tests vor Launch** → Verworfen — `apply-dal.ts`, `billing-actions.ts`, `install-requests.ts` sind in Prod seit pre-Audit stabil. Test-Gap, kein Code-Bug.
- **Alt-E: Stripe-Live + Domain vor Auth-Fixes** → Verworfen — Auth-IDORs würden zahlende Kunden zu Cross-Tenant-Daten exponieren. Auth ZUERST.
- **Alt-F: B2C-Compliance-Pflichten + Cookie-Banner** → Verworfen (Q7 — DACH-B2B-Tooling, kein Cookie-Banner-Pflichtfall, AGB B2B-kürzbar).
- **Alt-G: AI-Gateway statt direct-provider** → Bleibt verworfen per ADR-0005 (Vendor-Lock-in-Vermeidung).

## 5. Endzustand

**Code:**
- Alle 18 Wave-1-Kills gefixt + verifiziert (file:line + Test)
- Bundle-A: alle DAL-Funktionen mit `userIsMember`/`requireRole`, keine `ownerId === user.id`-Patterns mehr außer in `/admin`-Surfaces
- Bundle-B: `allowOverage`-Pfad zu 100% durch (UI → Action → Inngest → Meter), Stripe-API auf `2026-04-22.dahlia` korrekt konsumiert, `customer.deleted`-Handler vorhanden, alle Prices mit `tax_code`
- Bundle-C: `INNGEST_SIGNING_KEY` enforced, Sentry installiert (DSN-env, error-boundaries verbunden), `vercel.json` Production-Profile (regions, functions, frozen-lockfile, db-migrate-out-of-build)
- Bundle-D: `/[workspace]/scans/[id]` mit PageShell + Card-Layout, Modals wired, Settings-Stubs hidden (feature-gated), Toast-System überall

**Infrastruktur:**
- Domain registriert + Vercel-verbunden + 5 DNS-Records gesetzt (A, www-CNAME, MX, DKIM-TXT, SPF-TXT, DMARC-TXT, Stripe-Domain-Verify-TXT)
- Resend-Account + Inngest-Cloud-Account live, Webhooks registriert
- Stripe-Live-Account inkl. Tax-DE-Registration aktiv, alle Products/Prices/Meters in Live gespiegelt, Webhook-Endpoint registriert mit Live-`STRIPE_WEBHOOK_SECRET`

**Observability:**
- Sentry: Source-Maps uploaded, releases tagged, alerts auf Critical-Error-Spike + Stripe-Webhook-Failure
- Logging: structured (Pino o.ä.) statt console.log

**CI/CD:**
- Lighthouse-CI mit machbaren Thresholds (warn/error nuanced)
- Required-Checks für main-merge: typecheck + lint + test + integration + lighthouse
- Production-Deploy-Approval-Gate (Vercel-Branch-Protection o.ä.)

**Legal:**
- Legal-Pages aktuell (Impressum mit §5 TMG-Vollständigkeit, AVV-Template downloadbar, Privacy mit Subprozessoren-Liste inkl. Stripe/Resend/Anthropic/Inngest/Neon/Vercel, AGB-B2B kurz)
- Account-Delete + Workspace-Delete + Session-Revoke implementiert (GDPR Art. 17/15)

**Test:**
- Bundle-A + B Code mit Vitest-Unit + Integration gegen Postgres (Pattern: Nova-3b Sub-A)
- E2E-Smoke (Playwright, optional) für Signup → Audit → Upgrade-Pfad

## 6. Schritte (Master-Sequenz — REVIDIERT nach Wave-2)

### Phase 0 — Audit ✅ Done

- [x] Wave 1 (6 Sub-Agents) + Wave-1-Synthese (`_wave1-synthesis.md`)
- [x] Wave 2 (6 Sub-Agents) + Wave-2-Synthese (`_wave2-synthesis.md`)
- [x] 13 Detail-Reports (7191 LOC) in `docs/audits/2026-05-deep/`
- [x] Master-Plan revidiert auf 7 Bundles (was 5)

### Phase 1 — Bundle A · Auth-Security + Authz-Helper-Refactor (7-8 dev-days)

Eigener Plan: `docs/plans/auth-security-hardening.md`

- K1-K13 alle 13 Auth+DAL-IDORs fixen (inkl. Wave-2 listApplyActionsForFinding + getSolution + listSolutionStatusByFinding)
- **`@/lib/authz` Single-Module-Refactor** (S23) — `userIsMember` triple-duplication beseitigen, defense-in-depth Single-Source
- Better-Auth-Hardening (K7) + Magic-Link-Rate-Limit (K9)
- Security-Headers (K8) — CSP/HSTS/X-Frame/Referrer/Permissions
- Rate-Limiter (K10) auf Upstash/Vercel-KV
- Account-Delete + Workspace-Delete + Session-Revoke (S15 = K27 Legal, GDPR Art. 17)
- **GDPR PII-Scrub** (K21) — ip_address + user_agent in install_decision/apply_action/dpa_acceptance auf User-Delete scrubben
- Vitest-Bump (K35, CVE-2025)
- Test-Pattern: Integration-Tests mit Multi-Workspace-Setup für Cross-Tenant-Negatives

### Phase 2 — Bundle B · Payment-Fix-Block + Inngest-Idempotency (5-6 dev-days)

Eigener Plan: `docs/plans/payment-fix-block.md`

- K14 Auto-Overage end-to-end (UI → Action → Inngest → Meter) + Tests
- K15 `current_period_end` aus `sub.items.data[0]` lesen
- **K16 Inngest cross-instance bug** — `audit-requested` mit local-disk-path: entweder local-path-Pfad in Inngest sperren (kurz) ODER S3/Blob-Upload (lang). Quick-Cut: nur GitHub-URL erlauben für Inngest-Path.
- K34 Invoice-paid email-receipt + Credit-low-warning-Email
- S1 `handleInvoicePaid` Idempotency-Index auf `(workspace_id, reason, reference_id)` + Migration
- S2 `customer.deleted` Handler
- S3 `tax_code: txcd_10103001` auf alle B2B-SaaS-Prices
- S4 `customer_update.name: "auto"`
- S5 AI-Markup-Meter wired + Flushed
- S24/S25/S28 Inngest Atomicity + onFailure + prepaid-expirer-Order

### Phase 3 — Bundles C + D + F + G parallel

**Bundle C · Production-Infra-Bootstrap** (6-7 dev-days + 24h DKIM):
Eigener Plan: `docs/plans/production-infra-bootstrap.md`

- K17 `INNGEST_SIGNING_KEY` enforce + `runtime="nodejs"` + 503-guard
- K18 Sentry Install + Source-Maps + Alerts (Sentry-Skill konsultieren)
- K19 Domain registrieren (Empfehlung Wave-1-Infra: Cloudflare/INWX/Hetzner) + DNS + DKIM/SPF/DMARC + Stripe-Domain-Verify
- K31/K32 Resend-Webhook-Endpoint + Suppression-Table-Migration
- S6 `vercel.json` Fluid-Compute-Profile (regions, functions, frozen-lockfile)
- S7 Env-Schema-Validator (zod) zur Build-Zeit
- S30 6 missing hot-query indices (Migration)
- S35 Lighthouse-CI Thresholds nuancieren (warn/error mix)
- S41 Deps-Bump (tmp, hono moderate CVEs)
- Resend-Account + Inngest-Cloud-Account-Setup + Webhook-Registration

**Bundle D · Frontend-Pre-GA-Polish** (3-4 dev-days):
Eigener Plan: `docs/plans/frontend-pre-ga-polish.md`

- K22 `/[workspace]/scans/[id]` Design (PageShell, Card, Header)
- K23 `loading.tsx` → `<GalaxieSkeleton />` (5 LOC!)
- K24 Modals wired ODER deleted
- S10 10/17 Settings-Stubs hidden hinter Feature-Flag
- S11 Button + Input `h-11` (44px)
- S12 SettingsLayout Mobile-Accordion-Pattern
- S13 `global-error.tsx` `lang="de"`
- S14 Toast-System überall (form-success)
- S20 Inspector focus-trap
- **S34 SiteNav-Static-Block fix** — Lift SiteNav out of SSR-blocking auf Marketing-Pages → unlocks `○ Static` für 5+ Routes
- S36 `/status` self-DOS-vector cache

**Bundle F · Legal + DSGVO + Compliance-Pre-GA** (2-3 dev-days code + 3-5 days Legal-Content):
Eigener Plan: `docs/plans/legal-dsgvo-pre-ga.md`

- K25 Impressum implementieren (§5 TMG Vollständigkeit)
- K26 Datenschutzerklärung implementieren (Subprozessoren-Liste, Art. 6 DSGVO Rechtsgrundlagen, Retention)
- K27 GDPR Art. 17 = K-Auth (Bundle A) — koordinieren
- K28 Impressum-Footer in ALLE Transactional-Emails (= Bundle G)
- K29 TIA-Doc fixen ODER Link entfernen
- K30 DPA-Contact-Email auf Domain-Adresse (= Bundle C Domain)
- S37 Domain-Inkonsistenz (.app/.dev/-ai) — pick one + global-replace
- S38 DPA-Acceptance-Audit-Log dokumentieren in DSE
- S39 AVV-PDF-Download
- S40 OSS-Notices
- AGB-Translation auf de-DE (Wave-2-Legal Weak)
- Legal-Content: entweder Anwalt-Konsultation ODER Template-Provider (Termly/eRecht24/iubenda)

**Bundle G · Email-Templates + Deliverability** (2-3 dev-days):
Eigener Plan: `docs/plans/email-deliverability.md`

- K33 Member-Invite-Email implementieren + im `inviteAdmin`-Pfad triggern
- K34 Invoice-Paid Email + Credit-Low-Warning (überlappt Bundle B — koordinieren)
- List-Unsubscribe-Header (RFC 8058 one-click) auf alle Templates
- Impressum-Footer in alle Templates (= K28)
- de-DE Locale für Subjects + Date-Formatting (`PlanChangeConfirmation`, `PrepaidPackExpireWarning`)
- 30-day + 7-day Variants von `PrepaidPackExpireWarning` (Wave-2 fand nur 1-day implementiert)
- Resend-Webhook-Handler-Implementierung (auf Suppression-Table aus Bundle C)
- Dunning-Cap (max 3 mails pro invoice statt N retries)

### Phase 4 — Bundle E · Stripe-Live-Mode-Bootstrap (2 dev-days code + 1-2 wks KYC parallel)

Eigener Plan: `docs/plans/stripe-live-mode-bootstrap.md`

- Stripe-Live-Account KYC (out-of-band, parallel ab Phase 1)
- Stripe-Tax-DE-Registrierung + ggf. EU-OSS-Vorbereitung
- Bootstrap-Skript `pnpm stripe:setup-live` (sk_live_-acceptance fix in `scripts/stripe-test-setup.ts:97-101`)
- 14 Env-Vars Test→Live swap-Dokument
- Webhook-Endpoint registrieren + `STRIPE_WEBHOOK_SECRET_LIVE`
- Customer-Portal-Branding + Allowed-Actions
- Smoke-Test-Checkliste (echte Karte + Refund)

### Phase 5 — Pre-Launch-Verify + Soft-Launch

- E2E-Smoke-Test (Signup → Audit → Pay → Cancel)
- Sentry-Alert-Check
- DNS-Propagation-Verify (mxtoolbox + mail-tester.com)
- Stripe-Test-Charge mit Live-Card + Refund
- Beta-User-Friends (3-5) für 7 Tage
- Master-Plan → `docs/plans/done/production-launch-readiness/`

## 7. Files-to-Change

Pro Bundle in jeweiligem Sub-Plan dokumentiert. 7 Sub-Pläne werden im Anschluss als Skelette geschrieben:

- `docs/plans/auth-security-hardening.md` — Bundle A
- `docs/plans/payment-fix-block.md` — Bundle B
- `docs/plans/production-infra-bootstrap.md` — Bundle C
- `docs/plans/frontend-pre-ga-polish.md` — Bundle D
- `docs/plans/stripe-live-mode-bootstrap.md` — Bundle E
- `docs/plans/legal-dsgvo-pre-ga.md` — Bundle F (NEU nach Wave-2)
- `docs/plans/email-deliverability.md` — Bundle G (NEU nach Wave-2)

## 8. DB-Migration (relevant in Bundle B)

Bundle B benötigt Migration für Idempotency-Index:

```sql
-- Migration 0016 (Bundle B): credit_ledger idempotency
CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_ledger_invoice_grant
  ON credit_ledger (workspace_id, reason, reference_id)
  WHERE reason = 'monthly_grant';
```

Plus ggf. Migration für `webhook_event` falls Bundle A FK auf `workspace_id` ergänzen muss (siehe Wave-2 DB-Schema-Audit).

## 9. Test-Plan

Pro Bundle eigener Test-Plan. Konsolidiert:

- **Bundle A**: Vitest-Unit pro DAL-Function (membership-guard), Integration-Test gegen Postgres für Cross-Workspace-Negative (Workspace-A-User darf Workspace-B-Resource nicht sehen)
- **Bundle B**: Integration-Test für Auto-Overage E2E (allowOverage=true → consumeCredits → ledger-Row → aggregator-Run → meter-Event), Replay-Test für `invoice.paid` Idempotency
- **Bundle C**: env-validator-Test, Sentry-Init-Test, Inngest-signingKey-Required-Test
- **Bundle D**: snapshot-Test für `/[workspace]/scans/[id]`, axe-core Playwright für Settings-Mobile-Layout
- **Bundle E**: Manual-Checkliste (KYC, Test-Charge, Refund, Tax-Calc-Spot-Check)

## 10. Risiken

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|--------|--------|------------|
| Wave-2 entdeckt 5+ weitere Kills die nicht in A–E passen | Mid | Plan-Erweiterung um Bundle F+G | Wave-2-Synthese ggf. Bundle-Re-Plot |
| Stripe-Live-KYC dauert >2 Wochen | Mid | Launch-Verzögerung | KYC sofort starten (Phase 0/1 parallel) |
| DKIM-Propagation 48h statt 24h | Low | 1 Tag Verzögerung | Buffer einplanen |
| Cross-Tenant-IDOR-Fix breaks bestehende Tests | Mid | Test-Schreibung | Bundle-A-Tests vor Refactor |
| `current_period_end` Fix breaks integration tests die alte Field-Shape mocken | High | Test-Update nötig | Bundle B inkludiert Test-Update |
| Sentry-Source-Maps Upload-Pipeline schwierig auf Vercel | Low | Sentry-Functions-untested | Sentry-Skill konsultieren, falls Probleme |

## 11. Out-of-Scope

- Cache-Components-Adoption (`'use cache'` Roll-Out) — eigener Plan post-launch
- Nova-3c residual DAL-Tests (apply-dal, billing-actions, install-requests, stale-references) — eigener Plan post-launch
- Workspace-Hub-Polish-Phase-3 (UI-Phase-3 mit Sub-11 Polish-Liste 30 Items) — Nova-3b Bundle J, post-launch
- B2C-Compliance-Cookie-Banner (DACH-B2B only)
- Marketing-Launch (Demo-Video, Press-Kit, Investor-Deck)
- Pricing-Page-Re-Design (V2 ist OK, Polish post-launch)
- pgvector + Embeddings-Roadmap

## 12. Rollout

Phasen 1–4 sequentiell, jeweils eigener `/execute <bundle-slug>`. Nach jedem Bundle: `git mv` Sub-Plan-File nach `docs/plans/done/production-launch-readiness/`.

Phase 5 (Pre-Launch-Verify): Manual-Checkliste in eigenem File `docs/operations/pre-launch-checklist.md` (existiert noch nicht — Bundle C erstellt).

**Soft-Launch Strategy:**
1. Domain live + alle Bundles green
2. 3-5 Friends auf Live-Mode (echte Karten, 100% Refund nach 7 Tagen)
3. Bei 0 Critical-Alerts: Public-URL teilen mit Newsletter o.ä.

## 13. Offen

Werden in Wave-2 + Wave-3 entschieden:

- Welche Settings-Stubs (S10) shippen wir wirklich (= Nova-2-Settings-Backend mit einplanen?) und welche hide?
- Account-Delete: hard-delete vs. 7-day-soft-delete-mit-Inngest-Job?
- Sentry vs. Axiom vs. PostHog (Bundle C — pick one, Sentry-Empfehlung default)
- Domain-Vorschlag (Wave-1-Agent listet Cloudflare/INWX/Hetzner/Vercel-Domains — User-Choice)
- DPA-Template + AVV: Selbst-erstellt vs. Vorlage-Anbieter (Termly/iubenda/…)?

---

End of Master-Plan. Sub-Pläne folgen nach Wave-2-Synthese.
