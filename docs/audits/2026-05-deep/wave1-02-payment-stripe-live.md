# Wave-1 · 02 — Payment-E2E Deep-Audit + Stripe Live-Readiness

**Auditor:** general-purpose subagent (Opus 4.7 / 1M-context, read-only)
**Date:** 2026-05-22
**Scope:** SaaS-Pricing-V2 implementation (Sub-Plan-A/B/C, shipped 2026-05-21) + Live-mode promotion plan
**Stripe API pinned:** `2026-04-22.dahlia` (verified: `apps/web/src/lib/stripe.ts:19`, `packages/inngest/src/functions/stripe-reconcile.ts:48`, `packages/inngest/src/functions/credit-aggregator.ts:23`, `scripts/stripe-test-setup.ts:103`)
**Severity bands:** `Kill > Strong > Mid > Weak > Exceptional`

---

## Executive Summary

| Severity | Count | Top items |
|----------|-------|-----------|
| Kill     | 2     | (1) Auto-Overage is wired in UI + DB + meter pipeline but never produces ledger rows — entire overage-billing path is dead code, paying customers can never be billed for overage; (2) `current_period_end` read from a deprecated location for API `2026-04-22.dahlia` — `currentPeriodEnd` is always `null` after the first subscription cycle, breaking renewal-date display and grant-detection signals |
| Strong   | 6     | Dashboard-replay of `invoice.paid` double-grants credits (no idempotency on invoice.id); no `customer.deleted` handler; no `tax_code` / `tax_behavior` on Prices (Stripe-Tax falls back to `txcd_10000000` standard B2B SaaS — workable but unverified); BYOK-or-managed-AI markup meter is wired but never flushed (dormant); reconcile-cron only detects, never recovers; `customer_update` missing `name` field — checkout-collected name/VAT-ID may not write back to Customer |
| Mid      | 8     | No webhook event for `customer.subscription.created` rate-limit (idempotent re-affirm only); `invoice.created` flush failure is silently swallowed; checkout success-URL leaks `session_id` (low PII but fingerprinted by analytics); credit-balance computed outside FOR-UPDATE-locked tx in `getCreditBalance`-during-grant; no test for concurrent `invoice.paid` + `subscription.updated`; portal not configured for tier-downgrades; no spend-cap enforcement on auto-overage path (column exists, never read); no proactive credit-low warning email |
| Weak     | 4     | VAT-by-IP uses `x-vercel-ip-country` (locked to Vercel host); stripe-reconcile.ts has unused `void and/eq/isNull`; `appInfo.version` strings drift between files (0.0.15 vs 0.0.16 vs 0.0.20); `stripe.subscriptions.list` reconcile keeps pageCount < 50 (5000-sub ceiling) |

**Test-Mode → Live-Mode is BLOCKED until the two `Kill` items are resolved.** The auto-overage gap means customers can buy credit-packs and burn quota but never exceed it, which is a paying-customer-blocker. The `current_period_end` gap means the renewal-date and the prepaid-pack expiry-grant logic both read `null` on real Stripe subscriptions today — only "happy enough" in the test-mode smoke because Stripe-CLI triggered events synthesise the deprecated field.

---

## Part A · Payment-Flow E2E Code Audit

### A.1 Subscription Lifecycle

#### Checkout creation
File: `apps/web/src/lib/billing-actions.ts`

Two flows, both Server Actions:
- `createCheckoutSession(tier, cycle)` — `mode: "subscription"`, lines `71-87`
- `createPrepaidPackCheckoutSession(packSize)` — `mode: "payment"`, lines `181-207`

**Correctness verified:**
- `automatic_tax: { enabled: true }` set on BOTH flows (`billing-actions.ts:82,202`)
- `tax_id_collection: { enabled: true }` set on BOTH flows (`billing-actions.ts:84,204`)
- Metadata: `workspaceId`, `userId`, `tier`, `cycle` on subscription path (`billing-actions.ts:79,80`)
- `subscription_data.metadata` mirrored so `customer.subscription.*` webhooks have the same payload (`billing-actions.ts:78`)
- `client_reference_id: workspaceId` as fallback when metadata gets stripped (`billing-actions.ts:76,186`)
- Both Server Actions return `redirect(result.url as never)` — the `as never` is needed because `redirect()` is typed `never` but Vercel's typed-routes plugin tightens it; safe.

**Issues:**

##### Kill #1 — Auto-Overage is dead code end-to-end
- `apps/web/src/lib/audit-action.ts:122` calls `canConsume(actor.workspaceId, need)` with NO `options.allowOverage`. Defaults to `false`.
- `apps/web/src/lib/audit-action.ts:352` calls `consumeCredits({ ... })` without `allowOverage` either.
- `packages/inngest/src/functions/audit-requested.ts:70` (background path) — same: no `allowOverage`.
- `apps/web/src/lib/workspace-ai-actions.ts:110` writes `autoOverageEnabled` to DB.
- `apps/web/src/app/[workspace]/settings/ai/page.tsx:189-204` exposes the toggle to the user.
- `packages/inngest/src/functions/credit-aggregator.ts:56` polls for `cl.reason = 'overage'` rows.
- `packages/billing/src/credits.ts:163` — overage path requires `args.allowOverage === true`, which no caller ever passes.

→ When a customer enables Auto-Overage, the next audit still blocks at the canConsume gate. No `credit_ledger` row with `reason='overage'` is ever created. The credit-aggregator finds nothing to flush. The `stripe.billing.meterEvents.create` for `audit_credit_overage` is never invoked in production. The whole Sub-Plan-B overage-meter is wired-but-dormant. The Pricing page (`pricing/page.tsx:241`) explicitly promises "extra credits get billed via Stripe at €0.30 each at the end of the cycle" — false advertising once Live-Mode is on.

→ **Fix:** `audit-action.ts:122` must read `snap.autoOverageEnabled` and pass `allowOverage: true` to `canConsume` AND `consumeCredits` (Inngest path too). `consumeCredits` already writes the overage ledger row when balance goes negative (`packages/billing/src/credits.ts:163-194` — but the `delta` for the overage ledger row uses `-args.amount`, while the aggregator expects positive units via `Math.abs(row.delta)` on `credit-aggregator.ts:73`, so the sign-convention works). Additionally, spend-cap (`spendCapMicrocents` column) needs to be enforced — currently never read.

##### Strong #1 — `customer_update` missing `name` field
- `billing-actions.ts:83,203`: `customer_update: snap.stripeCustomerId ? { address: "auto" } : undefined`
- Per Stripe-API contract, when `tax_id_collection` is enabled and the customer already exists, Stripe needs `customer_update.address` AND `customer_update.name` to write Checkout-form-collected name back to the Customer object. With only `address`, the legal name shown on invoices stays whatever Stripe auto-detected on first customer creation. For DACH B2B this means VAT-relevant invoices may show partial info.
- **Fix:** `customer_update: { address: "auto", name: "auto" }`.

##### Strong #2 — No payment-method validation on initial checkout
- `mode: "subscription"` Checkout sessions accept any card. There's no `payment_method_collection: "if_required"` — defaults to `"always"`. Acceptable, but not explicit, and means even free-tier downgrades through portal would need a card. (Free is currently unreachable via Checkout; only via portal `customer.subscription.deleted`.)

#### Webhook handler
File: `apps/web/src/app/api/stripe/webhook/route.ts`

**Correctness verified:**
- Node runtime (`route.ts:39`) — required for raw-body signature verification, edge re-encodes the body and breaks signatures
- `req.text()` BEFORE JSON-parse (`route.ts:88`) — correct order
- `stripe.webhooks.constructEvent(rawBody, signature, secret)` — proper signature verify (`route.ts:93`)
- 503 fallbacks: `isDbEnabled()` → 503 (`route.ts:66-71`), `isStripeEnabled()` → 503 (same), `STRIPE_WEBHOOK_SECRET` missing → 503 (`route.ts:72-78`). Verified.
- 400 on empty signature (`route.ts:80-86`), 400 on `constructEvent` throw (`route.ts:94-100`)
- Idempotency via `INSERT INTO stripe_event ... ON CONFLICT DO NOTHING RETURNING id` (`route.ts:104-116`) — replays return `{ ok: true, duplicate: true }`. **Verified end-to-end in integration test** (`route.integration.test.ts:93-134`).

Six handled event types (switch, `route.ts:119-153`):
1. `checkout.session.completed` → tier-upgrade or prepaid-pack grant
2. `customer.subscription.created` → idempotent re-affirm (same handler as updated)
3. `customer.subscription.updated` → tier/status change
4. `customer.subscription.deleted` → downgrade to free
5. `invoice.created` → synchronous meter-flush
6. `invoice.paid` → monthly credit grant + reset
7. `invoice.payment_failed` → flag `past_due`

**Note:** Switch default is `break` → returns 200 with `{ ok: true }` for unhandled events. Stripe doesn't retry on 200, so unknown events drain quietly — fine. But this means subscription-schedule changes (`subscription_schedule.*`), refunds (`charge.refunded`), and disputes (`charge.dispute.*`) are SILENTLY DROPPED. The reconcile cron will surface tier-drift but not credit-state drift on a refund.

**Issues:**

##### Kill #2 — `current_period_end` deprecated in API 2026-04-22.dahlia
- `route.ts:461-465`:
  ```ts
  function periodEndFromSubscription(sub: Stripe.Subscription): Date | null {
    const candidate =
      (sub as unknown as { current_period_end?: number }).current_period_end;
    return typeof candidate === "number" ? new Date(candidate * 1000) : null;
  }
  ```
- In API version `2026-04-22.dahlia`, `current_period_end` was removed from the root `Subscription` object and moved into each `SubscriptionItem.current_period_end`. Stripe deprecated this back in API 2025-* and dropped it from root in `2026-04-22.dahlia`. The webhook payloads from a real Live-Mode subscription will have `sub.current_period_end === undefined` — `periodEndFromSubscription` returns `null` every time.
- Downstream effects:
  - `billing/page.tsx:158` shows "Next renewal: —"
  - `billing/page.tsx:209` shows "Resets on —"
  - Reconcile-cron has no period-end signal but doesn't compare it currently — partial luck
  - Prepaid-pack expiry email logic uses its own 12-month timestamp, not affected
- The integration test `route.integration.test.ts:144` only triggers `customer.subscription.deleted` via synthetic payload; it does NOT exercise `subscription.updated` with `2026-04-22.dahlia` real subscription items. Test-Mode smoke via Stripe-CLI `stripe trigger` may still synthesise the old field shape; this lands silently in production.
- **Fix:** read `sub.items.data[0].current_period_end` (and store an arbitrary item's value; for our single-line subscriptions all items share the same period). Type already exists on `Stripe.SubscriptionItem` in the SDK.

##### Strong #3 — `handleInvoicePaid` not idempotent on invoice.id (dashboard-replay double-grants)
- `route.ts:315-352`: the only idempotency is `stripe_event.id` PK. If a Stripe admin replays the same `invoice.paid` event via the Dashboard (Developers → Webhooks → Send test webhook / Resend), a NEW event id is generated. The handler will:
  1. Insert a new `stripe_event` row (no conflict, fresh id)
  2. Reset `credits_used_this_period = 0`
  3. Insert a new `credit_ledger` row with `reason='monthly_grant'`, `delta=creditsQuotaPerCycle`
  - This double-grants credits.
- **Fix:** In `handleInvoicePaid`, wrap the grant in `INSERT ... ON CONFLICT DO NOTHING` keyed on `(workspaceId, reason, referenceId=invoice.id)`. Schema change required: a partial unique index on `credit_ledger (workspace_id, reason, reference_id) WHERE reason='monthly_grant'`. Alternative: check ledger for existing row with `reference_id=invoice.id` before granting.
- Cite: `packages/billing/src/credits.ts:240-246` — `grantCredits` blindly inserts. No idempotency layer.

##### Strong #4 — No `customer.deleted` handler
- If an admin deletes a Stripe Customer from the Dashboard, our `subscription.stripeCustomerId` column points to a deleted entity. The next `createBillingPortalSession` call will fail with a 4xx from Stripe (`No such customer: cus_X`). The user sees "Stripe portal" error and can't fix it.
- Stripe sends `customer.deleted` events; the handler should null out `stripe_customer_id` + `stripe_subscription_id` and downgrade to free.
- **Fix:** Add `case "customer.deleted":` to the switch.

##### Strong #5 — `customer.subscription.created` re-affirm depends on metadata leakage
- `route.ts:125-131`: handler re-uses `handleSubscriptionUpdated`. That reads `sub.metadata?.workspaceId`, falling back to `lookupWorkspaceByCustomer`. If checkout-session metadata didn't propagate (Stripe sometimes drops `subscription_data.metadata` if checkout completion fires before subscription is fully created — race), the `subscription.created` event has empty metadata and the customer lookup also fails because the `stripe_customer_id` write in `handleCheckoutCompleted` hasn't landed yet (both webhooks arrive close together; Stripe doesn't guarantee order).
- The integration test does not cover this race. Manually verifiable via Stripe-CLI: `stripe trigger customer.subscription.created` triggers in isolation, no metadata, no DB row → silently no-op.
- **Fix:** add a `setTimeout(retry, 1000)` or accept eventual-consistency: trust `checkout.session.completed` as the authoritative provision path, treat `subscription.created` as a pure no-op. Currently it overwrites tier with `"free"` (default fallback `route.ts:207`) if metadata is missing — actively harmful.

##### Mid #1 — `invoice.created` meter-flush failures are swallowed
- `route.ts:306-312`: `flushPendingForCustomer` errors only `console.error`. Stripe gets a 200 and finalizes the invoice. Pending overage rows stay unflushed for 5 minutes until the next Inngest tick — but if the invoice is already finalized, those rows now drift forever (the customer won't be billed for them until the next billing cycle, and the credit-aggregator doesn't re-attach them to any open invoice).
- Comment claims Stripe will re-deliver `invoice.created` (`route.ts:309-310`) — Stripe only re-delivers on 5xx. We return 200. **Fix:** return 500 on flush failure (or queue a compensating Inngest event with a `subscription_item.create_usage_record` style retry).

##### Mid #2 — `applyTierToWorkspace` not transactional
- `route.ts:402-438`: select-then-insert-or-update is two separate DB roundtrips. Concurrent `subscription.created` + `subscription.updated` for the same workspace can both pass the "no existing row" check and both call `insert(...)`. The `subscription.workspaceId` column has a `.unique()` constraint (`packages/db/src/schema.ts:518-521`) so the second one throws → caught by the route handler's try/catch → returns 500 → Stripe retries → next time the row exists, update path wins. Workable but noisy.
- **Fix:** single `INSERT ... ON CONFLICT DO UPDATE SET ...` with proper conflict target.

##### Mid #3 — Concurrent `checkout.session.completed` and `customer.subscription.created` race
- Verified via the same not-transactional-applyTierToWorkspace and metadata-fallback in `handleSubscriptionUpdated`. The "default to `free`" fallback at `route.ts:207` means a late `subscription.created` after a successful checkout could downgrade the customer to free if metadata didn't make it through.
- The previousTier-fetch-then-overwrite pattern at `route.ts:212-216` is correct in spirit but not race-safe.

#### Cancellation flow
- `handleSubscriptionDeleted` (`route.ts:254-297`) sets `tier='free'`, `status='canceled'`, clears `stripeSubscriptionId`, KEEPS `stripeCustomerId`.
- Email sent via `PlanChangeConfirmation` with `kind: "canceled"` — verified.
- **No re-activation flow.** If a user cancels then changes their mind, the only path is to start a new checkout — which creates a new `customer.subscription` and clobbers the now-`null` `stripeSubscriptionId`. Workable but loses subscription history continuity.
- **No soft-cancel-at-period-end UX.** The customer portal allows period-end cancellation (per stripe-go-live.md §2 checklist item) but the app reads `subscription.status === "canceled"` only after deletion. No `cancel_at_period_end` column or display. Customers who cancel will see "Active" in the UI until the period actually ends → confusing.

---

### A.2 Credit System

Files: `packages/billing/src/credits.ts`, schema in `packages/db/src/schema.ts:691-757`

**Append-only ledger ✅** — `credit_ledger` is INSERT-only via `consumeCredits` / `grantCredits`. No UPDATE path on existing rows (`credits.ts:203,240`).

**Idempotency via Stripe-ID PK ✅** — `prepaid_credit_grant.stripeInvoiceId` is `.notNull().unique()` (schema.ts:731-733). The webhook uses `.onConflictDoNothing({ target: prepaidCreditGrant.stripeInvoiceId })` at `route.ts:488` AND short-circuits before re-granting via `grantCredits` if `inserted.length === 0` (`route.ts:491-492`). Verified.

**Race-safety ✅** — `consumeCredits` uses raw `SELECT ... FOR UPDATE` (`credits.ts:126-130`) inside a `db.transaction`. Prepaid + subscription pool drain in the same tx. Per the comment block at `credits.ts:6-8`. Correct.

**Issues:**

##### Strong #3 (revisited) — `grantCredits` non-idempotent on `referenceId`
Documented above. Critical for `monthly_grant` from `invoice.paid` Dashboard-replays.

##### Mid #4 — `getCreditBalance` called inside `grantCredits` tx with a casted Db
- `credits.ts:239`: `await getCreditBalance(args.workspaceId, tx as unknown as Db);`
- The cast suggests the tx type doesn't match the `Db` interface in `@vk/db`. Functionally `tx` has `.select` and reads OK, but if anyone later changes `Db` to add helper methods, this breaks at runtime, not compile-time.
- More importantly: `getCreditBalance` does NOT `FOR UPDATE` lock the subscription row. Inside `grantCredits` tx, a concurrent `consumeCredits` could change `creditsUsedThisPeriod` between the `update subscription` (line 234-237) and the `getCreditBalance` read. The `balanceAfter` value written to the ledger could be stale — not catastrophic (it's denormalized), but the invariant "latest credit_ledger row's balance_after == effective balance" is broken under concurrency.

##### Mid #5 — Refund-flow not implemented
- `CreditReason` type includes `"refund"` (`credits.ts:13-19`) but no handler creates such rows. If a customer disputes a charge and Stripe refunds, credits are NOT reclaimed. Risk: customers refund their plan, keep the credits, run audits.
- **Fix:** subscribe to `charge.refunded` + `invoice.refund.created`; create a negative ledger row.

##### Weak #1 — Negative balance protection
- `consumeCredits` with `allowOverage=true` happily writes negative `creditsUsedThisPeriod` (well, `>quota`). The `subscriptionRemaining` floor is `Math.max(0, ...)` so it clamps display, but the column itself can be `> quota`. UI doesn't surface that. Not a correctness bug, but a debugging hazard.

---

### A.3 Metering

Files: `apps/web/src/lib/stripe-meters.ts`, `packages/inngest/src/functions/credit-aggregator.ts`

Two meters defined (`packages/billing/src/stripe-test-setup.ts:49-63`):
- `audit_credit_overage` (overage credits, billed at €0.30 each via Price `vk_overage_credit_eur`)
- `ai_cost_markup_microcents` (AI-cost markup, microcent-precision via `transform_quantity: { divide_by: 100 }`)

**Idempotency:** two-layer (`stripe-meters.ts:8-13`):
1. `stripe.billing.meterEvents.create` with an `identifier` (Stripe dedupes server-side for 24h on identifier)
2. `stripe_meter_event_log.identifier` PK in our DB — preflight check before submission (`stripe-meters.ts:42-49`)

Identifier source: `credit_ledger.id` (a UUID) for the overage path (`credit-aggregator.ts:78-79`). Stable, unique per ledger row.

**Issues:**

##### Strong #5 — AI-markup meter is dormant (declared but never flushed)
- Per the schema comment (`stripe-test-setup.ts:225-228`): "The markup-meter is declared in Sub-Plan-B but only flushed in Sub-Plan-C once the disclosure copy is live; this is the wired-but-dormant state."
- Sub-Plan-C shipped 2026-05-21 (`docs/plans/done/saas-pricing-sub-c-ui-compliance.md`).
- `audit-action.ts:381` and `audit-requested.ts:91` both write `markupMicrocents: 0` to `audit_run_cost`.
- No code submits `ai_cost_markup_microcents` meter events. The pricing-page says "AI-cost-markup" is part of the model (`pricing/page.tsx:213,222`) — and the metered Price exists in Stripe (€0.01 / 100 microcents) — but no flow ever feeds it. Customers won't be charged for AI-markup even if they consent.
- **Fix:** add a per-scan markup computation (`audit_run_cost.markupMicrocents = floor(totalCostMicrocents * MARKUP_RATIO)`) and feed it into `submitMeterEvent({ kind: "ai_markup", value: markupMicrocents })`. Gate behind `byokFlag === false`.

##### Strong #6 — Reconcile-cron is detection-only
- `packages/inngest/src/functions/stripe-reconcile.ts` runs daily at 03:00 UTC, paginates `stripe.subscriptions.list({ status: "all" })`, compares to DB, publishes `audit.failed` events when tier or status mismatches.
- It does NOT auto-fix. Drift is silently logged to the workspace event-stream — there's no email-on-drift, no Linear-ticket-on-drift, no dashboard surface. The founder needs to check `event` table manually.
- For first 100 customers this is fine. After that it scales linearly worse.
- Per `docs/operations/stripe-go-live.md:156` ("Auto-fix in the reconcile cron"): V2.

##### Mid #6 — `credit-aggregator` cron `pageCount < 50` limit
- `credit-aggregator.ts:104-128`: `BATCH_LIMIT = 100`, runs every 5 minutes, processes max 100 events per tick.
- At 100 customers each running 10 deep audits/day, that's 1000 audit events. Most won't be overage, but at scale the 100/tick limit means ~5min latency between consume → meter event. Acceptable for monthly billing.
- `stripe-reconcile.ts:59`: `while (pageCount < 50)` × `limit: 100` = 5000-subscription hard ceiling. Live-mode won't hit this for a year, but worth flagging.

##### Mid #7 — Meter-event `timestamp` is wall-clock at flush time, not at consume time
- `credit-aggregator.ts:79`: `timestamp: Math.floor(Date.now() / 1000)` — set at flush time. Stripe sees the meter event landing 0–5 minutes after the customer actually consumed it. For monthly billing this is fine. For "metered usage in this invoice period" edge cases (consume at 23:59 on the last day, flush at 00:01 next month → event lands in NEXT period's invoice), it shifts revenue.
- **Fix:** use `credit_ledger.created_at` as the timestamp.

---

### A.4 Failure Modes

#### `invoice.payment_failed` gating
- `route.ts:354-391` sets `status='past_due'`, sends `SubscriptionPastDue` email via `sendTransactionalEmail`.
- The `/billing` page shows a red banner when `snap.status === "past_due"` (`billing/page.tsx:98,125-143`) with an "Update payment" CTA opening the portal.
- **Issue (Mid #8): No feature gating.** A `past_due` user can still trigger audits. `audit-action.ts:120-126` checks `canConsume` for credits only — doesn't check `snap.status`. So a customer with a failed payment burns through their existing credit balance until Stripe gives up (4–5 retries over ~3 weeks → `customer.subscription.deleted`) and only then downgrades to free.
- **Fix:** in `audit-action.ts:120-126`, after `canConsume`, check `snap.status !== "active" && snap.tier !== "free"` and block.
- The integration test `route.integration.test.ts:166-193` verifies the column flip but does not assert feature-blocking.

#### Dunning
- No app-side dunning logic. Relies entirely on Stripe-Dashboard-configured Smart Retries (`stripe-go-live.md` §2 implies this is on the operator to configure).
- The `SubscriptionPastDue` email is sent ONCE per `invoice.payment_failed` event (Stripe sends one event per retry attempt, so the customer gets up to 4 emails — `route.ts:378-379` uses `invoice.attempt_count` to surface "attempt N"). Acceptable.

#### Webhook failures
- 5xx on handler error (`route.ts:155-158`) — Stripe retries with exponential backoff for up to 3 days. Combined with `stripe_event` PK idempotency, this is correct.
- The 5xx swallows the actual error inside `console.error` (`route.ts:156`). No structured logging, no Sentry/observability hook. → **Mid finding (logging gap)**.

#### 503-fallback for missing env-vars
- `apps/web/src/app/api/stripe/webhook/route.ts:66-78` — 503 when `!isDbEnabled()` OR `!isStripeEnabled()` OR `!STRIPE_WEBHOOK_SECRET`. ✅
- `apps/web/src/lib/billing-actions.ts:41-50, 107-111, 156-162` — `ok: false` with error string when DB or Stripe is off. The Server Action redirects to `/billing?status=error&reason=...`. ✅
- `apps/web/src/lib/health-check.ts:116-126` — Stripe health probe returns `disabled` when key is unset. ✅
- All Stripe API call sites verified: `billing-actions.ts:68,133,177`, `route.ts:89`, `stripe-meters.ts:51`, `credit-aggregator.ts:18-26` (own loader), `stripe-reconcile.ts:43-51` (own loader). All gate on `STRIPE_SECRET_KEY` either via `isStripeEnabled()` or local null-check.

#### Concurrent webhooks for same workspace
- DB-level locks: NONE on the subscription row except inside `consumeCredits` (`FOR UPDATE`). The webhook handlers operate without explicit row locks. Race example:
  - `invoice.paid` fires → starts resetting `credits_used_this_period = 0`
  - Concurrent `customer.subscription.updated` fires → `applyTierToWorkspace` overwrites `credits_quota_per_cycle` to new tier's quota
  - Order can interleave → ledger row written with stale `balance_after`
- Stripe webhook delivery is parallel by default. The `stripe_event` PK ensures each event is processed once, but two DIFFERENT events for the same subscription can be in-flight concurrently in Vercel Fluid Compute.
- Workable in practice (small race window, eventually consistent), but worth a `Mid` flag for "add an advisory lock per workspace_id during webhook processing." Postgres `pg_advisory_xact_lock(hashtext(workspace_id))` would do it.

---

### A.5 Tax + Compliance

#### Stripe-Tax integration
- `automatic_tax: { enabled: true }` on both checkout flows ✅ (`billing-actions.ts:82,202`)
- Subscription path: ✅
- Pack path: ✅

#### `tax_code` on Prices — MISSING
- `scripts/stripe-test-setup.ts:152-163,175-185,229-253` — none of the 12 Prices set `tax_code`. Default falls back to `txcd_10000000` (general SaaS). Acceptable for ValidationKit since the product IS SaaS, but Stripe-Tax recommends explicit tagging for proper EU place-of-supply rules.
- **Strong #2 (revisited):** for DACH-B2B compliance, the recommended tax_code is `txcd_10103001` (Software-as-a-Service — Business Use, Pre-Written). Setting this explicitly avoids edge cases on Reverse-Charge invoices for EU-B2B.

#### Tax-ID collection
- `tax_id_collection: { enabled: true }` ✅ on both flows (`billing-actions.ts:84,204`)
- B2B VAT-IDs are collected at checkout. Stripe validates them automatically (calls VIES for EU).
- Reverse-charge note appears on EU-B2B invoices automatically via Stripe-Tax. Per pricing-page FAQ (`pricing/page.tsx:248-250`): "EU B2B customers with a valid VAT ID get reverse-charge with the standard `Steuerschuldner: Leistungsempfänger` invoice note." — assumes Stripe-Tax DE registration is done.

#### Invoice PDFs
- Stripe sends invoice PDFs automatically when `automatic_tax` is on. ✅
- No custom branding configured in the bootstrap script. Branding lives in Stripe-Dashboard → Settings → Branding (`stripe-go-live.md` §2 has a Customer-Portal section but doesn't list invoice branding). **Mid finding: Invoice PDFs ship unbranded.**

#### EU OSS / DE registration
- Per `docs/operations/stripe-go-live.md:99-102`:
  - DE registration: OUTSTANDING
  - EU OSS: required at €10k/year non-DE EU
  - US state monitoring: enabled by default in Stripe-Tax
- Until DE registration, Stripe-Tax falls back to "no VAT, net price displayed" for DE customers. The /pricing page shows VAT-inclusive prices via IP-detection (`vat.ts:14-43`, `pricing/page.tsx:63-65`) — meaning the customer sees `€34.51 (incl. 19% VAT)` on the pricing page but pays `€29.00` at checkout, with Stripe-Tax adding nothing because DE-registration isn't done. **Strong-level risk** for buyer-trust: prices on `/pricing` are wrong until DE-registration ships.

---

### A.6 Customer Portal

- `createBillingPortalSession` (`billing-actions.ts:106-139`):
  - `stripe.billingPortal.sessions.create({ customer, return_url })` ✅
  - Gates on existing `stripeCustomerId` ✅ (returns `ok: false` with a "no customer on file" reason)
  - No allowed-features overrides — relies on Stripe-Dashboard config (per `stripe-go-live.md` §2 checklist).

- Stripe-Dashboard config (per the operator checklist in stripe-go-live.md:85-94):
  - [ ] Payment methods, Invoice history, Cancellation (period-end + reason), Plan switching, Tax-ID update, Return URL
  - **All unchecked. Live-Mode promotion requires running this checklist.** **Mid finding** — needs operator action.

- The portal is invoked from TWO places: the `past_due` banner button (`billing/page.tsx:136-141`) and the bottom-of-page "Open Stripe portal" button (`billing/page.tsx:326-330`). Both go through the same Server Action. ✅

---

## Part B · Test-Mode → Live-Mode Switch Plan

### B.1 Stripe Account Setup (Live)

| Step | Action | Out-of-band time |
|------|--------|------------------|
| 1.1  | Create Stripe Atlas / DE GmbH (or sole-proprietor) entity. Provide IBAN, tax-ID (DE VAT), beneficial-owner KYC. | 3–10 business days |
| 1.2  | Activate Live-Mode after KYC clears. Receive `sk_live_…` + `pk_live_…` keys. | Same-day after KYC |
| 1.3  | Stripe-Tax — DE registration via Stripe-Dashboard → Tax → Settings. Stripe handles VAT-OSS opt-in once DE is done. | 1–2 days |
| 1.4  | EU OSS registration via BZSt (out-of-band — Stripe surfaces a reminder at €10k threshold but registration is manual). | Not needed for launch |
| 1.5  | Apple-Pay domain-verification for `validationkit.app`: upload `apple-developer-merchantid-domain-association` to `/.well-known/`. Required only if Apple-Pay is enabled in Checkout. | 30min |
| 1.6  | Live-Mode webhook endpoint: register `https://validationkit.app/api/stripe/webhook` with the seven events (`checkout.session.completed`, `customer.subscription.created`, `.updated`, `.deleted`, `invoice.created`, `.paid`, `.payment_failed`). API version pin: `2026-04-22.dahlia`. | 5min |
| 1.7  | Live-Mode `whsec_…` secret → Vercel project env (production + preview + dev). | 5min |

### B.2 Product / Price / Meter Bootstrap in Live

**Existing script:** `scripts/stripe-test-setup.ts` — guards against non-`sk_test_` keys at `:97-101`:
```ts
if (!key.startsWith("sk_test_")) {
  throw new Error(
    "STRIPE_SECRET_KEY is not a test-mode key (must start with sk_test_).",
  );
}
```

**→ The script REJECTS Live-Mode keys. A separate Live-Mode runner does NOT exist.** The `docs/operations/stripe-go-live.md:118` claim that "`pnpm stripe:setup-test` supports live keys" is FALSE.

**Required new work:**
1. Rename the script to `scripts/stripe-setup.ts` and add a CLI flag `--mode=live|test` that swaps:
   - The `sk_test_` validation gate
   - The output file path (`.env.stripe-live-mode.generated` vs `.env.stripe-test-mode.generated`)
   - The Stripe-API key source (could share `STRIPE_SECRET_KEY` env, just relax the prefix gate)
2. Re-run against Live-Mode. The script is idempotent via `lookup_keys` (12 Prices + 1 Product + 2 Meters, all with lookup-keys) — re-runs skip existing.
3. **Mapping table** (Test → Live):

| Lookup-Key | Env-Var | Notes |
|------------|---------|-------|
| `vk_validation_product` | `STRIPE_PRODUCT_ID` | Single product, all Prices attach. |
| `vk_starter_base_eur_monthly` | `STRIPE_PRICE_STARTER_MONTHLY` | €29/mo licensed. |
| `vk_starter_base_eur_annual` | `STRIPE_PRICE_STARTER_ANNUAL` | €278.40/yr (20% off). |
| `vk_pro_base_eur_monthly` | `STRIPE_PRICE_PRO_MONTHLY` | €99/mo. |
| `vk_pro_base_eur_annual` | `STRIPE_PRICE_PRO_ANNUAL` | €950.40/yr. |
| `vk_agency_base_eur_monthly` | `STRIPE_PRICE_AGENCY_MONTHLY` | €299/mo. |
| `vk_agency_base_eur_annual` | `STRIPE_PRICE_AGENCY_ANNUAL` | €2870.40/yr. |
| `vk_pack_100_credits_eur` | `STRIPE_PRICE_PACK_100` | €25 one-time. |
| `vk_pack_500_credits_eur` | `STRIPE_PRICE_PACK_500` | €99 one-time. |
| `vk_overage_credit_eur` | `STRIPE_PRICE_OVERAGE_CREDIT_EUR` | Metered, €0.30/credit. |
| `vk_ai_markup_microcent_eur` | `STRIPE_PRICE_AI_MARKUP_MICROCENT_EUR` | Metered, dormant (see Strong #5). |
| `audit_credit_overage` (meter) | `STRIPE_METER_AUDIT_CREDIT_OVERAGE` | Sum aggregation, `event_payload.value`. |
| `ai_cost_markup_microcents` (meter) | `STRIPE_METER_AI_COST_MARKUP_MICROCENTS` | Sum aggregation, dormant. |

4. **Tax codes** on each Price (currently MISSING — Strong #2): patch `findOrCreateTierPrice` + `findOrCreatePackPrice` to set `tax_code: "txcd_10103001"` (Software-as-a-Service — Business Use, Pre-Written). Stripe-Tax then routes EU reverse-charge correctly.
5. **Webhook destination ID** — Stripe-Dashboard returns `we_…` after creating the live endpoint. Not stored in env; only used for `stripe trigger --forward-to` testing.

### B.3 Env-Var-Swap

| Var | Test-Mode | Live-Mode | Files touched |
|-----|-----------|-----------|---------------|
| `STRIPE_SECRET_KEY` | `sk_test_…` | `sk_live_…` | Vercel-only. Not in `.env.example` (commented). |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` from `stripe listen` | `whsec_…` from Dashboard endpoint | Vercel-only. |
| `STRIPE_PRODUCT_ID` | `prod_test_…` | `prod_live_…` | `.env.local` (dev), Vercel (prod). |
| All 7 tier-price vars | `price_test_…` × 6 | `price_live_…` × 6 | `.env.local` + Vercel. |
| `STRIPE_PRICE_PACK_100` / `_500` | `price_test_…` | `price_live_…` | `.env.local` + Vercel. |
| `STRIPE_METER_*` (2 meters) | `mtr_test_…` | `mtr_live_…` | `.env.local` + Vercel. |
| `STRIPE_PRICE_OVERAGE_CREDIT_EUR` | `price_test_…` | `price_live_…` | `.env.local` + Vercel. |
| `STRIPE_PRICE_AI_MARKUP_MICROCENT_EUR` | `price_test_…` | `price_live_…` | `.env.local` + Vercel. |

**Total 14 env-vars** must swap. The bootstrap script writes them into `.env.stripe-{test|live}-mode.generated`. For Vercel:

```bash
# Vercel CLI (per environment)
vercel env add STRIPE_SECRET_KEY production
# ... repeat for each
```

Or use `vercel env pull` to seed `.env.production.local` and `vercel env push` to upload bulk. Note: there is NO `vercel env push` command; you must `vercel env add` one at a time OR import via the Dashboard UI's "Bulk Edit" textarea.

**Code references that read these vars at runtime:**
- `apps/web/src/lib/stripe.ts:12,21,49-67,72-104,113` (all 14 env keys live here)
- `apps/web/src/app/api/stripe/webhook/route.ts:72` (webhook secret)
- `packages/inngest/src/functions/credit-aggregator.ts:19-26` (own Stripe client)
- `packages/inngest/src/functions/stripe-reconcile.ts:43-51` (own Stripe client)
- `apps/web/src/lib/health-check.ts:117` (probe Stripe API)

**`appInfo.version` strings need bumping** (Weak finding):
- `apps/web/src/lib/stripe.ts:21` → `"0.0.15"`
- `packages/inngest/src/functions/stripe-reconcile.ts:50` → `"0.0.16"`
- `packages/inngest/src/functions/credit-aggregator.ts:24` → `"0.0.20"`
- `scripts/stripe-test-setup.ts:105` → `"0.0.20"`
- All drift. Set to a single source (e.g., `apps/web/package.json` version) before Live-Mode.

### B.4 Pre-Live Verification Checklist

1. **Smoke-test Checkout end-to-end (real card):**
   - Log in to a fresh account on `validationkit.app` (or a Vercel preview deployment).
   - Click "Upgrade" → "Starter Monthly" → use a REAL card on Stripe Live-Mode Checkout.
   - Charge: €29 + VAT (DE: €34.51 incl. 19%).
   - Verify webhook delivery in Stripe-Dashboard → Developers → Webhooks → endpoint → recent events all 2xx.
   - Verify `subscription.tier='starter'`, `subscription.status='active'`, `subscription.stripe_customer_id` set.
   - Refund the test subscription via Stripe-Dashboard (full refund + cancel).
   - Verify `customer.subscription.deleted` arrives → `tier='free'`, `status='canceled'`.

2. **Webhook-replay test (Stripe CLI):**
   - From Stripe-Dashboard: pick the `invoice.paid` event from step 1, click "Resend" → verify the second delivery returns 200 from our endpoint AND `monthly_grant` does NOT double-grant in `credit_ledger`.
   - **EXPECTED TO FAIL** per Strong #3. Either accept the double-grant risk (low at the start, manual cleanup of `credit_ledger`) OR ship the idempotency fix first.

3. **Tax-calc spot-check:**
   - Buy a Starter Monthly subscription from a DE IP → expect 19% VAT line on invoice → `€34.51` total.
   - Buy as a B2B with valid VAT-ID (`DE123456789` style) → expect Reverse-Charge note on invoice → `€29.00` total.
   - Verify `/pricing` page shows VAT-inclusive `€34/mo` from DE IP (currently works via `x-vercel-ip-country` header).

4. **Customer Portal smoke:**
   - From `/[workspace]/settings/billing`, click "Open Stripe portal".
   - Verify all 6 actions from `stripe-go-live.md:88-94` are enabled and functional.
   - Cancel-at-period-end via portal → verify webhook fires `customer.subscription.updated` with `cancel_at_period_end: true`. **No app-side surface for this currently (Mid finding).**

5. **Email receipts arrive (Resend):**
   - `PlanChangeConfirmation` on first checkout — should land in the user's inbox.
   - Inspect headers: `From: notifications@validationkit.app`, DKIM passing.
   - Check Mailpit during local dev — note that prod uses Resend-SMTP not Resend-Node-SDK (per CLAUDE.md "Email" line).

6. **Subprocessor manifest update:**
   - `apps/web/src/lib/sub-processors.ts:67-76` — Stripe entry status is `"planned"`. Flip to `"active"` and bump `introducedAt` to the live-mode go-live date. The 30-day DPA notice clock starts on this date.

### B.5 Cutover Risks

**What can't be tested Pre-Live:**
- Real-money charge flows (you can charge yourself, then refund; but you can't simulate 50 customers, dunning over 21-day Smart-Retry window, or tax-report aggregation).
- Apple-Pay / Google-Pay device-specific UX (test devices have separate Live-Mode requirements).
- Stripe-Tax DE registration latency — first DE customer triggers the registration; until then, DE customers see net prices. Per `docs/operations/stripe-go-live.md:100`.
- EU-VAT-OSS threshold (€10k/year non-DE-EU) — won't be hit for months.

**Rollback procedure:**
1. **Toggle to Test-Mode keys in Vercel:** swap `STRIPE_SECRET_KEY` → `sk_test_…`. Existing Live-Mode subscriptions keep running on Stripe's side (they're managed by Stripe, not our app), but we stop creating NEW checkouts. New users see "Stripe is not configured" via the 503 path.
2. **Pause Live-Mode webhook endpoint** in Stripe-Dashboard → Developers → Webhooks → Disable. Stripe queues events for up to 3 days; re-enable when fixed.
3. **Revert code:** every Sub-B change is in a single commit per `docs/operations/stripe-go-live.md:149`. `git revert <sha>` brings the previous wire-up back.
4. **Stripe-Dashboard cleanup:** Products + Prices can be ARCHIVED but NOT DELETED — deleting breaks existing subscriptions. Use Dashboard → Products → ⋯ → Archive.
5. **Disable signups without app downtime:** comment out the "Upgrade" buttons in `/billing` and `/pricing` (`billing/page.tsx:296-310`, `pricing/page.tsx:177-192`). Existing users keep access. **No env flag for this currently — feature-flag gap (Mid).**

---

## Part C · Stripe-Relevant Files (Surface Map)

| File | Purpose |
|------|---------|
| `apps/web/src/lib/stripe.ts` | Stripe-SDK singleton, env-driven price/meter ID resolution, base-URL helper. |
| `apps/web/src/lib/billing-actions.ts` | Server Actions: `createCheckoutSession`, `createPrepaidPackCheckoutSession`, `createBillingPortalSession` + form-bound `*Action` wrappers. |
| `apps/web/src/lib/stripe-meters.ts` | `submitMeterEvent` wrapper with 2-layer idempotency (local `stripe_meter_event_log` + Stripe-side identifier dedup). Not invoked from any production path today. |
| `apps/web/src/lib/stripe-meters.test.ts` | Unit tests for `submitMeterEvent` (3 cases: zero-value skip, dup-log skip, happy-path). |
| `apps/web/src/lib/vat.ts` | EU-27 + UK VAT rates for display-only VAT-inclusive prices on `/pricing`. |
| `apps/web/src/lib/health-check.ts` | `probeStripe()` health surface for `/status` admin page. |
| `apps/web/src/lib/audit-action.ts` | Audit Server Action with credit-gate (`canConsume`) and credit-consume (`consumeCredits`). **Auto-Overage path missing.** |
| `apps/web/src/lib/sub-processors.ts` | Stripe listed as sub-processor (status="planned" — needs flip on go-live). |
| `apps/web/src/lib/workspace-ai-actions.ts` | `toggleAutoOverage` / `updateSpendCap` Server Actions — writes-only, never read. |
| `apps/web/src/app/api/stripe/webhook/route.ts` | Webhook handler — 7 event types, signature verification, idempotent via `stripe_event` PK. |
| `apps/web/src/app/api/stripe/webhook/route.test.ts` | Unit tests for the webhook (env-gating, signature, idempotency replay, default-event, handler-throw). |
| `apps/web/src/app/api/stripe/webhook/route.integration.test.ts` | Integration tests (real Postgres): checkout→tier-upgrade, replay, `subscription.deleted`, `invoice.payment_failed`. |
| `apps/web/src/app/billing/page.tsx` | Top-level `/billing` redirect to workspace-scoped billing. |
| `apps/web/src/app/[workspace]/settings/billing/page.tsx` | Workspace billing dashboard — current plan, credit balance, prepaid-pack list, tier-change form, portal CTA. |
| `apps/web/src/app/[workspace]/settings/ai/page.tsx` | AI settings — BYOK form, Auto-Overage toggle (**writes only, not honored by audit-action**), Spend-Cap input. |
| `apps/web/src/app/pricing/page.tsx` | Public `/pricing` page — VAT-by-IP, 4-tier grid, FAQ. |
| `apps/web/src/components/BuyCreditPackModal.tsx` | Pack-buy dialog component (uses `buyPrepaidPackAction`). |
| `apps/web/src/app/legal/agb/page.tsx` | Terms page — pricing-pass-through clause, overage-rate disclosure. |
| `apps/web/src/app/legal/dpa/page.tsx` | DPA template (Stripe listed as sub-processor). |
| `apps/web/src/app/legal/subprocessors/page.tsx` | Sub-processor listing with Stripe entry. |
| `apps/web/src/test/msw/stripe-mock.ts` | `signStripeEvent` test helper for webhook signature simulation. |
| `apps/web/src/test/msw/handlers.ts` | MSW handlers for Stripe-API mocking (meter-event endpoint). |
| `packages/billing/src/tiers.ts` | 4-tier ladder definitions (Free/Starter/Pro/Agency), `priceForCycle`, `monthlyEquivalent`, `hasFeature`. |
| `packages/billing/src/intensity.ts` | Quick=1 / Deep=5 credit cost mapping. |
| `packages/billing/src/credits.ts` | Credit ledger source-of-truth: `consumeCredits` (FOR-UPDATE-locked tx), `grantCredits`, `getCreditBalance`, `canConsume`. |
| `packages/billing/src/subscription.ts` | `ensureSubscription` (auto-insert free row), `canRunAudit`, `canAddCustomer`. |
| `packages/billing/src/byok-crypto.ts` | AES-256-GCM encryption for BYOK provider keys (not Stripe-specific but related to per-tier features). |
| `packages/billing/src/index.ts` | Public surface re-exports. |
| `packages/db/src/schema.ts:511-549` | `subscription` table — workspace-level, single row per workspace, `.unique()` on workspaceId. |
| `packages/db/src/schema.ts:558-567` | `stripe_event` table — idempotency PK on `event.id`. |
| `packages/db/src/schema.ts:604-633` | `ai_usage_event` table — append-only AI call log, feeds markup-meter (dormant). |
| `packages/db/src/schema.ts:647-676` | `audit_run_cost` table — 1:1 rollup per scan. |
| `packages/db/src/schema.ts:691-712` | `credit_ledger` table — append-only credit history. |
| `packages/db/src/schema.ts:724-747` | `prepaid_credit_grant` table — pack purchases, 12-month expiry, unique on `stripeInvoiceId`. |
| `packages/db/src/schema.ts:763-786` | `stripe_meter_event_log` table — local idempotency layer for meter submissions. |
| `packages/inngest/src/functions/credit-aggregator.ts` | 5-min cron: flush `reason='overage'` ledger rows → Stripe meter-events. Plus `flushPendingForCustomer` for sync `invoice.created` flush. **Has nothing to flush today.** |
| `packages/inngest/src/functions/stripe-reconcile.ts` | Daily 03:00 cron: paginate Stripe-subscriptions, diff tier/status, publish drift events. Detection-only. |
| `packages/inngest/src/functions/prepaid-credit-expirer.ts` | Daily 02:00 cron: retire expired packs + 24h-warning email. |
| `packages/inngest/src/functions/audit-requested.ts` | Background audit handler — `consumeCredits` + `audit_run_cost` insert. Same Auto-Overage gap. |
| `packages/auth/src/emails/PlanChangeConfirmation.tsx` | React-Email template for upgrade/downgrade/cancellation. |
| `packages/auth/src/emails/SubscriptionPastDue.tsx` | React-Email template for `invoice.payment_failed`. |
| `packages/auth/src/emails/PrepaidPackExpireWarning.tsx` | React-Email template for 24h-before-pack-expiry. |
| `packages/auth/src/emails/sender.ts` | `sendTransactionalEmail` wrapper (nodemailer over Resend-SMTP in prod, Mailpit in dev). |
| `packages/llm/src/usage.ts` | `recordUsage` — persists `ai_usage_event` rows with computed cost in microcents. Feeds the dormant AI-markup meter. |
| `scripts/stripe-test-setup.ts` | Test-Mode bootstrap script — products, prices, meters via lookup_keys. **Rejects sk_live_ keys** — needs `--mode=live` flag for Live-Mode promotion. |
| `scripts/check-billing-migration-safety.ts` | Pre-migration guard for the Sub-A schema rewrite — refuses to run if live Stripe subscription rows exist. |
| `docs/operations/stripe-go-live.md` | Operator runbook for Live-Mode promotion (the doc this audit complements). |
| `docs/adrs/0007-credit-system-and-intensity.md` | ADR for the credit model. |
| `.env.example` | Env-var template — 14 STRIPE_* vars commented out. |

---

## Recommended Pre-Live Action Order

1. **Kill #1 (Auto-Overage)** — wire `snap.autoOverageEnabled` into `audit-action.ts:122,352` and `audit-requested.ts:70`. Also wire `spendCapMicrocents`. Add tests.
2. **Kill #2 (`current_period_end`)** — switch to `sub.items.data[0].current_period_end` in `route.ts:461-465`. Add an integration test asserting `currentPeriodEnd` is set after a real `subscription.updated` event.
3. **Strong #3 (replay double-grant)** — add `credit_ledger` partial-unique-index on `(workspace_id, reason, reference_id) WHERE reason IN ('monthly_grant','prepaid_grant')`. Catch the conflict in `grantCredits`.
4. **Strong #4 (no `customer.deleted`)** — add the switch case.
5. **Strong #1 (`customer_update.name`)** — add `name: "auto"` to both `customer_update` calls.
6. **Strong #2 (`tax_code`)** — patch bootstrap script. Re-run against test-mode first to verify.
7. **Strong #5 (AI-markup meter)** — either flush it (Sub-Plan-C disclosure copy is already live) or remove the dangling Price+Meter from the bootstrap script.
8. **Mid #8 (no past_due gating)** — block audits when `status='past_due' && tier!='free'`.
9. **Mid #1 (`invoice.created` flush failure swallowed)** — return 500 on flush failure.
10. **Stripe-Tax DE registration + EU-OSS** — operator-side, 1–2 days.
11. **Bootstrap-script Live-Mode flag** — relax `sk_test_` gate, route to `.env.stripe-live-mode.generated`. Re-run against Live-Mode.
12. **Live-Mode webhook endpoint + secret** — 5min in Stripe Dashboard.
13. **Smoke-test Checkout with a real card** — refund afterward.
14. **Flip sub-processors.ts: Stripe `status="active"`** — starts the 30-day DPA notice clock.
15. **Customer-Portal config in Dashboard** — the 6 checkboxes in `stripe-go-live.md` §2.

**Estimated path-to-Live:** with the Kill fixes prioritized, ~3–5 dev days + 2–5 business days for Stripe-Tax DE registration = **1–2 weeks**. Matches the 2–4 week target if the cleanup-plan author groups B.5-rollback gaps + B.4-verification gaps into a single Sub-Plan-D pass.

---

## Out-of-Scope / V2 Notes

- Multi-currency (USD, GBP, CHF) — not blocking for DACH-B2B Q3 launch.
- Apple-Pay domain-verification — only if mobile-Checkout-friendly experience is wanted at launch.
- Stripe-v2 Pricing-Plans API (Private Preview as of April 2026) — wait for GA.
- AI-markup-meter live-flush — covered as Strong #5, recommended to ship in the same Sub-Plan-D pass since it's a 1-day code change and the customer-facing disclosure is already on `/pricing`.

---

**End of Wave-1 · 02.**
