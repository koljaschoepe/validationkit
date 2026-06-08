# Wave-2 · Deep-Audit 05 — Legal · DSGVO · DACH-B2B-Compliance

**Auditor:** Claude (read-only, code-level inventory)
**Date:** 2026-06-06
**Disclaimer:** I am NOT a lawyer. Wherever legal text is required, the recommendation
is "consult a Fachanwalt für IT-Recht" or use a template-provider
(Termly · iubenda · eRecht24 · Trusted Shops Legal). All Severity-Bands are
risk-assessment, not legal advice.
**Scope:** What blocks a German B2B paying customer from completing sign-up +
checkout today? Code-level findings with `file:line` + fix-direction.

---

## Executive Summary

**Verdict: NOT LAUNCH-READY for DACH-B2B paying customers.**

The good news: Stripe Tax + Reverse-Charge + Subprocessors-Liste + DPA-Template
are in place — this is more than most $19/mo competitors at this stage. The blocking
gaps are concentrated in three areas:

1. **Impressum + Datenschutzerklärung are not implemented at all.** §5 TMG +
   §13 DDG-Pflicht — without these, the site is sofort-abmahnfähig in Germany.
   This is the single biggest blocker.
2. **GDPR Art. 17 (Löschung) is mailto-stubbed.** Wave-1 S15 confirmed:
   account-delete + workspace-delete + session-revoke all show
   "Coming with nova-2-settings-backend" and link to `mailto:support@…`.
3. **Transactional emails carry no Impressum-Footer** — Pflicht per §5 TMG
   für jede geschäftliche E-Mail (analog Geschäftsbrief, BGH-Rspr.).

The Trust Center + DPA template + Subprocessors page + AGB-Draft already cover
~50 % of the surface. Closing the remaining 50 % is roughly 2 dev-days of code
+ ~3–5 user-days for legal-content (Anwalts-Review oder Generator-Lauf).

**Counts:**

| Severity | Count | Topic |
|----------|-------|-------|
| Kill | 6 | Impressum missing · Datenschutzerklärung missing · Art. 17 stub · §5 TMG-Pflicht email-footer · TIA-Doc broken-link · DPA-contact email = personal Gmail |
| Strong | 8 | Domain-Inkonsistenz (.app / .dev / -ai) · Session-Revoke stub · Profile-Edit stub · Newsletter-Page stub mentions opt-in but no consent surface · cookie-banner-decision undokumentiert · OSS-Notice fehlt · `docs/legal/*.md` Files fehlen · AVV-Download als PDF fehlt |
| Mid | 9 | AGB §X klärungsbedürftige Klauseln · SLA-implying Sprache · Verzugszinsen-Klausel fehlt · §147 AO Aufbewahrung nicht prominent · Audit-Trail-Retention-Statement nicht in DSE · Data-Export ist workspace-scoped not user-scoped (Art. 20 lückenhaft) · DPA-Acceptance-Audit-Log undokumentiert in DSE · Cookie-Notice Better-Auth-Cookies erwähnen · Stripe-Portal-Configuration nicht code-gepinnt |
| Weak | 5 | Faviconisierte Legal-Footer-Links · Trust-Center linkt zu nicht-existenten `.md`-Docs · sitemap.ts deindexiert nichts · AGB englisch — DACH-Käufer erwartet de · Status-Page-Disclaimer (kein SLA-Implikat) |

---

# Part A: Legal-Pages Inventory

## A.1 Existing Pages

| Route | File | Last-modified (filesystem) | Linked from |
|-------|------|---------------------------|-------------|
| `/legal/agb` | `apps/web/src/app/legal/agb/page.tsx` | 2026-05-21 | `/legal/dpa` body, `/legal/subprocessors` footer, `/[workspace]/settings/billing` footer `:340` |
| `/legal/dpa` | `apps/web/src/app/legal/dpa/page.tsx` | 2026-05-21 | `/legal/agb` body, `/legal/subprocessors` footer |
| `/legal/subprocessors` | `apps/web/src/app/legal/subprocessors/page.tsx` | 2026-05-21 | `/legal/agb` + `/legal/dpa` body |
| `/trust` | `apps/web/src/app/trust/page.tsx` | 2026-05-21 | `SiteNav` primary nav (`SiteNavLinks.tsx:16`), footer of `/` (`page.tsx:24`) |
| `/trust/dpa` | `apps/web/src/app/trust/dpa/page.tsx` | 2026-05-20 | `/trust` Documents-card `:294` |
| `/trust/sub-processors.json` | `apps/web/src/app/trust/sub-processors.json/route.ts` | 2026-05-18 | `/trust` `:300` |
| `/trust/sub-processors.xml` | `apps/web/src/app/trust/sub-processors.xml/route.ts` | 2026-05-18 | `/trust` `:302` (RSS feed) |
| `/trust/eval` | `apps/web/src/app/trust/eval/page.tsx` | 2026-05-21 | `/trust` `:308` |

## A.2 Footer Inventory

`apps/web/src/app/page.tsx:13-36` — landing footer has ONLY 3 links:

```
Pricing  ·  Trust  ·  Status
```

**Missing:** Impressum · Datenschutz · AGB · Sub-Processors · DPA. The legal pages
exist but no public surface (footer / nav) links to them outside cross-links between
`/legal/*` pages themselves.

## A.3 Page-Content Verdict

| Document | Existing? | Content quality | Lawyer-reviewed? | Blocking? |
|----------|-----------|-----------------|------------------|-----------|
| **Impressum (§5 TMG)** | **❌ MISSING** | n/a | n/a | **Kill** |
| **Datenschutzerklärung (DSE)** | **❌ MISSING** | n/a | n/a | **Kill** |
| AGB (B2B-variant) | ✅ Draft, 8 sections | Reasonable B2B-shape, English | "Anwaltliche Review steht aus" (`/legal/agb/page.tsx:197`) | Strong |
| AVV / DPA template | ✅ Draft on `/legal/dpa` + `/trust/dpa` | 7 sections, GDPR Art. 28 structure, accept-button writes audit-log | Drafted, "Lawyer-review M8" | Strong |
| Subprocessors-Liste | ✅ 7 sub-processors enumerated | Complete | n/a | Mid (see B.3 corrections) |
| Cookie-Notice | n/a — kein Banner | No analytics/marketing cookies set; only `vk_default_workspace_slug` + Better-Auth session-cookie (both strictly-necessary) | n/a | Weak (statement nötig in DSE) |
| Trust-Page | ✅ Comprehensive | Concession-then-Critique Pattern, gut | n/a | — |
| Newsletter-Consent | Settings-stub-only | `account/settings/notifications/page.tsx:10` mentions "weekly digest opt-in" — but no consent capture, no DOI-flow | n/a | Strong (wenn Newsletter geplant) |

---

# Part B: GDPR Compliance Surface

## B.1 User-Rights Implementation (Art. 15-22)

| Right | Article | Implemented? | Where? | Severity |
|-------|---------|--------------|--------|----------|
| Auskunft | Art. 15 | Partially | `/api/audit-trail?format=json` exports workspace-scoped data (`apps/web/src/lib/audit-trail-export.ts:34`). **No user-level Auskunft** (user-account-data + sessions + memberships across all workspaces). | Mid |
| Berichtigung | Art. 16 | Stub | `account/settings/profile/page.tsx:31` — "Editable name / avatar / locale lands with nova-2-settings-backend." Only read-only `Email` + `User ID` exposed today. | Strong |
| Löschung | Art. 17 | **NOT IMPLEMENTED** | `account/settings/delete/page.tsx:21` — "Coming with nova-2-settings-backend." Falls back to `mailto:support@validationkit.dev`. Workspace-Delete identical: `[workspace]/settings/danger/page.tsx:30` "Not yet available." | **Kill** |
| Einschränkung | Art. 18 | NOT IMPLEMENTED | No UI for "Verarbeitung einschränken." Workspace-Disable not separable from cancel-subscription. | Mid |
| Datenübertragbarkeit | Art. 20 | Partial | `/api/audit-trail` provides JSON/CSV (machine-readable ✓), BUT workspace-scoped — user owning multiple workspaces would need N exports. No `account/data-export` for user-bound data. | Mid |
| Widerspruch | Art. 21 | NOT IMPLEMENTED | No opt-out toggle for "berechtigtes Interesse"-Verarbeitung (e.g. Telemetry — if added later). | Weak (kein Telemetry-SDK noch installed, siehe D.4) |
| Automatisierte Entscheidung | Art. 22 | n/a | Audits sind keine automatisierte Entscheidung mit Rechtsfolge gegenüber Subject. | — |

**Kill-Begründung Art. 17:** German B2B-Käufer fragt im POC-Gespräch *garantiert*
"Wie löschen wir das Konto wenn wir kündigen?" Der `mailto:support@` ist
GDPR-konform (manuell möglich), aber:

- Mailto-Fallback signalisiert Beta-Reifegrad → enterprise-disqualifying.
- Wave-1 hat S15 bereits priorisiert.
- §17 erlaubt 30 Tage Frist — manuelle Bearbeitung ist *technisch* OK, aber
  ohne UI-Pfad muss jede Anfrage manuell tracked werden → Skalierungsfalle.

## B.2 Legal-Basis per Datacategory (Art. 6)

Status: **nirgends im Code dokumentiert.** Muss in DSE rein (siehe E.2).

| Datenkategorie | Empfohlene Rechtsgrundlage | Aktueller Code-Bezug |
|---------------|----------------------------|----------------------|
| Account-Email · User-ID · Sessions | Art. 6 (1) b — Vertragserfüllung | `schema.user`, `schema.session` (`packages/db/src/schema.ts:30+`) |
| Workspace · Membership · Repo-Settings | Art. 6 (1) b | `schema.workspace`, `schema.membership`, `schema.repo` |
| Stripe-Customer-ID · Tier · Period-Dates | Art. 6 (1) b + (1) c (§147 AO) | `schema.subscription`, Stripe-DB (subprocessor) |
| Rechnungen | Art. 6 (1) c — §14 + §14b UStG, §147 AO (10 J. Aufbewahrung) | Stripe-side |
| Scan-Inhalte (Repo-Content beim Audit) | Art. 6 (1) b + AVV (Auftragsverarbeitung) — Customer ist Controller, ValidationKit ist Processor | `schema.scan`, `schema.finding` |
| Magic-Link-Email (IP + UA im Body) | Art. 6 (1) f — Berechtigtes Interesse (Sicherheit), Art. 32 GDPR | `MagicLinkEmail.tsx:137`, server-side `request?.headers` lookup `auth/server.ts:95-99` |
| Session-IP + UA in `schema.session` | Art. 6 (1) f — Sicherheit | Better-Auth default |
| DPA-Acceptance-Audit-Log | Art. 6 (1) f — Nachweispflicht Art. 7 (1) GDPR | `lib/dpa-actions.ts`, schema TBD-confirmed |
| Webhook-Events | Art. 6 (1) f — Operativer Audit-Trail | `schema.webhookEvent` |

## B.3 Subprocessors-Liste — Audit + Corrections

Source: `apps/web/src/app/legal/subprocessors/page.tsx:27-70` (auch
`apps/web/src/lib/sub-processors.ts`).

| Processor | Eingetragen als | Stand der Realität | Fix |
|-----------|----------------|--------------------|-----|
| Anthropic, PBC | "USA (AWS us-east-1) — EU SCC + TIA in place" | ✅ Korrekt seit Anthropic EU-DPA (2024+). | — |
| **OpenAI Ireland Ltd** | Region "USA (Azure)" — name = Ireland-Entity | ⚠ Inkonsistenz: wenn DPA mit OpenAI **Ireland Ltd** geschlossen wird, ist Hosting in der EU mit Subprocessor-Chain US. Für DSGVO ist primärer Kontraktpartner relevant. | Verify in OpenAI DPA portal — wenn Vertrag mit OpenAI LLC (US) → ändern auf "OpenAI LLC, San Francisco" wie task-text vorgegeben |
| Stripe Payments Europe Ltd | Ireland + USA | ✅ Korrekt — Stripe Payments Europe Ltd. (Dublin) ist DPA-Counterpart. | — |
| Vercel Inc. | "USA + EU (deployment region pinning available)" | ✅ ok. Anmerkung: Vercel ist **Data Privacy Framework (DPF)**-zertifiziert seit 2023 — kann den Adequacy-Decision-Pfad statt SCC nutzen. Erwähnen in TIA. | Stronger statement: "Adequacy via EU-US DPF + SCC backup" |
| Neon Inc. | "EU (Frankfurt) primary; USA replica" | ✅ ok. | Verify in Neon dashboard ob primary region tatsächlich Frankfurt — Code-Pinning fehlt aktuell (siehe Wave-1 Infra-Audit). |
| Resend Inc. | "USA — EU SCC in place" | ✅ ok. Resend ist **DPF**-zertifiziert. | DPF-Zertifizierung erwähnen. |
| Inngest Inc. | "USA — EU SCC in place" | ✅ ok. | — |
| **GitHub Inc.** | **❌ FEHLT in der Liste** | GitHub OAuth ist anvisiert (Better-Auth `account` table hat `provider` column), und ein GitHub App ist auf der Roadmap. Sobald `provider="github"` Zeilen existieren, ist GitHub Subprocessor für Auth-Identität. | Add GitHub Inc. (San Francisco, SCC + DPF) bei OAuth/App go-live |

**Subprocessor-Notification:** AGB §X commits zu "30-day notice before adding/replacing
a sub-processor" (`/legal/agb/page.tsx:107`, `/legal/subprocessors/page.tsx:126`).
Mechanismus für die E-Mail-Notification fehlt aktuell im Code — kein Inngest-Job, kein
Admin-UI um Subprocessor-Update zu triggern. Erst manuell OK, aber dokumentieren.

## B.4 AVV (Auftragsverarbeitungsvertrag) — Status

| Anforderung | Status | Severity |
|------------|--------|----------|
| Template downloadbar via `/legal/dpa` | ✅ HTML-Version | Mid (PDF-Variante fehlt) |
| `/trust/dpa` Accept-Flow + Audit-Log | ✅ Implementiert, schreibt user-ID + version + IP + UA | Mid (Schema-Verify offen) |
| PDF-Variante zum Download / Anhang an E-Mail | ❌ Fehlt | Strong (sonst muss Käufer HTML→PDF selbst konvertieren) |
| Pre-signed standard-AVV linkbar aus Settings → Billing → Compliance | ❌ Settings/billing footer linkt nur zu `/legal/agb` (`page.tsx:340`), nicht zu DPA | Mid |
| Audit-Trail Export der DPA-Acceptances pro Workspace | Implizit über `/api/audit-trail`? Nicht klar — DPA-Acceptance ist user-scoped, audit-trail ist workspace-scoped | Strong |
| AVV-Anpassungen für individuelle Großkunden | "contact `legal@validationkit.app`" in `/legal/dpa/page.tsx:128` | Weak |

**Anwaltliche Review:** Beide Dokumente (AGB + DPA) tragen disclaimer "Anwaltliche
Review steht aus" — das ist *ehrlich aber blockierend* für >€500/mo Customers.
Für DACH-B2B-Launch reicht ein einmaliger Anwaltslauf (~€800–2000) der die
Template-basierte AGB/DPA-Variante absegnet.

---

# Part C: DACH-B2B Specifics

## C.1 Impressum-Pflicht (§5 TMG)

**Status: NICHT VORHANDEN — Kill.**

Pflicht-Inhalte für ein deutsches B2B-SaaS:

| Element | §-Pflicht | Wo im Code? |
|---------|-----------|-------------|
| Vollständiger Name (natürliche Person oder Rechtsform + Vertretungsberechtigter) | §5 (1) Nr. 1 TMG | ❌ |
| Anschrift (ladungsfähig — kein Postfach!) | §5 (1) Nr. 1 TMG | ❌ |
| Telefon + E-Mail (oder vergleichbar schnelle elektronische Kommunikation) | §5 (1) Nr. 2 TMG | nur Email |
| USt-ID (sobald vorhanden) | §5 (1) Nr. 6 TMG | ❌ |
| Wirtschafts-ID (optional, ersetzt USt-ID nicht) | §5 (1) Nr. 6 TMG | — |
| Handelsregister-Eintrag (bei Kapitalgesellschaft) | §5 (1) Nr. 4 TMG | n/a (Solo-Founder als Einzelunternehmer reicht "Berufsbezeichnung" nicht — wenn Einzelunternehmer: Vor- + Nachname + Adresse genügen) |
| Aufsichtsbehörde (bei reglementierten Berufen) | §5 (1) Nr. 3 TMG | n/a |
| Berufshaftpflichtversicherung (bei reglementierten Berufen) | §5 (1) Nr. 5 TMG | n/a — SaaS-Software-Anbieter ist nicht reglementiert. Optional aber Vertrauen-Plus. |
| Inhaltlich Verantwortlicher (§18 MStV, ex-§55 RStV) — bei journalistisch-redaktionellen Inhalten | §18 MStV | Blog/News? Aktuell kein redaktioneller Inhalt → nicht nötig |
| EU-ODR-Hinweis (Online-Streitbeilegung) | Art. 14 VO 524/2013 + §36 VSBG | nur bei B2C-Verkäufen Pflicht — B2B-only erspart das. Aber: ValidationKit hat Free-Tier und Self-Service-Checkout → Status "B2B-only" ist nicht hart durchsetzbar. Sicherheitshalber `Wir nehmen nicht an Streitbeilegungsverfahren teil` mit angeben. |

**Fix-Direction:** Neue Route `/legal/impressum` (oder `/imprint`) +
Footer-Link in `apps/web/src/app/page.tsx:13-36`. **Content kommt vom User
nach Beratung mit StB/Anwalt**, Code ist 30min Arbeit.

## C.2 AGB-B2B vs B2C — Verifizierung

`apps/web/src/app/legal/agb/page.tsx` — review der 8 Sections:

| Section | Status | Anmerkung |
|---------|--------|-----------|
| 1. The service | OK | klar abgegrenzt |
| 2. Subscription & credit pricing | OK | gute Transparenz; "Overage = €0.30" passt zu §307 BGB AGB-Transparenz |
| 3. Provider-cost volatility | Strong | 30-day notice ist sauber |
| 4. BYOK option | OK | |
| 5. Fair use & rate limits | Mid | "Sustained abuse may result in temporary suspension after written notice" — Erfüllbarkeit-Klausel sollte Auf-/Abstufung-Mechanismus benennen (welche Severity, welches Verfahren). |
| 6. Refunds & cancellation | Mid | "Non-refundable once purchased" für Prepaid-Packs → B2B ist OK, **aber**: §312k BGB Kündigungsbutton-Pflicht greift für Verbraucher-AGB. Wenn ValidationKit auch B2C-Self-Service-Checkout zulässt, muss der Kündigungsbutton im Workflow integriert sein (nicht nur Stripe-Portal). |
| 7. EU VAT & reverse-charge | OK | "Steuerschuldner: Leistungsempfänger" Formulierung korrekt |
| 8. Liability | Mid | Cap auf "fees paid in the 12 months preceding the claim" + "Statutory liability for intent and gross negligence is unaffected" ist B2B-üblich. **Aber:** Bei wesentlichen Vertragspflichten (Kardinalpflichten) gilt § 309 Nr. 7 BGB analog — Anwalt sollte Klausel checken. Für Datenverlust auch Aufnahme einer Datensicherungs-Mitwirkungspflicht des Kunden empfohlen. |

**Sprache:** Komplett auf Englisch. Für deutsche B2B-Käufer wird häufig die
deutsche Fassung verlangt. Empfehlung: Bilingual mit klarer
Sprachenwahl-Klausel ("Im Konfliktfall gilt die deutsche Fassung"). Sektion `/legal/agb-de`
oder Toggle.

**Fehlende Standardklauseln für DACH-B2B:**
- Verzugszinsen-Klausel: Verweis auf §288 (2) BGB (9 % über Basiszins für B2B).
- Aufrechnungsverbot (außer unbestrittene Forderungen).
- Anwendbares Recht + Gerichtsstand (Sitz des Anbieters bei Kaufleuten).
- Schriftform-Klausel + Salvatorische Klausel (umstritten, aber üblich).
- Höhere Gewalt / Force Majeure.

## C.3 §14 UStG Rechnungspflichtangaben

Stripe Tax kümmert sich um die Mehrwertsteuer-Logik (`billing-actions.ts:82,84`:
`automatic_tax: { enabled: true }`, `tax_id_collection: { enabled: true }`).
Stripe-Rechnungen sind **standardmäßig §14-konform**, sofern in der
Stripe-Dashboard-Konfiguration:

- Account-Name + Anschrift + USt-ID gesetzt
- Branding aktiv (Name auf Rechnung)
- Customer Tax-ID-Collection enabled (✅ im Code)
- Reverse-Charge-Memo-Text gesetzt ("Steuerschuldner: Leistungsempfänger / Reverse Charge per Art. 196 MwSt-SystRL")

**Code-Side:** Stripe-Customer-Portal-Configuration ist NICHT code-gepinnt
(`billing-actions.ts:134`: nur `customer` + `return_url` → relies on Default Portal
Config aus Dashboard). Das ist OK für jetzt, aber:

- Wenn Stripe-Dashboard-Default sich ändert (Stripe rollt manchmal neue Defaults),
  ändert sich Portal-Verhalten ohne Code-Diff → riskant.
- **Fix-Direction (Mid):** Idempotent `stripe.billingPortal.configurations.create` in
  setup-script (`scripts/stripe-test-setup.ts` analog erweitern) + ID in ENV festpinnen,
  dann `configuration: process.env.STRIPE_PORTAL_CONFIG_ID` an `sessions.create` übergeben.

## C.4 §14b UStG + §147 AO Aufbewahrung

**10-Jahre-Aufbewahrungspflicht für Rechnungen.** Stripe speichert Rechnungen,
solange das Stripe-Account aktiv ist. Bei Account-Delete in ValidationKit muss
deshalb explizit geregelt werden:

| Datentyp | Löschen bei Account-Delete? | Begründung |
|----------|-----------------------------|-----------|
| User-Account (`schema.user`) | ✅ ja (nach 30 Tagen Soft-Delete-Window) | Art. 17 GDPR |
| Workspace + Audits + Scans | ✅ ja | Art. 17 GDPR + Storage-Limitation |
| Stripe-Customer-ID, Rechnungen | ❌ behalten bzw. anonymisieren | §147 AO + §257 HGB — 10 Jahre |
| Audit-Trail-Rows (`schema.scan`, `webhookEvent`) | Anonymisieren (statt löschen) | Compliance-Frame-Customer-Anforderung + Inkasso-Beleg |
| DPA-Acceptance-Audit-Log | Behalten | Art. 7 (1) GDPR Nachweispflicht |

`/legal/dpa/page.tsx:138-140` formuliert das bereits korrekt:
> "Deletion requests are processed within 30 days, with billing-trail records
> kept for the statutory tax-retention window (10 years, DE)."

→ DSE muss dasselbe wiederholen. Account-Delete-Backend muss das beim Soft-Delete-Job
respektieren (Wave-1 Bundle-A Plan-Anforderung — explizit als Akzeptanzkriterium
aufnehmen).

## C.5 TTDSG / Cookie-Banner

**Aktuelle Cookies + LocalStorage:**

| Cookie | Set wo | Kategorie | Banner-Pflicht? |
|--------|--------|-----------|-----------------|
| Better-Auth session-cookie | `packages/auth/src/server.ts:78-80`, Better-Auth default | strictly-necessary | Nein (§25 (2) Nr. 2 TTDSG) |
| `vk_default_workspace_slug` | `apps/web/src/app/[workspace]/page.tsx:40` | strictly-necessary (UX-Routing, ohne den müsste man jedes Mal Workspace wählen) | Grenzwertig — eher "berechtigtes Interesse / functional" als "strictly-necessary". Sicherheitshalber in DSE als "funktional, Art. 6(1)f" deklarieren. |
| `sidebar` cookie | `components/ui/sidebar.tsx:85` | UI-Präferenz | Funktional — wie oben |
| Stripe Checkout — Stripe setzt eigene Cookies im embed | Stripe-hosted | Payment-strictly-necessary | Nein |

**Kein Analytics-/Marketing-SDK installiert** (verifiziert via package.json scan:
keine `@vercel/analytics`, `posthog`, `plausible`, `gtag`, `segment`).

**Verdict (TTDSG §25):** Für den aktuellen Zustand ist **kein Cookie-Banner Pflicht**.
Aber in der **Datenschutzerklärung** muss eine Auflistung der Cookies (Name, Zweck,
Speicherdauer, Rechtsgrundlage) enthalten sein.

⚠ Sobald PostHog / Plausible / Vercel-Analytics aktiviert werden (oder die geplante
"telemetry" surface), wird Consent-Banner Pflicht. Plan-Direction: cookie-decision
in `docs/legal/cookie-policy.md` festhalten.

---

# Part D: SaaS-Specific Legal Topics

## D.1 Payment-Terms in AGB

| Aspekt | Status | Anmerkung |
|--------|--------|-----------|
| Vorkasse vs. Rechnung-30-Tage | Implizit Vorkasse (Stripe Subscription) | OK für Self-Service-SaaS. Falls Enterprise-Käufer Net-30 wollen → manueller Override via Stripe-Invoice. |
| §312j BGB Buttonlösung ("Zahlungspflichtig bestellen") | Aktuell B2C-relevant — bei B2B-only entbehrlich, **aber:** Free-Tier-Sign-Up + Self-Service-Upgrade ist defacto B2C-zugänglich | **Mid: Stripe-Checkout-CTA-Text prüfen** — Standard ist "Subscribe" / "Pay". DACH-Compliance verlangt expliziten Text "Zahlungspflichtig bestellen" bzw. analog "Subscribe and pay €X". Stripe Checkout zeigt "Subscribe" — DE-locale müsste auf "Jetzt zahlungspflichtig abonnieren" geändert werden. Lookup: Stripe-Dashboard `Checkout button text` |
| Verzugszinsen B2B (§288 (2) BGB, 9% über Basiszins) | Fehlt in AGB | Mid |
| Kündigungsbutton §312k BGB | Stripe-Portal kann das (`openBillingPortalAction`) | OK aber: dedizierter "Verträge hier kündigen"-Button auf Workspace-Settings-Seite ist DACH-üblich |
| SLA / Verfügbarkeitsgarantien | Status-Page existiert (`/status`), keine harte SLA | OK — aber `/trust` benutzt Sprache wie "What we don't yet do" die kein SLA impliziert. Gut. |

## D.2 Limitation of Liability

`/legal/agb/page.tsx:182-194` Section 8:
- Cap: "fees paid in the 12 months preceding the claim" ✅ B2B-üblich
- Carve-out: "intent and gross negligence is unaffected" ✅ §309 Nr. 7 BGB-konform

**Fehlend:**
- **Kardinalpflichten-Klausel.** Für die Verletzung wesentlicher Vertragspflichten
  (Kardinalpflichten) ist die Haftungsbegrenzung in DACH **nur auf den vertragstypisch
  vorhersehbaren Schaden** zulässig (BGH st. Rspr.). Aktuell fehlt diese
  Differenzierung — Anwalt unbedingt drüberlassen.
- **Datenverlust-Mitwirkungspflicht** des Kunden: Empfehlung dass Kunde
  täglich/wöchentlich eigene Backups der wichtigen Daten zieht → reduziert
  Schadensumfang im Worst Case.
- **Drittanbieter-Disclaimer**: AI-Output (Anthropic/OpenAI) → "no warranty for
  accuracy of LLM-generated content."

## D.3 Service-Level / Uptime

`/status` Page existiert. `/trust` ist sehr ehrlich ("Single-author single-region
single-vendor — bus-factor of one"). **Implizite SLA-Sprache scan:**

```sh
grep -rn "99\..*uptime\|guaranteed\|SLA" apps/web/src
```
→ keine Treffer in UI-Code. ✅ Gut. Keine implizite Zusicherung.

**Empfehlung:** Kurze Sektion in AGB: "ValidationKit strebt eine Verfügbarkeit von
99% (jährlich gemessen) an. Geplante Wartungen werden 24h vorher
angekündigt. Höhere Gewalt + Dritt-Provider-Ausfälle sind ausgeschlossen."
→ Best-effort statt SLA. Klare Sprache verhindert Streit.

## D.4 Open-Source-Lizenzen

**`/legal/oss` oder `THIRD_PARTY_NOTICES.md`: ❌ existiert nicht.**

Stack hat shipped deps wie React, Next.js, Drizzle, motion (Framer-Motion ähnlich),
PixiJS, shadcn-ui (MIT) — alle MIT/Apache-2.0. MIT verlangt Lizenztext-Beilage bei
Distribution, Apache-2.0 verlangt NOTICE-Erhalt.

**Verpflichtung-Stärke:** Bei einem SaaS-Web-App ohne Code-Distribution (Sourcecode
wird nicht an Kunden ausgeliefert) ist die Pflicht stark abgeschwächt — primär
relevant wenn ein OSS-Bestandteil GPL/AGPL ist. Schnellcheck nötig.

```sh
pnpm licenses ls --prod
```

**Empfehlung (Weak):** Generated NOTICES-Page über `pnpm exec license-checker` oder
`@vercel/legal-tools` analog → `/legal/oss` mit auto-list.

---

# Part E: Recommended Action-List

Format: `[Severity]` Action — file:line + Fix-Direction + Effort-Estimate.

## E.1 Kill (Launch-blocking)

1. **[Kill] Impressum-Route fehlt komplett.**
   - File: NEW `apps/web/src/app/legal/impressum/page.tsx`
   - Fix: Static page mit §5 TMG Pflicht-Inhalten. Content vom User
     (Anschrift + ggf. USt-ID + Telefon + Verantwortlicher).
   - Footer-Link in `apps/web/src/app/page.tsx:16-33` + `apps/web/src/app/legal/*/page.tsx` cross-link.
   - Effort: 1h Code + User-Action (Inhalte zusammentragen).

2. **[Kill] Datenschutzerklärung-Route fehlt komplett.**
   - File: NEW `apps/web/src/app/legal/datenschutz/page.tsx` (auch `/privacy` als alias-redirect)
   - Fix: Template aus Termly · eRecht24 · Trusted Shops + Anpassung. Pflicht-Inhalte:
     - Verantwortlicher (Impressum-Sync)
     - Datenarten + Rechtsgrundlage (siehe B.2)
     - Subprocessors (Verweis auf `/legal/subprocessors`)
     - User-Rights (Art. 15-22) + Kontaktwege
     - Speicherdauer pro Datenart
     - Cookies-Tabelle (siehe C.5)
     - Datenübermittlung in Drittländer (SCC + TIA-Verweis)
     - DPO-Kontakt (bei <250 MA oft kein Pflicht-DPO; freiwillig empfohlen)
     - Recht auf Beschwerde bei Aufsichtsbehörde (Landesdatenschutzbehörde des Sitz-Bundeslands)
   - Footer-Link wie Impressum.
   - Effort: 2-3h Code-Page + 1 Anwaltsstunde Review oder 1 Generator-Lauf (Termly €20/mo).

3. **[Kill] Account-Delete + Workspace-Delete + Session-Revoke implementieren (Art. 17 GDPR).**
   - Stub: `apps/web/src/app/account/settings/delete/page.tsx:21` ("Coming with nova-2-settings-backend")
   - Stub: `apps/web/src/app/[workspace]/settings/danger/page.tsx:30` ("Not yet available")
   - Stub: `apps/web/src/app/account/settings/sessions/page.tsx:19` ("Coming with nova-2-settings-backend")
   - Fix-Direction (DELETE):
     1. Server-Action `deleteUserAccountAction()` in neuer `lib/account-actions.ts`:
        soft-delete `user` row → 30-day grace window, dann hard-delete via
        Inngest-Cron. Cascade: `workspace` wo user owner ist + alle `scan`/`finding`/`event`.
        Behalten: `subscription` (anonymisiert) + Stripe-Side-Daten (§147 AO).
     2. UI: Typed-Confirm-Dialog ("Type DELETE to confirm") in `delete/page.tsx`.
     3. E-Mail-Confirmation an User mit 24h-Abbruch-Link.
     4. DPA-Acceptance-Audit-Log + Subscription-Anonymisierungs-Log behalten.
   - Fix-Direction (WORKSPACE-DELETE): analog, owner-only, transfer-ownership-Pfad.
   - Fix-Direction (SESSION-REVOKE): Better-Auth bietet `auth.api.revokeSession()` —
     UI listet `schema.session` mit IP + UA + lastUsedAt, Button feuert Revoke.
   - Effort: 2-3 dev-days (Wave-1 Bundle-A bereits eingeplant). Akzeptanzkriterium:
     **30-Tage-Grace-Window**, **§147 AO-Aufbewahrung respektiert**, **DSGVO Art. 17
     Frist 1 Monat dokumentiert**.

4. **[Kill] §5 TMG E-Mail-Footer-Pflicht — alle Transaktional-Emails brauchen Impressum-Link.**
   - File: `packages/auth/src/emails/MagicLinkEmail.tsx` + alle anderen unter
     `packages/auth/src/emails/*.tsx`
   - Fix: Shared `<EmailFooter />` React-Email-Component mit:
     ```
     ValidationKit · [Anschrift] · [USt-ID]
     Impressum → vk.app/legal/impressum · Datenschutz → vk.app/legal/datenschutz
     ```
   - Begründung: BGH hat klargestellt dass §5 TMG bei jeder geschäftlichen Mail gilt
     (analog zu Geschäftsbriefen, §37a HGB / §35a GmbHG).
   - Effort: 30min Komponenten + 5min × 4 Templates Einfügen.

5. **[Kill] DPA-Kontakt-E-Mail = persönliche Gmail-Adresse.**
   - `apps/web/src/app/trust/dpa/page.tsx:111`: `kol.schoepe@gmail.com`
   - Risk: Persönliche Adresse in einem Compliance-Dokument signalisiert Hobbyist.
     Außerdem nach Kunden-Datenanfrage = Personal-Postfach-Mischung → datenschutzrechtlich
     unsauber.
   - Fix: Auf `legal@validationkit.app` umstellen (Domain reservieren und Catch-all
     einrichten) und konsistent zu `/legal/dpa/page.tsx:128,190` und `/legal/agb/page.tsx:200`.
   - Effort: 5min Code + Domain-Setup.

6. **[Kill] TIA + Legal-Docs gepriesen aber Files fehlen.**
   - `/trust/page.tsx:296-323` listet:
     - `docs/legal/dpa-template.md`
     - `docs/legal/sub-processors.md`
     - `docs/legal/scope-policy.md`
     - `docs/legal/toms-register.md`
     - `docs/legal/incident-response.md`
   - Realität: `docs/legal/` Folder existiert nicht. Nur `docs/operations/transfer-impact-assessment.md` existiert.
   - `/trust/dpa/page.tsx:23-29` lädt `docs/legal/dpa-template.md` und failed mit
     fallback string. → Trust-Page zeigt non-existent files an → Reputationsschaden.
   - Fix: Either dokumente erstellen oder Links entfernen. Empfehlung erstellen
     (`scope-policy.md` ist nur 1 Seite, TIA gibt's, TOMs ist ~3 Seiten Standard-Template).
   - Effort: 2h Doc-Schreiben + Code-Path-Fix in `loadDpaMarkdown()`.

## E.2 Strong (Trust-blocking)

7. **[Strong] Domain-Inkonsistenz: `.app` / `.dev` / `-ai`**
   - `account/settings/delete/page.tsx:26-27` → `validationkit.dev`
   - `/legal/agb/page.tsx:200-203`, `/legal/dpa/page.tsx:128-131,190-193` → `validationkit.app`
   - `/trust/page.tsx:285` → GitHub `validationkit-ai`
   - Fix: Eine Production-Domain wählen, Code + ENV (`NEXT_PUBLIC_APP_URL`) syncen,
     andere als Redirect zur Master-Domain.
   - Effort: 30min Code-Find-Replace + Domain-Registrar-Aktion.

8. **[Strong] User-scope Data-Export für Art. 20 GDPR.**
   - Aktuell `/api/audit-trail` workspace-scoped (`lib/audit-trail-export.ts:34-55`).
   - User mit Membership in N Workspaces braucht N Exports + sieht eigene Account-
     Daten (sessions, dpa_acceptances, account_oauth_links) nicht.
   - Fix-Direction: Neuer endpoint `/api/account/export` der Datenschutz-relevante
     User-zentrische Daten als ZIP (JSON + Markdown-Summary) ausliefert.
   - Effort: 1 dev-day.

9. **[Strong] AVV als PDF-Download.**
   - HTML allein reicht meist nicht für Käufer-Compliance-Team.
   - Fix: `@react-pdf/renderer` oder serverseitiges `puppeteer` als Inngest-Job auf
     Knopfdruck. Audit-log per Download speichern.
   - Effort: 4h Code + Anwalts-Prüfung der PDF-Renderung.

10. **[Strong] Newsletter-Stub deutet Marketing-Mails an — kein Consent-Capture.**
    - `account/settings/notifications/page.tsx:10` mention "weekly digest opt-in"
    - Risk: Wenn das Feature live geht ohne Double-Opt-In-Flow + getrenntes Speichern
      des Consent-Zeitpunkts + IP, ist es UWG- + DSGVO-widrig.
    - Fix: Im Stub jetzt schon klarmachen dass Newsletter erst mit DOI-Flow ausgerollt
      wird. Plan-Direction: separater Plan `marketing-mails-doi.md`.
    - Effort: 5min Stub-Klarstellung jetzt; voll-Implementierung später ~1 dev-day.

11. **[Strong] OSS-License-Notice-Page fehlt.**
    - Fix-Direction: `pnpm exec license-checker --json` → static page `/legal/oss`.
    - Bei nicht-MIT-Lizenzen (LGPL, AGPL) zusätzlich Beachtung.
    - Effort: 2h.

12. **[Strong] GitHub fehlt in Sub-Processors.**
    - File: `apps/web/src/app/legal/subprocessors/page.tsx:27-70`
    - Fix: Ergänzen `{ name: "GitHub, Inc.", purpose: "OAuth + ggf. App-Install", region: "USA — EU SCC + DPF", dpaUrl: "https://docs.github.com/en/site-policy/privacy-policies/global-privacy-practices" }` — sobald OAuth/App live geht. Aktuell weak (nicht aktiv), wird strong bei GitHub-OAuth-Launch.
    - Effort: 5min.

13. **[Strong] Profile-Edit (Art. 16) stub.**
    - File: `apps/web/src/app/account/settings/profile/page.tsx`
    - Fix-Direction: Form mit `name` + `image_url` + `locale` Felder; Server-Action
      die DAL-Update macht. Email-Change separat (verlangt Magic-Link-Re-Verify).
    - Effort: 4h.

14. **[Strong] Cookie-Decision dokumentieren.**
    - Fix-Direction: `docs/legal/cookie-policy.md` mit aktueller Tabelle (siehe C.5)
      + Trigger-Liste wann Banner Pflicht wird (PostHog/Plausible/Vercel-Analytics-Add).
    - Effort: 30min.

## E.3 Mid

15. **[Mid] AGB §8 Liability — Kardinalpflichten-Klausel ergänzen.**
    - File: `/legal/agb/page.tsx:182-194`
    - Fix: Anwalts-Sektion oder Termly-Template.
    - Effort: User-Action.

16. **[Mid] AGB §6 §312k BGB Kündigungsbutton — direkter Kündigen-Button auf Workspace-Settings.**
    - File: `apps/web/src/app/[workspace]/settings/billing/page.tsx` — aktuell nur
      "Open Stripe portal" Button (`:328`). Direkter "Subscription kündigen" Button
      hinzufügen der Stripe-Portal mit pre-selected "cancel" flow öffnet
      (`flow_data: { type: 'subscription_cancel', ... }`).
    - Effort: 1h.

17. **[Mid] Verzugszinsen-Klausel in AGB.**
    - File: `/legal/agb/page.tsx` neue Sektion 9.
    - Fix: Standardklausel "Bei B2B-Vertragspartnern gilt §288 (2) BGB (9 Prozentpunkte über Basiszinssatz)."
    - Effort: 5min Text.

18. **[Mid] §147 AO Aufbewahrungsfrist prominent in DSE.**
    - Bei DSE-Schreiben (E.1 Item 2) explizit als eigene Sektion.
    - Effort: in DSE-Implementierung.

19. **[Mid] Audit-Trail-Retention-Statement (12 Monate, hart-codiert in `lib/audit-trail-export.ts:24`) in DSE rein.**
    - Aktuell nur in Trust-Page erwähnt — Käufer der DSE liest erwartet Hinweis dort.
    - Effort: in DSE-Implementierung.

20. **[Mid] Data-Export ist workspace-scoped (B.1 Art. 20).**
    - Siehe Item 8 (Strong, separater Path).

21. **[Mid] DPA-Acceptance-Audit-Log nicht in DSE dokumentiert.**
    - `lib/dpa-actions.ts` schreibt user-ID + IP + UA + version. DSE muss das
      transparent machen ("Wir protokollieren Ihre DPA-Akzeptanz mit IP/UA für 5 Jahre
      zwecks Nachweispflicht Art. 7 (1) GDPR.").
    - Effort: in DSE-Implementierung.

22. **[Mid] Cookie-Notice mit Better-Auth-Cookies + `vk_default_workspace_slug` + `sidebar` in DSE.**
    - Tabelle aus C.5 1:1 in DSE.
    - Effort: in DSE.

23. **[Mid] Stripe-Portal-Configuration code-pinnen.**
    - Aktuell `billingPortal.sessions.create({ customer, return_url })` ohne
      `configuration:` Param (`billing-actions.ts:134`). Empfehlung idempotent
      bootstrap-script + ENV-Pin.
    - Effort: 1h.

## E.4 Weak

24. **[Weak] Legal-Footer-Links auch in `/billing`, `/pricing`, `/[workspace]/*` Footer surfaces.**
    - Aktuell nur Landing `page.tsx:13` hat Footer. Innen-App-Seiten haben keinen
      Footer mit Legal-Links.
    - Fix: Shared `<LegalFooter />` Component für public-facing + signed-in marketing
      surfaces.

25. **[Weak] Trust-Center linkt zu non-existent `.md` Docs** (siehe Item 6 Kill — Doppelnennung weak weil schon Kill).

26. **[Weak] sitemap.ts deindexiert nichts.**
    - `apps/web/src/app/sitemap.ts:11` listet alle legal-routes — OK. Aber `login` hat
      `robots: { index: false }` in metadata, sitemap.ts kennt diese Pflicht nicht.
      Marginal SEO-relevant.

27. **[Weak] AGB englisch, DACH-Käufer erwartet de.**
    - Fix: bilingual mit Sprachen-Toggle.

28. **[Weak] `/status` Disclaimer "no SLA implied" hinzufügen.**

---

# Part F: Pre-Launch Legal-Checklist (Day-by-Day)

**Total effort: ~2 dev-days Code + ~3-5 user-days Legal-Content.**

### Day 1 (Code) — Impressum + DSE + Email-Footer

- [ ] Create `apps/web/src/app/legal/impressum/page.tsx` — placeholder structure ready for user-content
- [ ] Create `apps/web/src/app/legal/datenschutz/page.tsx` (alias `/privacy`) — placeholder structure
- [ ] Shared `<LegalFooter />` Component → mount in `apps/web/src/app/page.tsx` + all `/legal/*` + `/trust/*`
- [ ] Shared `<EmailFooter />` React-Email Component → einfügen in alle 4 Templates unter `packages/auth/src/emails/`
- [ ] Domain-Sync: search/replace `validationkit.dev` → `validationkit.app` in `account/settings/delete/page.tsx`
- [ ] DPA-Contact `kol.schoepe@gmail.com` → `legal@validationkit.app` in `trust/dpa/page.tsx:111`

### Day 2 (User-Action: Legal-Content)

- [ ] Anwalts-/Steuerberater-Termin: Impressum-Felder + USt-ID + Berufshaftpflicht-Frage
- [ ] Termly oder eRecht24 oder iubenda — DSE-Generator-Lauf mit:
  - 7 (bzw. 8 mit GitHub) Sub-Processors
  - SaaS-B2B-Profile
  - DACH-Locale
- [ ] AGB-Anwalts-Pass (1-2h Termin) — speziell Kardinalpflichten + §309 BGB
- [ ] DPA-Anwalts-Pass (kann mit AGB-Termin zusammenfallen)
- [ ] OSS-License-Inventory generieren (`pnpm exec license-checker`)

### Day 3 (Code) — Account-Delete + Workspace-Delete + Session-Revoke (Wave-1 Bundle-A Sub-Aufgabe)

- [ ] `lib/account-actions.ts` — `deleteUserAccountAction()` + Soft-Delete + 30d-Grace
- [ ] `account/settings/delete/page.tsx` — Typed-Confirm UI ersetzen Stub
- [ ] `account/settings/sessions/page.tsx` — List + Revoke ersetzen Stub
- [ ] `[workspace]/settings/danger/page.tsx` — Transfer-Ownership + Delete-Workspace ersetzen Stub
- [ ] E-Mail-Confirmation-Templates + 24h-Abbruch-Link
- [ ] Inngest-Cron `account-hard-delete-after-30d`
- [ ] Stripe-Customer-Data: Anonymisierung statt Delete; Test (Wave-1 Bundle-A Test-Suite)
- [ ] DPA-Acceptance-Audit-Log behalten

### Day 4 (Code) — User-Data-Export (Art. 20) + Profile-Edit (Art. 16) + AGB-Polish

- [ ] `/api/account/export` user-scope ZIP-Export
- [ ] Profile-Form (`account/settings/profile/page.tsx`) — name/image/locale editierbar
- [ ] AGB §6 Kündigungsbutton + §9 Verzugszinsen + §10 Kardinalpflichten ergänzen
- [ ] AGB-Deutsche-Übersetzung als `/legal/agb-de` (Anwalts-Lauf)
- [ ] Stripe-Portal-Configuration setup-script

### Day 5 (Polish + Verifikation)

- [ ] `docs/legal/cookie-policy.md` festschreiben
- [ ] `/legal/oss` Page generieren
- [ ] Trust-Center broken-links zu `docs/legal/*` reparieren
- [ ] Lawyer-Final-Pass: AGB DE + AVV DE + DSE + Impressum
- [ ] Smoke-Test deutscher Sign-Up-Flow: Pricing → Checkout (Stripe Tax-ID-Field) → Webhook → Email mit Impressum-Footer → DSE-Link funktioniert → Account-Delete funktioniert → Audit-Trail-Export funktioniert
- [ ] Update `/trust/page.tsx` Status-Badges nach Real-Lawyer-Review

---

## Cross-References

- Wave-1 Audit-Synthesis: `docs/audits/2026-05-deep/_wave1-synthesis.md` (S15 — Account-Delete identical finding)
- Wave-1 Auth-Security: `docs/audits/2026-05-deep/wave1-03-auth-security.md`
- TIA: `docs/operations/transfer-impact-assessment.md`
- ADR-0020 DPA-Acceptance: erwähnt in `trust/dpa/page.tsx:61-63` — Datei-Existenz nicht verifiziert
- Prior Plan: `docs/plans/done/saas-pricing-sub-c-ui-compliance.md` (Sub-Plan-C → AGB/DPA/Subprocessors-Pages shipped 2026-05-21)

## Out-of-Scope

- Tatsächlicher Anwaltslauf — kann Auditor nicht ersetzen
- Reale ICO/Aufsichtsbehörde-Anmeldung
- Cyber-Versicherung
- US-CCPA/CPRA (Task-Scope DACH/EU)
- Branchen-spezifische Compliance (HIPAA, PCI-DSS) — pro Compliance-Frame separat
