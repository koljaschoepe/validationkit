# S7 — Legal/DSGVO, Email & Deliverability · Second-Opinion Audit · 2026-06-10
Modell: Fable 5 (claude-fable-5) · Methode: static + targeted dynamic · read-only

## Threat-Model & In-Scope-Annahmen
- **Angreifer/Risiko-Quellen:** (a) Abmahn-Anwalt / Wettbewerber, der §5-DDG- und Art.-13-DSGVO-Verstöße sucht; (b) DACH-B2B-Kunde bzw. dessen DSB, der DPA/Subprozessor-/Retention-Zusagen gegen die Realität prüft; (c) Datenschutz-Aufsichtsbehörde nach Beschwerde; (d) Spam-Filter/Mailbox-Provider (Gmail/Outlook), die Zustellung transaktionaler Mails entscheiden.
- **Kronjuwelen:** Rechtssichere Pflichtseiten (Impressum/Datenschutz/AVV) · Wahrheit der vertraglichen Zusagen (DPA, Subprozessoren, Retention) · Zustellbarkeit der Magic-Link-Mail (= einziger Login-Pfad!) · PII in Mail-Metadaten (IP/UA).
- **Explizit out-of-scope (Known-Issues-Filter §7.0 + User-extern):** Impressum-Platzhalter-Daten ausfüllen, Domain-Kauf (validationkit.app), Stripe-Live-KYC, Sentry/Upstash — alles User-extern. „Impressum + Datenschutz fehlen" (Erst-Audit-Kill) — Seiten existieren inzwischen; ich melde nur NEUE Aspekte. Member-Invite-Mail (Bundle G) — verifiziere nur den Status. B2C-Cookie-Banner (DACH-B2B, 0 Analytics).
- **Annahme:** Prod-Deployment folgt dem dokumentierten Runbook (`docs/operations/deploy.md` + `secrets-rotation.md`); Vercel-Env konnte nicht eingesehen werden.

## Dynamische Checks (ausgeführt)
- Alle /legal-, /trust-, Footer-Links per `curl` gegen lokalen Dev-Server: **alle 200** (`/privacy` → 307 → `/legal/datenschutz` → 200; `/dashboard` → 307 Auth-Redirect; `/api/audit-trail` anonym 404 = dokumentiertes By-Design-Verhalten). *Abweichung:* eigener Server auf :3107 nicht startbar (Next 16 Single-Instance-Lock, Dev-Server :3000 lief bereits) → rein lesende GETs gegen die laufende :3000-Instanz.
- Alle 5 Email-Templates aus `packages/auth/dist` real gerendert (HTML + plain-text) und via SMTP :1025 an Mailpit zugestellt; per Mailpit-API (:8025) verifiziert: 5/5 zugestellt, `multipart/alternative`, Impressum+Datenschutz-Footer-Links in allen 5, Anbieterkennzeichnung „Kolja Schöpe (Einzelunternehmen, Deutschland)" vorhanden, **kein** `List-Unsubscribe`-Header, `html lang="en"`, Datumsformat en-US („July 1, 2026"). de-DE-Rendern nicht möglich — Templates haben keinen Locale-Parameter (siehe S7-06).
- `gh repo view --json isPrivate` → Repo ist **public** (DPA-Verweis auf TIA „in our public repo" hält).
- AGB-Zahlen gegen Code geprüft: Rate-Limits 60/200/1000/5000 = `rate-limit.ts:31`, Credits Quick 1 / Deep 5 = `intensity.ts:10`, 12-Monats-Pack-Expiry = `webhook/route.ts:536` — alle korrekt.

## Findings (Übersicht)
| ID | Severity | go-live-blocker | Titel | file:line | verification |
|----|----------|-----------------|-------|-----------|--------------|
| S7-01 | Kill | yes | Magic-Link-Absender in Prod = `onboarding@resend.dev` — Runbook dokumentiert `RESEND_FROM`, Code liest es nie | packages/auth/src/server.ts:148 | verified |
| S7-02 | Weak | no | Subprozessor-Split-Brain: /legal-Seite vs. JSON/RSS-Feed widersprechen sich (Status, Regionen) | apps/web/src/lib/sub-processors.ts:34 | verified |
| S7-03 | Weak | no | Versprochene 12-Monats-Audit-Trail-Retention hat keinen Lösch-Mechanismus | packages/inngest/src/functions/index.ts:8 | verified |
| S7-04 | Weak | no | Retention-Widersprüche zwischen DPA (30 Tage), Datenschutz (12 Monate) und Trust (12 Monate) | apps/web/src/app/legal/dpa/page.tsx:44 | uncertain |
| S7-05 | Weak | no | DPA verspricht Self-Service-„Export of all workspace data" in Settings — Feature existiert nicht | apps/web/src/app/legal/dpa/page.tsx:136 | verified |
| S7-06 | Mid | no | Emails durchgehend en-US (Sprache, Datumsformate, `lang="en"`) ohne Locale-Mechanismus für DACH-Zielmarkt | packages/auth/src/emails/PlanChangeConfirmation.tsx:44 | verified |
| S7-07 | Mid | no | Kein List-Unsubscribe (RFC 8058), kein Bounce-/Suppression-Handling, Notification-Preferences nur Disabled-Preview | packages/auth/src/emails/sender.ts:72 | verified |
| S7-08 | Mid | no | Account-Lösch-Bestätigungsmail laut Code-Kommentar „wired in Bundle G" — nirgends verdrahtet | apps/web/src/lib/account-actions.ts:70 | verified |
| S7-09 | Mid | no | Impressum/Datenschutz von /login, /pricing und der eingeloggten App aus nicht direkt erreichbar | apps/web/src/components/SiteNavLinks.tsx:14 | verified |
| S7-10 | Mid | no | Invertierte Badge-Logik auf Subprozessor-Seite: Nicht-EU-Prozessor würde „EU-only" gelabelt | apps/web/src/app/legal/subprocessors/page.tsx:99 | verified |
| S7-11 | Mid | no | Trust-Page-Staleness: widersprüchliche Versions-Footer, veraltete Milestone-/GitHub-App-Claims; Expirer sendet nur 1-Tages-Warnung statt dokumentierter 30/7/1 | apps/web/src/app/trust/page.tsx:351 | verified |
| S7-12 | Strong | no | Legal-Stack vollständig + konsistent verlinkt; DPA-Acceptance-Audit-Log + Art.-17-PII-Scrub deckungsgleich mit Datenschutz-Zusagen | apps/web/src/lib/pii-scrub.ts:17 | verified |
| S7-13 | Strong | no | Member-Invite-Mail existiert, wird versendet (live in Mailpit verifiziert) — Erst-Audit-Kill K-EM1 geschlossen | apps/web/src/lib/membership.ts:147 | verified |
| S7-14 | Strong | no | Magic-Link-Hygiene: gehashte Token-Speicherung, 10-min-TTL, 3/10min-Rate-Limit, IP/UA-Transparenz in Mail + Datenschutzerklärung | packages/auth/src/server.ts:121 | verified |

## Findings (Detail)

### S7-01 · Magic-Link-Absender in Prod = `onboarding@resend.dev` · Kill · go-live-blocker: yes
- **Evidenz:** `packages/auth/src/server.ts:147-151`
  ```ts
  await transport.sendMail({
    from:
      process.env.SMTP_FROM ??
      (useResend ? "onboarding@resend.dev" : "auth@validationkit.local"),
    to: email,
  ```
  Dazu `docs/operations/secrets-rotation.md:30-32`: „`SMTP_HOST` / `SMTP_PORT` / `SMTP_FROM` (**Local-Dev only**) … **Prod: Nicht setzen** (Resend-Pfad nimmt Vorrang)" — und dieselbe Datei dokumentiert `RESEND_FROM` als Prod-Sender-Env. `grep -rn RESEND_FROM` über den gesamten Code: **0 Treffer** — die Variable wird nirgends gelesen.
- **Impact/Exploit-Pfad:** Wer das eigene Runbook befolgt (SMTP_FROM in Prod nicht setzen, RESEND_FROM setzen), schickt jede Magic-Link-Mail von Resends Sandbox-Absender `onboarding@resend.dev`. Resend stellt von dieser Test-Adresse nur an die eigene Account-Email zu — Sign-in-Mails an Kunden werden abgelehnt bzw. landen bestenfalls als Fremd-Domain-Phishing-Kandidat im Spam. Magic-Link ist der **einzige** Login-Pfad → kein Kunde kann sich einloggen. Begründung Kill: blockt den Launch funktional (Login tot per Runbook), unabhängig von Legal.
- **Confidence:** high (Code+Doc-Mismatch ist sicher; nur falls SMTP_FROM entgegen dem Runbook doch in Vercel gesetzt würde, wäre der Effekt maskiert)
- **Verifikation:** verified — Widerlegung versucht: (1) „Liest ein anderer Pfad RESEND_FROM?" → repo-weiter grep: 0 Treffer. (2) „Gilt der Fallback nur für Dev?" → Nein, `useResend`-Zweig ist genau der Prod-Pfad (RESEND_API_KEY gesetzt). (3) „Nutzt der Magic-Link-Versand vielleicht sender.ts mit gutem Default?" → Nein, `server.ts` hat einen eigenen `transport.sendMail` ohne den `notifications@validationkit.app`-Default aus `sender.ts:73` (zweite Inkonsistenz: zwei verschiedene Default-Absender).
- **Fix-Richtung (1 Satz, kein Code):** `RESEND_FROM` (mit Fallback `SMTP_FROM`) in beiden Sende-Pfaden lesen und das Secrets-Inventar mit dem Code synchronisieren.

### S7-02 · Subprozessor-Split-Brain (Seite vs. Feed) · Weak · go-live-blocker: no
- **Evidenz:** `apps/web/src/lib/sub-processors.ts:70-75` (speist `/trust/sub-processors.json` + `.xml`)
  ```ts
  id: "stripe", … status: "planned",
  // resend: regions: ["EU-pinned"]
  // inngest/anthropic/openai: status: "planned"
  ```
  vs. `apps/web/src/app/legal/subprocessors/page.tsx:27-70`: dieselben Anbieter als aktive Subprozessoren, Resend „USA, EU SCC in place", OpenAI „Quick audits (GPT-5-nano default)". Die Trust-Seite (`trust/page.tsx:300-306`) verlinkt Liste, JSON und RSS direkt nebeneinander.
- **Impact/Exploit-Pfad:** Der DPA (§2) autorisiert Subprozessoren per Verweis auf `/legal/subprocessors`; der maschinenlesbare Feed — das beworbene 30-Tage-Notice-Abo-Instrument — meldet für aktiv genutzte Prozessoren „planned" und für Resend eine andere Region („EU-pinned" vs. „USA"). Ein prüfender Kunden-DSB findet widersprüchliche Art.-28-Disclosures; die Notice-Mechanik ist faktisch nicht gepflegt. (`sub-processors.ts:5` behauptet zudem, `docs/legal/sub-processors.md` zu spiegeln — Verzeichnis existiert nicht.)
- **Confidence:** high
- **Verifikation:** verified — (1) „Ist der Feed vielleicht unbenutzt/tot?" → Nein, beide Routen importieren ihn und die Trust-Seite verlinkt sie. (2) „Ist die /legal-Seite die alleinige SSOT per Disclaimer?" → Nein, kein Vorrang-Hinweis auf Seite oder Feed. (3) „Stimmen die Inhalte vielleicht doch überein?" → Direkter Textvergleich: Status- und Regions-Widersprüche bei 4 von 7 Anbietern.
- **Fix-Richtung:** Eine SSOT (lib-Manifest) für Seite, JSON und RSS verwenden und die Einträge einmalig auf den Ist-Stand heben.

### S7-03 · 12-Monats-Retention ohne Lösch-Mechanismus · Weak · go-live-blocker: no
- **Evidenz:** `apps/web/src/app/legal/datenschutz/page.tsx:209` „Audit-Trail-/Nachweisdaten: bis zu 12 Monate." + `trust/page.tsx:332` „**Retention: 12 months.**" — aber `packages/inngest/src/functions/index.ts:8-14`:
  ```ts
  export const functions: any[] = [
    auditRequested, autoTrackRepos, creditAggregator,
    prepaidCreditExpirer, stripeReconcile,
  ];
  ```
  Keine der 5 Functions (und kein anderer Code, grep über delete-Pfade) löscht Audit-Trail-/Event-Rows altersbasiert.
- **Impact/Exploit-Pfad:** Die öffentlich zugesagte Speicherbegrenzung (Art. 5 Abs. 1 lit. e DSGVO) wird technisch nicht durchgesetzt — ab Monat 13 nach Launch widerspricht der Datenbestand der eigenen Datenschutzerklärung; bei einer Auskunfts-/Beschwerde-Prüfung ist das ein belegbarer Verstoß gegen die eigene Disclosure.
- **Confidence:** high
- **Verifikation:** verified — (1) „Gibt es einen Vercel-Cron statt Inngest?" → `vercel.json`/API-Routen: kein Retention-Endpoint. (2) „Löscht der Account-Delete-Pfad das?" → Nein, der scrubbt nur IP/UA (`pii-scrub.ts`), Rows bleiben absichtlich. (3) „Blockt das den Launch?" → Nein: „bis zu 12 Monate" ist eine Obergrenze; bis Juni 2027 existiert kein Datum-überschreitender Datensatz → Weak statt Kill. Hinweis: Team-bekannt als „Retention-Cron"-Restposten im Launch-Master, aber nicht im §7.0-Filter — daher gemeldet.
- **Fix-Richtung:** Täglichen Retention-Cron (Inngest) für die in der Datenschutzerklärung genannten Nachweis-Tabellen mit 12-Monats-Cutoff nachziehen.

### S7-04 · Retention-Widersprüche zwischen den Legal-Dokumenten · Weak · go-live-blocker: no
- **Evidenz:** `apps/web/src/app/legal/dpa/page.tsx:44-47`
  ```tsx
  <strong>Duration:</strong> For the term of the subscription
  agreement, plus a 30-day retention window for audit-trail integrity.
  ```
  vs. `legal/datenschutz/page.tsx:209` („Audit-Trail … bis zu 12 Monate") und `trust/page.tsx:332` („Retention: 12 months"); zusätzlich DPA §7 („delete or return all personal data within 30 days").
- **Impact/Exploit-Pfad:** Für dieselbe Datenkategorie (Audit-Trail) verspricht der AVV 30 Tage, die Datenschutzerklärung und das Trust-Center 12 Monate. Ein Kunde kann sich nach Vertragsende auf die 30-Tage-Zusage berufen, während das System (und die eigene Privacy-Policy) 12 Monate vorsieht — vertraglicher Widerspruch mit Haftungs-/Streitpotenzial.
- **Confidence:** low
- **Verifikation:** uncertain — Widerlegungsversuch: Die 12-Monats-Angabe könnte sich ausschließlich auf ValidationKits *eigene* Nachweis-Pflichten (eigene Verantwortlichkeit) beziehen, die 30 Tage auf Controller-Daten i. S. d. AVV; die Texte trennen das aber nirgends explizit („audit-trail" in beiden). Da die Lesart nicht eindeutig entscheidbar ist: drin mit max. Weak + Confidence low. Zur Klärung fehlt: juristische Definition, welche Tabellen Controller-Daten vs. eigene Compliance-Records sind.
- **Fix-Richtung:** Retention-Matrix einmal definieren (Datenkategorie → Frist → Rechtsgrundlage) und DPA/Datenschutz/Trust daraus konsistent generieren.

### S7-05 · DPA verspricht nicht-existenten Self-Service-Datenexport · Weak · go-live-blocker: no
- **Evidenz:** `apps/web/src/app/legal/dpa/page.tsx:136-138`
  ```tsx
  Export of all workspace data + audit reports is available
  self-service from the workspace settings.
  ```
  Settings-Inventar (`apps/web/src/app/[workspace]/settings/` → ai, api-keys, audit-apply, billing, danger, general, integrations, members, notifications, user, webhooks): kein Export-Feature; repo-weiter grep nach Export-Funktionalität trifft nur den DPA-Text selbst. Einziger Export = `/api/audit-trail` (nur Audit-Trail, verlinkt von /trust, nicht von Settings).
- **Impact/Exploit-Pfad:** Der AVV macht eine vertragliche Zusage (Unterstützung bei Art.-15/20-Anfragen via Self-Service-Export), die ein Kunde am Tag 1 widerlegen kann — Vertrauens- und Vertragsrisiko genau im Dokument, das DACH-Kunden vor Kauf prüfen.
- **Confidence:** high
- **Verifikation:** verified — (1) „Existiert Export woanders (Dashboard/CLI)?" → grep über `apps/web/src` nach export/download-Flows: nur `/api/audit-trail` (Teilmenge, anderer Ort). (2) „Meint der Text den Audit-Trail-Export?" → Nein, „all workspace data + audit reports … from the workspace settings" ist spezifisch. (3) erreichbar/öffentlich? → Ja, /legal/dpa = 200 anonym.
- **Fix-Richtung:** Entweder den DPA-Satz auf den real existierenden Audit-Trail-Export + Email-Prozess abschwächen oder den Workspace-Export bauen, bevor zahlende Kunden den AVV akzeptieren.

### S7-06 · Emails durchgehend en-US ohne Locale-Mechanismus · Mid · go-live-blocker: no
- **Evidenz:** `packages/auth/src/emails/PlanChangeConfirmation.tsx:44-48`
  ```ts
  const dateStr = effectiveAt.toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
  ```
  (identisch `PrepaidPackExpireWarning.tsx:39`); dynamisch verifiziert: gerenderte Mail enthält „July 1[0], 2026", `<html lang="en">`, alle 5 Templates englisch. Kein Locale-Prop, keine i18n-Struktur.
- **Impact/Exploit-Pfad:** Kein Rechtsverstoß (B2B, Servicesprache Englisch zulässig), aber Stilbruch zum deutsch-authoritativen Legal-Stack und zur DACH-Positionierung; das §7.S7-geforderte de-DE-Rendering ist mangels Mechanismus unmöglich. Plan-seitig existiert „AGB-de" als Rest-Politur — Mail-Locale hängt am selben Strang.
- **Confidence:** high
- **Verifikation:** verified — Locale-Parameter gesucht (Props aller 5 Templates): nicht vorhanden; Footer ist deutsch-anteilig („Impressum/Datenschutz"), Rest englisch.
- **Fix-Richtung:** Locale-Prop (de-DE Default für DACH-Workspaces) in Templates + Datums-Formatierung einziehen, sobald die Produktsprache entschieden ist.

### S7-07 · Kein List-Unsubscribe, kein Suppression-/Bounce-Handling · Mid · go-live-blocker: no
- **Evidenz:** `packages/auth/src/emails/sender.ts:72-79`
  ```ts
  const info = await transport.sendMail({
    from: args.from ?? "notifications@validationkit.app",
    to: args.to, subject: args.subject, html, text,
    replyTo: args.replyTo,
  });
  ```
  Keine `headers`/`list`-Option; Mailpit-Header-Dump bestätigt: kein `List-Unsubscribe`. Repo-weiter grep nach suppress/unsubscribe/bounce: 0 Treffer in Mail-Pfaden; `settings/notifications/page.tsx:17` rendert `<NotificationMatrix disabled />` („Preview only — Save is disabled").
- **Impact/Exploit-Pfad:** Alle aktuellen Mails sind transaktional (UWG-§7-konform ohne Opt-out), aber: (a) Hard-Bounces werden nie unterdrückt → wiederholte Sends an tote Adressen drücken die Resend-Domain-Reputation; (b) PlanChange-/Expiry-Warnungen sind grenzwertig „Notification" — ohne Abmelde-Mechanik und ohne funktionierende Preferences gibt es keinen Opt-out-Pfad, falls Volumen wächst (Gmail/Yahoo-Bulk-Sender-Regeln ab 5k/Tag fordern RFC 8058).
- **Confidence:** high
- **Verifikation:** verified — (1) „Setzt Resend selbst Suppression?" → Resend unterdrückt Bounces account-seitig teilweise, aber die App erfährt davon nichts (kein Webhook verdrahtet) — Risiko bleibt app-seitig unsichtbar. (2) „Sind alle Mails strikt transaktional?" → Magic-Link/Invite/PastDue ja; Expiry-Warnung/PlanChange vertretbar — kein akuter Rechtsbruch → Mid, kein Blocker.
- **Fix-Richtung:** Resend-Bounce-Webhook + Suppression-Check vor Send; `List-Unsubscribe`-Header für die Notification-Klasse, sobald Preferences live sind.

### S7-08 · Account-Lösch-Bestätigungsmail nicht verdrahtet trotz Kommentar-Behauptung · Mid · go-live-blocker: no
- **Evidenz:** `apps/web/src/lib/account-actions.ts:70` (Doc-Kommentar von `deleteAccount`)
  ```ts
  * Confirmation email is owned by Bundle G (email infra) — wired there.
  ```
  Call-Site-Inventar von `sendTransactionalEmail` (repo-grep): `membership.ts` (Invite), `stripe/webhook/route.ts` (PlanChange/PastDue), `prepaid-credit-expirer.ts` (Expiry) — kein Deletion-Confirm-Send existiert.
- **Impact/Exploit-Pfad:** Kein Rechtsverstoß (Art. 17 verlangt keine Bestätigungsmail), aber der Kommentar behauptet einen verdrahteten Zustand, der nicht existiert — beim nächsten Audit/Onboarding wird die Lücke fälschlich als erledigt gelesen; der Nutzer erhält nach unwiderruflicher Hard-Löschung keinerlei Beleg.
- **Confidence:** high
- **Verifikation:** verified — alle `sendTransactionalEmail`-Importe geprüft; auch Better-Auth-Hooks (`server.ts`) senden nur Magic-Link.
- **Fix-Richtung:** Entweder die Bestätigungsmail im `deleteAccount`-Pfad senden (vor dem User-Delete) oder den Kommentar auf den wahren Stand korrigieren.

### S7-09 · Impressum von /login, /pricing und App-Shell nicht direkt erreichbar · Mid · go-live-blocker: no
- **Evidenz:** `apps/web/src/components/SiteNavLinks.tsx:14-18`
  ```ts
  const NAV_ITEMS = [
    { href: '/', label: 'Audit' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/trust', label: 'Trust' },
  ] as const;
  ```
  Legal-Links existieren nur im Landing-Footer (`app/page.tsx:42-55`). `/login`: 0 legal-Referenzen; `/pricing`-Footer (Zeile 253-261): nur Preistext; `[workspace]`-Shell: einziger Legal-Link ist AGB auf `settings/billing/page.tsx:331`.
- **Impact/Exploit-Pfad:** §5 DDG verlangt „leicht erkennbar, unmittelbar erreichbar, ständig verfügbar" — Rechtsprechung akzeptiert i. d. R. max. 2 Klicks von jeder Seite. Von /login/App aus geht der Pfad nur über Logo → Landing → Footer (Kenntnis vorausgesetzt) bzw. /trust → Documents-Card; das ist abmahn-anfällig, wenn auch verteidigbar.
- **Confidence:** mid
- **Verifikation:** verified (Befund) — Gegenprobe: SiteNav ist auf /login/pricing/trust präsent und verlinkt /trust, dessen Documents-Card Impressum verlinkt → formal 2 Klicks erreichbar; deshalb Mid statt Weak und kein Blocker.
- **Fix-Richtung:** Impressum+Datenschutz-Mikro-Footer in SiteNav-Surfaces und die App-Shell (Settings-Layout-Footer) aufnehmen.

### S7-10 · Invertierte Badge-Logik auf der Subprozessor-Seite · Mid · go-live-blocker: no
- **Evidenz:** `apps/web/src/app/legal/subprocessors/page.tsx:98-100`
  ```tsx
  <Badge variant="secondary" className="text-[10px]">
    {s.region.includes("EU") ? "EU SCC + TIA" : "EU-only"}
  </Badge>
  ```
- **Impact/Exploit-Pfad:** Die Semantik ist verdreht: ein Eintrag, dessen Region-String **kein** „EU" enthält (reiner US-Prozessor), bekäme das Label „EU-only" — die falscheste mögliche Aussage auf einer Compliance-Seite. Aktuell latent (alle 7 Strings enthalten „EU"), bricht beim ersten neuen US-Eintrag.
- **Confidence:** high
- **Verifikation:** verified — alle aktuellen `region`-Werte geprüft (alle matchen „EU" → Anzeige heute korrekt); Logik-Inversion bleibt objektiv falsch.
- **Fix-Richtung:** Explizites `transferMechanism`-Feld statt String-Sniffing auf der Region.

### S7-11 · Trust-Page-/Doku-Staleness (Versionen, Milestones, Warn-Kadenz) · Mid · go-live-blocker: no
- **Evidenz:** `apps/web/src/app/trust/page.tsx:351` „ValidationKit v0.0.14" vs. `trust/dpa/page.tsx:139` „v0.0.15" vs. `@vk/web@0.0.20` (Dev-Server-Log). Außerdem `trust/page.tsx:222-235`: „No GitHub App live … LocalGitClient writing patch files" (Stand widerspricht GitHub-App-Webhook-Infra in `packages/github-app`), M3/M8-Milestones ohne Datum. Email-seitig: `PrepaidPackExpireWarning.tsx:19-21` dokumentiert „Sent three times … 30, 7, and 1 day(s)", der Cron sendet nur 1-Tag (`prepaid-credit-expirer.ts:132,142`, beide `daysUntilExpiry: 1`).
- **Impact/Exploit-Pfad:** Das Trust-Center ist das Honest-Framing-Aushängeschild; intern widersprüchliche Versionsnummern und veraltete Capability-Aussagen untergraben genau die Glaubwürdigkeit, die die Seite herstellen soll. Die 30/7/1-Behauptung ist (noch) nur Code-Doku, keine Kundenzusage → Mid.
- **Confidence:** high
- **Verifikation:** verified — Versions-Strings + Cron-Code direkt zitiert; „GitHub App planned" gegen `packages/github-app`-Existenz geprüft (Webhook-Code vorhanden — mindestens die Formulierung ist stale).
- **Fix-Richtung:** Versionsnummer zentral beziehen und Trust-Claims einmal pro Release gegen den Feature-Stand abgleichen.

### S7-12 · Legal-Stack vollständig + DPA-Acceptance/PII-Scrub konsistent · Strong · go-live-blocker: no
- **Evidenz:** `apps/web/src/lib/pii-scrub.ts:17-32` (NULLt IP/UA auf `installDecision`/`applyAction`/`dpaAcceptance` **vor** dem User-Delete) — deckungsgleich mit Datenschutz §5 („IP/User-Agent … bei Konto-Löschung anonymisiert"); `dpa-actions.ts:70-84` idempotentes Acceptance-Log (UNIQUE user+version, IP/UA, onConflictDoNothing) wie auf /trust/dpa offengelegt; `account-actions.ts:82-96` blockt Delete bei Sole-Ownership. Alle Pflichtseiten (Impressum §5 DDG, Datenschutz Art. 13 inkl. Drittland/SCC/DPF, AGB, AVV, Subprozessoren, TIA) existieren, sind anonym erreichbar (curl 200) und wechselseitig verlinkt; persönliche Gmail aus dem DPA-Flow ist vollständig entfernt (repo-grep „gmail": 0 Treffer).
- **Impact:** Erst-Audit-Kill „Impressum/Datenschutz fehlen" ist substanziell geschlossen — verbleibend nur die bekannten User-externen Platzhalter (Anschrift/Telefon/USt-IdNr, `impressum/page.tsx:22-35`) und die ausstehende anwaltliche Review (auf den Seiten selbst transparent deklariert).
- **Confidence:** high · **Verifikation:** verified (statisch + curl).
- **Fix-Richtung:** — (Positiv-Befund; Platzhalter-Ausfüllen bleibt User-Task.)

### S7-13 · Member-Invite-Mail existiert und wird versendet · Strong · go-live-blocker: no
- **Evidenz:** `apps/web/src/lib/membership.ts:147` (`await sendInviteEmail(...)` nach dem Membership-Insert, Soft-Fail-Semantik) + `MemberInviteEmail.tsx` mit Footer/Plain-Text; dynamisch in Mailpit zugestellt + Inhalt verifiziert (Accept-URL, Anbieter-Footer).
- **Impact:** Erst-Audit-Kill K-EM1 („Invite verschickt keine Email") ist geschlossen — als Status-Verifikation gemeldet, nicht als Neu-Fund.
- **Confidence:** high · **Verifikation:** verified (Code + Live-Render + Mailpit-API).
- **Fix-Richtung:** —

### S7-14 · Magic-Link-Hygiene vorbildlich · Strong · go-live-blocker: no
- **Evidenz:** `packages/auth/src/server.ts:121-130`
  ```ts
  magicLink({
    expiresIn: 600,
    storeToken: "hashed",
  ```
  plus Rate-Limit `"/sign-in/magic-link": { window: 600, max: 3 }` (Zeile 110) und IP/UA-Transparenz im Mail-Body — in der Datenschutzerklärung als Art.-6(1)(f)-Verarbeitung offengelegt.
- **Impact:** Token-Leak via DB-Dump nutzlos (Hash), 10-min-TTL deckt sich mit Mail-Text, Email-Bombing gedrosselt. Disclosure und Code stimmen überein.
- **Confidence:** high · **Verifikation:** verified.
- **Fix-Richtung:** —

## Geprüft & verworfen (refuted)
| Vermutung | Warum verworfen |
|-----------|-----------------|
| AGB-Zahlen (Rate-Limits, Credit-Kosten, Pack-Expiry) stimmen nicht mit Code überein | `rate-limit.ts:31-37` (60/200/1000/5000), `intensity.ts:10-13` (1/5), `webhook/route.ts:536-538` (12 Monate) — alle AGB-Claims exakt belegt |
| DPA-Verweis „TIA … in our public repo" ist toter Verweis (Repo privat) | `gh repo view` → `isPrivate:false`; `docs/operations/transfer-impact-assessment.md` existiert |
| `/api/audit-trail` liefert 404 → Trust-Export kaputt | Anonymes 404 ist dokumentiertes By-Design-Verhalten („no side-channel", `trust/page.tsx:344`) |
| Persönliche Gmail noch im öffentlichen DPA-Flow (Erst-Audit-Fund) | repo-weiter grep „gmail" über src: 0 Treffer; Kontakt = legal@/datenschutz@validationkit.app |
| Email-Footer-Links zeigen in Prod auf localhost | Fallback-Kette endet auf `https://validationkit.app` (`EmailFooter.tsx:15-18`); `deploy.md:29-30` schreibt `NEXT_PUBLIC_APP_URL`-Setzen vor — verbleibendes Risiko ist der bekannte User-externe Domain-Kauf |
| Datenschutz-Cookie-Liste unvollständig/falsch | `vk_default_workspace_slug` + `sidebar` in `proxy.ts`/`workspace-actions.ts`/`[workspace]/page.tsx` real vorhanden; Better-Auth-Session-Cookie korrekt benannt |

## Out-of-Scope-Notizen (je 1 Zeile, nicht vertieft)
- Impressum-Platzhalter (Anschrift/Telefon/USt-IdNr) + Domain-Kauf + DKIM/SPF/DMARC-Setup in Resend = bekannte User-externe Tasks.
- AGB nur englisch („AGB-de" ist deklarierter Rest im Launch-Master) — B2B vertretbar, deutsche Fassung ausstehend.
- Anwaltliche Review von AGB/DPA/TIA ist auf allen Dokumenten transparent als ausstehend deklariert (bewusste Entscheidung, Master-Plan §11).

## Completeness self-check
- **Nicht erreicht/gelesen:** Vercel-Prod-Env (ob SMTP_FROM/NEXT_PUBLIC_APP_URL real gesetzt sind — S7-01-Impact hängt daran); Resend-Account-Konfiguration (Domain-Verifizierung, account-seitige Suppression); DPA-§3-Claim „7-day workspace event log" nicht bis zum Code verfolgt; `/trust/eval`-Inhalt nur per Status-Code geprüft; Stripe-Rechnungs-Pflichtangaben (Reverse-Charge-Note) nur als AGB-Text, nicht als echte Invoice geprüft.
- **Unbestätigte Annahme:** dass Prod dem Runbook folgt (Basis von S7-01); dass Resends `onboarding@resend.dev`-Restriktion (nur Owner-Adresse) unverändert gilt — der Code/Doc-Mismatch (RESEND_FROM ungelesen) steht unabhängig davon.
- **Methodische Abweichung:** kein eigener Dev-Server auf :3107 möglich (Next-16-Single-Instance-Lock gegen laufenden :3000-Server) → Link-Checks als rein lesende GETs gegen die bestehende Instanz; de-DE-Template-Rendering unmöglich, da Templates keinen Locale-Parameter besitzen (als S7-06 gemeldet statt blockiert).
