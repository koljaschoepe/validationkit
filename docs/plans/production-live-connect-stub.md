# Plan — Production-Live-Connect (Stub)

> Erstellt: 2026-05-21
> Status: 🔵 Out-of-Scope (Skelett — wird später aktiviert)
> Slug: `production-live-connect-stub`
> Voraussetzung: `docs/plans/nova-3-repo-polish-and-prod-prep.md` ✓ (Test-Mode komplett lauffähig)
> **Diesen Plan NICHT direkt mit `/execute` starten — erst per `/plan production-live-connect` konkretisieren.**

## 1. Ziel (Stub)

ValidationKit von "lokal-test-mode-funktioniert" auf "live unter validationkit.app erreichbar + zahlende Kunden möglich" bringen. Alle Out-of-Repo-Schritte (KYC, Domain, Stripe-Tax, Inngest-Cloud, Resend-Prod, Vercel-Prod-Env) in ordentlicher Reihenfolge erledigen + dokumentieren.

## 2. Vorbedingungen (aus Nova-3 Hauptplan)

- ✅ Lokal Stripe-Test-Mode komplett durchläuft (Pricing → Checkout → Webhook → Plan-Update)
- ✅ Magic-Link + Mailpit funktioniert lokal
- ✅ Workspace-Hub `/[workspace]` ist visuell production-ready
- ✅ Audit-Reports + Cleanup ✓ (keine `Kill`-Severities offen)
- ✅ Lighthouse-CI grün auf Landing + Hub

## 3. TODO-Sektionen (zu konkretisieren bei späterem `/plan`)

### 3.1 Stripe-Live-Wiring
- KYC abschließen (Company-Onboarding bei Stripe DE)
- Live-Mode-Keys generieren (`sk_live_…` + `whsec_…_live`)
- `pnpm stripe:setup-test` im Live-Mode-Modus laufen lassen (Products/Prices/Meters in Live-Mode-Stripe anlegen)
- Customer-Portal-Config in Live-Mode wiederholen (siehe `docs/operations/stripe-go-live.md:40-49`)

### 3.2 Vercel-Prod-Env
- Alle Stripe-Live-Keys + DB-URL + Auth-Secret + Resend-Key + Inngest-Keys in Vercel-Project-Settings setzen (per Environment: Production / Preview / Development)
- `NEXT_PUBLIC_APP_URL=https://validationkit.app`
- `AUTH_BASE_URL=https://validationkit.app`

### 3.3 Domain
- `validationkit.app` (Strato / Cloudflare / Vercel-Domains) bestellen + auf Vercel zeigen lassen
- DNS-Records: A/AAAA für apex, CNAME für `www` → vercel.app
- SSL automatisch via Vercel
- `apps/web/next.config.ts` — falls hardcoded localhost in `images.domains` / `headers()` — fixen
- E-Mail-Sender-Domain `noreply@validationkit.app` bei Resend verifizieren (SPF/DKIM)

### 3.4 Resend-Prod
- Account erstellen, Domain verifizieren
- `RESEND_API_KEY` + `RESEND_FROM="auth@validationkit.app"` in Vercel-Env
- SMTP_* env-vars in Prod entfernen (siehe `.env.example:35-37` Comment)
- Magic-Link-Smoke-Test gegen Prod-Domain

### 3.5 Inngest-Cloud
- Inngest-Account, Project anlegen
- `INNGEST_EVENT_KEY` + `INNGEST_SIGNING_KEY` in Vercel-Env
- `INNGEST_BASE_URL` in Prod entfernen
- Background-Jobs-Smoke-Test (Cron-Jobs, Audit-Background-Path)

### 3.6 Stripe-Tax (DE + EU)
- DE-Registration in Stripe-Tax-Dashboard (siehe `docs/operations/stripe-go-live.md:53-57`)
- automatic_tax-Schalter umlegen
- VAT-Pflicht-Check bei Test-Order durchspielen
- EU-OSS später bei €10k-Threshold

### 3.7 Observability + Compliance
- Sentry-Project anlegen (oder Vercel-OTel) — Frontend + API-Routes + Inngest
- Better-Stack / Vercel-Log-Drain für Production-Logs
- `/legal/agb` + `/legal/dpa` + `/legal/subprocessors` final aktualisieren mit allen Live-Providern
- Cookie-Banner falls EU-User (TIA-Doc existiert: `docs/operations/transfer-impact-assessment.md`)
- `CCA_STATUS` setzen falls relevant

### 3.8 Go-Live-Smoke-Test (Checkliste)
- [ ] Landing über `https://validationkit.app` lädt
- [ ] Magic-Link-Login funktioniert mit `noreply@validationkit.app`-Sender
- [ ] Audit eines public-repo läuft durch (Background-Path triggered Inngest)
- [ ] Pricing → Checkout (echte Karte!) → Plan-Update
- [ ] Webhook-Endpoint `https://validationkit.app/api/stripe/webhook` empfängt Events
- [ ] Stripe-Customer-Portal-Link funktioniert
- [ ] DPA-Download in `/legal/dpa` lädt
- [ ] Status-Page `/status` zeigt grün

## 4. Open Items (zu klären bei `/plan`)

- Custom-Domain für `validationkit.app` — Registrar-Wahl
- E-Mail-Domain-Strategie: `validationkit.app` allein vs `noreply.validationkit.app`-Subdomain
- Sentry vs Vercel-OTel vs Better-Stack — Single-Source-of-Truth für Observability
- Beta-User-Onboarding-Strategie: Closed-Beta-Code vs offen
- Pricing-Live-Switch-Timing: Sofort live-mode oder N-Wochen-Soft-Launch mit eingeladenen Beta-Usern

## 5. Status

🔵 **Out-of-Scope für Nova-3.** Aktivieren via `/plan production-live-connect` mit kompletter Discovery — dieser Stub ist nur Memory-Hilfe für zukünftige Sessions.
