# Plan — Fix der 4 Go-Live-Blocker (Second-Opinion-Audit)

> Erstellt: 2026-06-11
> Status: 🟡 In Review
> Slug: `fix-go-live-blockers`
> Confidence: **High** — basiert auf 8 User-Entscheidungen (2 Discovery-Runden) + Code-Audit von 10 Files + der vollen Evidenz aus `docs/audits/2026-06-second-opinion/` (alle 4 Blocker CoVe-verified mit file:line)
> Quelle: `docs/audits/2026-06-second-opinion/_synthesis.md` (Blocker S7-01 · S1-01 · S3-01+S2-05 · S2-01)

## 1. Ziel

Nach Execute sind alle 4 Go-Live-Blocker des Second-Opinion-Audits geschlossen: Login-Mails kommen vom konfigurierten Absender (S7-01), kein `"use server"`-DAL-Modul ist mehr ohne Auth erreichbar (S1-01 + S1-02-Klasse), verlorene Stripe-Events sind retry-fähig + werden vom Reconcile geheilt (S3-01 + S2-05 + S3-04), und Jahres-Abos erhalten ihr volles Credit-Allotment (S2-01).

## 2. User-Entscheidungen (Audit-Trail aus Discovery)

| ID | Runde | Frage | Antwort |
|----|-------|-------|---------|
| Q1 | 1.1 | IDOR-Scope | **Ganze Klasse**: customer-dal.ts (Kill) + install-requests.ts, solution-dal.ts, membership.listMembers (S1-02) |
| Q2 | 1.2 | S3-01-Mechanik | **Status-Spalte** auf `stripe_event` (`processing|processed|failed`), nicht Row-Delete |
| Q3 | 1.3 | Annual-Fix | **Jahres-Allotment up-front**: `billing_cycle`-Spalte, Quota ×12 bei annual, Pricing-Copy präzisieren |
| Q4 | 1.4 | S2-05 Reconcile-Heilung | **Ja, mitnehmen** — stripe-reconcile prüft + heilt fehlende monthly_grants (inkl. S3-04-Poison-Record-Fix, sonst stirbt der heilende Cron selbst) |
| Q5 | 2.1 | Migration | **Handgeschrieben, rein additiv** (0019, Muster 0012–0018; `generate` ist durch Snapshot-Drift S3-02 kaputt) |
| Q6 | 2.2 | RESEND_FROM | **Fail-fast im Env-Validator** (Prod + RESEND_API_KEY ⇒ RESEND_FROM Pflicht) + Code liest die Var |
| Q7 | 2.3 | Test-Tier | **Unit + Integration** — neue Webhook-Integration-Tests (invoice.paid monthly/annual, failed→Retry, Reconcile-Heilung) |
| Q8 | 2.4 | Branch | **`fix/go-live-blockers` ab aktuellem HEAD** (feat/app-visual-overhaul-3color) — einzige Datei-Überschneidung (pricing/page.tsx) liegt auf diesem Branch |

## 3. Existing-Patterns im Repo (Vorbild)

- `apps/web/src/lib/customers.ts:1-10` — **der K14-Fix**: `import "server-only"` statt `"use server"` entfernt die RPC-Surface komplett; Header-Kommentar erklärt die IDOR-Klasse. Exakt dieses Muster wenden wir auf die Schwester-Module an.
- `apps/web/src/lib/authz.ts` — `requireWorkspaceAccess`/`userIsMember` als SSOT für In-Function-Guards (für Module, die `"use server"` bleiben müssen, weil sie echte Client-Actions enthalten — `membership.ts`).
- `apps/web/src/env.ts:103-107` — Conditional-Dep-Mechanik („Feature on ⇒ Dep required", fail-fast in Prod). Vorbild für die RESEND_FROM-Pflicht.
- `packages/db/drizzle/0016_credit_ledger_idempotency.sql` + `_journal.json` — handgeschriebene, idempotente Migration mit manuell gepflegtem monotonen `when`-Wert. Vorbild für 0019.
- `apps/web/src/app/api/stripe/webhook/route.ts:309-315` — `handleInvoiceCreated` zeigt das gewünschte Fehler-Semantik-Vorbild: Fehler tolerieren, damit Stripes 72h-Retry greift.
- `packages/billing/src/credits.ts` — `grantCredits` mit `monthly_grant`-Idempotenz-Index (`referenceId` = invoice.id): macht die Reconcile-Heilung und Event-Re-Processing gefahrlos re-entrant (Replay = No-op).
- `apps/web/src/app/api/stripe/webhook/route.integration.test.ts` — bestehendes Integration-Test-Harness für Webhook-Events (wird um invoice.paid-Fälle erweitert).

## 4. Alternativen, die wir bewusst NICHT wählen

- **Row-Delete statt Status-Spalte (S3-01):** Kein Schema-Change, aber blind bei Prozess-Crash ohne catch, und ein paralleler Stripe-Retry während laufender Verarbeitung würde als `duplicate ok` verschluckt → Q2.
- **Monats-Drip-Cron für Annual:** Wörtlich „50/month", aber neuer Job + neue Fehlerklasse (verpasste Drips) auf dem Geldpfad → Q3.
- **Annual deaktivieren:** Kleinster Change, aber Feature-Verlust vor Launch → Q3.
- **Erst Snapshot-Drift (S3-02) fixen, dann generieren:** Sauberer, aber +2–4h eigenes Risiko vor Launch; 0019 folgt dem etablierten Handarbeits-Muster → Q5.
- **In-Function-Guards statt server-only für customer-dal:** `server-only` ist der teameigene Standard (K14) und entfernt die Angriffsfläche statt sie zu bewachen; Guards nur dort, wo ein Modul echte Client-Actions enthält (membership.ts).
- **Weicher RESEND_FROM-Fallback ohne Validator:** Vergessene Var fiele erst beim manuellen Mail-Test auf statt beim Deploy → Q6.

## 5. Endzustand

1. **S7-01:** `server.ts` + `sender.ts` lesen `RESEND_FROM ?? SMTP_FROM ?? <fallback>`; `env.ts` bricht Prod-Boot ab, wenn RESEND_API_KEY gesetzt aber RESEND_FROM fehlt; `docs/operations/secrets-rotation.md` stimmt mit dem Code überein. *(Du setzt RESEND_FROM danach in Vercel — User-Task.)*
2. **S1-01/S1-02:** `customer-dal.ts`, `install-requests.ts`, `solution-dal.ts` tragen `import "server-only"`; `membership.listMembers` hat einen In-Function-Guard (`requireWorkspaceAccess`). Das Build-Manifest (`server-reference-manifest.json`) listet **keine** Action-IDs mehr aus diesen Modulen.
3. **S3-01:** `stripe_event.status` existiert; Flow = Insert `processing` → Handler → Update `processed` | bei catch `failed`. Duplikat-Pfad: `processed` → `{ok, duplicate}`; `failed` oder `processing` älter als 5 min → erneut verarbeiten; frisches `processing` → 409/500 (Stripe retried später). Verlorene Events sind damit unmöglich, solange Stripe retried.
4. **S2-05/S3-04:** `stripe-reconcile` prüft pro aktiver Sub, ob für die laufende Periode ein `monthly_grant`-Ledger-Eintrag existiert, und heilt fehlende via idempotentem `grantCredits` (referenceId = Invoice-ID); `publishEvent` ist step-gewrappt + workspace-existenz-geprüft (kein Poison-Record-Tod mehr).
5. **S2-01:** `subscription.billing_cycle` existiert; `applyTierToWorkspace` setzt `creditsQuotaPerCycle = creditsPerCycle × 12` bei annual (Cycle aus `price.recurring.interval` der Stripe-Subscription); der bestehende `invoice.paid`-Grant bucht damit automatisch das Jahres-Allotment. Pricing-Copy sagt bei annual „<N×12> credits / year (granted up-front)".
6. Alle Gates grün: `pnpm typecheck` · `pnpm test` · `pnpm test:integration` (inkl. neuer invoice.paid-/Retry-/Heilungs-Tests) · `pnpm --filter @vk/web build`.

## 6. Schritte

**Phase A — S7-01 Resend-Absender (~0.5h)**
- [x] A1: `packages/auth/src/server.ts:147-150` — From-Kette auf `process.env.RESEND_FROM ?? process.env.SMTP_FROM ?? (useResend ? "onboarding@resend.dev" : "auth@validationkit.local")` umstellen.
- [x] A2: `packages/auth/src/emails/sender.ts:72` — Default-From auf `RESEND_FROM ?? SMTP_FROM ?? "notifications@validationkit.app"` vereinheitlichen (eine Absender-Logik, zwei Pfade).
- [x] A3: `apps/web/src/env.ts` — Conditional-Check ergänzen: Production + `RESEND_API_KEY` gesetzt ⇒ `RESEND_FROM` Pflicht (Muster Zeile 103-107).
- [x] A4: `docs/operations/secrets-rotation.md` — RESEND_FROM-Eintrag mit dem realen Code-Verhalten synchronisieren.

**Phase B — S1-01/S1-02 IDOR-Sweep (~1.5h)**
- [x] B1: Pro Modul Client-Importer prüfen. **Befund (Execute 2026-06-11):** `solution-dal.ts` ist bereits `server-only` (Bundle-A K12/K13 — Audit S1-02 hier veraltet, kein Change). `customer-dal.ts` hat 0 Client-Importer → `server-only`-Konvertierung wie geplant. `install-requests.ts` hat 2 echte Client-Actions (`decideInstall`, `requestInstall`) → **User-Entscheidung (Block-Resolver): In-Function-Guards** für die 3 List-Funktionen statt server-only (B2-Muster).
- [x] B2: `membership.ts` enthält echte Client-Actions → bleibt `"use server"`; `listMembers` bekommt als erste Anweisung `requireWorkspaceAccess(workspaceId, user.id)` (authz-SSOT).
- [x] B3: Verifikation: `pnpm --filter @vk/web build` grün; Manifest: 0 Treffer customer-dal/solution-dal; install-requests bleibt registriert (echte Actions + geguardete Reads) — erwartet nach B1-Resolver.

**Phase C — Migration 0019 + S2-01 Annual (~2h)**
- [ ] C1: `packages/db/src/schema.ts` — `stripeEvent.status` (`varchar(12)`, notNull, default `'processed'` → Legacy-Rows gelten als erledigt) + `subscription.billingCycle` (`varchar(10)`, notNull, default `'monthly'`).
- [ ] C2: `packages/db/drizzle/0019_stripe_event_status_billing_cycle.sql` NEW — idempotent (`ADD COLUMN IF NOT EXISTS`), + `_journal.json`-Eintrag mit monoton steigendem `when`.
- [ ] C3: `pnpm db:migrate` gegen lokale DB **und** gegen `validationkit_test` (hängt bei 16/19 — Audit-Befund; auf 20/20 ziehen, sonst sind die neuen Integration-Tests blind).
- [ ] C4: Webhook `handleSubscriptionUpdated` → Cycle aus `sub.items.data[0].price.recurring.interval` (`"year"` → `annual`) ableiten und an `applyTierToWorkspace` durchreichen; dort `billingCycle` persistieren + `creditsQuotaPerCycle = config.creditsPerCycle * (cycle === "annual" ? 12 : 1)`.
- [ ] C5: Pre-Flight-Check (Annahme verifizieren): `consumeCredits`/`canConsume` gaten auf `creditsUsedThisPeriod < creditsQuotaPerCycle` — bestätigen, dass das ×12-Quota das Jahres-Allotment freischaltet.
- [ ] C6: `apps/web/src/app/pricing/page.tsx` — Annual-Copy präzisieren („<N×12> credits / year, granted up-front").

**Phase D — S3-01 Webhook-Status-Machine (~2h)**
- [ ] D1: `apps/web/src/app/api/stripe/webhook/route.ts:104-161` — Insert mit `status: 'processing'`; bei Konflikt bestehende Row lesen: `processed` → `{ok, duplicate}`; `failed` ODER `processing` mit `processedAt` älter 5 min → Status auf `processing` + Re-Run der Handler; frisches `processing` → 500 (in-flight). Nach erfolgreichem Switch → `status: 'processed'`; im catch → `status: 'failed'` + weiterhin 500.
- [ ] D2: Kommentar im Code: warum insert-before-process vorher Geld-Events verlor (Audit-Referenz S3-01).

**Phase E — S2-05/S3-04 Reconcile-Heilung (~2.5h)**
- [ ] E1: `packages/inngest/src/functions/stripe-reconcile.ts` — `publishEvent` in `step.run` wrappen + Workspace-Existenz-Check davor (verwaiste Subs: loggen statt FK-Crash) → S3-04.
- [ ] E2: Heilungs-Step: pro aktiver Subscription mit `stripeSubscriptionId` letzte bezahlte Invoice via Stripe-API holen; existiert kein `credit_ledger`-Eintrag `reason='monthly_grant'` mit `referenceId = invoice.id` → `grantCredits` nachholen (idempotent durch 0016-Index) + Warn-Log (geheilter Drop = Alarm-Signal).
- [ ] E3: Heilung ebenfalls step-gewrappt, damit ein Fehler pro Sub nicht den Run killt.

**Phase F — Tests + Gates (~1.5h)**
- [ ] F1: `route.integration.test.ts` erweitern: (a) `invoice.paid` monthly → Grant 50 + Quota-Reset; (b) annual-Sub → Quota 600 + Grant 600; (c) Handler-Fehler → Row `failed` → Replay desselben Events verarbeitet erneut + Grant genau 1× (Idempotenz); (d) frisches `processing`-Duplikat → 500.
- [ ] F2: Reconcile-Heilungs-Test (Unit mit gemocktem Stripe-Client): fehlender Grant wird nachgebucht, vorhandener nicht doppelt; gelöschter Workspace crasht den Run nicht.
- [ ] F3: Gates: `pnpm typecheck` · `pnpm test` · `pnpm test:integration` · `pnpm --filter @vk/web build` (Build ist Pflicht — CI fährt keins, Audit S4-04).

## 7. Files-to-Change

| Datei | Aktion | Was passiert |
|-------|--------|--------------|
| `packages/auth/src/server.ts` | EDIT | Magic-Link-From liest RESEND_FROM (A1) |
| `packages/auth/src/emails/sender.ts` | EDIT | Default-From vereinheitlicht (A2) |
| `apps/web/src/env.ts` | EDIT | Conditional RESEND_FROM-Pflicht in Prod (A3) |
| `docs/operations/secrets-rotation.md` | EDIT | Inventar ↔ Code synchron (A4) |
| `apps/web/src/lib/customer-dal.ts` | EDIT | `"use server"` → `server-only` + Header (B1) |
| `apps/web/src/lib/install-requests.ts` | EDIT | dito (B1) |
| `apps/web/src/lib/solution-dal.ts` | EDIT | dito (B1) |
| `apps/web/src/lib/membership.ts` | EDIT | In-Function-Guard in `listMembers` (B2) |
| `packages/db/src/schema.ts` | EDIT | `stripeEvent.status` + `subscription.billingCycle` (C1) |
| `packages/db/drizzle/0019_stripe_event_status_billing_cycle.sql` | NEW | additive, idempotente Migration (C2) |
| `packages/db/drizzle/meta/_journal.json` | EDIT | 0019-Eintrag, monotones `when` (C2) |
| `apps/web/src/app/api/stripe/webhook/route.ts` | EDIT | Status-Machine (D1) + Cycle-Ableitung/applyTier ×12 (C4) |
| `apps/web/src/app/pricing/page.tsx` | EDIT | Annual-Credit-Copy (C6) |
| `packages/inngest/src/functions/stripe-reconcile.ts` | EDIT | step-Wrap + Existenz-Check + Grant-Heilung (E1–E3) |
| `apps/web/src/app/api/stripe/webhook/route.integration.test.ts` | EDIT | 4 neue invoice.paid-/Retry-Fälle (F1) |
| `packages/inngest/src/functions/stripe-reconcile.test.ts` | NEW/EDIT | Heilungs-Tests (F2) |

## 8. Test-Plan

**Automatisch:**
- `pnpm typecheck` ✓
- `pnpm test` ✓ — neue Unit-Tests: Reconcile-Heilung (F2)
- `pnpm test:integration` ✓ — neue Tests: invoice.paid monthly/annual ×12, failed→Replay-Idempotenz, processing-Duplikat (F1); **Voraussetzung:** `validationkit_test` auf 20/20 Migrationen (C3)
- `pnpm --filter @vk/web build` ✓ — danach Manifest-Grep: 0 Actions aus den 3 server-only-Modulen (B3)

**Manuell:**
- [ ] Lokal mit `RESEND_API_KEY` ungesetzt: Magic-Link via Mailpit — From = SMTP_FROM-Wert.
- [ ] `next start` mit Prod-Env-Simulation: Boot bricht ab, wenn RESEND_API_KEY gesetzt + RESEND_FROM fehlt (A3 greift).
- [ ] Customers-Seite + Customer-Detail im Browser: lädt/mutiert unverändert (server-only-Konvertierung hat Page-Pfade nicht gebrochen).
- [ ] **User-Task danach:** `RESEND_FROM` in Vercel-Prod-Env setzen (verifizierte Resend-Domain).

## 9. Risiken + Mitigation

| Risiko | Severity | Mitigation |
|--------|----------|------------|
| server-only-Konvertierung bricht einen übersehenen Client-Importer | Strong | B1-Importer-Check vor Umstellung + Block-Resolver (AskUserQuestion statt raten); `build` als Gate (typecheck allein fängt RSC-Brüche nicht — Lehre da0babb) |
| Status-Machine-Race: Stripe-Retry trifft ein, während Erstverarbeitung läuft | Mid | Frisches `processing` → 500, Stripe retried in Minuten erneut; 5-min-Stale-Fenster deckt Crash-mitten-im-Handler ab |
| `updateTag`-Aufrufe in konvertierten DAL-Modulen laufen im Render-Kontext | Mid | Nur Mutations-Funktionen rufen `updateTag` und werden weiter aus Server-Actions (`customer-actions.ts`) aufgerufen — in B1 pro Call-Site verifizieren |
| Annual-×12 zu großzügig falls Kunde nach 1 Monat kündigt (600 verbraucht, 1/12 bezahlt bei Refund) | Weak | Pre-Launch: 0 Bestands-Annual-Subs; Stripe-Refund-Policy ist Geschäftsentscheidung — als Notiz in §11, kein Code |
| Reconcile-Heilung granted fälschlich doppelt | Mid | `grantCredits`-Idempotenz-Index (0016, referenceId=invoice.id) macht Replay zum No-op — von F2 explizit getestet |
| Migration 0019 auf Prod via buildCommand (bekanntes Bundle-C-Thema) | Mid | Rein additiv + `IF NOT EXISTS` → mehrfach/parallel gefahrlos; kein DROP/RENAME |
| `recurring.interval` fehlt bei exotischen Price-Objekten | Weak | Fallback `monthly` (konservativ: lieber unter- als über-granten) + Warn-Log |

## 10. Rollout

- **Strategie:** Branch `fix/go-live-blockers` ab aktuellem HEAD (Q8), thematische Commits pro Phase (A–F), 1 PR; Review durch dich, Merge zusammen mit/nach dem Visual-Overhaul.
- **Pre-Deploy-Gates:** alle §8-Gates grün; `git status` sauber außer geplanter Files.
- **Post-Deploy-Verifikation:** (1) Magic-Link an echte Mail-Adresse → From prüfen; (2) `stripe trigger invoice.paid` im Test-Mode (Stripe-CLI installieren — schließt zugleich Audit-Folge-Session F1 teilweise); (3) Vercel-Logs: Reconcile-Nightly läuft ohne FK-Error durch.
- **Rollback-Trigger:** Webhook-Route wirft nach Deploy systematisch 500 auf Nicht-Duplikaten; Customers-Seiten 500en.
- **Rollback-Schritte:** Revert-Commit des PR (Migration ist additiv → kein Down nötig; `status`-Default `'processed'` hält Alt-Code kompatibel).

## 11. Out-of-Scope (V2 / separater Plan)

- Übrige Weak/Mid-Findings des Second-Opinion-Audits (S2-02 reserve-then-run, S2-03/S2-04 Overage-Billing + spendCap, S5-03 Rate-Limit-KV, S6-Kontrast, S7-Legal-Texte …) — eigene Triage.
- S3-02 Snapshot-Drift-Rebaseline (0012–0019) — eigener kleiner Plan, bevor die nächste *generierte* Migration nötig wird.
- Refund-/Proration-Policy für gekündigte Annual-Subs (Geschäftsentscheidung, dann ggf. Code).
- Audit-Folge-Sessions F1–F4 aus `_synthesis.md` (u.a. `tax_code`-Verifikation — potenzieller 5. Blocker, separat prüfen!).
- RESEND_FROM/Domain in Vercel setzen + Resend-Domain-Verifizierung (User-extern).

## 12. Open Questions (nur Post-Execute-Items)

- C5 verifiziert die `consumeCredits`-Quota-Semantik als Pre-Flight (Annahme: gated auf `creditsUsedThisPeriod < creditsQuotaPerCycle`); falls anders → Block-Resolver.
- Exaktes Stale-Fenster (Default 5 min) ggf. an reale Webhook-`maxDuration` anpassen — im Execute prüfen.

## 13. Geschätzter Aufwand

- Phase A: 0.5h · B: 1.5h · C: 2h · D: 2h · E: 2.5h · F: 1.5h
- **Gesamt: ~10h.** Empfehlung: 1 Branch / 1 PR mit 6 Phasen-Commits; bei Session-Limit nach Phase C oder D sauber unterbrechbar (jede Phase lässt das Repo grün zurück).
