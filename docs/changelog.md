# ValidationKit — Phasen-Changelog

Pro Phase ein Block. Verweist auf detaillierte Plan-Files und Roadmaps. Aktive Phase steht oben.

---

## Plan-Reconciliation + Konsolidierung auf 2 offene Pläne (✅ 2026-06-18)

16-Subagent-Reconciliation aller 16 aktiven Pläne gegen den echten Code (Plan-Checkboxen waren durchgängig stale — die meisten Bundles längst implementiert). Ergebnis: alle *code-now*-Reste umgesetzt, alle erledigten/obsoleten Pläne archiviert, verbleibender Scope auf **genau zwei** Pläne reduziert. Branch `launch-prep-execute`.

- **Umgesetzt + committet**: J5-Credit-Refund-on-Failure (reserve-before-LLM, exakte Pool-Reversal); B-Resilience (`customer_update.name='auto'`, deterministische Inngest-Enqueue-`id`); J6-List-Refresh nach Invite/Revoke/Decide; Bundle F — **AGB-de**, OSS-Notices + `THIRD_PARTY_NOTICES.md`, reusable `LegalFooter`, Subprozessor-Single-Source; 3 Orphan-Deletes (`CreditMeter`/`IntensitySelector`/`cost-estimator`); Doc-Sync (Galaxie-Metapher aus README/vision/CLAUDE.md raus, 8 Audit-Drafts gelöscht). Typecheck 23/23, Tests 335/335 grün.
- **Archiviert** (`docs/plans/done/`): Master `production-launch-readiness` + 10 Bundle-Sub-Pläne → `done/production-launch-readiness/`; `pre-launch-second-opinion-audit`, `production-live-connect-stub`, 3× `nova-2-*`, `saas-premium-overhaul` (+ Sub-Pläne) → `done/`.
- **Verbleibend (2 Pläne)**: `production-go-live.md` (Domain/Stripe-Live-KYC/Sentry/Upstash/Live-Keys — der einzige manuelle Block) + `frontend-and-polish.md` (Frontend-Visual + Settings-Backend-Features + J1/J4-Architektur + Email-de-Copy + axe-Harness — Code ohne externe Voraussetzung).
- **Bewusst NICHT autonom**: DB-Migrationen (drizzle-Snapshots bei 0011 eingefroren → hand-geschrieben, Constraint-Risiko), GitHub-Background-Refactor (Shared-Package), CSP-Enforce-Flip, alles Domain-/Geld-gekoppelte.

## App-Visual-Overhaul: 3-Farben-System + Hero-Viewport (✅ 2026-06-10)

App-weiter Visual-Pass: striktes 3-Farben-System (Rot/Orange/Grün), ruhigeres Severity-Styling, 100dvh-Hero, aufgeräumte Konsole, ehrliche Trust-Bausteine. Basiert auf 11 User-Entscheidungen (3 Discovery-Runden) + Code-Audit über 4 Subagenten. Plan: `docs/plans/done/app-visual-overhaul-3color.md`.

- **Bundle 1 — Token/Severity-Core**: `severity-colors.ts` zur reinen Var-Mapper-SSOT (`severityColorVar`/`SEVERITY_COLOR` → `var(--color-sev-*)`), toter Pixi-Code (Glow/Pulse/PixiColor/Outline) entfernt — die `globals.css`-Tokens sind jetzt die einzige Severity-Farbquelle (Ampel −/0/+: Kill voll-rot, Weak gedämpft-rot, Mid ein gedämpftes Orange, Strong/Exceptional grün). `SeverityBadge` cva → einheitliche 1px-Hairline-Pills, nur Kill gefüllt (kein border-2/3px/dashed/italic mehr). `--radius` 8→6px. Plan-Farben → Graustufe, `space-bg.ts` (0 Consumer) gelöscht, Inline-Hex → Tokens.
- **Bundle 2 — Konsole**: Gruppierung auf Repo+Kunde reduziert (Severity- + neuer Regel-`<details>`-Filter, Ordner bleibt nested); 5-Farb-`HeatBar` → ruhiger `SeverityDot` (Worst-Severity + Kill-Zahl + Total, aria-label); `sectionsBySeverity`/`ByFolder`/`heatSegments` entfernt, `worstSeverity` hinzu.
- **Bundle 3 — Hero/Landing**: Hero füllt exakt `100dvh−nav` — side-by-side ab `lg` (Text links / Live-Konsole rechts), gestapelt mobil (Demo oben). Unterer CTA → `RepoUrlPill` mit echtem Anon-Audit via entkoppelter `vk:audit-repo`-Event-Bridge (ConsoleSurface remountet RepoConsole mit `initialUrl`). Feature-Bilder Hover-Zoom (motion-reduce-safe).
- **Bundle 4 — Trust/Proof**: Fake-Logo-Wall + Placeholder-Stat („2.400+/18.000+") + erfundene Testimonials (Lena/Tomasz/Priya) entfernt → ehrliche Proof-Punkte + `Principles`-Sektion + Founder-Note (Pre-Launch-Glaubwürdigkeit). Trust-Seite token-sauber. ⚠️ **Deferred**: 4 Feature-Screenshots-Regen (Playwright-Backend in der Env nicht funktionsfähig) — zeigen noch alte Palette.
- **Bundle 5 — App-Sweep**: emerald (billing)→sev-strong, amber (delete)→sev-mid, teal+cream Inline-Hex (Inspector)→neutral, AISolutionPlaceholder dashed+italic→Hairline. Verifikation: typecheck ✓, lint ✓, **Prod-Build grün**, 183 Tests grün (4 vorbestehende `server-only`-DAL-Failures unverändert).

## Galaxie-Retirement + Konsolen-Surface (✅ 2026-06-10)

Die PixiJS-Galaxie komplett aus Code, Deps und Produkt entfernt; die Landing auf **ein durchgehendes Konsolen-Surface** umgebaut. Basiert auf 8 User-Entscheidungen (2 Discovery-Runden) + Code-Audit von ~15 Files über 5 Subagenten. Plan: `docs/plans/galaxie-retire-console-landing.md`.

- **Bundle 1 — Retirement** (`e8ed96c`): Workspace `GalaxieRoot`/Map-Tab → neue `WorkspaceConsole` (`SolarListView` + portierter `WorkspaceSwitcher` + `ActivationChecklist`); kein Pixi, kein SVG-Fallback, keyboard-/screenreader-native by default. Gelöscht: `GalaxieScene`/`GalaxieRoot`/`StaticGalaxieSVG`/`MiniMap`/`ZoomIndicator`/`OnboardingBanner`/`pixi/**`, `landing/PortfolioShowcase`, `settings/galaxie`-Route. `OnboardingState`-Type nach `lib/galaxie/types.ts`. Inspector-Slide-in von GSAP → Web-Animations-API. **Heavy-Deps raus**: `pixi.js`, `@pixi/react`, `pixi-filters`, `gsap` (−20 npm-Pakete). `solar-layout.ts` BLEIBT (Konsolen-Tree braucht `computeSolarLayout`).
- **Bundle 2 — Surface** (`bed0488`): `ConsoleSurface` = Portfolio-Triage-Liste ⇄ Repo-Tree+Inspector mit motion-Scale-Fade-Zoom. `SolarListView` bekommt optionalen `onRepoActivate`-Hook (Workspace unverändert). `HeroSection`-Audit-Demo extrahiert zu `RepoConsole` (mit „← Portfolio"-Back). Live-Surface ersetzt statisches `konsole.png` im Hero-Browser-Frame. Page: Hero(Text+Surface) → Features → SocialProof.
- **Bundle 3 — Copy/Cleanup**: Feature-Block 3 „Portfolio-Map/Galaxie" → „Konsole"; Testimonial-Galaxie-Lob → Konsole-Lob; Dangling-Copy in `customers`/`scans`/`access`/RepoInspector entschärft; orphaned SVG-Galaxie-Hero-Cluster (`RepoGalaxie`+`Sphere`+`BackgroundStars`+`HoverTooltip`+`SeverityIcon`) gelöscht; `portfolio-map.png` raus.
- **Verifikation**: typecheck grün, vitest 192 grün (4 vorbestehende `server-only`-DAL-Integration-Failures unverändert), prod-build grün. Mobile-QA = User.
- **Block-Resolutions**: (1) `WorkspaceSwitcher`+`ActivationChecklist` lebten nur in der Pixi-Chrome → in die Konsole portiert statt verloren; (2) `solar-layout.ts` ist NICHT Pixi-only (Konsolen-Tree-Dep) → behalten; (3) `gsap` doch in `Inspector` (Konsolen-Stack) → auf WAAPI portiert.

## Galaxie-Workspace-Solar (✅ 2026-06-03)

Workspace-Audit-Galaxie komplett neu gedacht — Sonnensystem-pro-Repo statt freier Planeten-Wolke, asymmetrische Severity-Salienz (nur Kill schreit) statt 5-Hue-Bunt, Calm-by-Default mit Hover-Reveal, Datadog-Pivot statt Modal, Mobile-List statt PixiJS-on-Phone. Master + 3 Sub-Pläne in `docs/plans/done/galaxie-workspace-solar-redesign/`, basiert auf 12 User-Entscheidungen (4 Discovery-Runden), 12 Web-Research-Agents und Code-Audit von 9 Files.

- **Master**: `docs/plans/done/galaxie-workspace-solar-redesign/galaxie-workspace-solar-redesign.md`
- **Sub-A Layout-Foundation** (`03a53b9`, 2026-05-26): `solar-layout.ts` + `SolarLayoutNode` + `FolderNode` deterministisch hash-sortiert, Multi-Sonnen-Cluster pro Customer, neue PIXI-Klassen `RepoSun` + `FolderPlanet` + `FilePlanet` (alte `CustomerStar`/`RepoMoon`/`FileAsteroid` gelöscht). 12 neue Vitest-Tests. MiniMap-Bridge mit deprecated `layout.ts` läuft weiter.
- **Sub-B Asymm-Severity + Pulse + Edge-Badges** (`a1df899`, 2026-05-26): `SEVERITY_HEX` Hard-Replace auf OKLCH-Asymm-Palette (Kill `#c64a3a` sat-Rot mit Bloom + 0.625 Hz Pulse; Weak `#cf8a4f` gedämpft Orange; Mid `#9aa3b3` neutral-Anker ohne Badge; Strong `#7eb8a4` Teal; Exceptional neutral + 1 px Indigo-Stroke; Dismissed `#4d4d4d` Alpha 0.35). Lucide-Edge-Badges (`OctagonX`/`AlertTriangle`/`MinusCircle`/`CheckCircle`/`Sparkles`) via `renderToStaticMarkup` → Blob-URL → DPR-2-Canvas → `PIXI.Texture.from` cached. Worst-Child-Aggregate-Badge auf Sun nur bei Kill. Landing-Hero V2 läuft mit gleicher Palette mit (Cross-Impact-Re-Walk pflichtig + grün).
- **Sub-C Hover-Reveal + Datadog-Pivot + Mobile-List** (`b8ebb04`, 2026-06-03): `EdgeContainer` + `OrbitContainer` + `SelectedEdgeContainer` mit Container.alpha-Tween für Reveal-Layers. Hover-Scale auf 1.08 reduziert (statt Sub-B 1.5), `setHoverGlow(active)` auf allen 3 PIXI-Klassen. Datadog-Pivot via `inspectorTarget`-State → derived `selectedNodeId` → GSAP-Proxy-Dim-Tween schont Sub-B-Solution-Status-Alphas via `baseAlphas`-Cache. Inspector major-refactored auf `target`-Prop-Union (`FileInspector` + `FolderInspector` als Sub-Components, Click-Outside-Detection rAF-deferred). `SolarListView.tsx` für Mobile ≤639 px mit Severity-Filter-Chips + 44 pt Rows + Bottom-Sheet-Inspector. `StaticGalaxieSVG` zeigt Orbits + Edges permanent bei strokeOpacity 0.10.
- **Tech-Stack-Verzicht**: PixiJS v8 + GSAP bleibt (R3F-Migration explizit verworfen, +150 kB Bundle-Tax disproportional zum Schmerz).
- **Tests**: typecheck 23/23, vitest 36/36 (+17 neue: 12 solar-layout, 5 severity), next build ~6 s. Acceptance-Walks Desktop + Mobile-Emulation + Reduced-Motion + Landing-Regression alle grün.
- **Discovery-Pattern-Validierung**: 4 Discovery-Runden im Master, je 1 in Sub-A/B/C; alle Recommended-Antworten außer QA4 (Test-Migration override) und QC1 (Major-Refactor von Inspector statt Hard-Replace = sparte 200+ LOC).
- **Deferred / Out-of-Scope** (alle dokumentiert): rekursive Folder-Hierarchie + Visual-Sub-Sonnen-Pivot, MiniMap-Migration + Pivot-Indicator, Semantic-Zoom-Cutoffs (Mapbox-Style), Filter-Chips in Desktop-Toolbar, Saved-Views, UniversalSearch-Anpassung, Submodul-Drift-Edges, `@tanstack/react-virtual` bei >500 Files, R3F-Migration (Nova-3+).
- **Folge-Cleanup-Item**: `apps/web/src/lib/galaxie/layout.ts` ist `@deprecated`-frozen für MiniMap-Bridge, kann mit MiniMap-Migration-Phase gelöscht werden.

## SaaS-Pricing V2 Polish-Pack — Email + Pack-Modal (✅ 2026-05-21)

Polish-Pack auf Master SaaS-Pricing-Redesign. Schließt 3 von 4 Sub-C-Deferrals.

- **3 React-Email-Templates** in `packages/auth/src/emails/`:
  - `PrepaidPackExpireWarning.tsx` — 1-day pre-expiry heads-up (30d/7d variants ready, only 1d wired in V2)
  - `SubscriptionPastDue.tsx` — Stripe-Portal CTA bei `invoice.payment_failed`
  - `PlanChangeConfirmation.tsx` — Upgrade / Downgrade / Cancellation
- `packages/auth/src/emails/sender.ts` (NEW) — `sendTransactionalEmail()` Wrapper mit nodemailer-Transport (Resend SMTP prod, Mailpit dev). Soft-fails ohne Transport für Tests.
- `packages/auth/src/emails/styles.ts` (NEW) — Linear-Aesthetic shared style constants.
- `prepaid-credit-expirer` Cron erweitert: 1-day-Warning-Mail mit Dedup via `event`-Table (`type=prepaid_pack_warning`, 48h-Lookback).
- Stripe-Webhook erweitert: `invoice.payment_failed` triggert Past-Due-Mail, `customer.subscription.updated` triggert Plan-Change-Mail (skip if tier unchanged), `customer.subscription.deleted` triggert Cancellation-Mail.
- `BuyCreditPackModal.tsx` (NEW) — Modal-Alternative zu inline-forms auf billing-page; Radio-Pick (100 / 500) + Stripe-Checkout-Redirect.
- `packages/inngest` jetzt mit `@vk/auth` + `react` deps für Email-Calls.
- 222 Tests grün, root typecheck grün, alle Builds grün.
- Deferred: V2.4 IntensitySelector-Integration (kein workspace-internal Audit-Trigger-Form existiert — ready-to-import wenn der entsteht); 30d/7d-Warnings (V3, brauchen state-Spalten in prepaid_credit_grant); Playwright-E2E + credits.test.ts DB-Integration (V3).

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

## Phase Future (Backlog)

- **Nova-3b** — Tests-Critical-Paths (Stripe-Webhook, audit-action, API-Routes, DAL, session, billing, Audit-Rules) + UI-Konsistenz-Phase-3-Workspace-Hub-Polish (Sub-11 Polish-Liste mit 30 Items in 6 Sub-Phasen). Eigener `/plan`-Cycle, ~30h.
- ~~**Production-Live-Connect** — Stripe-Live + Vercel-Prod-Env + Domain + Resend-Prod + Inngest-Cloud + Sentry + Stripe-Tax-DE + KYC. Skelett: `docs/plans/production-live-connect-stub.md`.~~ → **Superseded (2026-06-18)** durch Production-Launch-Readiness-Master (Bundle C Production-Infra + Bundle E), siehe `docs/plans/production-launch-readiness.md`.
- Themen-Backlog im `TODO.md` Parking-Lot.

---

## Phase Nova-3a — Repo-Polish + Production-Code-Prep (🟡 In Execute, ab 2026-05-21)

Aktive Phase. Foundation-Cleanup (Audit-getrieben) + Landing-Hero-Polish + Stripe-Test-Mode-Verify + Stub für Production-Live.

- Plan: `docs/plans/nova-3-repo-polish-and-prod-prep.md`
- Audit: `docs/audits/2026-05/` (12 Subagent-Reports + Synthese; 18 Kill · 59 Strong · 60 Mid)
- Bundles A-H Cleanup + Phase 2 Landing-Polish + Phase 4 Stripe-Test-Mode.
- Tests-Critical-Paths + Workspace-Hub-Polish → Nova-3b.
