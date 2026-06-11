# Diff: Second-Opinion (2026-06-11) vs. Launch-Verify-Erst-Audit (2026-06-08)

> Erstellt von S8 **nach** unabhängigem Urteil (Erst-Audit wurde von S1–S7 nicht gelesen).
> Zweck: Was hat der Erst-Audit übersehen? Was hat er gefunden, das wir nicht reproduziert haben?

## 1 · Vom Erst-Audit ÜBERSEHEN — neu im Second-Opinion

| Second-Opinion | Severity | Warum der Erst-Audit es verfehlte |
|----------------|----------|-----------------------------------|
| **S1-01** `customer-dal.ts` 5× ungescopte `"use server"`-Actions (Read+**Write**-IDOR) | Kill | Erst-Audit fand exakt dieselbe Klasse in `customers.ts` (K-A1), prüfte aber das Schwester-File nie — und notierte selbst „Phase 5 Per-Action-IDOR-Negative-Tests fehlen → genau deshalb blieb K-A1 unentdeckt". Die Prognose traf erneut zu. |
| **S2-01** Jahres-Abo bekommt 1/12 der Credits | Kill | Erst-Audit prüfte den `invoice.paid`-Pfad nur auf API-Shape (K-PAY1), nie auf Cycle-Semantik (annual = 1 Invoice/Jahr). |
| **S3-01** Event-Insert **vor** Verarbeitung → Geld-Events permanent verloren | Kill | Erst-Audit listete die Webhook-Idempotenz sogar als **VERIFIED-OK** („stripe_event-PK + onConflictDoNothing") — er prüfte den Mechanismus, nicht die *Reihenfolge*. Lehrstück: „verified-ok" ohne Fehlerpfad-Trace. |
| **S3-04** Workspace-Delete vergiftet Reconcile-Cron (FK-Poison-Record) | Weak | Reconcile-Cron existierte beim Erst-Audit noch nicht in dieser Form / wurde nicht gegen Delete-Flows getraced. |
| **S4-01** Auto-Track-Cron enqueued ohne `workspaceId` → gratis, unmetered LLM-Audits | Weak | Hintergrund-Pfad-Payload wurde nie feldweise gegen den Consumer geprüft. |
| **S4-02** Zipball ohne Größen-Cap/Timeout (Memory-DoS am Anon-Pfad) | Weak | Erst-Audit sah am GitHub-Pfad nur den Threshold-Timeout (K-FLOW1), nicht die Ressourcen-Kante. |
| **S2-03** Overage-Metered-Price hängt nie an der Subscription (Overage unbillbar) | Weak | Erst-Audit fand die Schicht davor (K-PAY2 `allowOverage` tot); nach deren Fix wurde die nächste Schicht nie re-auditiert. |
| **S2-04** `spendCap` gespeichert, nie durchgesetzt | Weak | UI-Zusage-vs-Code-Abgleich war keine Erst-Audit-Methode. |
| **S7-05** DPA verspricht nicht-existenten Self-Service-Export | Weak | Legal-Texte existierten beim Erst-Audit noch nicht (K-LEG1/2 waren ja „fehlt"). Folge-Klasse: neue Seiten = neue Zusagen. |
| **S7-10** Invertierte Badge-Logik Subprozessor-Seite („EU-only" für Nicht-EU) | Mid | dito — Seite neu. |
| **S6-01/S6-02** Weak-Band + Low-Alpha-Texte verfehlen Kontrast-AA | Weak | 3-Farben-Overhaul kam NACH dem Erst-Audit; dessen Galaxie-Kontrast-Kills (K-GS1/2) sind moot (retired), die neuen Token brachten neue Fails. |
| **S1-04** cookieCache 300s-Stale-Session bei Remote-Revoke | Weak (uncertain) | Library-Semantik-Tiefe, die der Erst-Audit nicht erreichte. |

## 2 · Vom Erst-Audit gefunden, vom Second-Opinion ESKALIERT

| Finding | Erst-Audit | Second-Opinion | Grund der Eskalation |
|---------|-----------|----------------|----------------------|
| Magic-Link-From `onboarding@resend.dev` | Mid (Dimension 10, „Sandbox, kein DKIM-Alignment") | **S7-01 Kill** | Neuer Beweis: Runbook dokumentiert `RESEND_FROM` als Prod-Mechanismus, Code liest die Var **nirgends** (grep 0) — per Runbook deployed ist der einzige Login-Pfad funktional tot, nicht nur „schlechte Deliverability". |

## 3 · Erst-Audit-Kills: vom Second-Opinion als GEFIXT verifiziert (Regression-Checks grün)

| Erst-Audit-Kill | Verifikation im Second-Opinion |
|------------------|-------------------------------|
| K-A1 `customers.ts` IDOR | S1: `server-only`-Fix bestätigt (refuted-Tabelle) — aber siehe S1-01 (Schwester-File!) |
| K-PAY1 `invoice.subscription` (dahlia) | S2: `subscriptionIdFromInvoice` mit dahlia-Pfad code-verifiziert |
| K-PAY2 Auto-Overage `allowOverage` tot | S2: live durchgereicht (Foreground + Background) — aber siehe S2-03 (nächste Schicht) |
| K-FE1 Scan-Detail undesigned | S6: **widerlegt** — PageShell/Breadcrumb/Tables/Skeleton vorhanden; Rest = en-Texte (S6-08) |
| K-LEG1/K-LEG2 Impressum/Datenschutz fehlen | S7: existieren, anonym erreichbar, strukturell vollständig (Platzhalter = bekannter User-Task) |
| K-LEG3 Email-Impressum-Footer | S7: in allen 5 Templates vorhanden (Mailpit-verifiziert) |
| K-LEG4 persönliche Gmail im DPA-Flow | S7: vollständig entfernt (grep 0) |
| K-EM1 Member-Invite-Mail fehlt | S7-13: existiert + live in Mailpit zugestellt |
| da0babb Prod-Build-Blocker | S4: Build Exit 0, alle 21 Seiten, Fix in `membership.ts:8-15` lokalisiert |
| K-GS1/K-GS2/K-A11Y1 (Galaxie) | Moot — Galaxie/Pixi retired 2026-06-10; Nachfolge-Kontrast-Themen → S6-01/02 |
| „Kein Env-Validator" (Strong, Dim 11) | S5: fail-fast-Env-Validierung live beobachtet — als Exceptional-nah gelobt |
| „Stripe-Abo bei Delete nicht gekündigt" (Strong, Dim 12) | S2: `cancelWorkspaceStripeSubscription` vorhanden (refuted) — Folgeproblem S3-04 (Poison-Record) neu |

## 4 · UNABHÄNGIG REPRODUZIERT (beide Audits, weiterhin offen → hohe Konfidenz)

- In-Memory-Rate-Limits × Instanzen (Erst: K10/Strong · Jetzt: S5-03) — inkl. neuem Email-Bomb-Aspekt.
- Inspector `aria-modal` ohne Fokus-Management (Erst: Strong Dim 14 · Jetzt: S6-03).
- Subprozessor-Split-Brain Seite vs. Feed (Erst: Strong Dim 9 · Jetzt: S7-02 — Status/Regionen-Widersprüche konkretisiert).
- Drizzle-Snapshot-Drift (Erst: Mid „0012–0015" · Jetzt: S3-02 „0012–0018", dynamisch bewiesen via TTY-Konflikt).
- Pending-Invite ohne Partial-Unique + Claim-Race (Erst: Strong Dim 3 · Jetzt: S3-03 mit Dashboard-Lockout-Pfad).
- Retention versprochen, kein Lösch-Code (Erst: Mid · Jetzt: S3-07 + S7-03 mit DSGVO-Disclosure-Beweis).
- Kein List-Unsubscribe / Suppression / Bounce-Webhook (Erst: Strong Dim 10 · Jetzt: S7-07).
- 30/7/1-Expiry-Warnungen sind Code-Lüge (Erst: Strong · Jetzt: S7-11).
- LLM-Kosten vor `consumeCredits` (Erst: Mid Dim 12 · Jetzt: S2-02 mit Cost-Amplification-Pfad).
- SiteNav zwingt alle Marketing-/Legal-Seiten dynamic (Erst: Strong Dim 13 · Jetzt: S6-07 mit Messwerten 227–328 KB gzip).
- Email-Locale en-US (Erst: Mid · Jetzt: S7-06) · CSP Report-Only ohne Sink (Erst: Strong Dim 11 · Jetzt: S5-01).

## 5 · Vom Erst-Audit gefunden, vom Second-Opinion NICHT geprüft (offene Verifikations-Schuld)

> Weder bestätigt noch widerlegt — gehören in Folge-Session F3 (siehe `_synthesis.md`):

- **`tax_code` fehlt auf Products/Prices** — laut Erst-Audit blockiert `automatic_tax` im Live-Mode den Checkout (potenzieller 5. Blocker!).
- `current_period_end` immer null (Billing-Page ohne Reset-Datum).
- Kein Logout-Button in der gesamten UI · Redirect-Loop nach Löschen des letzten Workspace.
- `/status`-Self-DoS (6 externe Probes pro Pageview) · Dunning-Cap (4 Past-Due-Mails) · Hot-Query-Indices.
- Dead-Code-/Docs-Konsolidierungslisten (Dim 4/5) — außerhalb des Second-Opinion-Scopes.

## Fazit

Der Erst-Audit war auf seinen 14 Dimensionen gründlich, hatte aber genau die blinden Flecken, die die
Second-Opinion-Hypothese vermutete: (a) **Klassen-Fixes wurden nie auf Schwester-Files ausgeweitet**
(K-A1→S1-01), (b) **„verified-ok" ohne Fehlerpfad-Trace** (Webhook-Idempotenz→S3-01), (c) **Zusagen
(Pricing/Legal/Runbook/Kommentare) wurden nie gegen Code abgeglichen** (S2-01, S2-04, S7-01, S7-05).
Umgekehrt hat das Team seit dem Erst-Audit 9 von 14 Kills nachweislich geschlossen — die 4 neuen Kills
sind echte Lücken, keine Regressionen.
