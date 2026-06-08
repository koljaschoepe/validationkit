# Wave 2 · Sub-06 — Email + Resend + Deliverability Deep-Audit

**Date:** 2026-06-06
**Scope:** every transactional email path (magic-link, plan-change, payment-failed, prepaid-pack-expire, account/workspace lifecycle); Resend deliverability stack; bounce/complaint handling; rate-limit + throttle; Mailpit dev parity.
**Verdict:** 🔴 — **not production-ready.** Code paths render + send three of the five required templates cleanly, but the operational surface around Resend (Domain not verified, no bounce-webhook, no suppression-list, no rate-limit, no Impressum/List-Unsubscribe, no member-invite-mail at all) means real customer inboxes will silently reject, mark-as-spam, or never receive these mails on day-1.

Wave-1 already flagged the headline Kills (K15 Domain/DKIM, E2 magic-link rate-limit, "no bounce-handler"). This sub-audit ratifies them, adds **4 new Kills** (no Resend webhook endpoint, no suppression-table, no member-invite email, hardcoded `from`-domain split between two senders without DNS-anchor), and lays out the pre-launch checklist.

---

## Part A — Email-Template Inventory

Total templates: **4** (all in `packages/auth/src/emails/`). No `packages/email/` exists; emails live next to Better-Auth because magic-link is the original tenant. The 3 SaaS-Pricing-V2 React-Email templates shipped in commit `f159d2a`. There is **no email-rendering test** anywhere in the repo (`find … -name "*email*.test*"` = 0 hits).

| # | Template | File:line | Purpose | Trigger code-path | Recipient | Required vars | Render-quality |
|---|----------|-----------|---------|-------------------|-----------|---------------|---------------|
| 1 | `MagicLinkEmail` | `packages/auth/src/emails/MagicLinkEmail.tsx:38-164` | Magic-link sign-in / sign-up. | Better-Auth `magicLink.sendMagicLink` callback at `packages/auth/src/server.ts:91-117`. Fires on every `POST /api/auth/magic-link/send`. | Sign-in initiator (could be brand-new lead with no account). | `url`, `expiresInMinutes`, `requestIp?`, `userAgent?` | Mobile: fixed `maxWidth: 480` ✓; plain-text auto-generated via `render(el,{plainText:true})` ✓; dark-mode aware: **no** — colors are hardcoded `#0a0a0c` bg + `#fafafa` text; Light-mode clients render perfectly (it's white-on-dark always). |
| 2 | `PlanChangeConfirmation` | `packages/auth/src/emails/PlanChangeConfirmation.tsx:34-175` | Tier upgrade/downgrade/cancel confirmation. | Stripe webhook → `handleSubscriptionUpdated` at `apps/web/src/app/api/stripe/webhook/route.ts:236-251`, `handleSubscriptionDeleted` at `:284-296`. | Workspace owner (`schema.workspace.ownerId` → `schema.user.email`). | `workspaceName`, `previousTierLabel`, `newTierLabel`, `newCreditsPerCycle`, `kind`, `effectiveAt`, `billingUrl` | Same constraints as #1 — single-column 480 px, plain-text auto-rendered, no dark-mode CSS. **Date locale is hardcoded `"en-US"`** at line 43 (`effectiveAt.toLocaleDateString("en-US", …)`) — wrong for DACH-B2B; should be `"de-DE"` or follow workspace locale. |
| 3 | `PrepaidPackExpireWarning` | `packages/auth/src/emails/PrepaidPackExpireWarning.tsx:31-150` | Pre-paid credit pack expiry reminder. | Inngest daily-cron `prepaidCreditExpirer` at `packages/inngest/src/functions/prepaid-credit-expirer.ts:125-148`. **Only the 1-day variant is ever sent** despite the type `daysUntilExpiry: 30 \| 7 \| 1` — the 30-day + 7-day branches the comments promise don't exist. | Workspace owner. | `workspaceName`, `creditsRemaining`, `expiresAt`, `daysUntilExpiry`, `billingUrl` | Date hardcoded `"en-US"` (line 38). Same dark-only color palette. |
| 4 | `SubscriptionPastDue` | `packages/auth/src/emails/SubscriptionPastDue.tsx:28-150` | Dunning notice on `invoice.payment_failed`. | Stripe webhook → `handleInvoicePaymentFailed` at `apps/web/src/app/api/stripe/webhook/route.ts:380-390`. | Workspace owner. | `workspaceName`, `tierLabel`, `amountDueEur`, `attemptCount`, `billingUrl` | Amount pre-formatted as `€{x.xx}` upstream (route.ts:377) using `.toFixed(2)` — no thousands separator, no localized decimal comma. Acceptable for B2B but rough. |

### Common observations (apply to all 4)

- **No subject-line localization** — all subjects are English, but `apps/web` supports German UI copy.
- **No Impressum link in footer.** §5 TMG strongly recommends Impressum even on transactional mail for commercial entities.
- **No `List-Unsubscribe` header.** Best-practice even for transactional (Gmail Promotion-tab placement + RFC 8058 one-click). Missing on all 4 because the only sender code (`sender.ts:72-79`) never sets custom headers.
- **No alt-text on CTA buttons.** React-Email's `<Button>` renders an `<a>` with the visible text — works for screen readers, but no `aria-label` for additional context. Not blocking.
- **Logo is `▸ ValidationKit` text only.** No image, no brand mark — improves deliverability (less HTML weight, no remote image-load triggering "load images?" prompts) but reduces brand polish. Trade-off acceptable.
- **No "View in browser" link.** Standard for transactional. Not blocking.

---

## Part B — Email-Send Code-Paths

Two sender code paths:

1. **Magic-link sender:** Better-Auth-internal at `packages/auth/src/server.ts:91-117`. Uses a separate `transport` initialized at `:45-59` (duplicated, not shared with `sender.ts`).
2. **Transactional sender:** `packages/auth/src/emails/sender.ts:53-88` — the `sendTransactionalEmail()` helper used everywhere else.

### B.1 Inventory — all `sendMail` / `sendTransactionalEmail` call-sites

| # | Caller | File:line | Template | Error handling | Retry | Idempotency |
|---|--------|-----------|----------|----------------|-------|-------------|
| 1 | `magicLink.sendMagicLink` | `packages/auth/src/server.ts:108-117` | `MagicLinkEmail` (via `renderMagicLinkEmail`) | **None.** `await transport.sendMail(…)` is inside the Better-Auth callback. On throw, Better-Auth surfaces a generic error to the client. No try/catch. | None — Better-Auth-internal retry on next user re-submit. | None at the email layer; the magic-link token is single-use, but a flood-sender can email the same recipient 50× in 60 s (E2 Wave-1). |
| 2 | `handleSubscriptionUpdated` (tier-change) | `apps/web/src/app/api/stripe/webhook/route.ts:236-251` | `PlanChangeConfirmation` (kind=upgrade/downgrade) | `sendTransactionalEmail` returns `{ok,error}` but the call **doesn't check `result.ok`** — soft-fail is silent, no log on customer side. The wrapping `try/catch` at `:118-158` only catches **throws**; sender does `return {ok:false}` on transport-failure (sender.ts:81-87) so the webhook always returns 200. | None. | **Suppressed by tier-diff** (`previousTier === tier ⇒ return`, `:228`). Replay-safe at the Stripe-event level via `stripeEvent.id` PK upsert (`:104-115`). |
| 3 | `handleSubscriptionDeleted` | `apps/web/src/app/api/stripe/webhook/route.ts:284-296` | `PlanChangeConfirmation` (kind=canceled) | Same as #2. | None. | Same Stripe-event idempotency. **Edge case:** if the cancel-mail send fails transiently AND we then re-process the same event (we won't, because `stripeEvent.id` upsert short-circuits replays at line 114), the customer never sees a cancel-mail. |
| 4 | `handleInvoicePaymentFailed` | `apps/web/src/app/api/stripe/webhook/route.ts:380-390` | `SubscriptionPastDue` | Same silent soft-fail. | None — Stripe re-fires `invoice.payment_failed` on every retry-attempt (1 of N), so the customer can get **N dunning-mails** for the same invoice. That's by-design, but: there's no `attemptCount` check before sending — the very first failed-charge fires a mail; we could suppress N>3. | Same Stripe-event idempotency. |
| 5 | `prepaidCreditExpirer` (1-day warning) | `packages/inngest/src/functions/prepaid-credit-expirer.ts:125-148` | `PrepaidPackExpireWarning` | `if (result.ok)` check ✓ — only writes the `prepaid_pack_warning` event-row on success. | No retry; the next day's cron run will re-try because the event-row was never written. | Per `hasRecentWarning(…)` at `:56-71` — 48-hour lookback against `event` table. ✓ |

### B.2 Verifying every required transactional surface

Checklist from the task brief:

| Surface | Implemented? | Where | Notes |
|---------|--------------|-------|-------|
| Magic-link | ✅ | `packages/auth/src/server.ts:108` | Works. |
| Invoice-paid notification | ❌ **Not implemented** | `handleInvoicePaid` at `apps/web/src/app/api/stripe/webhook/route.ts:315-352` mutates DB + grants credits, but never sends a "Receipt / new period started" email. Stripe sends its own receipt-email (if turned on in Stripe Dashboard → Customer-Receipts), which is OK for receipts but not for the "credits-refreshed" copy. | New Kill candidate. |
| Payment-failed dunning | ✅ | `route.ts:380-390` | Works. |
| Credit-low warning | ❌ **Not implemented anywhere** | `consumeCredits` at `packages/billing/src/credits.ts:112-…` updates balance but doesn't fire a low-credit threshold event. Wave-1-Payment flagged this; confirmed. No Inngest cron checks remaining balance < 10 % and sends a heads-up. | New Kill. |
| Member-invite email | ❌ **Not implemented** | `apps/web/src/lib/membership.ts:80-163` (`inviteAdmin`) inserts a `membership` row in `pending` status and returns. The invited person learns about the invite **only when they happen to sign in** (via `claimPendingMemberships` at `:170-197`). **There is no email telling them they were invited.** UI copy at `repos/[repoId]/access/AccessForms.tsx:30` says: *"If they don't have an account yet, the invite resolves on their first magic-link sign-in"* — which is technically true but operationally broken (the invitee has to **independently** decide to sign up at ValidationKit). | **New Kill.** |
| Audit-completed notification | ❌ | `packages/inngest/src/functions/audit-requested.ts:132-157` publishes an internal `audit.completed` event via `publishEvent(…)` (DB-row only). No mail. Could be in-scope or out-of-scope depending on workspace-notification preferences. | Lower-priority (subjective whether long-running audits warrant mail). |
| Workspace-deleted notification | ❌ | `apps/web/src/app/[workspace]/settings/danger/page.tsx:34` literally says *"Ownership transfer and workspace deletion ship together with the …"* — the route doesn't exist yet. So: send-not-needed-yet, but tracks as **deferred**. |
| Account-deleted confirmation | ❌ | `apps/web/src/app/account/settings/delete/page.tsx:19-29` reads *"Coming with nova-2-settings-backend"*; no delete-route exists. Same: deferred. |
| Sub-processor change notification | ❌ | `apps/web/src/app/legal/subprocessors/page.tsx:125-135` promises *"Email notifications go to the workspace owner at least 30 days before the change"* — **no code implements this.** This is a contractual liability if a Stripe/Anthropic/Vercel subprocessor changes. |

### B.3 The `from` problem

Two senders, two `from` defaults:

```ts
// packages/auth/src/server.ts:109-111 — magic-link
from: process.env.SMTP_FROM
  ?? (useResend ? "onboarding@resend.dev" : "auth@validationkit.local"),

// packages/auth/src/emails/sender.ts:73 — everything else
from: args.from ?? "notifications@validationkit.app",
```

Three problems:
1. **Magic-link fallback `onboarding@resend.dev`** — Resend's shared sandbox sender. In prod, when `SMTP_FROM` isn't set, every magic-link comes from Resend's domain. Wave-1 flagged this (K15).
2. **Transactional fallback `notifications@validationkit.app`** — DNS-correct, but no DKIM/SPF/DMARC because the domain isn't registered yet (Wave-1 K15).
3. **Two different `from` per-product-flow** — `auth@validationkit.app` for magic-link vs `notifications@validationkit.app` for billing. Both legitimate (Google `from` separation reduces blast-radius if one signature gets compromised), but the prod-rollout document at `docs/plans/production-launch-readiness.md:65` only lists **one** Resend domain-verify entry. Both sub-addresses need DKIM signed by the parent domain (which they will be once the Resend "Domain" is `validationkit.app` and the DKIM-DNS is published — the `resend._domainkey` TXT covers all `*@validationkit.app` senders).

---

## Part C — Branding + UI Quality

### C.1 MagicLinkEmail (file:line `packages/auth/src/emails/MagicLinkEmail.tsx`)

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Subject-line clear + branded? | 🟡 | `"Sign in to ValidationKit"` (server.ts:113). Clear, single-language English. Not spammy. **No emoji/punctuation tricks** — good. |
| `From` name set? | ❌ | The `from` field is just an address. nodemailer accepts `"ValidationKit <auth@validationkit.app>"`; not used. Gmail will display the bare email-local-part. |
| `Reply-To` set? | ❌ | `replyTo` not passed in magic-link send (server.ts:108-116). For a magic-link this is OK (replies make no sense), but transactional emails would benefit from `replyTo: "support@validationkit.app"`. |
| Layout: mobile-responsive? | ✅ | `maxWidth: 480` + `padding: "32px 28px"`; renders well on iPhone (375 px viewport). Single-column. |
| Layout: dark-mode aware? | 🟡 | Hardcoded dark palette (`#0a0a0c` bg, `#fafafa` text). Apple Mail / Outlook dark-mode users see it correctly because the dark colors are explicit. Light-mode users see a dark email **inside their light inbox** — visually heavy but legible. No `<meta name="color-scheme" content="dark light">` or `prefers-color-scheme` CSS. |
| CTA button accessible? | ✅ | Renders as `<a>` with visible text "Sign in" (lines 99-112). Plain-link fallback also present (lines 120-133). |
| Plain-text fallback? | ✅ | `render(el, { plainText: true })` at `render.ts:17`. ✓ |
| Footer Impressum link? | ❌ | Not present. §5 TMG-best-practice for commercial sender. |
| Footer Unsubscribe link / `List-Unsubscribe` header? | ❌ | Not present. RFC 8058 strongly recommended even for transactional in Gmail Postmaster Tools 2024+. |
| Preview text? | ✅ | `<Preview>Your link expires in N minutes</Preview>` (line 47) — Gmail snippet. |
| Logo? | 🟡 | Text-only `▸ ValidationKit`. No image — protects deliverability but reduces brand polish. |
| Date/locale leak? | n/a | No date rendered in magic-link email. |
| IP/UA leak to recipient? | 🟡 | `requestIp` + `userAgent` rendered to recipient at lines 137-154. Wave-1-Auth A6 flagged this as a **privacy concern**: if the user got phished into requesting a magic-link to someone else's inbox, the recipient sees the victim's IP + browser. For DACH-B2B this is a borderline data-minimisation issue; the security-benefit (suspicious-request detection) is small for a 10-min one-shot token. **Recommend removing UA from email body** (keep IP optionally). |

### C.2 PlanChangeConfirmation (file:line `packages/auth/src/emails/PlanChangeConfirmation.tsx`)

| Criterion | Status |
|-----------|--------|
| Subject-line | 🟡 — `"Welcome to {tier}"` / `"Plan updated to {tier}"` / `"Subscription canceled"` (route.ts:238-241, :286). English; no brand prefix. |
| `From` / `Reply-To` | ❌ — same single-string `from`, no reply-to. |
| Mobile-responsive | ✅ |
| Dark-mode | 🟡 — same hardcoded palette. |
| CTA | ✅ — "Open billing" button → `billingUrl`. |
| Plain-text | ✅ |
| Impressum / Unsubscribe / List-Unsubscribe | ❌ |
| Preview | ✅ |
| Date locale | ❌ — hardcoded `"en-US"` at line 43. **Fix for DACH:** `"de-DE"`. |
| Currency | n/a here |
| Refund/billing-portal copy | ✅ — footer copy at lines 167-169 explains pro-rata + reactivation. |

### C.3 PrepaidPackExpireWarning

| Criterion | Status |
|-----------|--------|
| Subject-line | 🟡 — `"${creditsRemaining} pre-paid credits expire tomorrow"` (`prepaid-credit-expirer.ts:127`). Clear, urgent, not spammy. |
| Mobile-responsive | ✅ |
| Dark-mode | 🟡 |
| CTA | ✅ — "Open billing". |
| Plain-text | ✅ |
| Impressum / Unsubscribe | ❌ |
| Preview | ✅ |
| Date locale | ❌ — hardcoded `"en-US"`. |
| **Only the 1-day variant fires.** | ❌ | The component supports `daysUntilExpiry: 30 \| 7 \| 1` but Inngest only emits the 1-day version. The 30 + 7-day reminders the file-header comment promises **are not wired up**. |

### C.4 SubscriptionPastDue

| Criterion | Status |
|-----------|--------|
| Subject-line | ✅ — `"Payment failed for ${workspaceName} — action needed"` (route.ts:382 + preview at template line 38). |
| Mobile-responsive | ✅ |
| Dark-mode | 🟡 |
| CTA | ✅ — "Update payment method". |
| Plain-text | ✅ |
| Impressum / Unsubscribe | ❌ |
| Preview | ✅ |
| Currency | 🟡 — `€${amount}` with `.toFixed(2)`. No thousands separator, no localized decimal comma. For DACH should be `1.234,56 €`. |
| **No `attemptCount` suppression** | ❌ — sends on every Stripe retry (typically 4 in 21 days), which is fine, but no in-mail "attempt N of 4" framing. |

---

## Part D — Deliverability Setup

### D.1 Current state (evidence)

- **Domain `validationkit.app` is NOT registered.** Confirmed by Wave-1 K15 (`docs/audits/2026-05-deep/wave1-04-prod-infra-vercel.md:312`) — no Vercel project alias exists, no DNS-RR for the apex.
- **No Resend Domain configured.** Confirmed because (a) we don't own the domain yet, (b) `RESEND_API_KEY` is uncommented placeholder in `.env.example:40` — no actual Resend account in `.env.local`.
- **No DKIM/SPF/DMARC** because no domain.
- **No `RESEND_FROM`/`SMTP_FROM` set in `.env.local`** (`.env.local` lines confirmed) — local dev uses Mailpit at `127.0.0.1:1025`, no `SMTP_FROM` override.

### D.2 What needs to be set (DNS records)

For Resend, after adding `validationkit.app` to **Resend Dashboard → Domains**, Resend issues 4-5 TXT records. The canonical shape (cross-referenced with Wave-1 doc `wave1-04-prod-infra-vercel.md:495-503`):

```dns
;; SPF — declare Resend as authorized sender for the apex
TYPE  HOST                  VALUE
TXT   @                     "v=spf1 include:_spf.resend.com ~all"

;; DKIM — Resend issues a selector + key pair; selector is "resend"
TXT   resend._domainkey     "p=<long base64 from Resend dashboard>"
TXT   _resend               "<verification token from Resend dashboard>"  ; ownership-proof

;; MX (Resend doesn't accept inbound, but DMARC's "rua" reports need MX on a reachable mailbox)
;; Use the same primary mail-host you'll use for support@:
MX    @          10 mx.eu.mailhost.example.

;; DMARC — start at p=none to MONITOR, then progress
TXT   _dmarc                "v=DMARC1; p=none; rua=mailto:dmarc-reports@validationkit.app; aspf=r; adkim=r; pct=100; fo=1"
```

**DMARC progression:**
1. **Week 1-2:** `p=none` + monitor `rua` reports. Validates that Resend + Stripe + (any other senders) align with the DKIM + SPF setup.
2. **Week 3:** Bump to `p=quarantine; pct=25` — quarantine 25 % of failing mail, monitor what gets caught.
3. **Week 4:** `p=quarantine; pct=100`.
4. **Week 5+:** `p=reject` — outright reject failing mail. Only safe to do once you've verified all senders (Resend + Stripe-receipts + any Inngest-from-prod mail + any future GitHub-App notifications) are aligned.

**Stripe-emails**: Stripe sends customer receipts from `noreply@stripe.com` (Stripe's domain, signed by Stripe's DKIM). They do **not** sign on the merchant's domain unless you enable "Custom email domain" (Stripe Pro feature). For the launch, **leave Stripe-receipts on Stripe's domain** — saves a DKIM-record. If you later want `receipts@validationkit.app`, that's an extra DNS-setup + a Stripe Plus subscription tier.

### D.3 Resend Account Setup Checklist

| Step | Status | Notes |
|------|--------|-------|
| Resend account created | ❓ (out-of-scope; not in repo) | |
| `validationkit.app` added in dashboard | ❌ (depends on D.2) | |
| Domain verified (TXT records propagated) | ❌ | 24h DKIM propagation = critical-path dependency for launch. |
| API key generated | ❌ — `.env.local` doesn't have `RESEND_API_KEY` | Once issued, store in Vercel-prod-env (not `.env.local`). |
| **Bounce/complaint webhook** registered | ❌ **Kill** | See Part E. |
| Test-send fired | ❌ | mail-tester.com score should be ≥9/10 before launch. |
| EU data-region selected | ❓ | Resend has a `eu-west-1` option. Sub-processor table at `apps/web/src/app/legal/subprocessors/page.tsx:60-62` says *"USA — EU SCC in place"* — best to switch Resend to EU region to simplify DPA. |

### D.4 From-Address Strategy

| Use case | Recommended `from` | Why |
|----------|--------------------|-----|
| Magic-link sign-in | `auth@validationkit.app` (display: `ValidationKit <auth@validationkit.app>`) | Single sub-address. Recipients learn the brand pattern. |
| Stripe receipts | (leave on Stripe `noreply@stripe.com`) | Stripe's deliverability + DMARC is already excellent. Avoid the engineering cost of a Custom-Stripe-Domain. |
| Plan-change / past-due / pack-expire | `billing@validationkit.app` (NOT `notifications@…`) | Lets users filter "billing" mail in Gmail. Avoids the catch-all `notifications@`. Current code at `sender.ts:73` hardcodes `notifications@` — change to `billing@` and consider a per-template override. |
| Member-invite (when implemented) | `team@validationkit.app` | Distinct from billing — recipient is often a colleague not the customer. |
| System / audit-trail | `system@validationkit.app` with `Reply-To: support@validationkit.app` | |
| Marketing newsletters (future) | `news@validationkit.app` from a **separate Resend subdomain** like `news.validationkit.app` | Best-practice: marketing sends never share DKIM with transactional. If marketing gets reported as spam, your transactional reputation is untouched. |

**Implementation note:** `packages/auth/src/emails/sender.ts:73` hardcodes the default — change to read `process.env.MAIL_FROM_BILLING` etc., or accept a typed `kind: "billing" | "auth" | "team" | "system"` discriminator that resolves to the right sub-address.

---

## Part E — Bounce + Complaint Handling

### E.1 Current state

- **Zero bounce handler.** Confirmed: `find apps/web/src/app -type d -name "*resend*" -o -name "*bounce*"` returns nothing. No route at `/api/resend/webhook`, no Svix-signature verify code anywhere.
- **No suppression-list DB table.** `grep -n "bounce\|suppression" packages/db/src/schema.ts` returns 0 hits. (`emailVerified` exists at `schema.ts:24` but it tracks "did the user click a magic-link", not "did this address bounce".)
- **No code that flips `user.emailVerified=false` on hard-bounce.**
- **No alert / pager when bounce-rate spikes.**

### E.2 What needs to exist

#### Route + signature-verify

New file `apps/web/src/app/api/resend/webhook/route.ts`:
- Method: `POST`
- Runtime: `nodejs` (Svix lib needs Node)
- Signature: Svix `webhook.verify(rawBody, headers)` — Resend uses Svix's webhook signing scheme. Secret comes from `RESEND_WEBHOOK_SECRET` (env-var to be issued by Resend dashboard).
- Idempotency: store `svix-id` header in a new `resend_event(id PRIMARY KEY, type, payload, received_at)` table; replay → 200 with `duplicate:true`.

#### New DB tables

```sql
-- migration NNNN_email_suppression.sql
CREATE TABLE email_suppression (
  email           VARCHAR(320) PRIMARY KEY,
  reason          TEXT NOT NULL,           -- 'hard_bounce' | 'complaint' | 'manual'
  bounce_type     TEXT,                    -- Resend "bounce_type" (mailbox-full, unknown-user, …)
  first_seen      TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen       TIMESTAMPTZ NOT NULL DEFAULT now(),
  attempts        INT NOT NULL DEFAULT 1
);

CREATE TABLE resend_event (
  id              VARCHAR(64) PRIMARY KEY,   -- svix-id
  type            TEXT NOT NULL,
  payload         JSONB NOT NULL,
  received_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### Handler logic

```text
on email.bounced (hard):
  - upsert email_suppression(email, reason='hard_bounce', ...)
  - update user set emailVerified=false where email=$1
  - audit-log: 'email_hard_bounce' { user_id, email, bounce_type }
  - if user is a workspace-owner with active subscription → set workspace flag
    to surface "your email bounced — update on /account/settings/profile"
on email.bounced (soft):
  - increment email_suppression(email).attempts
  - if attempts > 5 within 7 days → escalate to hard_bounce
on email.complained:
  - upsert email_suppression(email, reason='complaint')
  - mark user as 'opted_out' for all non-essential mail
  - alert ops (Inngest event 'email/complained')
on email.delivered, email.sent, email.opened: optional analytics; skip for now.
```

#### Suppression-list check on every send

`sender.ts:sendTransactionalEmail()` and `server.ts:sendMagicLink` callback both need:
```text
const suppressed = await db.select…from email_suppression where email=$1;
if (suppressed && reason in ('hard_bounce','complaint')) {
  return { ok: false, error: 'suppressed' };
}
```
Without this, every send to a known-bouncing address contributes to **Resend reputation degradation** — Resend will eventually rate-limit or terminate the account.

### E.3 Complaint-handling (spam-reports)

- For **B2B transactional**, a complaint usually means the user thought our magic-link was phishing — possible if they didn't initiate sign-in. Log + suppress is sufficient.
- For any future marketing/newsletter sends, complaints must auto-pause campaigns. Out-of-scope until newsletter ships.

---

## Part F — Mailing-List + Unsubscribe Compliance (DACH)

### F.1 §7 UWG (Wettbewerbsrecht)

Transactional mail (magic-link, billing, support) **does not require opt-in or unsubscribe** — it's "Vertragserfüllung". But:

### F.2 §5 TMG (Telemediengesetz) — Impressum

Every commercial email sent on behalf of a business **must** carry the Impressum or a link to it. The current templates don't. **Fix:** add a footer block to all 4 templates:

```text
ValidationKit by Unit-ix GmbH · CEO: Kolja Schöpe
Musterstr. 1 · 10115 Berlin · Germany · HRB 123456 B
Impressum: https://validationkit.app/legal/impressum
```

### F.3 `List-Unsubscribe` header (RFC 8058)

Gmail Postmaster Tools (Feb 2024) **requires** `List-Unsubscribe` + one-click on every bulk sender (>5k/day). Even below that threshold, mail clients render an "Unsubscribe" link based on the header — better UX than digging in account-settings.

Even on transactional, the header is best-practice:
```text
List-Unsubscribe: <https://validationkit.app/api/email/unsubscribe?token=…>, <mailto:unsubscribe@validationkit.app>
List-Unsubscribe-Post: List-Unsubscribe=One-Click
```

Implementation:
- Add `headers: { "List-Unsubscribe": …, "List-Unsubscribe-Post": … }` to `transport.sendMail(…)` in both `server.ts` and `sender.ts`.
- For magic-link + billing, the unsubscribe should be a **soft no-op** (cannot unsubscribe from essential mail) — clicking opens `/account/settings/notifications` with an explanatory message.
- For future marketing, the token-based one-click route stores the user's preference + responds 200 in <1s.

### F.4 Current template compliance check

| Template | Impressum link? | List-Unsubscribe? | Comment |
|----------|------------------|--------------------|---------|
| MagicLinkEmail | ❌ | ❌ | |
| PlanChangeConfirmation | ❌ | ❌ | |
| PrepaidPackExpireWarning | ❌ | ❌ | |
| SubscriptionPastDue | ❌ | ❌ | |

**Verdict: 0/4 compliant.** Single shared `<Footer />` component (new) used in all templates fixes this once.

---

## Part G — Rate-Limit + Throttling

### G.1 Magic-link rate-limit

- **Client-side throttle:** `LoginForm.tsx:23,86` — 30 s countdown. Trivially bypassable (POST `/api/auth/magic-link/send` from curl).
- **Server-side throttle:** **None.** `packages/auth/src/server.ts:61-121` configures Better-Auth without a `rateLimit` block.
- Better-Auth 1.6 supports `rateLimit.customRules` (verify exact name against 1.6 docs at runtime). Sample shape:
  ```text
  rateLimit: {
    enabled: true,
    storage: 'database',
    customRules: {
      '/magic-link/send': { window: 600, max: 3 }, // 3 per 10 min per IP
    },
  }
  ```
  Plus a per-email throttle in `magicLink.rateLimit` (if 1.6 exposes that option) or via a custom hook that checks the last `verification.createdAt` for the same email.

### G.2 Per-recipient throttling (cross-template)

Currently zero. The `prepaidCreditExpirer` already has "don't re-warn within 48h" logic at `:56-71` (event-table lookup) — generalize this into a `lastSentAt` check per `(email, template-kind)` for all transactional mail. Without it, edge-cases like "user upgrades plan 3× in 10 minutes" send 3 confirmation mails.

### G.3 Per-workspace throttling

For multi-member workspaces, the **owner** receives all billing + plan + expire mails. With 1 owner per workspace, blast-radius is bounded. Once member-invites send mail (currently they don't, see B.2), an attacker who controls a workspace could mass-invite to spam Resend quota. Throttle: cap `inviteAdmin` to N per workspace per hour (e.g. 20).

### G.4 Resend quota / pricing

Resend free tier: **3 000 emails/month, 100/day.** Sufficient for first ~50 active workspaces (1 magic-link + 1-2 billing mails / user / month). Above that, the Pro plan ($20/mo) gives 50k/month. **Hard-fail mode** when quota is exhausted is silent (Resend just rejects with 429) — the current `sender.ts:81-87` catches the error and soft-fails. Monitor via Resend's dashboard or a custom Inngest cron that hits Resend's `/usage` API.

---

## Part H — Local-Dev Email (Mailpit)

| Check | Status |
|-------|--------|
| Mailpit container in `docker-compose.yml`? | ✅ — service `mailpit`, ports `1025:1025` (SMTP) + `8025:8025` (web-UI). |
| Dev `SMTP_HOST` points to Mailpit? | ✅ — `.env.example:32` + `.env.local:3` both `127.0.0.1:1025`. |
| Prod switches to Resend? | ✅ — `server.ts:44-59` + `sender.ts:15-32` both branch on `RESEND_API_KEY` presence. |
| `.env.local` vs `.env.example` parity? | ✅ — same vars, different defaults. |
| **In dev, magic-link `from` = `auth@validationkit.local`** | ✅ at `server.ts:111` — works for Mailpit because Mailpit accepts any `from`. **But:** the `.local` TLD has no DNS; if you ever copy a dev-mail address into Resend by mistake, it bounces. Trivially safe. |
| **In Mailpit Web-UI, transactional emails (sender.ts) show `notifications@validationkit.app`** | ✅ — because `sender.ts:73` hardcodes that string, even in dev. Works because Mailpit doesn't validate domains. |
| **Test path: open Mailpit + send all 4 templates** | ❌ — no `pnpm` script `email:preview` or similar. React-Email has its own preview server (`pnpm email`) but it isn't wired up here. |

**Verdict:** dev parity is functionally correct, but **no template-preview tooling** exists. Adding `@react-email/preview-server` (or the new `react-email dev` CLI) under `packages/auth` would let you iterate on templates without running the full app stack.

---

## Part I — Recommended Action List (severity-banded)

### 🔴 Kill (block launch)

| # | Issue | File:line | Fix direction | Effort |
|---|-------|-----------|---------------|--------|
| K-E.01 | **Domain not registered.** DKIM/SPF/DMARC impossible until owned. | DNS-ops | Register `validationkit.app`, add to Resend Dashboard → Domains, publish 4 TXT records, wait 24h for propagation. | 2h + 24h propagation |
| K-E.02 | **Magic-link `from` falls back to `onboarding@resend.dev`** in prod when `SMTP_FROM` is unset. | `packages/auth/src/server.ts:108-111` | Make `SMTP_FROM` **required** at startup (throw on missing in prod). Default to `"ValidationKit <auth@validationkit.app>"`. | 30 min |
| K-E.03 | **No Resend bounce/complaint webhook.** Suppression-list-missing means we'll keep re-sending to dead addresses and burn Resend reputation. | (new) `apps/web/src/app/api/resend/webhook/route.ts` + migration `NNNN_email_suppression.sql` | Implement Svix-signed webhook + 2 DB tables (see E.2) + suppression-check in both senders. | 1 day |
| K-E.04 | **No server-side rate-limit on `POST /api/auth/magic-link/send`.** Only client-side 30s throttle. Attacker can flood Resend quota + email-enumerate. | `packages/auth/src/server.ts:61-121` (Better-Auth config) | Add `rateLimit.customRules` for `/magic-link/send`: 3 per 10 min per IP + 5 per 10 min per email. | 2h |
| K-E.05 | **Member-invite has no email.** Invitee never knows they were invited until they independently sign in. Operationally broken team-onboarding. | `apps/web/src/lib/membership.ts:80-163` | After `db.insert(membership)…pending`, call `sendTransactionalEmail` with a new `MemberInviteEmail` template containing workspace name + inviter name + sign-in CTA. | 4h (incl. new template) |
| K-E.06 | **No Impressum + no `List-Unsubscribe` header** in any of 4 templates. §5 TMG + Gmail Postmaster 2024 best-practice. | All 4 templates + sender.ts:72-79 | Add shared `<Footer />` component with Impressum + add `headers: { "List-Unsubscribe": ..., "List-Unsubscribe-Post": ... }` in both `transport.sendMail(…)` calls. | 4h |
| K-E.07 | **No credit-low warning email.** Wave-1 already flagged; users hit 0 credits with zero heads-up. | `packages/billing/src/credits.ts:consumeCredits` + new Inngest cron `credit-balance-warn.ts` | Daily cron: for each workspace with balance < 20% of `creditsQuotaPerCycle`, send 1 warning per period (track via `event` table). New template `CreditBalanceLow.tsx`. | 1 day |

### 🟠 Strong (fix before paying customer #1)

| # | Issue | File:line | Fix direction | Effort |
|---|-------|-----------|---------------|--------|
| S-E.01 | **No `invoice.paid` confirmation email.** Stripe sends its own receipt, but our copy ("Your fresh N credits are loaded") doesn't fire. | `apps/web/src/app/api/stripe/webhook/route.ts:315-352` | Add `sendTransactionalEmail` call with a new `InvoicePaid` template after `grantCredits`. | 4h (incl. template) |
| S-E.02 | **Date locale hardcoded `"en-US"`** in 2 templates → wrong for DACH-B2B. | `PlanChangeConfirmation.tsx:43`, `PrepaidPackExpireWarning.tsx:38` | Switch to `"de-DE"` or accept `locale` prop. | 30 min |
| S-E.03 | **Currency formatting non-DACH** — `€{x.xx}` instead of `1.234,56 €`. | `route.ts:377` + `SubscriptionPastDue` props | Use `Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" })` upstream. | 30 min |
| S-E.04 | **PrepaidPackExpire 7-day + 30-day variants not wired** despite type allowing them. | `packages/inngest/src/functions/prepaid-credit-expirer.ts:107-148` | Add two more passes — 7-day + 30-day lookback windows + matching event-rows. | 2h |
| S-E.05 | **Soft-fail-silent on transactional send.** Webhook handler doesn't check `result.ok`; lost emails are invisible. | `apps/web/src/app/api/stripe/webhook/route.ts:236, 284, 380` | Log + audit-event when `result.ok===false`. Optional: enqueue an Inngest retry. | 1h |
| S-E.06 | **Sub-processor change notification promised in copy but not implemented.** Contractual liability. | `apps/web/src/app/legal/subprocessors/page.tsx:125-135` + (new) admin-only trigger | Build a one-shot admin-CLI/script that loops workspace-owners + sends a `SubprocessorChange` mail with 30-day notice. | 4h |
| S-E.07 | **No `Reply-To` set on transactional mail.** Replies bounce or go nowhere. | `sender.ts:53-79` | Set `replyTo: process.env.SUPPORT_EMAIL ?? "support@validationkit.app"` by default. | 15 min |
| S-E.08 | **`From` lacks display name.** Bare `auth@validationkit.app` instead of `ValidationKit <auth@validationkit.app>`. | `server.ts:109-111`, `sender.ts:73` | Wrap with display name. | 15 min |
| S-E.09 | **`request-ip` + UA exposed in magic-link email.** Wave-1-Auth A6 (Mid) — keep on the radar. | `MagicLinkEmail.tsx:137-154` + `server.ts:95-99` | Drop UA, keep IP optional (gated by env-flag). | 30 min |
| S-E.10 | **Two duplicated transport-init blocks** (server.ts:44-59 + sender.ts:13-33) — drift risk. | both | Move to a single shared `getMailTransport()` helper in `packages/auth/src/emails/transport.ts`. | 1h |

### 🟡 Mid (cleanup / polish)

| # | Issue | File:line | Fix |
|---|-------|-----------|-----|
| M-E.01 | **No email-template tests.** Snapshot or render-to-HTML smoke test. | (new) `packages/auth/src/emails/*.test.tsx` | Add Vitest snapshot test that renders each template with sample props + asserts HTML doesn't throw. | 2h |
| M-E.02 | **No `pnpm email:preview` script.** | root `package.json` | Add `react-email dev` or `@react-email/preview-server`. | 30 min |
| M-E.03 | **Dunning fires on every retry-attempt** without "attempt N of 4" framing. | `route.ts:377-390` + template | Add an attempt-banner; suppress sends past attempt 3. | 1h |
| M-E.04 | **Mailpit max-messages = 5000** in compose — non-critical, low memory. | `docker-compose.yml:43` | OK as-is. |
| M-E.05 | **No per-template `from` override**. Every transactional mail comes from `notifications@`. | `sender.ts:73` | Refactor `from` to a discriminator `kind: 'billing' | 'team' | 'system'`. | 2h |
| M-E.06 | **Resend region not pinned to EU** — improves DPA story for DACH. | Resend Dashboard + DPA copy at `subprocessors/page.tsx:60-62` | Switch region in dashboard before launch; update copy to read `"EU (Frankfurt)"`. | 30 min |
| M-E.07 | **`@react-email/components@1.0.12` deprecated on npm** (per CLAUDE.md / 2026-05 audit S6). No upstream successor yet. | `packages/auth/package.json:32` | Monitor; revisit when @react-email/components 2.x ships. | n/a |
| M-E.08 | **No "View in browser" link** in templates. | All templates | Optional; consider a `/email/{messageId}` route that re-renders the template HTML for the recipient. | 4h |
| M-E.09 | **No dark-mode-aware color palette** — works because we force-dark. | All templates | Add `<meta name="color-scheme" content="dark light">` + `prefers-color-scheme` CSS for inverse palette. | 4h |

---

## Part J — Pre-Launch Email Checklist

Step-by-step, in dependency order:

1. **Register `validationkit.app`** (or chosen TLD). 1h + waiting for registrar.
2. **Add domain to Vercel project** (`vercel domains add validationkit.app`) + verify ownership via DNS.
3. **Create Resend account** (or log in). Choose **EU region**.
4. **Add domain in Resend Dashboard → Domains → Add Domain.**
5. **Publish 4 DNS TXT records** (SPF, DKIM, ownership-token, DMARC `p=none`). See D.2.
6. **Wait 24-48h for DKIM propagation.** Re-check in Resend dashboard; verify all 3 records show green.
7. **Generate Resend API key** → store in Vercel-prod-env as `RESEND_API_KEY`.
8. **Set `SMTP_FROM`** in Vercel-prod-env = `"ValidationKit <auth@validationkit.app>"`.
9. **Set `MAIL_FROM_BILLING`, `MAIL_FROM_TEAM`** (once code supports per-template `from`) — or stick with single `SMTP_FROM` for V1.
10. **Set `SUPPORT_EMAIL`** = `support@validationkit.app`.
11. **Resend Webhook**: in Resend Dashboard → Webhooks, create endpoint `https://validationkit.app/api/resend/webhook` for events `email.bounced`, `email.complained`, optionally `email.delivered`. Copy signing secret to `RESEND_WEBHOOK_SECRET` in Vercel.
12. **Ship K-E.03 code** (webhook route + suppression table + suppression-check in senders).
13. **Ship K-E.04** (Better-Auth rate-limit config) — load-bearing for E.2 attack-surface.
14. **Ship K-E.05** (member-invite email) — load-bearing for B2B onboarding.
15. **Ship K-E.06** (Impressum + List-Unsubscribe in all 4 templates).
16. **Ship K-E.07** (credit-low warning Inngest cron + new template).
17. **Ship S-E.01** (invoice.paid mail), **S-E.02-S-E.10**.
18. **Test-send each template** in **prod-mode** (set `RESEND_API_KEY` locally + send to a Gmail + Outlook + ProtonMail + Apple-Mail address). For each:
    - Gmail → "Show original" → **DKIM-pass, SPF-pass, DMARC-pass** all green.
    - Verify rendering on iPhone Mail, Gmail mobile-web, Outlook 365 desktop.
    - Verify plain-text version (Apple-Mail → "Reduce to plain text").
19. **Run mail-tester.com check.** Send each template to the unique `…@mail-tester.com` address; aim for **≥9/10** score. Common deductions: missing List-Unsubscribe, missing Impressum, suspicious phrasing in subject — see Parts F + G.
20. **Monitor for 1 week at DMARC `p=none`** — collect `rua` reports, verify no rogue senders (e.g. forgotten Vercel-preview using shared Resend key).
21. **Tighten DMARC** to `p=quarantine; pct=25` → `pct=100` → `p=reject` over 4 weeks.
22. **Set up alerting**: Resend dashboard bounce-rate > 2 % → Slack-webhook (or Inngest event triggering ops-alert).
23. **Document support@ mailbox** — needs an actual mailbox (Google Workspace / Fastmail / Migadu) to receive replies and DMARC reports.

**Critical path:** steps 1-7 require ~3 days of wall-clock (mostly DNS-propagation waiting). Steps 12-17 require ~5 dev-days of engineering. **Combined: ~1.5-2 calendar weeks to a launch-clean email stack.**

---

## Appendix — Stripe Domain-verify (cross-reference)

Stripe-receipts (the auto-mail sent on every successful charge if enabled in Dashboard → Customer-Receipts) sign with **Stripe's own DKIM** on `stripe.com`. They do **NOT** affect ValidationKit's DMARC unless you turn on "Custom email domain" (Stripe Premium / Pro feature). **Recommendation: leave Stripe-receipts on Stripe's domain** for V1. Document this in `docs/operations/stripe-go-live.md` so future-you doesn't get confused by "why don't customer Stripe-receipts appear in my Resend dashboard?"

---

## Severity Roll-up

| Band | Count | IDs |
|------|-------|-----|
| 🔴 Kill | 7 | K-E.01 K-E.02 K-E.03 K-E.04 K-E.05 K-E.06 K-E.07 |
| 🟠 Strong | 10 | S-E.01 … S-E.10 |
| 🟡 Mid | 9 | M-E.01 … M-E.09 |
| Exceptional | 0 | — |
| Weak | 0 | — |

**Verdict reaffirmed: 🔴 not launch-ready.** Two of the seven Kills (K-E.01 domain, K-E.03 bounce-handler) are wall-clock-heavy (DNS propagation + a day of engineering). Plan a 2-week email-hardening sprint immediately after Stripe-KYC is unblocked, and run Stripe-go-live + email-go-live in parallel since they share the DNS-setup dependency.
