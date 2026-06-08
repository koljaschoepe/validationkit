# Plan — Production-Launch-Readiness Master

> Erstellt: 2026-06-05 · Wave-2-Update 2026-06-08 · **Launch-Verify-Refresh 2026-06-08**
> Status: 🟡 In Execute — Bundle A 4/6 committet, dann durch Launch-Verify-Audit **reopened** (2 übersehene IDORs). 10 Bundles (A–J).
> Slug: `production-launch-readiness`
> Confidence: **High** — 8 Discovery-Entscheidungen (Wave-1/2) + 6 Refresh-Entscheidungen (Session 2026-06-08) + 14-Subagent-Launch-Verify-Audit (`docs/audits/2026-06-launch-verify/_synthesis.md`).
> Source-of-Truth-Findings: `docs/audits/2026-06-launch-verify/_synthesis.md` (neu, 14 Dim) ergänzt `docs/audits/2026-05-deep/_wave2-synthesis.md`.

## 1. Ziel

Repo von „Solid, aber mit verifiziert ~14 NEUEN Kill-Bugs + fehlenden Pflicht-Dokumenten" auf **„GA-ready für zahlende DACH-B2B-Kunden auf eigener Domain"** heben — als echte SaaS-Plattform, bei der jeder Flow (Signup → Audit → Galaxie → Bezahlung → Verwaltung → Löschung) funktioniert, die Galaxie professionell + lesbar ist, das Repo schlank ist und alle Rechtstexte rechtssicher (AI-erstellt, DE+EN) vorliegen.

**Leitprinzip Geld/Domain (User-Entscheidung 2026-06-08):** Möglichst spät Geld ausgeben. Alles, was **ohne Domain/ohne Bezahlung** geht, kommt zuerst (Stripe **Test-Mode** komplett, Sentry-free, Upstash-free, Inngest-free, Legal-Content schreiben, gesamter Code). Der **allerletzte** Schritt ist: Domain kaufen → DNS/DKIM → Stripe-**Live**-KYC → Live-Keys flippen. Stripe-Integration (Bundle B) kommt damit klar **vor** der Domain — siehe §12.

**Konkret zu schließen (aus Launch-Verify-Audit):**
- 14 Kills (`_synthesis.md` Kill-Liste) — 2 übersehene Cross-Tenant-IDORs, 2 Stripe-`dahlia`-Shape-Bugs (Monats-Credits + Overage feuern nie), db-migrate-in-build, Galaxie-Kontrast-Inversion + 6px-Marker, undesignte Scan-Detail-Seite, fehlendes Impressum + Datenschutzerklärung + Email-Footer + Gmail-im-DPA, fehlende Member-Invite-Mail, GitHub-Audit-Timeout, tastatur-unzugängliche Galaxie.
- Plus ~30 Strong (Logout fehlt, Redirect-Loop, Stripe-nicht-gekündigt-bei-Delete, Settings-Ghost-Town, Toast-tot, Sentry/Env-Validator/Rate-Limit-Backend fehlen, Hot-Query-Indices fehlen, Email-Deliverability-Lücken, Galaxie-LOD/Labels/Spacing/a11y).
- Galaxie-Legibility-Rework (User-Top-Prio): Kontrast hoch, Marker/Spacing größer, professioneller — beide Galaxien.
- Repo-Cleanup: toter Code löschen, Deps entfernen, Docs/Context konsolidieren.

**Out-of-Scope** (eigene /plan-Cycles, post-launch): Cache-Components-`'use cache'`-Roll-Out (Performance-Strong, kein Kill), pgvector+Embeddings, Marketing-Launch-Material, Workspace-Hub-Polish-Phase-3, B2C-Cookie-Banner (DACH-B2B, 0 Analytics — verifiziert nicht nötig), automatisierte Test-Suites (User will vorerst keine neuen Tests schreiben — Verifikation manuell + Browser, s. §9).

## 2. User-Entscheidungen (Audit-Trail)

**Discovery Wave-1/2 (2026-06-05):**

| ID | Frage | Antwort |
|---|---|---|
| Q1 | Audit-Verhältnis zu 2026-05/Nova-3 | Fresh-Sweep + Diff |
| Q2 | Scope | Alle 5: Payment + Auth + Infra + Bugs + Frontend |
| Q3 | Output-Form | Master + Sub-Pläne pro Kill-Cluster |
| Q4 | Launch-Horizont | 4-6 Wochen bis zahlende Kunden |
| Q5 | Stripe-Status | Test-Mode-only, kein Live-Account |
| Q6 | Domain | NOCH NICHT registriert |
| Q7 | Markt/Legal | DACH-first, B2B |
| Q8 | Agent-Strategie | 12-15 Agents in Waves |

**Refresh-Discovery (2026-06-08, diese Session):**

| ID | Frage | Antwort |
|---|---|---|
| R1 | Verhältnis zu existierendem Master | **Bestehenden Master refreshen + erweitern** (keine Duplikat-Pläne) |
| R2 | Geld-/Sequenz-Strategie | **Stripe Test-Mode jetzt komplett, Domain + Live zuletzt** |
| R3 | Cleanup-Aggressivität | **Aggressiv: löschen + konsolidieren, alles per Git rückrollbar** |
| R4 | Galaxie-Scope | **Beide Galaxien, gezielter Legibility-/Kontrast-Pass** (kein Mechanik-Redesign) |
| R5 | Rechtsform | **Einzelunternehmer Deutschland** (§5 DDG, Kleinunternehmer/Regelbesteuerung) |
| R6 | Legal-Sprache | **Deutsch + Englisch** |
| R7 | Test-Env | Dev läuft lokal komplett (Neon + Magic-Link/Mailpit) |
| R8 | Verify-Flows | Alle 4: Auth · Billing · Core/Galaxie · Workspace |

## 3. Existing-Patterns im Repo (Vorbild)

- **Severity-Bänder** `{Kill, Strong, Mid, Weak, Exceptional}` (`packages/core/src/severity.ts`).
- **Master + Sub-Plan-Split** — Nova-3b Sub-A/B/C + Galaxie-Solar-Sub-A/B/C als Vorbild.
- **authz.ts Single-Source** (`apps/web/src/lib/authz.ts`) — Bundle A etablierte `userIsMember`/`requireRole`; alle neuen Gates ziehen daraus.
- **Stripe-Webhook-Idempotenz** — `stripe_event`-PK + `onConflictDoNothing` (verifiziert sauber) — Bundle B baut darauf.
- **Email-Sender soft-fail** (`packages/auth/src/emails/sender.ts`) — Webhook/Cron blockieren nie am Mailfehler; Bundle G behält das Pattern.
- **StaticGalaxieSVG ist a11y-Vorbild** (`StaticGalaxieSVG.tsx:289`) — tastaturzugängliche Sprites; Bundle I überträgt das Muster auf den Default-Pixi-Pfad bzw. den List-Fallback.
- **SEVERITY_HEX Single-Source** (`lib/galaxie/severity-colors.ts`) speist Pixi + SVG + Landing — Bundle I ändert die Palette an **einer** Stelle.

## 4. Alternativen, die wir bewusst NICHT wählen

- **Alt-A: Ein Mega-Plan** → Verworfen (Q3/R1) — 14 Kills × ~30-40 dev-days in einem `/execute` unrealistisch. Sub-Pläne erlauben fokussierten Block-Resolver.
- **Alt-B: ASAP-Launch mit Kill-Minimal-Cut** → Verworfen — Cross-Tenant-IDORs + Stripe-Geld-Bugs + fehlendes Impressum sind nicht „deferrable".
- **Alt-C: Domain zuerst (für finale Cookies/Webhooks)** → Verworfen (R2) — würde früh Geld binden; Test-Mode + relative report-Endpoints decken 90% ab.
- **Alt-D: Galaxie-Mechanik-Redesign** → Verworfen (R4) — Solar wurde gerade frisch geshippt; nur Legibility/Kontrast/Spacing tunen.
- **Alt-E: Vercel-KV für Rate-Limit** → Verworfen — Upstash-Redis-free (Marketplace) löst K10 ohne Paywall.
- **Alt-F: Cookie-Banner** → Verworfen (Q7, verifiziert 0 Analytics-SDK) — senkt B2B-Conversion, nicht Pflicht.
- **Alt-G: Neue automatisierte Test-Suites vor Launch** → Verworfen (User 2026-06-08) — Verifikation manuell + Browser; bestehende Tests bleiben grün.
- **Alt-H: AI-Gateway** → Bleibt verworfen (ADR-0005).

## 5. Endzustand (Acceptance-Kriterien)

**Sicherheit:** 0 client-erreichbare `"use server"`-Reads ohne Membership-Gate (K-A1 + pollPRStatus zu); Rate-Limit global durchgesetzt (Upstash); CSP enforced mit report-Endpoint.
**Payment (Test-Mode, end-to-end verifiziert):** Checkout → Webhook → Monats-Credit-Grant **feuert** (dahlia-Shape) → Reset-Datum korrekt; Auto-Overage UI→Action→Ledger(`reason=overage`)→Aggregator→Meter durchgängig; `tax_code` gesetzt; Abo wird bei Workspace/Account-Delete gekündigt; Credit-Pack-UI verdrahtet **oder** gelöscht.
**Core-Flows:** GitHub-Audit großer Repos läuft im Background (kein Timeout); Logout überall erreichbar; kein Redirect-Loop beim Workspace-Delete.
**Galaxie:** Kill ist die kontraststärkste/auffälligste Severity (CR≥7), Marker on-screen ≥12-16px, beide Galaxien lesbar + professionell, tastatur-/screenreader-zugänglich (List-Fallback + Inspector-Focus-Trap), Spacing aufgelöst (kein Sun-Overlap).
**Frontend:** Scan-Detail designed (PageShell/SiteNav/loading); Settings-Stubs hidden; Toasts auf allen Mutationen.
**Infra:** Sentry live (free); Env-Validator fail-fast; Migration aus Build raus; frozen-lockfile; Inngest signiert; Hot-Query-Indices + membership-unique migriert.
**Legal (rechtssicher DE+EN):** Impressum + Datenschutzerklärung + AGB-de + AVV-PDF + globaler Legal-Footer + Email-Impressum-Footer; keine Gmail/Broken-Doc-Links.
**Email:** Member-Invite, Invoice-Receipt, Credit-Low, List-Unsubscribe, Suppression-Table, Dunning-Cap, de-DE.
**Repo:** Toter Code + Deps entfernt; CLAUDE.md/changelog/README/vision/architecture aktuell; plans/ root nur aktive Bundles.
**Domain/Live (zuletzt):** Domain registriert + DNS/DKIM/SPF/DMARC; Stripe-Live-KYC + Live-Keys; `__Host-`-Cookie; Resend-Custom-Domain.

## 6. Schritte (Master-Sequenz — Launch-Verify-Refresh)

> Prinzip: 3 Waves. **Wave 1+2 sind 100% kostenlos & ohne Domain** (Code + Test-Mode + Legal-Content). **Wave 3 ist der einzige Geld-/Domain-Block** und kommt zuletzt.

### Phase 0 — Audit ✅ Done
- [x] 2026-05-deep (12 Agents) + Wave-1/2-Synthese
- [x] **2026-06-08 Launch-Verify (14 Agents)** → `docs/audits/2026-06-launch-verify/_synthesis.md`
- [x] Bundle A Phase 1-4 committet (`3ced93d`/`15b01b0`/`5ff3df0`/`e100457`)

### Wave 1 — Korrektheit, Sicherheit, Geld-Pfad (Code, kein Geld/Domain)

**Bundle A · Auth-Security FINISH (REOPENED, ~2-3 dd)** — `docs/plans/auth-security-hardening.md`
- K-A1: `customers.ts` getRepo/listRepos/addRepo gaten **oder** auf `server-only` (NEU — Kill, Phase-2 übersehen)
- pollPRStatus/pollPRStatusAction Session+Membership-Gate (NEU — Strong)
- K10: Rate-Limit auf **Upstash-Redis-free** (Better-Auth `secondary-storage` + `lib/rate-limit.ts`) — jetzt OHNE Vercel-KV-Paywall lösbar
- Phase 6: CSP report-Endpoint (an Sentry) → connect-src einengen → enforce-Flip
- (Phase 5 IDOR-Negative-Tests: User will keine Tests → manuelle Verifikation der 2 neuen Gates, s. §9)
- `__Host-`-Cookie → Wave 3 (domain-gekoppelt)

**Bundle B · Payment-Stripe-Correctness (~5-6 dd)** — `docs/plans/payment-fix-block.md`
- **Zuerst Test-Fixtures auf echten `2026-04-22.dahlia`-Shape** (rot machen), dann:
- K-PAY1: `invoice.parent.subscription_details.subscription` lesen → Monats-Grant feuert
- K-PAY2: `allowOverage` durchreichen + `reason='overage'`-Ledger-Zeile schreiben → Aggregator/Meter leben
- `current_period_end` aus `sub.items.data[0]`; `credit_ledger`-Unique-Index `(workspace_id,reason,reference_id)`; `tax_code: txcd_10000000` + `tax_behavior:exclusive`; `customer.deleted`-Handler; `billingBaseUrl()`-Precedence-Fix
- **Credit-Pack-UI entscheiden:** verdrahten (right-rail CreditMeter + BuyCreditPackModal) **oder** löschen → Bundle H
- Stripe-Abo bei Workspace/Account-Delete kündigen (`stripe.subscriptions.cancel`, soft-fail) — überlappt Bundle J/A
- AI-Markup-Meter: explizit GA-out-of-scope deklarieren **oder** flushen

**Bundle C · Production-Infra + DB-Hardening (~4-5 dd, alles free)** — `docs/plans/production-infra-bootstrap.md`
- Sentry-free (`@sentry/nextjs` + instrumentation) + Webhook-`captureException`
- Env-Schema-Validator (zod, fail-fast beim Boot, aus `.env.example` abgeleitet)
- K-DB1: Migration aus `vercel.json` buildCommand → CI-Release-Step / `VERCEL_ENV`-Guard
- `0016_hot_query_indices.sql` (scan/repo/session/account/install_request/workspace.owner_id) + `0017_membership_pending_unique.sql`
- `--frozen-lockfile=true`; Inngest-Route `runtime=nodejs` + signingKey-Enforce; vercel.json `regions`/`functions`; Retention-Cron (event 7d / webhook_event 30d); Schema-Snapshot-Drift schließen (`db:generate`)
- Upstash-Redis-free provisionieren (für Bundle A Rate-Limit) — **User-Action: Marketplace-Klick**

**Bundle J · Core-Flow-Fixes (NEU, ~3-4 dd)** — `docs/plans/core-flow-fixes.md` *(zu schreiben)*
- K-FLOW1: GitHub-Audit Background-Threshold + `maxDuration`
- Logout-Button + Account-Menü (SiteNav/Galaxie-HUD, `auth.api.signOut`-Action)
- Workspace-Delete Redirect-Loop + stale-Cookie-Clear + Empty-State statt `/login`-Redirect
- `requestSolution` async (pending-Row + Inngest) **oder** ehrlich-blockierend mit Timeout-Guard
- `runForegroundAudit`: Credits atomar VOR LLM-Call reservieren (TOCTOU)
- Invite/Revoke `router.refresh` + Invite/Revoke-UI nach settings/members ziehen; `cookieStore.set` aus Render raus

### Wave 2 — Politur, Galaxie, Cleanup, Email (Code, kein Geld/Domain)

**Bundle D · Frontend-Pre-GA-Polish (~3-4 dd)** — `docs/plans/frontend-pre-ga-polish.md`
- K-FE1: Scan-Detail in SiteNav+PageShell+PageHeader+`loading.tsx`
- Settings-Ghost-Town hinter Feature-Flag / aus Nav; Toast-System auf alle Mutationen verdrahten
- Heading-Pattern vereinheitlichen (`SettingsPageHeader`-Primitive); Touch-Targets; pricing-SiteNav-Fix
- Kleine a11y aus Dim 14: SessionList `confirm()`→AlertDialog, Delete-Forms `aria-describedby`

**Bundle I · Galaxie-Legibility-Rework (NEU, ~5-6 dd — User-Top-Prio)** — `docs/plans/galaxie-legibility-rework.md` *(zu schreiben)*
- **Palette** (`severity-colors.ts`, eine Stelle → Pixi+SVG+Landing): Kill `#c64a3a→#e8503f/#f4604e` (CR≥7, Salienz-Inversion fixen); Mid/Exceptional aus dem Grau (Chroma geben); Galaxie-Kill an CSS `--sev-kill` angleichen; Glow 6→8px
- **Marker-Größe**: Kill-spezifisch Disc 5→8/Icon 6→11, edge-badge 12→16 @ DPR3; **counter-scale-LOD** gegen Kamera-Zoom (Marker screen-min ~12px, Orbit-Stroke screen-konstant); Landing Badge-Disc 11→16 + Icon-Ratio
- **Spacing**: `SUN_ORBIT_IN_CLUSTER 220→300`, `CUSTOMER_CLUSTER_RADIUS 600→750` (Sun-Overlap auflösen); Badge `*mobileScale`
- **Lesbarkeit**: persistente Sun-Labels ab `scale≥1.2`; Landing-Labels 16→20/20→24/24→28 + Ancestor-Opacity 0.32→0.5; weiße-Icon-auf-hellem-Disc-Kontrast (dunkles Icon pro Band)
- **a11y** (Dim 14): K-A11Y1 Desktop-List-Fallback (SolarListView-Toggle) ODER fokussierbare Findings-Liste; Inspector→Radix-Sheet (Focus-Trap/Restore); `#main-content` auf Galaxie-Seite; `text-white/40→/58`
- **Acceptance: Browser-Verifikation (Playwright)** Desktop+Mobile, beide Galaxien, frische Session

**Bundle H · Repo-Cleanup + Doc-Konsolidierung (NEU, ~2 dd)** — `docs/plans/cleanup-and-doc-consolidation.md` *(zu schreiben)*
- Dead-Code löschen (12 sichere Files, s. `_synthesis.md` Dim 4) + 9 Deps; Export-Sichtbarkeit
- Doc-Updates: CLAUDE.md Aktive-Phase, changelog, README/vision-Galaxie-Metapher, architecture-Cache-Claim
- Plan-Archivierung (production-live-connect-stub + 3 Nova-2-Sub-Pläne → done/); 7 verwaiste 2026-05-Audit-Drafts löschen
- **Reihenfolge: NACH Bundle B** (Credit-Pack-UI-Entscheidung muss erst fallen, sonst löscht Cleanup evtl. zu verdrahtende Komponenten). Jeder Lösch-Schritt eigener Commit.

**Bundle G · Email-Deliverability (~3-4 dd, Build now / Send verifiziert via Mailpit)** — `docs/plans/email-deliverability.md`
- K-EM1: MemberInviteEmail + Trigger in `inviteAdmin`
- `<EmailFooter>` (Impressum/USt-ID/Links) in alle Templates (= K-LEG3, mit Bundle F koordiniert)
- List-Unsubscribe (RFC 8058) + `/api/email/unsubscribe`; Suppression-Table (Migration in Bundle C) + Resend-Webhook + Pre-Send-Check; Dunning-Cap (≤3); de-DE Locale; Invoice-Paid-Receipt + Credit-Low-Cron; 30/7-Tage-Pack-Varianten real
- Echter Send an Kunden braucht Resend-Custom-Domain → Wave 3; bis dahin Mailpit-Verifikation

### Wave 3 — Geld + Domain (LETZTER Block)

**Bundle F-Content · Legal-Texte (AI-erstellt DE+EN — kann SCHON in Wave 2 geschrieben werden)** — `docs/plans/legal-dsgvo-pre-ga.md`
- Impressum, Datenschutzerklärung, AGB-de, AVV-PDF, OSS-Notices (Pflichtinhalte in `_synthesis.md` Dim 9) — **Content jetzt schreiben**, nur domaingebundene Adressen/Deployment in Wave 3
- Code: `/legal/impressum` + `/legal/datenschutz` (+`/privacy`-Alias) Routen, globaler `<LegalFooter>`, Gmail→Domain-Adresse, Subprozessor-Single-Source, trust-broken-docs fixen

**Bundle F-Domain + C-Domain + E · Domain + Stripe-Live (Geld/KYC, ZULETZT)** — `docs/plans/stripe-live-mode-bootstrap.md` + `production-infra-bootstrap.md`
- **User-Action (out-of-band, früh anstoßen wg. Wartezeit):** Stripe-Live-KYC (1-2 Wo), Domain-Entscheidung
- Domain registrieren → 7 DNS-Records (A/www/MX/DKIM/SPF/DMARC/Stripe-Verify) → Resend-Domain-Verify
- `__Host-`-Cookie-Prefix; Stripe-Live-Bootstrap (`pnpm stripe:setup-live`) + 14 Env-Vars Test→Live; Live-Webhook-Secret; Customer-Portal-Branding
- Pre-Launch-Verify-Checkliste (`docs/operations/pre-launch-checklist.md`)

## 7. Files-to-Change

Pro Bundle im jeweiligen Sub-Plan. **10 Sub-Pläne:**
- `auth-security-hardening.md` (A, existiert — reopen) · `payment-fix-block.md` (B) · `production-infra-bootstrap.md` (C) · `frontend-pre-ga-polish.md` (D) · `stripe-live-mode-bootstrap.md` (E) · `legal-dsgvo-pre-ga.md` (F) · `email-deliverability.md` (G)
- **NEU zu schreiben:** `cleanup-and-doc-consolidation.md` (H) · `galaxie-legibility-rework.md` (I) · `core-flow-fixes.md` (J)

## 8. DB-Migrationen

- `0016_hot_query_indices.sql` (Bundle C): scan(workspace_id,created_at DESC), scan(repo_id), repo(workspace_id), session(user_id), account(user_id), install_request(workspace_id,requested_at DESC), workspace(owner_id)
- `0017_membership_pending_unique.sql` (Bundle C): `UNIQUE … ON membership(workspace_id, lower(invited_email)) WHERE status='pending' AND user_id IS NULL`
- `0018_credit_ledger_idempotency.sql` (Bundle B): `UNIQUE … (workspace_id, reason, reference_id) WHERE reference_id IS NOT NULL`
- `0019_email_suppression.sql` (Bundle C, von G genutzt): email_suppression(email, reason, bounce_type, created_at) + `user.opted_out_marketing`
- Schema-Snapshot-Drift schließen: `schema.ts:707` `.desc()` + `pnpm db:generate` (meta 0012-0015)
- (Migration 0016 aus altem Plan-§8 entfällt — PII-Spalten waren schon nullable, Bundle A nutzte direkten SET-NULL-Scrub.)

## 9. Verifikations-Plan (KEINE neuen Test-Suites — User-Entscheidung 2026-06-08)

Statt automatisierter Tests: **manuelle + Browser-Verifikation** pro Bundle. Bestehende Tests bleiben grün (`pnpm test`).
- **Bundle A**: manuell — die 2 neuen Gates (customers/pollPRStatus) mit zweitem Workspace gegen-prüfen.
- **Bundle B**: `stripe trigger` Test-Mode-Events (echter `invoice.paid`-Shape) → Monats-Grant + Reset + Overage-Ledger sichtbar; Stripe-CLI-Webhook-Forward.
- **Bundle I**: Playwright Desktop+Mobile, beide Galaxien — Kill-Marker sichtbar/groß, Kontrast geprüft (axe optional), kein Sun-Overlap.
- **Bundle D/J**: Browser-Durchklick der 4 Flows (Signup→Audit→Galaxie→Checkout-TestMode→Workspace→Delete).
- Bestehende Stripe-Webhook-Tests **müssen** auf den echten `dahlia`-Shape umgestellt werden (sonst maskieren sie die Kills) — das ist Fixture-Korrektur, kein neuer Test.

## 10. Risiken

| Risiko | W'keit | Impact | Mitigation |
|--------|--------|--------|------------|
| Stripe-`dahlia`-Shape-Fix bricht weitere Stellen | Mid | Test-Update | Erst Fixtures auf echten Shape, dann Handler |
| Galaxie-Counter-Scale-LOD bricht GSAP-Tweens/Performance | Mid | Visual-Regression | Inkrementell + Browser-Check je Schritt; Reduced-Motion-Pfad separat |
| Cleanup löscht zu verdrahtende Credit-Pack-UI | Mid | Feature-Verlust | Bundle H **nach** Bundle-B-Entscheidung; git-rückrollbar |
| Stripe-Live-KYC > 2 Wochen | Mid | Launch-Verzug | KYC sofort starten (Wave-1-parallel, out-of-band) |
| Upstash-Marketplace-Provision vergessen | Low | Rate-Limit bleibt in-memory | Bundle-A-Pre-Flight prüft Redis-Env |
| DKIM-Propagation 48h | Low | 1 Tag | Buffer |

## 11. Out-of-Scope (post-launch, eigene Pläne)

Cache-Components-`'use cache'`-Roll-Out · pgvector+Embeddings · Marketing-Launch · Workspace-Hub-Polish-Phase-3 · B2C-Cookie-Banner · neue automatisierte Test-Suites · MiniMap-Solar-Migration (Legacy-Layout-Debt) · AI-Markup-Billing (falls als out-of-scope deklariert).

## 12. Rollout + die Stripe-vor-Domain-Frage (User-Anfrage)

**Antwort: Ja, Stripe vor der Domain — und genau in dieser Reihenfolge:**
1. **Jetzt (Wave 1):** Stripe **Test-Mode** komplett bauen + verifizieren (Bundle B). Kostet **0 €**, braucht **keine** Domain/KYC. Voller Flow Checkout→Webhook→Credits→Overage→Tax via `stripe trigger`/Test-Cards durchspielbar.
2. **Wave 1-2 parallel (out-of-band):** Stripe-**Live**-KYC beantragen (1-2 Wo Wartezeit — deshalb früh anstoßen, obwohl der Code-Flip zuletzt kommt).
3. **Wave 3 (zuletzt):** Domain kaufen → DNS/DKIM → Stripe-Live-Keys flippen → erster echter zahlender Kunde. Hier fließt erstmals Geld (Domain ~10-20 €/Jahr; Stripe nimmt nur %-Gebühr pro echter Transaktion — kein Vorab-Fixum).

So gibst du **erst beim allerletzten Schritt** Geld aus, hast aber bis dahin alles verifiziert. Sequenz der `/execute`: A → B → C → J (Wave 1) → D → I → H → G + F-Content (Wave 2) → F-Domain + E + Domain-Kauf (Wave 3). Nach jedem Bundle `git mv` Sub-Plan → `done/production-launch-readiness/`.

**Soft-Launch:** Domain live + alle Bundles grün → 3-5 Friends auf Live-Mode (echte Karten, 100% Refund nach 7 Tagen) → bei 0 Critical-Sentry-Alerts public.

## 13. Offen (in Bundle-Pre-Flights zu klären)

- Credit-Pack-UI: verdrahten vs löschen (Bundle B entscheidet — beeinflusst Bundle H).
- AI-Markup-Billing: GA-Scope oder out-of-scope?
- Domain-Name + TLD (.app/.de/.io) — User-Entscheidung vor Wave 3.
- Settings-Stubs: welche shippen vs hide (Bundle D)?
- Observability: Sentry-free reicht für GA (Default) vs später Axiom/PostHog?

---

End of Master. Sub-Pläne H/I/J werden als Skelette geschrieben; A-G existieren und werden im jeweiligen Pre-Flight gegen `_synthesis.md` refresht.
