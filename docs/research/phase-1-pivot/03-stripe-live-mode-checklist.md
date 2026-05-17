# 03 — Stripe Live-Mode Checklist (M3+ Critical Path)

> Research-Agent A3 · 2026-05-17 · Scope: what stands between Sprint-0.13-test-mode and `STRIPE_LIVE_MODE=true`. Existing code references: `apps/web/src/lib/stripe.ts`, `apps/web/src/app/api/stripe/webhook/route.ts`, `packages/billing/src/{tiers,subscription,index}.ts`.

## TL;DR

Code is mostly ready — the gap is **account-state, tax, and operational hygiene**, not engineering. Eight line-items below; three are Kill-band (no live-mode without them), two are Weak-band (polish), three are Mid-band (do-it-once, then forget). DACH-founder KYC is 1–3 business days in 2025–2026 if you have the paperwork ready; Stripe Tax is the only sane EU-VAT/OSS path at our volume; PCI is a 22-question SAQ-A self-attestation; Radar default is sufficient sub-1k customers. The real risk is not technical — it's the founder discovering at M3 that Stripe Atlas-style activation needs a German trade-register entry (Gewerbeanmeldung) the founder didn't file yet.

## Skeptic-Mentor frame

You shipped test-mode code two sprints ago and haven't logged into Dashboard once. That's fine for code-correctness — `stripe.webhooks.constructEvent` behaves identically in test and live ([Stripe — Webhook signatures, 2025](https://docs.stripe.com/webhooks#verify-official-libraries)). It's not fine for go-live timing: every line below has a wall-clock cost the codebase can't compress.

---

## Line-items (Severity-banded)

### 1. Stripe Account Activation (DACH) — **Kill**
KYC for German sole-proprietor or GmbH requires: legal name + DOB, **Steuer-ID** (personal tax-ID, 11 digits), **USt-IdNr.** (VAT-ID, for B2B reverse-charge), business address, IBAN, and government-photo-ID upload. GmbH adds Handelsregister-Auszug. Activation review averages **1–3 business days** for clean German Einzelunternehmer accounts since the 2024 EU-AMLR refresh, up to 7 days if address-proof mismatches ([Stripe — Activate your account in Germany, 2025](https://docs.stripe.com/connect/required-verification-information#germany), [Stripe Support — Verification timelines, 2025](https://support.stripe.com/questions/account-verification-process)). **Action:** founder logs into Dashboard this week, files Gewerbeanmeldung first if not done, then submits.

### 2. EU VAT + B2B reverse-charge → Stripe Tax — **Kill**
DIY VAT for an EU-merchant selling B2B+B2C across 27 member states + UK + US is a 40-hour-per-quarter accounting trap. Stripe Tax handles MOSS/OSS registration triggers, VAT-ID validation (VIES), reverse-charge invoice flags, and §13b UStG markings for ~0.5 % of transaction volume ([Stripe Tax — pricing, 2026](https://stripe.com/tax/pricing), [Stripe — EU VAT one-stop shop, 2025](https://docs.stripe.com/tax/supported-countries/european-union)). At $30k MRR phase-2 target, Tax costs ~$150/mo — cheaper than one Steuerberater hour. **Code touch:** add `automatic_tax: { enabled: true }` + `customer_update: { address: 'auto' }` to checkout-session create. **Action:** enable Tax in Dashboard before first live charge, register OSS at Bundeszentralamt für Steuern *after* first EU-cross-border sale (one-shot, ~30 min).

### 3. PCI SAQ-A self-attestation — **Kill**
Hosted Checkout means card data never touches our origin → SAQ-A scope (22 questions, self-attestation, no QSA). Stripe auto-generates the SAQ-A PDF in Dashboard → Settings → Compliance once activation completes; founder signs annually ([Stripe — PCI compliance for SaaS, 2025](https://docs.stripe.com/security/guide#validating-pci-compliance), [PCI SSC — SAQ-A v4.0.1, 2024](https://www.pcisecuritystandards.org/document_library/)). **Hard fail mode:** if you ever embed a raw `<input>` for card numbers (you don't — you use Checkout redirect), scope jumps to SAQ-A-EP, +60 questions, +quarterly ASV scan. Keep Checkout-redirect, not Elements-on-our-page, until $100k ARR.

### 4. Live-mode webhook hardening — **Weak**
Signing algorithm and headers are identical test↔live; only the `whsec_…` secret differs ([Stripe — Webhook signing, 2025](https://docs.stripe.com/webhooks/signatures)). Three deltas worth a 1-hour PR before flip:
- **Tolerance window:** current `constructEvent` defaults to 300 s — fine; don't widen.
- **IP allowlist:** Stripe publishes egress IPs ([webhook-IPs JSON, 2025](https://docs.stripe.com/ips)), but maintaining a Vercel firewall rule for 16 rotating CIDRs costs more than the signature-verify already gives. **Skip.** Signature + idempotency PK is the documented best-practice.
- **Replay defense:** `stripe_event.id` PK in `apps/web/src/app/api/stripe/webhook/route.ts:64–71` already handles this. Verified correct.

### 5. Radar fraud — default tier sufficient — **Mid**
Sub-1k-customer B2B-SaaS rarely triggers card-testing rings. Radar (built-in, free, ML-rules) blocks ~99 % of obvious fraud. **Radar for Fraud Teams** ($0.07/screened-tx + custom rules) is overkill until chargeback-rate >0.5 % or volume >$10k/mo ([Stripe — Radar pricing, 2026](https://stripe.com/radar/pricing)). **Decision:** stay default, revisit at first chargeback.

### 6. Idempotency reconciliation job (Inngest nightly) — **Mid**
Webhook handler is at-least-once but our PK-conflict-noop guarantees exactly-once application-side. The real failure-mode is **silent webhook drops** (Vercel cold-start timeout >25 s, DB outage during handler). Mitigation: nightly Inngest job that paginates `stripe.subscriptions.list({ status: 'all' })` and reconciles each `metadata.userId` against our `subscription` table; logs drift, doesn't auto-fix ([Stripe — Best practices for webhook endpoints, 2025](https://docs.stripe.com/webhooks#best-practices)). 2-hour build, runs forever. Schedule for M3.

### 7. Subscription state edges + dunning — **Mid**
Stripe Smart Retries default: 4 attempts over 3 weeks, then `subscription.status='canceled'` unless you configure otherwise ([Stripe — Smart Retries + dunning, 2025](https://docs.stripe.com/billing/revenue-recovery/smart-retries)). Our `handleInvoicePaymentFailed` correctly flips to `past_due` (route.ts:178). Two gaps: (a) no in-app banner when `status='past_due'` — add to dashboard layout; (b) Stripe-native dunning emails are off by default — toggle on in Dashboard → Billing → Emails (free). Trial-end: `customer.subscription.trial_will_end` fires 3 days before — currently in the `default` branch (route.ts:99). Add a case + Resend email at M3 if we offer trials (we don't yet).

### 8. Refund + DACH chargeback prep — **Weak**
B2B contracts are out-of-scope for the 14-day BGB §312g Widerrufsrecht (consumer-only), so no mandatory refund window — **but** publish a refund policy anyway: "30-day money-back, no questions, prorated for partial months." Costs nothing, removes a sales objection. Chargebacks: SEPA-direct-debit (which we don't accept yet) has an 8-week no-questions reversal; card chargebacks via Stripe's Dispute flow with 7-day evidence window ([Stripe — Disputes in Europe, 2025](https://docs.stripe.com/disputes/responding)). Action: keep Checkout-receipts + signed-MSA PDF for every Agency-tier customer; that's 90 % of evidence.

---

## Critical-path sequence (M3 week-by-week)

1. **W1:** Founder files Gewerbeanmeldung (if needed), submits Stripe activation, enables Stripe Tax, creates 5 Products+Prices, copies IDs into `STRIPE_PRICE_*` env vars.
2. **W2:** Activation comes back; sign SAQ-A; toggle dunning emails; add `automatic_tax` flag to checkout-session create in `apps/web/src/app/api/stripe/checkout/route.ts` (see existing pattern in `lib/stripe.ts:34`).
3. **W3:** Build Inngest nightly reconcile job; ship `past_due` banner; publish refund policy on `/legal/refunds`.
4. **W4:** Live-mode smoke-test with founder's own card on Solo Indie tier; rotate `STRIPE_WEBHOOK_SECRET`; flip `STRIPE_LIVE_MODE`.

## Skeptic verdict

Code-side is 95 % done. The 5 % left (Stripe Tax flag, dunning toggle, reconcile job) is half a day of work. **The 95 % that's actually blocking is the founder finishing Gewerbeanmeldung paperwork and clicking "Activate" in Dashboard.** Don't conflate "engineering complete" with "ready to charge real EUR." Book the Steuerberater hour for VAT-registration questions *before* W1, not after.

---

## 100-word summary

Test-mode Stripe code (Sprint 0.13) is production-grade — signature-verify, raw-body Node-runtime, PK-idempotent — and needs almost no changes for live. The real M3 critical-path is **non-code**: German KYC (1–3 days, needs Steuer-ID + USt-IdNr. + Gewerbeanmeldung), Stripe Tax activation for EU-VAT/OSS/reverse-charge (Kill-band, ~0.5 % fee, replaces 40h/quarter manual accounting), and a 22-question SAQ-A self-attestation (auto-generated, sign annually). Add an Inngest nightly reconcile job, toggle Stripe's native dunning emails, ship a `past_due` in-app banner, publish a refund policy. Radar default is enough sub-1k customers. Total: ~4 wall-clock weeks if founder starts paperwork in W1.
