# Stripe Setup Plan — Zero-Cash-Out for Phase 0.5

> Agent A11, 2026-05-17. Scope: Stripe-prep without paying. Citation-first, severity-banded.

## TL;DR

**Stripe Checkout (hosted) + Customer Portal + flat-tier Subscriptions with metadata-driven quotas.** Skip metered billing — quota enforcement lives in our app. Test-mode is free indefinitely; founder flips `STRIPE_LIVE_MODE=true` when ready. Phase-0.5 Stripe spend: **$0**.

---

## 1. Pricing Model — Flat-Tier Subscriptions — **Strong**

Five Stripe Products (Free, Solo Indie $19, Solo Pro $79, Agency Pro $299, Agency Scale $799), each with **one recurring monthly Price**. Quotas (`paid_repos_quota`, `runs_per_month`, `seats`) live in Price-metadata + mirrored in our DB.

- **Not metered:** usage-based pricing needs a meter-event pipeline and confuses customers wanting a predictable bill ([Stripe Usage-Based Pricing](https://docs.stripe.com/subscriptions/pricing-models/usage-based-pricing), 2026).
- **Not graduated/tiered:** graduated tiers fit one-product-N-bands. We have **five distinct SKUs**, not five volume-bands ([Tiered Pricing](https://docs.stripe.com/subscriptions/pricing-models/tiered-pricing), 2026).
- **Seats:** for v1 hardcode `tier === 'agency_pro' → 5 seats` in app. Defer Stripe `quantity` per-seat pricing ([Per-Seat Pricing](https://docs.stripe.com/subscriptions/pricing-models/per-seat-pricing)) until per-seat overage matters.

## 2. Checkout — Stripe-Hosted (not Embedded, not Pricing-Page) — **Strong**

Server Action calls `stripe.checkout.sessions.create({ mode: 'subscription' })` and redirects to the hosted URL. Zero PCI scope; Stripe handles mobile/Apple-Pay/3DS ([Box Software 2026](https://www.boxsoftware.net/how-to-add-stripe-checkout-to-a-next-js-app-with-the-app-router/), [DEV 2026](https://dev.to/sameer_saleem/the-ultimate-guide-to-stripe-nextjs-2026-edition-2f33)). Hosted Pricing-Page rejected — can't gate per-repo upsells contextually. Embedded Checkout deferred to Phase 2.

## 3. Customer Portal — **Strong, free**

Included in Stripe Billing (0.7% of billing volume, $0 fixed; custom domain $10/mo optional) ([Stripe Pricing](https://stripe.com/pricing), 2026). Configure fully via Dashboard — one Server Action returning `stripe.billingPortal.sessions.create(...)` ([Customer Portal Setup](https://docs.stripe.com/no-code/customer-portal), 2026). Self-serve plan-change, card-update, invoice-download, cancellation.

## 4. Webhook Handler — `apps/web/app/api/stripe/webhook/route.ts`

**Events (v1 minimum):** `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`, `invoice.paid`.

**Load-bearing rules:**
1. `export const runtime = 'nodejs'` — Edge re-encodes body and breaks signature ([HookRay 2026](https://hookray.com/blog/stripe-webhook-best-practices-2026)).
2. `await request.text()` **before** JSON-parse — re-serialization changes whitespace, breaks HMAC ([Stripe Signature Docs](https://docs.stripe.com/webhooks/signature), 2026).
3. Exclude `/api/stripe/webhook` from Clerk middleware — auth returns 401 first ([Kitson Broadhurst 2026](https://kitson-broadhurst.medium.com/next-js-app-router-stripe-webhook-signature-verification-ea9d59f3593f)).
4. Idempotent — Stripe retries the same event ([Stripe Webhooks](https://docs.stripe.com/webhooks), 2026). Use `event.id` as Drizzle upsert key in `stripe_events`.
5. Enqueue heavy work via Inngest post-verify — keep route ≤200ms.

## 5. Free Tier vs Trial — **Free Tier wins** — **Strong**

Free tier (1 repo, no card). No time-limited trial in v1.

B2B-dev-tool freemium converts 2–5% over 90–180d but feeds the PLG-pipeline Constraint #8 requires ([Sybill 2026](https://www.sybill.ai/blogs/freemium-vs-free-trial)). Card-required trials hit ~31% but kill build-in-public top-of-funnel ([Pulseahead 2026](https://www.pulseahead.com/blog/trial-to-paid-conversion-benchmarks-in-saas)). Layer a **14-day trial onto Agency tiers later** when sales-assisted in M3+.

## 6. Schema (`packages/db/schema/subscription.ts`)

```ts
subscription {
  id, user_id (FK), stripe_customer_id, stripe_subscription_id,
  tier: 'free'|'solo_indie'|'solo_pro'|'agency_pro'|'agency_scale',
  status: 'active'|'past_due'|'canceled'|'trialing',
  paid_repos_quota int, runs_quota int, seats_quota int,
  current_period_end ts, runs_used_this_period int,
  created_at, updated_at
}
stripe_events { id (= event.id), type, processed_at }  -- idempotency
```

Helpers in `packages/billing/`: `isPaid(userId)`, `canAddRepo(userId)`, `canRunAudit(userId)`.

## 7. Implementation Order (dependency-sorted)

1. **D1**: Stripe test-mode account ($0). Create 5 Products + Prices in Dashboard. Copy IDs → `.env.test`.
2. **D1**: Add `subscription` + `stripe_events` tables, run Drizzle migration locally.
3. **D2**: `packages/billing/` helpers + tier-config constants.
4. **D2**: Server Action `createCheckoutSession(priceId)` → hosted URL.
5. **D3**: `/api/stripe/webhook/route.ts` — Node runtime, signature verify, idempotent upsert, Inngest enqueue.
6. **D3**: Local test via `stripe listen --forward-to localhost:3000/api/stripe/webhook`.
7. **D4**: Customer Portal Server Action + `/billing` page link.
8. **D4**: Gate UI — `<UpgradePrompt>` when `canAddRepo()` is false.
9. **D5**: Playwright E2E with `4242 4242 4242 4242` + failed-card `4000 0000 0000 0341` ([Stripe Test Cards](https://docs.stripe.com/testing), 2026).

**Go-live flip (Phase 1, post-M3 LOI-gate):** Submit Stripe verification (legal name, address, tax, bank — up to 1 week). Re-create Products/Prices in live mode with **identical IDs** ([Stripe Go-Live Checklist](https://docs.stripe.com/get-started/checklist/go-live), 2026). Register live webhook endpoint. IP-restrict live keys. Set `STRIPE_LIVE_MODE=true` + `STRIPE_SECRET_KEY=sk_live_…` in Vercel env. Total switch-over: **1 PD**.

## Risks

- **Mid:** Free-tier-only delays revenue signal. Mitigation: in M3 add opt-in 14-day trial to Agency tiers when LOI-pipeline matures.
- **Mid:** App-side quota drift vs Stripe state on failed-payment-but-active edge cases. Mitigation: nightly Inngest reconciliation job.
- **Weak:** Stripe Billing's 0.7% only kicks in when we charge. Pre-revenue: $0.

---

*Sources cited inline. All Stripe-doc dates 2026.*
