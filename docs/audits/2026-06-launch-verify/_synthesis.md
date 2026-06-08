# Launch-Verify Deep-Audit — Synthese (2026-06-08)

> 14 parallele Sub-Agenten (Workflow `launch-readiness-deep-audit`, 1,1 Mio Tokens, 374 Tool-Calls).
> Zweck: Re-Verifikation des Ist-Codes nach Bundle A (4/6) + GA-Readiness-Gap-Analyse für den
> Production-Launch-Readiness-Master-Refresh. Ergänzt — **ersetzt nicht** — `docs/audits/2026-05-deep/`.
> Severity-Bänder: **Kill** (blockt Launch/Sicherheit/Geld) · **Strong** (wichtig vor GA) · **Mid** · **Weak**.

## Kill-Liste (konsolidiert, 14 distinct)

| # | Dimension | Finding | File:Line | Fix-Aufwand |
|---|-----------|---------|-----------|-------------|
| K-A1 | Auth | `customers.ts` getRepo/listRepos/addRepo sind ungated `"use server"`-Actions → Cross-Tenant-IDOR (gleiche Klasse wie Bundle-A-Phase-2, aber übersehen) | `customers.ts:1,42,96,176` | 0.25 |
| K-PAY1 | Payment | `invoice.paid` liest `invoice.subscription` — in Stripe-API `2026-04-22.dahlia` **entfernt** → Monats-Credit-Grant feuert **NIE** | `api/stripe/webhook/route.ts:336` | 0.5 |
| K-PAY2 | Payment | Auto-Overage komplett tot: `allowOverage` nie durchgereicht + **keine** `reason='overage'`-Ledger-Zeile → Aggregator/Meter-Flush verarbeiten nichts | `audit-action.ts:352`, `credits.ts:203`, `credit-aggregator.ts:56` | 2 |
| K-DB1 | DB | DB-Migration läuft **im Vercel-buildCommand** (db-migrate-in-build, kein Advisory-Lock, Preview-Builds migrieren Prod-DB) | `vercel.json:5`, `migrate.ts:17` | 1 |
| K-GS1 | Galaxie-Solar | **Kill-Severity hat den schwächsten BG-Kontrast** aller Bänder (CR 4.19 vs Strong 8.75 / Mid 7.79) — Salienz invertiert zur „nur Kill schreit"-Absicht | `severity-colors.ts:18` | 0.5 |
| K-GS2 | Galaxie-Solar | Kill-Marker-Icon **6px** (Default) / **2.7px** (Overview) — „Ausrufezeichen zu klein", als Warn-Signal unbrauchbar | `severity-icons.ts:42-43`, `FolderPlanet.ts:146` | 1.5 |
| K-FE1 | Frontend | Scan-Detail-Seite (Funnel-Ende nach Magic-Link!) komplett **undesigned** — rohes HTML, kein PageShell/SiteNav/loading | `[workspace]/scans/[id]/page.tsx:53` | 0.5 |
| K-LEG1 | Legal | **Impressum (§5 DDG/TMG) existiert nicht** — sofort abmahnfähig | `app/legal/` (fehlt) | 0.5 |
| K-LEG2 | Legal | **Datenschutzerklärung (Art. 13 DSGVO) existiert nicht** | `app/legal/` (fehlt) | 0.75 |
| K-LEG3 | Legal | Transaktionale Emails ohne Impressum-Pflichtangaben (§5 DDG Geschäftsmail) | `packages/auth/src/emails/*.tsx` | 0.5 |
| K-LEG4 | Legal | Persönliche **Gmail-Adresse** (`kol.schoepe@gmail.com`) im öffentlichen DPA-Lösch-Flow | `trust/dpa/page.tsx:111` | 0.1 |
| K-EM1 | Email | **Member-Invite verschickt nie eine Email** — Team-Onboarding still kaputt; UI verspricht fälschlich eine Mail | `membership.ts:61`, `AccessForms.tsx:30` | 0.5 |
| K-FLOW1 | Flows | GitHub-URL-Audit (Haupt-Produktiv-Pfad) ignoriert `BACKGROUND_THRESHOLD` → blockt synchron inkl. LLM → **Serverless-Timeout** bei jedem realen Repo | `audit-action.ts:226` | 1 |
| K-A11Y1 | a11y | PixiJS-Galaxie **komplett tastatur-unzugänglich** (WCAG 2.1.1 A) — Kern-Workspace nur per Maus | `GalaxieScene.tsx:866`, `[workspace]/page.tsx:46` | 2.5 |

> K-PAY1 == K-FLOW1's „stripe-monthly-credits-never-granted" (gleicher Bug, zwei Agenten). K-LEG3 == K-EM1's „no-impressum-footer".

---

## Dimension 1 — Auth & Cross-Tenant-Security (RE-VERIFY)

**Health:** Bundle A landete **großteils sauber**: `authz.ts` ist echte Single-Source (0 `userIsMember`-Duplikate, alle Importer umgestellt), die 13 Phase-2-IDORs (K1-K6, K11-K13) sind verifiziert membership-gated, Account/Session/Workspace-Delete + PII-Scrub IDOR-safe. **ABER** die Erfolgsmetrik „0 Cross-Tenant-Read ohne Gate" ist NICHT erfüllt.

- **K-A1 (Kill)** — `getRepo/listRepos/addRepo` (`customers.ts`) ungated; einzige Prüfung `row.workspaceId !== workspaceId` beweist nur Repo-Zugehörigkeit, nicht Membership. `addRepo` nimmt `userId` als Client-Param (`void userId`). Fix: `getSessionUser` + `userIsMember` als erstes Statement, **oder** auf `server-only` umstellen (sauberster Cut, analog `solution-dal.ts`).
- **Strong** — `pollPRStatus`/`pollPRStatusAction` ohne Session+Membership-Gate (`apply-dal.ts:363`, `apply-actions.ts:47`); einzige Action ohne Session-Guard.
- **Strong** — Rate-Limiter (Better-Auth + `audit-action`) ist **in-memory Map** → auf Fluid Compute pro-Instanz, Magic-Link-3/10min + anonymer 30/h-Audit-Limit um Faktor N umgehbar. **K10 ist jetzt OHNE Vercel-KV-Paywall lösbar: Upstash-Redis-free (Marketplace).**
- **Strong** — Phase 5 (Per-Action-IDOR-Negative-Tests) + Phase 6 (CSP-Enforce-Flip) fehlen → genau deshalb blieb K-A1 unentdeckt.
- **Mid** — `__Host-`-Cookie-Prefix deferred (domain-gekoppelt, akzeptabel bis Domain).
- **Weak** — `deleteWorkspace` via `requireRole` sperrt Legacy-Owner-ohne-membership-Row aus (fail-closed, kein Security-Loch).

## Dimension 2 — Payment & Stripe End-to-End (Bundle B)

**Health:** **NICHT** end-to-end test-mode-ready. Webhook-Idempotenz + Checkout solide, aber der Code konsumiert die `2026-04-22.dahlia`-API mit dem **alten Objekt-Shape**.

- **K-PAY1 (Kill)** — `invoice.subscription` existiert nicht mehr (→ `invoice.parent.subscription_details.subscription`). Guard `if (!stringOrNull(invoice.subscription)) return` returnt immer früh → Monats-Grant + Counter-Reset feuern nie. `route.ts:336`.
- **K-PAY2 (Kill)** — Auto-Overage tot (s.o.).
- **Strong** — `current_period_end` immer null (Feld → `sub.items.data[0].current_period_end`); Billing-Page zeigt leeres Reset-Datum. `route.ts:461`.
- **Strong** — `credit_ledger` ohne Unique-Constraint `(workspace_id,reason,reference_id)` → Monthly-Grant nur durch `stripe_event`-PK geschützt. `schema.ts:691`.
- **Strong** — **Kein `tax_code`** auf Product/Prices → `automatic_tax` rechnet unbestimmt; im Live-Mode blockiert das den Checkout. Fix: `tax_code: txcd_10000000` + `tax_behavior: exclusive`. `stripe-test-setup.ts:118`.
- **Strong** — Integration-Tests mocken **veralteten** Invoice-Shape (`subscription: id` top-level) → maskieren die Kills grün. Reihenfolge: erst Fixtures auf echten Shape (rot), dann Handler fixen (grün).
- **Mid** — kein `customer.deleted`-Handler (`route.ts:119`); **Mid** AI-Markup-Meter wired-but-never-flushed (`markupMicrocents:0` hart); **Mid** `billingBaseUrl()` Operator-Precedence-Bug (`??` vs `?:`) → ignoriert `NEXT_PUBLIC_APP_URL` / `https://undefined/...`. `stripe.ts:110`.

**VERIFIED-OK:** Webhook-Event-Idempotenz (`stripe_event`-PK + `onConflictDoNothing`), API-Version-Pin konsistent, raw-body+`constructEvent`+`runtime=nodejs`, Pre-Paid-Pack-Idempotenz (`stripeInvoiceId.unique()`), `consumeCredits` mit `SELECT FOR UPDATE`.

## Dimension 3 — DB / Drizzle-Schema / Migrationen

- **K-DB1 (Kill)** — db-migrate-in-build (s.o.). Fix: in CI-Release-Step (`ci.yml:97` hat ihn schon) oder `VERCEL_ENV==='production'`-Guard.
- **Strong** — **Hot-Query-Indices fehlen flächendeckend**: `scan.workspace_id`, `scan.repo_id`, `repo.workspace_id`, `session.user_id`, `account.user_id` (Better-Auth liest pro Request!), `install_request.workspace_id`, `workspace.owner_id` → Full-Table-Scans ab dem 2. Workspace. → Migration `0016_hot_query_indices.sql`.
- **Strong** — Keine UNIQUE-Constraint für pending Invites: `(workspace_id, user_id)` mit nullable `user_id` → NULL-bypass; `membership.ts:113` ist SELECT-then-INSERT (TOCTOU-Race) → bricht `claimPendingMemberships` mitten in der Schleife. → Partial-Unique-Index `WHERE status='pending' AND user_id IS NULL`.
- **Mid** — Schema-Drift: `credit_ledger`-Index DESC (Migration) vs ASC (`schema.ts:707`); meta-Snapshots 0012-0015 fehlen → nächster `db:generate` produziert destruktive Statements. **Mid** `event` + `webhook_event` wachsen unbegrenzt (Retention versprochen, kein Cron).
- **Weak** — `schema.ts:74` behauptet PII-Scrub sei „V2" (ist seit Bundle A implementiert — Doku-Drift). **Weak** Connection-Pool max=10 — Neon-Pooled-URL verifizieren.

**FK-onDelete-Audit (Bundle A, Stand 0015):** SET NULL + nullable korrekt auf allen Audit-Trail-Spalten; CASCADE korrekt auf session/account/membership/*.workspace_id. 5 ALTER-Statements matchen `schema.ts` 1:1, `pii-scrub.ts` + sole-owner-guard sauber.

## Dimension 4 — Dead-Code & Cleanup

**Health:** Git-hygienisch sauber (keine getrackten dist/.next-Artefakte; Root-PNGs + `.playwright-mcp/` via `.gitignore`). Ein hartes Dead-Code-Cluster + ungenutzte Primitives/Deps.

**SICHER LÖSCHBAR (0 Importer, verifiziert — alle git-rückrollbar):**
- shadcn: `ui/avatar.tsx`, `ui/dropdown-menu.tsx`, `ui/popover.tsx`, `ui/scroll-area.tsx`, `ui/alert-dialog.tsx`, `ui/sheet.tsx`, `ui/sidebar.tsx` + `hooks/use-mobile.ts` + `landing/GalaxieSettingsPopover.tsx`
- `settings/ApiKeyModal.tsx`, `settings/DangerConfirm.tsx`, `lib/landing/demo-finding.ts`

**ENTSCHEIDUNG NÖTIG (geshipptes-aber-totes Billing-UI):** `BuyCreditPackModal.tsx`, `CreditMeter.tsx`, `IntensitySelector.tsx`, `lib/cost-estimator.ts` + `billing-actions.ts` createCheckout/Portal/PrepaidPackCheckout (0 Aufrufer). → **Verdrahten** (Doc-Comment nennt „workspace-layout right-rail CreditMeter") **oder löschen**. Billing-Conversion-relevant → wahrscheinlich Bundle-B-Task, kein Cleanup.

**DEPS ENTFERNEN:** `apps/web`: d3-selection, d3-zoom, @types/d3-*, gray-matter. `root`: lint-staged, @mswjs/data, @eslint/eslintrc, @next/eslint-plugin-next.

**KNIP-FALSE-POSITIVES — NICHT löschen:** `ui/command.tsx`+`input-group.tsx`+`textarea.tsx` (Chain via UniversalSearch live), `scripts/anonymize.ts`, `scripts/check-billing-migration-safety.ts`, `examples/sample-*`.

**EXPORT-SICHTBARKEIT (kein Delete):** `health-check.ts` probe*-Einzelfns un-exportieren (nur `probeAll`), `dispatch.ts:29` AccessDeniedError-Duplikat-Re-Export weg, `galaxie/types.ts` LayoutLevel→lokal.

**LEGACY-DEBT (Ticket, nicht löschbar):** `lib/galaxie/layout.ts computeLayout` + 3 `@deprecated` Types noch live in `GalaxieScene→MiniMap` — erst nach MiniMap-Solar-Migration entfernbar.

## Dimension 5 — Docs- & Context-Konsolidierung

**KONSOLIDIERUNGS-PLAN (Datei → Aktion):**

*UPDATE:* `.claude/CLAUDE.md:9-11,38` (Aktive Phase Nova-3a→Production-Launch-Readiness; Cache-Components→post-launch) · `docs/changelog.md` (Top-Block für laufende Phase, Nova-3a ✅) · `README.md:8,11` + `vision.md:51-67` (Galaxie-Metapher invertiert: Repo=Sonne, nicht Customer=Sonne; toter `roadmap/phase-galaxie.md`-Link) · `architecture.md:101` (Cache-Components als „geplant, 0 Directives").

*ARCHIVE (git mv → done/):* `production-live-connect-stub.md` (superseded by Bundle C+E) · `nova-2-live-audit-flow.md` + `nova-2-a11y-deep-sweep.md` (→ Backlog post-launch) · `nova-2-settings-backend.md` (erledigte Danger/Sessions/Delete-Sections raus — Bundle A done; Rest behalten).

*DELETE (git rm — verwaiste Pre-Numbering-Drafts; nur `01-*..12-*.md` sind kanonisch per `_synthesis.md:5`):* `docs/audits/2026-05/`: context-files.md, dead-code-apps-web.md, tests-eval-ci.md, adr-vs-code.md, packages-health.md, tech-stack-drift.md, workflow.md (settings-backend.md VORHER prüfen — in nova-2-settings-backend.md zitiert).

## Dimension 6 — Galaxie Landing-Hero (SVG+motion)

**Skalen-Mathe:** viewBox 1100 Units → ~600-700px Pane → **~0.55-0.6 px/Unit** @ Root. Badge-Icon rendert ~8px, Folder-Labels ~9px, Discs ~13px.

- **Strong** — Weiße Severity-Icons auf hellen Discs: **CR 1.9-2.5:1** (WCAG AA fail). Fix: Icon-Farbe pro Band an Disc-Lightness koppeln (dunkles Icon `oklch 0.18` auf Strong/Mid/Exceptional/Weak, weiß nur auf Kill). `Sphere.tsx:54,369`.
- **Strong** — Badge-Icon ~8px @ Root (kein min-px-Floor). Fix: `BADGE_DISC_RADIUS 11→16`, `BADGE_ICON_RATIO 1.3→1.4` + **counter-scale gegen Kamera-Zoom** (px-konstant, POI-Verhalten), Ziel Icon ≥16px / Disc ≥24px on-screen. `Sphere.tsx:52-53,326`.
- **Mid** — Folder-Labels ~9px @ Root + Ancestor-Opacity 0.32. Fix: folder 16→20, repo 20→24, workspace 24→28; Ancestor 0.32→0.5.
- **Mid** — Mid/Exceptional als Grautöne (`#9aa3b3` chroma 0.02, `#acacac` chroma 0) → Finding liest sich nicht als Finding. Fix: leichte Chroma geben (Mid `#b88a52`, Exceptional Indigo `#8a82e0`).
- **Weak** — Kill `#c64a3a` + weißes Icon nur ~3.2:1; **Galaxie-Kill `#c64a3a` ≠ CSS `--sev-kill oklch(0.62 0.24 25)`** (Hero zeigt zwei Kill-Rottöne). Fix: angleichen, Kill auf `oklch(0.50) ≈ #a83a2c`.

## Dimension 7 — Galaxie Workspace-Solar (PixiJS)

**WCAG vs BG `#0a0a0a` (load-bearing):** Kill `#c64a3a` = **CR 4.19** (zu niedrig!), Weak 6.98, Mid 7.79, Strong 8.75, Exceptional 8.72. **Inter-Band (nackte Fills): Strong vs Exceptional = CR 1.00 (identisch!)**, Mid↔Strong 1.12.

- **K-GS1 (Kill)** — Salienz-Inversion (s.o.). Fix: Kill `#c64a3a → #e8503f` (CR~5.6) oder `#f4604e` (CR~7); Glow 6→8px, outerStrength 1.4→1.8. `severity-colors.ts:18`.
- **K-GS2 (Kill)** — Kill-Icon 6px/2.7px (s.o.). Fix: Kill-spezifisch `KILL_BADGE_DISC=8/ICON=11` (andere Bänder 5/6), `edge-badge ICON_SIZE 12→16 @ DPR3`, Badge-Container counter-scale `clamp` → Kill-Marker screen-min ~12px.
- **Strong** — Badge-Geometrie ignoriert `mobileScale` (Planet 1.8× größer, Badge konstant → Marker proportional kleiner genau auf Touch). `FolderPlanet.ts:134-154`.
- **Strong** — **Kein zoom-LOD**: alle Radien/Strokes world-space-konstant → Orbit-Stroke 0.23px @ Overview (sub-pixel), File-Planet 3.6px @ Overview. Fix: counter-scale-Layer für Badge/Stroke. `GalaxieScene.tsx:912`, `orbits.ts:24`.
- **Mid** — Mid/Strong/Exceptional ununterscheidbar (s.o.); **Mid** keine persistenten Labels → Overview = 15 unbeschriftete graue Scheiben (Sun-Hover triggert nicht mal Tooltip). Fix: Sun-Labels (nur Repo-Name) ab `scale≥1.2` persistent (counter-scale, 11px). **Mid** Sun-Overlap aus Plan-Risiko nie aufgelöst: `SUN_ORBIT_IN_CLUSTER=220` < 260px Reach → File-Orbits benachbarter Suns überlappen. Fix: `220→300`, `CUSTOMER_CLUSTER_RADIUS 600→750`.
- **Weak** — Dismissed-Fill `#4d4d4d` CR 2.34 + alpha 0.2 → unsichtbar.

**Layout-Konstanten heute** (`solar-layout.ts`): CUSTOMER_CLUSTER_RADIUS 600, SUN_ORBIT_IN_CLUSTER 220, FOLDER_ORBITS [60,95], FILE_ORBIT 130, SUN_RADIUS 28, FOLDER 8, FILE 4.

## Dimension 8 — Frontend-Polish (Bundle D)

**Health:** Design-System (shadcn + ui-vk) sauber, Split eingehalten. Polish ungleich verteilt.

- **K-FE1 (Kill)** — Scan-Detail undesigned (s.o.) — Funnel-Ende des Magic-Link-Audit-Flows (`dashboard/page.tsx:58` redirectet dorthin).
- **Strong** — `scans/[id]/loading.tsx` fehlt → harter Blank/CLS; `scans/loading.tsx` baut Skeleton ad-hoc statt `PageSkeleton`.
- **Strong** — **Settings-Ghost-Town**: 9/11 Routen sind verlinkte „Coming soon"-Stubs mit disabled-Buttons (general/galaxie/audit-apply/api-keys/webhooks/notifications + account connections/notifications). Wirkt wie halbfertige Baustelle. Fix: hinter Feature-Flag/aus Nav nehmen.
- **Strong** — **Toast-System tot**: Toaster gemountet, **0 `toast()`-Calls** im ganzen Repo → Mutationen ohne Feedback; `dashboard/page.tsx:62` „we lose the error".
- **Mid** — `ApiKeyModal` (185 LOC fertig) verwaist; Heading-Split (`type-h1` vs `text-2xl font-bold`); Button/Input `h-8` unter eigener Spec (32/36/40px) UND unter 44px-Touch-Target.
- **Weak** — `pricing/page.tsx:69` SiteNav innerhalb `<main>`.

## Dimension 9 — Legal / DSGVO (Einzelunternehmer DE, DE+EN, KEIN Anwalt)

**Bundle-A-Korrektur:** GDPR Art. 17 (Account-Delete) war im 2026-05-Audit Kill → seit 2026-06-08 **erledigt** (Hard-Delete + PII-Scrub + Session-Revoke + Sole-Owner-Block). Kein Kill mehr.

- **K-LEG1 (Kill)** Impressum fehlt · **K-LEG2 (Kill)** Datenschutzerklärung fehlt · **K-LEG3 (Kill)** Email-Impressum-Footer fehlt · **K-LEG4 (Kill)** persönliche Gmail in `trust/dpa/page.tsx:111`.
- **Strong** — Zwei divergente Subprozessoren-Quellen (`lib/sub-processors.ts` vs `legal/subprocessors/page.tsx`, GitHub fehlt); `/trust` + `/trust/dpa` preisen **5 nicht-existente** `docs/legal/*.md` (öffentlicher Broken-State); kein globaler Legal-Footer (Pflichtseiten nicht 2-Klick-erreichbar); AGB+DPA nur Englisch + ungeprüft, DACH-B2B-Standardklauseln fehlen.
- **Mid** — AVV kein PDF-Download; Cookie-Banner zu Recht nicht nötig (0 Analytics-SDK) **aber** Cookie-Tabelle in DSE Pflicht. **Weak** `applyVat` USD/EUR-Variablennamen + Rundung.

**ZU ERSTELLENDE DOKUMENTE (DE+EN):** Impressum (§5 DDG Einzelunternehmer: Name, ladungsfähige Anschrift, Email + 2. Kontaktweg, USt-IdNr sobald vorhanden, §36 VSBG-Satz) · Datenschutzerklärung (Art.-6-Rechtsgrundlage je Datenkategorie, Subprozessoren, USA-Drittlandtransfer SCC+DPF+TIA, Retention 10J §147 AO / 12 Mon Audit, Betroffenenrechte, Aufsichtsbehörde, Cookie-Tabelle, „kein DPO <250 MA") · AGB-DE bilingual (+ §288 BGB, Kardinalpflichten, Gerichtsstand, LLM-Disclaimer) · AVV-PDF · OSS-Notices. **KEIN Cookie-Banner** (B2B, 0 Analytics — korrekt out-of-scope).

## Dimension 10 — Email & Deliverability (Bundle G)

**Health:** Fundament solide (4 Templates + nodemailer/Resend-SMTP + Plain-Text-Fallback + soft-fail), aber Bundle G ist **0% umgesetzt** (Plan ist Skelett).

- **K-EM1 (Kill)** Member-Invite-Email fehlt · **K-LEG3 (Kill)** Impressum-Footer in allen Templates fehlt.
- **Strong** — 30/7/1-Tage Pack-Expiry-Varianten sind **Code-Lüge** (Cron sendet nur 1-Tag); kein List-Unsubscribe-Header (RFC 8058, Gmail/Yahoo-Pflicht); kein Resend-Webhook + keine Suppression-Table (Bounces/Complaints ignoriert); kein Dunning-Cap (4 Past-Due-Mails pro Fehlversuch).
- **Mid** — durchgehend en-US-Locale statt de-DE; kein Invoice-Paid-Receipt + keine Credit-Low-Warning; Magic-Link-From fällt auf `onboarding@resend.dev` (Sandbox, kein DKIM-Alignment) zurück.

## Dimension 11 — Infra / Deploy / Env / Observability (Bundle C)

- **Strong** — **Keine Observability**: kein Sentry/OTel/Pino, nur 9 `console.error` die in Vercel verdampfen → verlorener Stripe-Webhook (= falscher Tier/verlorenes Geld) nicht diagnostizierbar.
- **Strong** — **Kein Env-Validator**: 25 ungeprüfte `process.env`-Reads mit `as string`-Casts → fehlende Prod-Var crasht still beim ersten Request statt beim Deploy.
- **Strong** — CSP nur Report-Only (kein report-Endpoint → 24h-Observe produziert keine Daten); Rate-Limiter in-memory (s.o. K10); db-migrate-in-build (s.o. K-DB1).
- **Mid** — Inngest-Route ohne `runtime=nodejs` + ohne signingKey-Enforcement (offener Audit-Trigger wenn `INNGEST_SIGNING_KEY` vergessen); `--frozen-lockfile=false` (Vercel-Build ≠ CI-Build); kein `functions`/`regions`-Block; CI lighthouse/integration nur auf PR → Solo-Direct-Push umgeht Gates.

**JETZT KOSTENLOS (kein Geld/Domain):** Sentry-free (5k/mo, nur DSN), Env-Validator (zod, 0€), vercel.json-Fixes, **Upstash-Redis-free (10k/day, Marketplace) → löst K10 ohne Vercel-KV-Paywall**, Inngest-Cloud-free, env-validator. **BRAUCHT DOMAIN/GELD (so spät wie möglich):** Resend-Custom-Sender-Domain (für Magic-Link an echte Kunden — **der erste Punkt der eine Domain erzwingt**), Stripe-Live-KYC, Vercel-Log-Drains (Pro), `__Host-`-Cookie.

## Dimension 12 — Funktionale Flows & Bug-Hunt

- **K-FLOW1 (Kill)** GitHub-Audit-Foreground-Timeout (s.o.) · **K-PAY1 (Kill)** Monats-Credits (s.o.).
- **Strong** — **Kein Logout/Sign-out-Button in der gesamten UI** (`auth.api.signOut` nur als Seiteneffekt von deleteAccount; `/account/settings` nur per Direkt-URL). **Strong** — Löschen des letzten Workspaces → `/dashboard`→`/login`→`/dashboard` **Redirect-Loop** + stale `vk_default_workspace_slug`-Cookie → 404. **Strong** — Workspace/Account-Delete kündigt das **Stripe-Abo nicht** → Kunde wird weiter belastet.
- **Mid** — `requestSolution` generiert synchron (5-30s LLM) im Server-Action → Polling-Pfad ist toter Code + Timeout-Risiko; `runForegroundAudit` zahlt LLM-Kosten **vor** `consumeCredits` (TOCTOU verbrennt Geld bei Pool-Race). **Weak** — Invite/Revoke ohne `router.refresh` (stale Liste); Settings-Members read-only (Invite/Revoke versteckt unter `/repos/[id]/access`).

## Dimension 13 — Performance & Rendering (Next 16)

- **Strong** — **`/status` Self-DoS**: 6 externe HEAD-Probes + DB-SELECT `no-store` **pro Pageview**, vom Footer jeder Seite verlinkt. Fix: `unstable_cache`/30-60s-TTL. **Strong** — **SiteNav (`getSessionUser`→`headers()`) zwingt ALLE Marketing-/Legal-Seiten in Dynamic** → 0 statisch (Layout-Kommentar „legal/* can now statically prerender" ist faktisch falsch). Fix: SiteNav-Shell statisch + Auth-Slot in Suspense/Client.
- **Mid** — `GlobalMotionConfig` zieht volle motion-Lib in jeden Shared-Bundle (auch Textseiten); 0 `'use cache'` (Cache-Components nicht adoptiert — Post-Launch); `cookieStore.set()` während Render in `[workspace]/page.tsx:38`.
- **Weak** — Font-Loading vorbildlich (swap + adjustFontFallback, kein CLS). Pixi korrekt lazy `dynamic(ssr:false)`, nur auf authentifizierter Seite; GSAP reist im Lazy-Pixi-Chunk; R3F verworfen.

## Dimension 14 — Accessibility (a11y)

- **K-A11Y1 (Kill)** PixiJS-Galaxie tastatur-unzugänglich (s.o.). Fix: SolarListView (existiert, mobile-only) als Desktop-Toggle exponieren **oder** parallele fokussierbare Findings-Liste.
- **Strong** — Inspector-Dialog `aria-modal=true` **ohne Focus-Trap/Initial-Focus/Restore** (betrifft auch Reduced-Motion- + Mobile-Pfad). Fix: auf Radix Sheet umstellen. **Strong** — Galaxie-Workspace-Seite ohne `#main-content` → Skip-Link ins Leere (15-Min-Fix). **Strong** — `text-white/40` auf Schwarz ≈ 2.5:1 an ~6 load-bearing Stellen (Filter-Chips, Folder-Counts, Empty-States) → AA-fail. Fix: ≥`white/58`.
- **Mid** — SessionList nutzt natives `confirm()` statt AlertDialog; Delete-Forms ohne `aria-describedby` zur Konsequenz-Warnung. **Weak** — Inspector Dismiss/Snooze `aria-disabled` ohne funktionalen Disable.

**VERIFIZIERTE POSITIVA:** Reduced-Motion mehrschichtig sauber; **StaticGalaxieSVG (reduced-Pfad) IST tastaturzugänglich** (rect role=button tabIndex=0 + Enter/Space) — ironischerweise a11y-besser als der Default-Pixi-Pfad; SeverityBadge non-visuell encodiert (role=img + Text + Border-Weight statt Hue → farbenblind-robust); Radix-Modale erben Focus-Trap korrekt; SolarListView 44pt-Tap-Targets.

---

## Bundle-Zuordnung (für Master-Refresh)

| Bundle | Neue/eskalierte Findings aus diesem Audit |
|--------|--------------------------------------------|
| **A** Auth (REOPEN) | K-A1, pollPRStatus, Upstash-Rate-Limit (K10 jetzt lösbar), CSP-enforce, IDOR-Negative-Tests |
| **B** Payment | K-PAY1, K-PAY2, current_period_end, ledger-idempotency-index, tax_code, billingBaseUrl, customer.deleted, credit-pack-UI-wire-or-delete, stripe-cancel-on-delete, Test-Fixtures-real-shape |
| **C** Infra+DB | Sentry, Env-Validator, K-DB1 migrate-out-of-build, hot-query-indices, membership-unique, retention-cron, frozen-lockfile, inngest-runtime, vercel.json-profile |
| **D** Frontend | K-FE1 scan-detail, loading.tsx, settings-ghost-town, toast-system, headings, touch-targets, small-a11y (confirm→AlertDialog, describedby) |
| **E** Stripe-Live | (domain/KYC-gated — LAST) |
| **F** Legal | K-LEG1/2/3/4, subprocessor-merge, trust-broken-docs, global-footer, AGB-de, AVV-pdf |
| **G** Email | K-EM1 member-invite, list-unsubscribe, suppression, dunning-cap, locale-de, invoice-paid/credit-low, 30/7-variants |
| **H** Cleanup+Docs (NEU) | Dead-code-delete, dep-removal, CLAUDE.md/changelog/README/vision/architecture-fix, plan-archivierung |
| **I** Galaxie-Rework (NEU) | K-GS1, K-GS2, beide Paletten-Kontrast, counter-scale-LOD, spacing, labels, mobileScale, K-A11Y1 keyboard, inspector-focus-trap, low-contrast-text |
| **J** Core-Flows (NEU) | K-FLOW1 github-foreground, no-logout, redirect-loop, solution-poll, audit-llm-before-consume |
