# Second-Opinion Audit — Synthese (S8) · 2026-06-11

> 7 unabhängige Domänen-Sessions (S1–S7) auf **Fabel 5** (`claude-fable-5`), je frischer Kontext,
> nach Protokoll `docs/plans/pre-launch-second-opinion-audit.md` §7.0 (Evidenz-Pflicht + CoVe-Verifikation,
> Default-Drop bei Zweifel). Methode: static Deep-Trace + targeted dynamic (Build, Vitest 328 Unit + 360
> Integration, LHCI, psql, Mailpit-Zustellung, curl gegen prod `next start`). Erst-Audit
> (`2026-06-launch-verify/`) wurde erst NACH unabhängigem Urteil gelesen → `_diff-vs-launch-verify.md`.

---

## 🚨 PRIORISIERTE GO-LIVE-BLOCKER-LISTE (go-live-blocker: yes)

Alle 4 Blocker sind **Kill**, verification **verified**. Sortierung: was den Launch am härtesten/frühesten bricht.

| Prio | ID | Finding | file:line | Impact (1 Satz) | Fix-Richtung (1 Satz) |
|------|----|---------|-----------|-----------------|----------------------|
| 1 | **S7-01** | Magic-Link-Absender in Prod = `onboarding@resend.dev` — Runbook dokumentiert `RESEND_FROM`, Code liest es nirgends (0 grep-Treffer) | `packages/auth/src/server.ts:148` | Magic-Link ist der einzige Login-Pfad; per Runbook deployed stellt Resend von der Sandbox-Adresse nicht an Kunden zu → **kein Kunde kann sich einloggen**. | `RESEND_FROM` (Fallback `SMTP_FROM`) in beiden Sende-Pfaden lesen + Secrets-Inventar mit Code synchronisieren. |
| 2 | **S1-01** | `customer-dal.ts` exportiert 5 ungescopte `"use server"`-Funktionen — Cross-Tenant **Read + Write** IDOR (Build-Manifest bestätigt 5 registrierte Action-IDs) | `apps/web/src/lib/customer-dal.ts:37,100,173,218,249` | Autorisierungsfreie HTTP-Endpoints mit Cross-Tenant-Schreibfähigkeit — exakt die Klasse, die das Team in `customers.ts` (K14) bereits als launch-blockierend gefixt hat; das Schwester-File blieb offen. | Auf `import "server-only"` umstellen (RPC-Surface weg) ODER `requireWorkspaceAccess` als erste Anweisung in jeder Funktion. |
| 3 | **S3-01** (+ Money-Aspekt **S2-05**) | Stripe-Webhook markiert Event **vor** Verarbeitung als gesehen; transienter Handler-Fehler → Event permanent verloren, Stripe-Retry läuft in Duplicate-Kurzschluss; kein Reconcile-Pfad heilt fehlende Credit-Grants | `apps/web/src/app/api/stripe/webhook/route.ts:104–118,160` + `packages/inngest/src/functions/stripe-reconcile.ts:107–110` | Ein einzelner Neon-/Stripe-Hiccup heißt „Kunde hat bezahlt, Credits nie gutgeschrieben" — ohne Alarm, ohne Selbstheilung, ohne Operator-Heilung (Resend nutzt dieselbe Event-ID). | `stripe_event` um Status (`processing/processed/failed`) erweitern bzw. Row bei Handler-Fehler löschen, damit Stripes 72h-Retry greift; Reconcile um Grant-Abgleich erweitern. |
| 4 | **S2-01** | Jahres-Abo erhält nur EINEN Cycle Credits für 12 Monate (1/12 der beworbenen Menge) — `invoice.paid` feuert bei annual 1×/Jahr, Grant ist cycle-agnostisch | `apps/web/src/app/api/stripe/webhook/route.ts:349-354` | Annual-Starter zahlt ~278 €/Jahr und bekommt 50 statt der beworbenen 600 Credits → garantierte Refund-/Chargeback-Welle + UWG-Risiko irreführender Preisangabe (DACH-B2B). | Grant bei annual ×12 (Jahres-Allotment) oder monatliche Grant-Quelle für Annual-Subs — oder Annual bis zum Fix aus Checkout + Pricing nehmen. |

**Hinweis zur Reihenfolge:** S7-01 ist trivial zu fixen und bricht sonst Tag 1 alles; S1-01 ist der Security-Kill; S3-01/S2-01 sind die Geld-Kills. Kein Weak trägt `go-live-blocker: yes`.

---

## Severity-Tally pro Dimension

| Session | Kill | Weak | Mid | Strong (Positiv-Status) | uncertain |
|---------|------|------|-----|-------------------------|-----------|
| S1 Auth/Tenant | 1 | 3 | 0 | — | 1 (S1-04) |
| S2 Payments | 1 | 4 | 1¹ | 6 Positiv-Befunde | 0 |
| S3 Data/DB | 1 | 3 | 3 | 4 Positiv-Muster | 0 |
| S4 Flows/Jobs | 0 | 3 | 2 | 3 Positiv-Befunde | 1 (S4-05) |
| S5 Hardening | 0 | 2 | 1 | 5 refuted-Positiva | 0 |
| S6 Frontend/a11y | 0 | 4 | 7 | LHCI 98–100, Kill-Badge AA | 1 (S6-11) |
| S7 Legal/Email | 1 | 4 | 6 | 3 (S7-12/13/14) | 1 (S7-04) |
| **Σ (roh)** | **4** | **23** | **20** | | 4 |
| **Σ (nach Dedupe)** | **4** | **23** | **19** | | 4 |

¹ S2-06 ist mit S1-03 dedupliziert (siehe unten) — kanonisch als Weak gezählt.

**Re-Judge über Domänen (eine Skala):** Die Bänder sind konsistent — kein Domänen-Bias gefunden.
Einzige Korrektur: **S1-03 ≡ S2-06** (beide = `workspace-ai-actions.ts` nur membership- statt
rollen-gegated; S1 fand zusätzlich `setSpendCap`/`updateByokSettings`/`setDefaultIntensity`).
Kanonische Severity: **Weak** (billing-/sicherheitsrelevante Owner-Entscheidungen durch beliebiges
Member schaltbar — „ernst, bald fixen" trifft es besser als Mid). Eskalations-Notiz aus S2
übernommen: **S2-03 wird Kill, sobald ein Kunde Auto-Overage aktiviert** (unbillbare, ungedeckelte
AI-Kosten — S2-03+S2-04 zusammen vor dem ersten Overage-Kunden fixen).

---

## Dedupe-Register

| Kanonisch | Dubletten/Aspekte | Verhältnis |
|-----------|-------------------|------------|
| S1-03 (Weak) | S2-06 | Identische Stelle (`workspace-ai-actions.ts:99–147`), S1 breiter (4 Funktionen). |
| S3-01 (Kill) | S2-05 | S2-05 = neuer Money-Aspekt (kein Reconcile heilt den Verlust) — im Blocker #3 konsolidiert. |
| Sprach-Inkonsistenz | S6-08 + S7-06 + S6-10 | Gleiche Wurzel (keine Sprachstrategie de/en) — als Cross-Cutting #6 gebündelt, Findings bleiben einzeln triagierbar. |
| Retention fehlt | S3-07 + S7-03 | Gleiche Wurzel (versprochene Retention ohne Lösch-Code), verschiedene Beweise (Schema-Kommentar vs. Datenschutzerklärung) — ein Fix (Retention-Cron) schließt beide. |

---

## Cross-Cutting-Muster (einzeln klein, zusammen systemisch)

1. **Ungeschützte `"use server"`-DAL-Module** — mind. 4 Module / 12 Funktionen verlassen sich auf
   Page-Level-Gating, das beim direkten Action-Dispatch umgangen wird: `customer-dal.ts` (S1-01, Kill),
   `install-requests.ts`, `solution-dal.ts`, `membership.listMembers` (S1-02). Das Team kennt die Klasse
   (K14-Fix in `customers.ts`) — es fehlt die **Sammel-Maßnahme + Regression-Schutz** (Lint-Regel
   „`use server`-Export ohne Auth-Erstanweisung" oder Per-Action-Negative-Tests).
2. **Zusage-Code-Drift — das größte Muster (9 Stellen):** Dokumentierte/versprochene Verhalten, die im
   Code nicht existieren: `RESEND_FROM` (S7-01) · `spendCap` gespeichert, nie durchgesetzt (S2-04) ·
   Overage-FAQ „€0.30 via Stripe", nie fakturierbar (S2-03) · Retention 7d/12mo versprochen, kein
   Lösch-Code (S3-07/S7-03) · DPA verspricht Self-Service-Export (S7-05) · Kommentar behauptet
   Delete-Mail „wired" (S7-08) · Doku behauptet 30/7/1-Warnungen, Code sendet 1 (S7-11) ·
   Subprozessor-Feed widerspricht Seite (S7-02) · Layout-Kommentar „legal/* can statically prerender",
   keine Route tut es (S6-07). **Empfehlung:** einmaliges „Claims-Inventar" (jede kundenseitige Zusage
   aus Legal/Pricing/Trust/Runbooks/Kommentaren → Code-Beleg oder Text-Korrektur) als Launch-Gate.
3. **Geldpfad ohne Selbstheilung und ohne Alarm:** Event-Verlust permanent (S3-01) + Reconcile heilt
   Grants nicht (S2-05) + Reconcile-Cron stirbt an Poison-Record nach Workspace-Delete (S3-04) + kein
   Error-Tracking-Hook (S4-05) + CSP-Reports ohne Sink (S5-01). Konsequenz: transiente Fehler werden
   permanente, **unsichtbare** Schäden. Ein dünner Alarm-Hook in `instrumentation.ts` + Status-Spalte
   am `stripe_event` + step-gewrapptes `publishEvent` entschärfen das Cluster gemeinsam.
4. **Fehlende Caps/Timeouts an teuren Außenkanten:** Zipball ohne Größen-Cap/Timeout (S4-02) · LLM-Call
   ohne AbortSignal (S4-03) · Credits consume-after-run statt reserve-then-run (S2-02) · Auto-Track-Cron
   enqueued ohne `workspaceId` → gratis, unmetered LLM-Audits (S4-01) · In-Memory-Rate-Limits ×
   Instanzenzahl (S5-03). Klasse: unkontrollierte Kosten-/Ressourcen-Lecks am LLM-/Fetch-Rand.
5. **Rollen-Gating-Lücke bei Billing-Settings** (S1-03≡S2-06): `loadWorkspace` prüft Membership, nie
   Rolle — ein `requireRole(["owner","admin"])` an einer Stelle schließt 4 zahlungswirksame Aktionen.
6. **Sprach-Inkonsistenz im DACH-Funnel:** `lang="de"` + englische Metadata (S6-08), Emails en-US ohne
   Locale-Mechanismus (S7-06), „Back to galaxy" (S6-10), AGB nur en (bekannter Rest). Eine
   Sprachstrategie-Entscheidung, dann mechanische Umsetzung.
7. **Galaxie-Retirement-Leichen:** CSP-`blob:`-Grants nur durch Pixi begründet (S5-02), „Back to
   galaxy"-Label (S6-10) — Dead-Grant/Dead-Naming-Klasse, je 1-Zeilen-Fix.

---

## Completeness-Kritik (was dieser Lauf NICHT geleistet hat)

**Uncertain geblieben (brauchen gezielte Klärung):**
- **S1-04** — `cookieCache`-300s-Fenster bei Remote-Revoke: dynamischer 2-Geräte-Test fehlt.
- **S6-11** — Mobile `fixed`-Pill-Bar-Escape: nur visuell klärbar (→ manuelle Aufgabe M1).
- **S4-05** — Error-Tracking: hängt an nicht eingesehenem Monitoring-Betriebsmodell (Log-Drain vs. SDK).
- **S7-04** — Retention-Widerspruch DPA (30 d) vs. Datenschutz (12 mo): juristische Lesart nötig.

**Dünn abgedeckt:**
- **Authentifizierte UI-Flächen dynamisch** — S6 lief LHCI/axe nur auf 3 öffentlichen Routen (desktop);
  Workspace-Konsole/Settings/Scan-Detail mit echten Daten nie im Browser geprüft (Playwright-Env tot).
- **Kein Live-Stripe-Roundtrip** — Stripe-CLI nicht installiert; `invoice.paid`-Pfad nur per
  Direkt-Invokation gegen Dev-DB verifiziert. **Kein Integration-Test deckt `invoice.paid` ab**, und
  die `validationkit_test`-DB hängt bei 16/19 Migrationen → die Suite würde eine
  Grant-Idempotenz-Regression nicht fangen.
- **Kein Live-Inngest-Re-Run** — Step-Retry-/Idempotenz-Semantik nur statisch belegt.
- **`pnpm eval` / `eval:conflicts` nicht gelaufen** — die LLM-Regel-Qualität (Golden-Set, FPR) war in
  keiner Session-Scope; vor Launch einmal fahren.
- **Erst-Audit-Strongs ohne Zweit-Urteil** (weder bestätigt noch widerlegt — gezielt nachprüfen):
  fehlender `tax_code` auf Products/Prices (laut Erst-Audit Live-Checkout-Blocker!), `current_period_end`
  immer null, fehlender Logout-Button, Redirect-Loop nach Löschen des letzten Workspace,
  `/status`-Self-DoS, Dunning-Cap.

**Manuelle User-Aufgaben (aus S6, Playwright tot):** M1 Mobile-Pill-Bar · M2 100dvh-Hero auf echtem
Gerät · M3 Tastatur-Walkthrough Inspector-Fokus · M4 Deuteranopie-Simulator · M5 Screenshot-Aktualität.

**Empfohlene Folge-Sessions:**
1. **F1 — Stripe-Live-Roundtrip:** Stripe-CLI installieren, `stripe trigger invoice.paid` + Annual-Fall
   end-to-end; dabei `tax_code`/`current_period_end` aus dem Erst-Audit mitverifizieren.
2. **F2 — Authentifizierte a11y/Visual-Session**, sobald die Playwright-Env steht (axe auf Konsole,
   Settings, Scan-Detail; M1–M4 abhaken).
3. **F3 — Erst-Audit-Restliste:** die oben gelisteten unverifizierten Strongs (Logout, Redirect-Loop,
   /status, Dunning) in einer kurzen gezielten Session bestätigen/schließen.
4. **F4 — cookieCache-Revoke-Test** (S1-04) als 30-Minuten-Dynamik-Check.

**Qualitäts-Selbstprüfung des Laufs:** Kein bekannter offener Kill aus §7.0 wurde als „neu" gemeldet
(Filter hat gehalten; S2/S7 haben 4 alte Kills explizit als *gefixt-verifiziert* dokumentiert).
Alle 4 neuen Kills tragen `file:line` + Snippet + Exploit-Pfad + bestandene Widerlegungs-Runde.

---

## Datei-Index

| Report | Inhalt |
|--------|--------|
| `S1-auth.md` | Auth/Session/Tenant-Isolation — 1 Kill · 3 Weak |
| `S2-payments.md` | Stripe/Credits — 1 Kill · 4 Weak · 1 Mid · 6 Positiva |
| `S3-data-db.md` | Schema/Migrationen/Transaktionen — 1 Kill · 3 Weak · 3 Mid · 0018-Drift widerlegt |
| `S4-flows-jobs.md` | Pipeline/Inngest/Observability — 3 Weak · 2 Mid · da0babb-Blocker gefixt-verifiziert |
| `S5-web-hardening.md` | Header/CSP/Secrets/SSRF — 2 Weak · 1 Mid · SSRF refuted, Bundle sauber |
| `S6-frontend-a11y-perf.md` | a11y/CWV/SEO — 4 Weak · 7 Mid · LHCI 98–100 · Scan-Detail-Kill widerlegt |
| `S7-legal-email.md` | DSGVO/Email — 1 Kill · 4 Weak · 6 Mid · 3 Strong (Alt-Kills geschlossen) |
| `_diff-vs-launch-verify.md` | Abgleich gegen Erst-Audit (erst nach unabhängigem Urteil erstellt) |
