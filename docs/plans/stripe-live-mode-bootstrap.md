# Plan — Bundle E · Stripe-Live-Mode-Bootstrap

> Erstellt: 2026-06-08
> Status: 🔵 Skelett — /execute nach Bundle B (Payment-Fixes Pflicht-Vorbedingung)
> Master: `docs/plans/production-launch-readiness.md`
> Slug: `stripe-live-mode-bootstrap`
> Confidence: **High** — wave1-02 Part C (15-Step-Plan) file:line

## 1. Ziel

Von Stripe-Test-Mode auf Live-Mode wechseln: Live-Account, Tax-DE-Registrierung, Live-Products+Prices+Meters, Live-Webhook-Endpoint, 14 Env-Var-Swap, Customer-Portal-Config, Smoke-Test-Checkliste.

## 2. User-Entscheidungen

Master §2. Bundle-spezifisch (Stripe-spezifisch, parallel zu Engineering):
- KYC-Daten (UStID, Bankverbindung, Steuernummer)
- Stripe-Tax-DE vs Stripe-Tax-EU-OSS
- Customer-Portal-Branding (Logo, Farben)

## 3. Existing-Patterns

- `scripts/stripe-test-setup.ts:97-101` — Bootstrap-Skript für Test-Mode (rejected sk_live_)
- `docs/operations/stripe-go-live.md:118` — Doc behauptet `setup-test` würde Live unterstützen (wave1-02 widerspricht)
- `.env.stripe-test-mode.generated` — Generierte Test-Env-Vars
- 8 Tier-Prices + 2 Packs + 2 Meters + 2 Metered-Prices in Test-Mode konfiguriert

## 4. Alternativen

- **Alt-A: Hand-konfiguriert in Stripe-Dashboard** → Drift-Risk + nicht reproduzierbar. Bootstrap-Skript-Variante besser.
- **Alt-B: Manual Live-Setup ohne Tax-DE** → wave2-05 sagt Stripe-Tax bereits configured in Code. Tax-DE-Registrierung muss out-of-band beantragt werden (Anwalt/Steuerberater).
- **Alt-C: Live-Mode mit Test-Credentials testen** → Stripe sandbox/test ≠ live. Echter Smoke-Test mit Live + Refund nach 7 Tagen.

## 5. Endzustand

- Stripe-Live-Account verified (KYC complete, Bank-Account, USt-ID hinterlegt)
- Stripe-Tax-DE aktiv (zumindest), optional EU-OSS
- 8 Tier-Prices + 2 Packs + 2 Meters + 2 Metered-Prices in Live-Mode angelegt, mapped zu DB-Tier-Refs
- Alle Prices mit `tax_code: txcd_10103001` (Bundle B Pflicht-Vorbedingung)
- Live-Webhook-Endpoint registriert `https://<domain>/api/stripe/webhook` mit `STRIPE_WEBHOOK_SECRET_LIVE`
- Webhook-Signing-Secret in Vercel-Prod-Env
- Customer-Portal konfiguriert: Branding (Logo, Farben), Allowed-Actions (cancel, update-payment, update-billing-address), Tier-Downgrade-Optionen
- 14 Env-Vars von Test→Live geswitched in Vercel-Production
- Domain-Verify in Stripe für Apple-Pay (TXT-Record gesetzt)
- `scripts/stripe-setup-live.ts` ODER `scripts/stripe-test-setup.ts` mit `--live`-Flag akzeptiert sk_live_
- Smoke-Test-Checkliste in `docs/operations/stripe-go-live.md` aktualisiert

## 6. Schritte

### Phase 0 — KYC (out-of-band, parallel ab Bundle A!) — 1-2 Wochen
- [ ] Stripe.com Account erstellen
- [ ] Business-Verifizierung: Gewerbeschein, USt-ID, Personalausweis
- [ ] Bank-Account verifizieren
- [ ] Tax-DE-Registrierung beantragen
- [ ] Wait for Stripe-Approval

### Phase 1 — Bootstrap-Skript Live-Variant (~4h)
- [ ] `scripts/stripe-test-setup.ts:97-101` — sk_live_-Rejection durch `--allow-live` Flag entfernen
- [ ] ODER neue `scripts/stripe-setup-live.ts` mit gleicher Logik + Live-Safety-Checks (Confirm-Prompt)
- [ ] Idempotente Product/Price/Meter-Creation
- [ ] Output: `.env.stripe-live-mode.generated`

### Phase 2 — Stripe-Live-Account Setup (~3h)
- [ ] Live-Products + Prices + Meters via Bootstrap-Skript erstellen
- [ ] Verify in Stripe-Dashboard: alle 8 Tiers + 2 Packs + 2 Meters sichtbar
- [ ] Tax-Codes auf Prices: `txcd_10103001` (B2B SaaS)
- [ ] Customer-Portal konfigurieren: Branding + Allowed-Actions

### Phase 3 — Webhook + Domain-Verify (~2h)
- [ ] Live-Webhook-Endpoint `https://<domain>/api/stripe/webhook` registrieren
- [ ] Events subscribed: checkout.session.completed, customer.subscription.created/updated/deleted, invoice.created/paid/payment_failed, customer.deleted
- [ ] `STRIPE_WEBHOOK_SECRET_LIVE` in Vercel-Prod-Env
- [ ] Stripe-Domain-Verify TXT-Record (Apple-Pay) — koordinieren mit Bundle C

### Phase 4 — Env-Vars Swap (~1h)
14 Env-Vars Test→Live:
- `STRIPE_SECRET_KEY` (sk_live_)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (pk_live_)
- `STRIPE_WEBHOOK_SECRET` (whsec_ Live)
- `STRIPE_PRICE_*` × 8 Tier-IDs
- `STRIPE_PACK_*` × 2 Pack-Price-IDs
- `STRIPE_METER_*` × 2 Meter-IDs

Vercel-Production-Scope only, Preview-Scope kann Test-Mode behalten.

### Phase 5 — Smoke-Test (~2h)
- [ ] Echter Test-Charge mit eigener Karte (Tier-Upgrade)
- [ ] Stripe-Tax: Rechnung-PDF zeigt korrekte USt-DE / Reverse-Charge
- [ ] Customer-Portal: cancel + reactivate
- [ ] Auto-Overage triggern (Bundle B Pflicht-Vorbedingung)
- [ ] Refund nach 24h
- [ ] Webhook-Logs in Stripe-Dashboard sauber

### Phase 6 — Acceptance
- [ ] Stripe-Live-Webhook-Events alle 200 OK
- [ ] DB-State synchron mit Stripe (Reconcile-Cron erfolgreich)
- [ ] Customer-Portal-URL erreichbar
- [ ] `git mv` → done

## 7. Files-to-Change

**Modified:**
- `scripts/stripe-test-setup.ts:97-101` ODER neu `scripts/stripe-setup-live.ts`
- `docs/operations/stripe-go-live.md` (Doc-Update)

**Vercel-Env (manuelle Änderung, kein Code-Diff):**
- 14 Production-Env-Vars

## 8. DB-Migration

Keine.

## 9. Test-Plan

Manual-Checkliste (kein automated test für Live-Money-Flows):
- Test-Charge + Refund
- Webhook-Smoke (alle 8 Event-Types)
- Tax-Calculation-Spot-Check
- Customer-Portal-Smoke

## 10. Risiken

| Risiko | Mitigation |
|---|---|
| Stripe-KYC > 2 Wochen | Phase 0 sofort starten (Bundle A parallel) |
| Tax-DE-Approval verzögert | Steuerberater konsultieren, ggf. ohne Tax-DE Soft-Launch |
| Live-Webhook-Endpoint vor Domain → Fallback Vercel-URL | Stripe-Webhook registrieren erst NACH Domain-Live |
| Bootstrap-Skript-Live-Mode beschädigt Live-Stripe (duplikate) | Idempotency via `lookup_key` auf Products/Prices |
| Refund-Flow funktioniert nicht in Live | Test-Charge mit kleiner Summe + manual refund first |

## 11. Aufwand

**2 dev-days code + 1-2 Wochen KYC out-of-band**.

## 12. Out-of-Scope

- Stripe-Atlas (Delaware-C-Corp)
- Multi-Currency-Pricing (EUR only initial)
- Subscription-Schedules (V2)
- Stripe-Connect (V2)
- Dunning-Email-Customization (Stripe-default)

## 13. Open Items

- **Tax-Setup**: Nur DE oder EU-OSS sofort? Empfehlung: DE + OSS, da EU-Kunden sonst nicht abrechenbar.
- **Customer-Portal-URL**: stripe-hosted (default) vs custom-page mit embedded portal? Default: stripe-hosted.
- **Live-Bootstrap-Variant**: `--allow-live`-Flag im bestehenden Skript ODER neues File? Vorschlag: neues File `stripe-setup-live.ts`.
