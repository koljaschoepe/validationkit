# ValidationKit — Phasen-Changelog

Pro Phase ein Block. Verweist auf detaillierte Plan-Files und Roadmaps. Aktive Phase steht oben.

---

## Master SaaS-Pricing-Redesign — Sub-Plan-C: UI + Compliance (✅ 2026-05-21)

User-facing layer komplett — Master-Plan ist damit shippable.

- Sub-Plan-C: `docs/plans/done/saas-pricing-sub-c-ui-compliance.md`
- `/pricing` rewritten: 4 Tier-Cards (Free/Starter/Pro/Agency, EUR + VAT-by-IP), Cycle-Toggle, Quick/Deep-Erklärung-Section, Markup-Disclosure-Footnote, FAQ.
- `/[workspace]/settings/billing` rewritten: Current-Plan + Credit-Balance-Progressbar + Pre-Paid-Packs-Liste + 4-Tier-Picker + Buy-100/500-Forms + Stripe-Portal-Link + Past-Due-Banner. `/billing` redirected zu workspace-scope.
- `/[workspace]/settings/ai` (NEU): BYOK-Toggle (Pro+) mit verschlüsselter Key-Persistenz, Auto-Overage-Switch, Spend-Cap, Default-Intensity-Radio. Sidebar-Nav-Item "AI" hinzugefügt.
- `apps/web/src/lib/workspace-ai-actions.ts` (NEU): 4 Server-Actions für BYOK / Auto-Overage / Spend-Cap / Default-Intensity.
- `IntensitySelector.tsx` (NEU): Reusable Pill-Group mit Tier-Lock, Cost-Preview ("This Quick audit consumes 1 credit (≈€0.02 of GPT-5-nano)").
- `CreditMeter.tsx` (NEU): Right-Rail-Komponente — Credits-Balance, Progress-Bar, Reset-Datum, Top-Up-CTA.
- `cost-estimator.ts` (NEU): pre-audit estimateAuditCost + formatEurCents.
- 3 Legal-Pages (NEU): `/legal/subprocessors` (7 Sub-Processors mit DPA-Links + 30d-Notice), `/legal/dpa` (GDPR Art. 28 template, 7 Sektionen), `/legal/agb` (Terms + Pricing-Klausel + Cost-Volatility-Klausel + 30d-Notice + BYOK + Fair-Use).
- `docs/operations/transfer-impact-assessment.md` (NEU): TIA für US-Sub-Processors (Schrems II), per-Processor-Assessment, Open-Items für Beta-Pre-Launch.
- Root-Typecheck grün, Builds grün, 222 Tests grün.
- Deferred: Email-Templates (C.7) + Playwright-E2E-Suite (C.8) + IntensitySelector-Integration in RepoUrlPill — User-Sites die anonyme Audits triggern.
- Out-of-scope: Anwaltliche AGB/DPA-Review (Master-§11), Lighthouse-CI als Gate, SiteFooter mit Legal-Links (kein bestehender Footer im Repo).

## Sub-Plan-B: SaaS-Pricing Sub-B — Stripe Meters + Credits + Webhooks (✅ 2026-05-21)

Stripe-Integration komplett auf Workspace-Architektur + Credit-System.

- Sub-Plan-B: `docs/plans/done/saas-pricing-sub-b-stripe-credits.md`
- `scripts/stripe-test-setup.ts` — Bootstrap-Script provisioniert 1 Product, 8 Tier-Prices (4 Tiers × 2 Cycles), 2 Pre-Paid-Pack-Prices, 2 Meters + Meter-Prices. Idempotent via lookup_keys.
- `apps/web/src/lib/stripe.ts` erweitert: `prepaidPackPriceId`, `meterIdFor`, `meterEventName`, `MeterKind`.
- `apps/web/src/lib/stripe-meters.ts` NEW — Meter-Event-Wrapper mit 2-Layer-Idempotenz (DB-Log + Stripe-API-side dedupe).
- DB Migration 0014: `stripe_meter_event_log` (PK = identifier, workspaceId-scoped).
- Webhook 6 Events: `checkout.session.completed` (+prepaid-pack-branch), `customer.subscription.created/updated/deleted`, `invoice.created` (synchroner Meter-Flush via `flushPendingForCustomer`), `invoice.paid` (monthly_grant + reset), `invoice.payment_failed` (past_due).
- Pre-Paid-Pack-Checkout-Flow: `createPrepaidPackCheckoutSession` (`mode=payment`), `buyPrepaidPackAction`, 12-Monats-Expiry via `prepaidCreditExpirer`-Cron (täglich 02:00 UTC).
- Inngest neue Jobs: `credit-aggregator` (alle 5min, batched Meter-Submission), `prepaid-credit-expirer` (daily).
- Reconcile-Cron: 5min-Settle-Window + workspace-Level drift-detection.
- `docs/operations/stripe-go-live.md` — KYC + USt-IdNr + OSS + Live-Mode-Switch-Checkliste.
- `.env.example` rewritten für neue 4-Tier-Konvention + Pre-Paid-Packs + Meters + BYOK_ENCRYPTION_KEY.
- 222 Tests grün, root typecheck grün.
- 3 Deferred: msw-Webhook-Integration-Tests, Stripe-CLI-E2E (Manual-Check), Stripe-Dashboard Tax+Portal-Setup (User-Aufgabe vor Live-Mode).

## Sub-Plan-A: SaaS-Pricing Sub-A — DB + Metering (✅ 2026-05-21)

Backend-Foundation für das neue 4-Tier Hybrid-Pricing-System.

- Master-Plan: `docs/plans/saas-pricing-redesign.md` (in review)
- Sub-Plan-A: `docs/plans/saas-pricing-sub-a-db-metering.md` (✅ done)
- Migration: `packages/db/drizzle/0013_saas_pricing_redesign.sql` — subscription user→workspace + 4 neue Tables (ai_usage_event, audit_run_cost, credit_ledger, prepaid_credit_grant) + scan-Erweiterung
- Neue ADRs: 0007 (Credit-System + Quick/Deep-Intensity), 0008 (BYOK-Key-Encryption mit AES-256-GCM)
- `packages/billing` rewrite: 4 Tiers (free/starter/pro/agency) + Credit-Ledger + BYOK-Crypto + Intensity (Quick=1, Deep=5)
- `packages/llm` Intensity-routing + Usage-Tracking: jeder generateText-Call persistiert ai_usage_event + computeCallCost in microcents
- Cross-cutting Tier-Rename: rate-limit.ts, stripe.ts, billing-actions.ts, webhook/route.ts, customer-dal.ts, customers.ts, billing/page.tsx, pricing/page.tsx — Sub-B/C-Stubs für ausstehendes UI/Stripe-Wiring
- 222 Tests grün, root typecheck grün, alle Builds grün
- Open: DB-Apply manuell (`pnpm stack:up && pnpm db:migrate`), Snapshot-Regenerate beim nächsten `db:generate`-Run

## Phase Repo-Health (✅ 2026-05-21)

Konsolidierender Health-Pass nach Phase Nova-2: Workflow-Overhaul, Doku-Reality-Sync, Drift-Cleanup-Final, Tech-Stack-Hygiene, Tests/CI-Härten, Onboarding-Doku.

- Master-Plan: `docs/plans/repo-health-and-workflow-overhaul.md`
- 8 Audit-Reports: `docs/audits/2026-05/`
- Neue ADRs: 0004 (SVG-Landing-Stack), 0005 (LLM-Multi-Provider), 0006 (Workspace-Tables vs. Better-Auth-Org)
- 3 superseded R3F-Plans gelöscht.

## Phase Nova-2 (✅ Shell shipped 2026-05-20)

Frontend auf Linear/Vercel-Niveau. Foundation (Tokens + ui-vk), Hero auf SVG, App-Pages-Refactor, Auth+Onboarding-Shell, Settings-Restructure (5+10 Sections, 13 noch Backend-Shell), Mobile-Adaptation, Quality-Gates.

- Roadmap: `docs/roadmap/phase-nova-2.md`
- Master-Plan: `docs/plans/done/nova/nova-2-full-product.md`
- Stack-Pivot: Landing-Hero PixiJS → SVG (`docs/plans/done/galaxie/repo-galaxie-mvp.md` + ADR-0004)
- Aktive Sub-Pläne: `nova-2-live-audit-flow.md`, `nova-2-settings-backend.md`, `nova-2-a11y-deep-sweep.md`

## Phase Galaxie (✅ shipped 2026-05-19)

Galaxie-Navigation auf PixiJS v8 + GSAP + Motion. Sprint G1–G6: UI-Skeleton, Data-Binding, Inspector, AI-Solutions, Apply, Polish.

- Roadmap: `docs/roadmap/done/phase-galaxie.md`
- Sprint-Pläne: `docs/plans/done/galaxie/`
- ADRs: 0002 (UI-Render-Stack — Pixi)
- Pivot mid-phase: Drift/Compare-Feature gedropt (ADR-0003).

## Homepage-Relaunch (✅ 2026-05-19)

Marketing-Pages-Polish + Drift/Compare-Feature gedropt.

- Pläne: `docs/plans/done/homepage-relaunch/`
- ADRs: 0003 (drop-compare-feature)

## Landing-Iterations (✅ shipped, verteilt)

5 Landing-Page-Sprints, davon `landing-refactor-v3-static-mockup.md` (2 Runden Discovery-AskUserQuestion-Vorbild für den Phase-0-Workflow-Overhaul).

- Pläne: `docs/plans/done/landing/`

## Phase 0 — Foundation (✅ shipped 2026-05-16)

11 Sprints in einer Woche: Monorepo-Skeleton, Parser MUST-5, 5+1 Audit-Rules, Docker-Stack, Better-Auth + Magic-Link, Trust-Center, GitHub-App, Inngest, Multi-Customer-UI, Compliance-Polish.

- Sprint-History: `docs/plans/done/phase-0-history.md`
- ADRs: 0001 (customer-schema)

---

## Phase Future (offen)

Kein aktiver Plan. Themen-Backlog im `TODO.md` Parking-Lot.
