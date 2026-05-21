# Stripe Go-Live — Checkliste

Stand: 2026-05-21 (Nova-3a Phase 4 — Test-Mode-Walkthrough ergänzt)
Status: 🟡 Pre-Launch — code is wired (✅ Test-Mode end-to-end), KYC + tax registrations are outstanding for Live-Mode.

This document captures the **out-of-band** steps that gate a Live-Mode Stripe activation. Code is the easy part; tax + KYC + Stripe-Dashboard config sit outside the repo and need to happen in this order.

Sections marked **✅ in Nova-3a** are wired in the repo and have been smoke-tested locally. Sections marked **🔵 deferred to production-live-connect-stub** are the actual Live-Mode-flip work.

---

## 0. Pre-Test-Mode — Erstaufsetzer-Walkthrough (✅ in Nova-3a)

Brand-new check-out auf einem leeren Dev-Stack:

```bash
# 0.1 — Stripe-Test-Account-Key holen
# Stripe-Dashboard (Test-Mode) → Developers → API keys → "Secret key"
# Copy `sk_test_…` in die .env.local:
echo 'STRIPE_SECRET_KEY="sk_test_REPLACE_ME"' >> .env.local
# Stripe-Webhook-Secret kommt im nächsten Step aus `stripe listen`.

# 0.2 — Lokales Stack hochfahren (Postgres + Mailpit + Inngest + Dragonfly)
pnpm stack:up
until docker exec vk-postgres pg_isready -U vk; do sleep 1; done

# 0.3 — DB-Migrations applyen (inkl. Nova-3a-Bundle-A user-cascade-hardening)
pnpm db:migrate

# 0.4 — Stripe-Test-Mode-Bootstrap-Script: provisioniert Products + Prices
#       + Meters in Test-Mode-Stripe. Idempotent via lookup_keys.
pnpm stripe:setup-test
# → schreibt .env.stripe-test-mode.generated mit 14 Vars
#   (8 Tier-Prices + 2 Pack-Prices + 2 Meters + 2 Metered-Prices)

# 0.5 — Generated env-vars in .env.local mergen (außer Header-Comments)
cat .env.stripe-test-mode.generated >> .env.local

# 0.6 — Stripe-CLI Webhook-Forwarding starten (eigenes Terminal)
stripe listen --forward-to localhost:3000/api/stripe/webhook
# → druckt `whsec_…` — das ist der `STRIPE_WEBHOOK_SECRET`
echo 'STRIPE_WEBHOOK_SECRET="whsec_REPLACE_FROM_STRIPE_LISTEN"' >> .env.local

# 0.7 — Dev-Server starten (eigenes Terminal)
pnpm --filter @vk/web dev
# → http://localhost:3000 ist Live, /api/stripe/webhook nimmt jetzt
#   echte Stripe-Test-Events entgegen.
```

**Verify:** `/pricing` → Click "Upgrade" auf einen Tier → Stripe Checkout mit Test-Card `4242 4242 4242 4242`, beliebige zukünftige Expiry, beliebige CVC → Redirect zu `/billing` → workspace.tier = "starter/pro/agency" + Plan-Change-Email landet in Mailpit (`http://localhost:8025`).

**503-Fallback verifiziert** (Nova-3a Bundle E): wenn `STRIPE_SECRET_KEY` oder `STRIPE_WEBHOOK_SECRET` fehlt, returns `apps/web/src/app/api/stripe/webhook/route.ts:69,76` HTTP 503 statt 500. Die `/billing`-UI surfst entsprechend "Stripe not configured".

---

## 1. Test-Mode (Code-Ready ✅)

Run once on a fresh Stripe Test-Mode account:

```bash
# Drop sk_test_xxx into .env.local
pnpm stripe:setup-test

# Merge the generated env vars
cat .env.stripe-test-mode.generated  # 8 tier prices + 2 packs + 2 meters + 2 metered prices
# … paste relevant lines into .env.local

# Boot the dev server + Stripe CLI webhook forwarder
stripe listen --forward-to localhost:3000/api/stripe/webhook
pnpm --filter @vk/web dev
```

Smoke tests (Stripe-CLI):

```bash
stripe trigger checkout.session.completed   # → workspace upgraded to chosen tier
stripe trigger invoice.paid                 # → credits_used_this_period reset, monthly_grant ledger row
stripe trigger invoice.payment_failed       # → subscription.status = past_due
stripe trigger customer.subscription.deleted # → tier downgrades to free
stripe trigger invoice.created              # → meter-flush hook runs (no-op if no overage)
```

---

## 2. Stripe-Dashboard — Customer Portal config

Run in **Settings → Billing → Customer Portal** (Test-Mode and again in Live-Mode):

- [ ] **Payment methods** — enabled
- [ ] **Invoice history** — enabled
- [ ] **Cancellation** — period-end + capture reason + optional retention coupon
- [ ] **Plan switching** — enable for the 6 tier base prices (Starter/Pro/Agency × monthly + annual)
- [ ] **Tax ID update** — enabled
- [ ] **Default return URL** — `https://validationkit.app/billing` (placeholder)

---

## 3. Stripe Tax — registration

- [ ] **DE registration** — required before going live. Until then, automatic_tax falls back to no-VAT and customers in DE see only the net price.
- [ ] **EU OSS registration** — once non-DE EU customers cross €10k/year, enable OSS via BZSt. Stripe Tax surfaces the threshold proactively.
- [ ] **US state monitoring** — leave Stripe-Tax-monitoring ON. Each state with a $100k nexus triggers a registration prompt; expect this at 100 paying customers earliest.

---

## 4. Live-Mode Switch

Once #2 and #3 are done **and** the founder's company has a `sk_live_…` key:

```bash
# In Vercel project env vars (per environment: prod, preview, dev):
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx_live

# Re-run the setup script against live-mode (create products + prices + meters):
# WARNING: this charges real money for tests after activation; do test-runs
# only in test mode beforehand.
pnpm stripe:setup-test   # supports live keys; output goes to a different file

# Register the production webhook in Stripe Dashboard:
#   Endpoint: https://validationkit.app/api/stripe/webhook
#   Events:   checkout.session.completed, customer.subscription.created/updated/deleted,
#             invoice.created, invoice.paid, invoice.payment_failed
#   API version: 2026-04-22.dahlia
```

---

## 5. Pre-Launch Compliance Gates

Sub-Plan-C must ship the following before live-mode goes wide:

- [ ] `/legal/agb` updated with the pricing-pass-through clause
- [ ] `/legal/subprocessors` lists Stripe + Anthropic + OpenAI + Neon + Vercel + Resend + Inngest
- [ ] `/legal/dpa` template + download
- [ ] Per-audit cost-preview in the AuditTriggerForm
- [ ] Spend-cap workspace setting (auto_overage_enabled + spend_cap_microcents from Sub-A schema)

Without those the Live-Mode Stripe key MUST stay restricted to internal-test usage only.

---

## 6. Rollback

In Live-Mode, if anything misbehaves:

1. **Toggle STRIPE_SECRET_KEY back to test-mode** in Vercel env → all new checkout sessions go to test-mode + existing live subscriptions keep running on Stripe's side but our app stops creating new ones.
2. **Pause webhook endpoint** in Stripe Dashboard if events are misbehaving.
3. **Revert code** — every Sub-B PR is a single commit; `git revert <sha>` brings the previous wire-up back.
4. **Stripe-Dashboard cleanup** — products + prices can be archived (NOT deleted, that would break existing subscriptions).

---

## 7. Open Items / V2

- Auto-fix in the reconcile cron (currently detection-only) — only enable when drift incidents land in a Linear/Linear-equivalent triage flow.
- Stripe v2 Pricing-Plans API — Private Preview as of April 2026; migrate when GA.
- Multi-currency (USD, GBP, CHF) — V2 after Beta.
- AI-markup meter live-flush — requires the pricing-page disclosure to land first (Sub-Plan-C).
