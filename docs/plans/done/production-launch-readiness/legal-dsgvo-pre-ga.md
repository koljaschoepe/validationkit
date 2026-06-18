# Plan — Bundle F · Legal + DSGVO + Compliance-Pre-GA

> Erstellt: 2026-06-08
> Status: 🔵 Skelett — /execute parallel zu C, D, G
> Master: `docs/plans/production-launch-readiness.md`
> Slug: `legal-dsgvo-pre-ga`
> Confidence: **Mid-High** — Code-Findings sind sicher (wave2-05), Legal-Content benötigt Anwalt/Template-Provider

## 1. Ziel

Legal-Foundation für DACH-B2B-zahlende-Kunden: Impressum (§5 TMG) + Datenschutzerklärung (§13 DDG) implementiert, GDPR Art. 17 Backend (überlappt Bundle A), Transactional-Email-Footer-Impressum (überlappt Bundle G), TIA-Doc + DPA-Contact + Domain-Konsistenz + AVV-PDF + OSS-Notices + AGB-de-Translation.

**Wichtiger Hinweis**: Code-Implementation ist 2-3 dev-days. Legal-Content (Texte) benötigt 3-5 Tage Anwalts-Review ODER Template-Provider-Lauf (Termly/eRecht24/iubenda). Diese Phase 0 muss parallel ab Bundle A laufen.

## 2. User-Entscheidungen

Master §2. Bundle-spezifisch:
- Legal-Content-Source: Anwalt vs Template-Provider?
- Domain-Name (S37 Inkonsistenz auflösen — bestimmt Bundle C)
- AVV-Default-Annahme oder Manual-Signature?

## 3. Existing-Patterns

- `/legal/agb`, `/legal/dpa`, `/legal/subprocessors` existieren (2026-05-21)
- `/trust`, `/trust/dpa`, `/trust/eval`, `/trust/sub-processors.{json,xml}` existieren
- DPA-Markdown wird per Request gelesen (S36 Wave-2 → cache)
- Trust-Center nutzt eigene Routes (kein PageShell)
- Stripe-Tax + Subprocessors-Liste + DPA-Template = "more than most $19/mo competitors at this stage" (wave2-05)

## 4. Alternativen

- **Alt-A: Mailto-Stubs lassen** → DACH-B2B-killer. Customer-Onboarding-Friction zu hoch.
- **Alt-B: Eigene Legal-Texte schreiben** → Haftungs-Risk. Anwalt oder Template-Provider Pflicht.
- **Alt-C: Cookie-Banner aktivieren** → B2B-Tool ohne Marketing-Cookies braucht keinen. Würde Conversion negativ beeinflussen.
- **Alt-D: Englische Legal-Pages für DACH-B2B** → wave2-05 Weak: Käufer erwartet de. Translation-Pflicht.

## 5. Endzustand

- `/legal/impressum/page.tsx` mit §5 TMG-Vollständigkeit (Name, Anschrift, Kontakt, USt-ID, Berufshaftpflicht falls applicable, Verantwortlicher §18 MStV)
- `/legal/datenschutz/page.tsx` mit:
  - Art. 6 DSGVO Rechtsgrundlagen pro Datacategory
  - Subprozessoren-Liste (Stripe, Resend, Anthropic, OpenAI, Neon, Vercel, Inngest, GitHub)
  - Retention-Periods (§147 AO 10y für Rechnungen)
  - User-Rights (Art. 15-22)
  - DPO-Contact (oder Statement warum keiner)
  - Audit-Trail-Retention-Statement
  - Better-Auth-Cookies-Section
- Domain konsistent gemacht (S37) — pick `.app` ODER `.de` ODER `.io`, global-replace
- TIA-Doc broken link gefixt ODER Link entfernt (K29)
- DPA-Contact auf Domain-Adresse statt Gmail (K30, koordiniert mit Bundle C Domain)
- `/trust/dpa` Markdown-Load gecached (S36 → Bundle D überlappt)
- AVV-PDF generated + `/legal/avv.pdf` als static-asset hosted (S39)
- `/legal/oss` + `THIRD_PARTY_NOTICES.md` (S40)
- AGB übersetzt auf de-DE (Wave-2 Weak)
- Footer-Component mit Impressum + Datenschutz + AGB Links auf ALLEN Pages (Wave-2 Mid: Trust-Footer-Links zu nicht-existenten .md)
- DPA-Acceptance-Audit-Log dokumentiert in Datenschutzerklärung (S38)
- Email-Footer-Impressum-Link (K28, koordiniert mit Bundle G)

## 6. Schritte

### Phase 0 — Legal-Content-Beschaffung (parallel ab Bundle A!) — 3-5 Tage
- [ ] Entscheidung: Anwalt für IT-Recht ODER Template-Provider (Termly/eRecht24/iubenda)
- [ ] Beauftragung + Briefing (Subprozessoren-Liste, Daten-Categories, Tech-Stack)
- [ ] Lieferung: Impressum-Text + Datenschutzerklärung-Text + AGB-de-Text + AVV-Template

### Phase 1 — Domain-Konsistenz (~1h)
- [ ] Domain festlegen (= Bundle C Open-Item, koordinieren)
- [ ] Global-Replace via grep+sed in repo
- [ ] CLAUDE.md, package.json, /trust pages, /legal pages, email-templates, Stripe-Config

### Phase 2 — Impressum + Datenschutz Pages (~4h)
- [ ] K25 `app/legal/impressum/page.tsx` mit Content aus Phase 0
- [ ] K26 `app/legal/datenschutz/page.tsx` mit Content + Subprozessoren-Tabelle-Component
- [ ] Footer-Component `<LegalFooter>` mit Impressum/Datenschutz/AGB Links
- [ ] Mounten auf jeder Marketing-Page + Settings-Page

### Phase 3 — TIA + DPA-Contact (~1h)
- [ ] K29 TIA-Doc fixen ODER Link entfernen aus `/legal/dpa`
- [ ] K30 DPA-Contact-Email auf `dpa@<domain>` (Mail-Forwarding einrichten in Bundle C)

### Phase 4 — AGB-de + AVV-PDF (~3h)
- [ ] AGB-Translation (Anwalts-Vorlage einarbeiten)
- [ ] AVV-PDF via `@react-pdf/renderer` ODER static PDF aus Anwalts-Template
- [ ] `/legal/avv.pdf` als static asset
- [ ] Download-Button in `/legal/dpa` + `/legal/agb`

### Phase 5 — OSS-Notices (~2h)
- [ ] `pnpm licenses list` Output sammeln
- [ ] Generate `THIRD_PARTY_NOTICES.md` + `/legal/oss/page.tsx`
- [ ] Footer-Link "Open-Source Notices"

### Phase 6 — DSE-Erweiterungen (~2h)
- [ ] S38 DPA-Acceptance-Audit-Log dokumentieren in §X Audit-Trail
- [ ] Better-Auth-Cookies in DSE §Cookies aufgenommen
- [ ] Audit-Trail-Retention-Statement

### Phase 7 — Acceptance
- [ ] Alle 6 Legal-Kills (K25-K30) gefixt
- [ ] Manual: /legal/impressum, /legal/datenschutz, /legal/agb, /legal/dpa, /legal/avv.pdf, /legal/oss alle erreichbar
- [ ] Footer auf jeder Page
- [ ] Email-Footer-Impressum erwähnt (= Bundle G)
- [ ] `git mv` → done

## 7. Files-to-Change

**New:**
- `apps/web/src/app/legal/impressum/page.tsx`
- `apps/web/src/app/legal/datenschutz/page.tsx`
- `apps/web/src/app/legal/oss/page.tsx`
- `apps/web/public/legal/avv.pdf` (static)
- `apps/web/src/components/LegalFooter.tsx`
- `apps/web/src/components/SubprocessorTable.tsx`
- `THIRD_PARTY_NOTICES.md`

**Modified:**
- `apps/web/src/app/legal/agb/page.tsx` (de-DE Translation)
- `apps/web/src/app/legal/dpa/page.tsx` (TIA-fix)
- `apps/web/src/app/trust/dpa/page.tsx` (cache markdown — überlappt Bundle D S36)
- Global: alle `validationkit.{app,dev,-ai}` → eine Domain (Bundle C koordiniert)
- Email-Templates für Impressum-Footer (Bundle G überlappt)

## 8. DB-Migration

Keine.

## 9. Test-Plan

- Manual: Anwalt/Template-Review der Texte
- Manual: Each /legal/* page erreichbar + Footer-Links
- Manual: AVV-PDF Download
- a11y-axe-core auf Legal-Pages

## 10. Risiken

| Risiko | Mitigation |
|---|---|
| Anwalts-Lieferung > 5 Tage | Phase 0 ab Bundle-A-Tag-1 starten, Template-Provider als Fallback |
| Legal-Texte sind generisch + nicht stack-spezifisch | Briefing-Doc mit Subprozessoren + Tech-Stack vor Beauftragung |
| Domain-Wechsel bricht bestehende Stripe-Test-Webhook | Bundle C koordiniert, Test-Mode-Webhook bleibt bestehen |
| AGB-Klauseln widersprechen Stripe-AGB | Anwalt prüft Stripe-AGB-Kompatibilität |

## 11. Aufwand

**2-3 dev-days Code + 3-5 days Legal-Content (parallel)**.

## 12. Out-of-Scope

- Cookie-Consent-Banner (B2B-Tool nicht Pflicht)
- TTDSG-Cookie-Konfiguration (siehe oben)
- Datenexport (Art. 20) Tool-Implementation — Bundle A hat nur Account-Delete; Art. 20 ist V2
- Cross-Border-Data-Transfer-Documentation (SCC-Templates) — Anwalt liefert
- ISO-27001 / SOC-2 (V2 Enterprise-Tier)

## 13. Open Items

- **Legal-Content-Source**: Anwalt für IT-Recht vs Template-Provider (Termly/iubenda/eRecht24)?
- **DPO**: Solo-Dev braucht keinen formalen DPO; Statement "Da Solo-Unternehmer und unter 250 MA, kein DPO bestellt — Anfragen direkt an dpa@domain" reicht. Bestätigen.
- **USt-ID**: bereits beantragt oder neu?
- **AVV-Modus**: Default-Akzeptanz beim Signup ODER Manual-Signature pro Customer?
