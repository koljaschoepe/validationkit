# Plan — Bundle G · Email-Templates + Deliverability

> Erstellt: 2026-06-08
> Status: 🔵 Skelett — /execute parallel zu C, D, F
> Master: `docs/plans/production-launch-readiness.md`
> Slug: `email-deliverability`
> Confidence: **High** — wave2-06 file:line + Template-Inventar

## 1. Ziel

Email-System production-grade: Member-Invite-Email implementiert (war nie da), Invoice-Paid + Credit-Low-Warning, alle Templates mit Impressum-Footer + List-Unsubscribe + de-DE Locale, 30/7/1-day Pack-Expiry Variants, Dunning-Cap.

## 2. User-Entscheidungen

Master §2. Bundle-spezifisch:
- Email-Subject-Sprache: nur de-DE oder workspace-locale-aware?
- Member-Invite-Email-Style: minimal vs branded?

## 3. Existing-Patterns

- `packages/auth/src/emails/` hostet 4 Templates (`MagicLinkEmail`, `PlanChangeConfirmation`, `PrepaidPackExpireWarning`, `SubscriptionPastDue`)
- `packages/auth/src/emails/sender.ts` ist Transactional-Sender (außerhalb Magic-Link)
- `react-email/components` Pattern (480px width, dark color palette, plain-text auto-render)
- Inngest `prepaid-credit-expirer` schickt nur 1-day-variant (30/7-day Comments sind LÜGE)
- `MagicLinkEmail` ist exceptional — als Pattern für andere Templates nutzen

## 4. Alternativen

- **Alt-A: Single-language Subjects (Englisch global)** → DACH-B2B erwartet de. de-DE Default, en als V2-Fallback.
- **Alt-B: Member-Invite ohne Email, In-App-Notification only** → User-Onboarding kaputt (Wave-2-Email K33). Email Pflicht.
- **Alt-C: List-Unsubscribe nur auf marketing** → Best-practice: auch transactional, hilft Gmail-Inbox-Placement.

## 5. Endzustand

- `MemberInviteEmail` Template + Send-Path in `inviteAdmin()` (K33)
- `InvoicePaidReceipt` Template + Send-Path in `handleInvoicePaid` (K34a)
- Credit-Low-Warning Inngest-Cron + Template (K34b)
- Alle 7+ Templates haben:
  - Subject-Lines in de-DE (oder workspace-locale-aware)
  - Date-Formatting `toLocaleDateString("de-DE")` statt en-US
  - Number-Formatting `.toLocaleString("de-DE")` für Beträge
  - Impressum-Footer (Domain + Adresse + Verantwortlicher) — koordiniert mit Bundle F
  - `List-Unsubscribe` header (RFC 8058 one-click) — auch wenn transactional
  - Plain-Text-Fallback (auto-rendered ✓)
- `PrepaidPackExpireWarning` Variants für 30-day + 7-day + 1-day (Comments sind jetzt wahr)
- Dunning-Cap (max 3 emails pro Stripe-invoice statt N-retries)
- Resend-Webhook-Handler (Bundle C delivers Suppression-Table-Migration; G implementiert Handler-Logic)
- `sendTransactionalEmail` wrapper checked Suppression-Table BEFORE send (= Bundle C)
- Test-Renderings für jedes Template (Vitest + react-email/render)

## 6. Schritte

### Phase 1 — Member-Invite-Email (~3h)
- [ ] K33 `packages/auth/src/emails/MemberInviteEmail.tsx` neues Template
- [ ] Trigger in `apps/web/src/lib/membership.ts:80-163` (`inviteAdmin`)
- [ ] `inviteAdmin` rufts Email mit `inviterName`, `workspaceName`, `acceptLink` (= Magic-Link mit `?invite=<token>` Param)
- [ ] Acceptance: invitee bekommt Email + Click → Sign-Up + `claimPendingMemberships` resolved

### Phase 2 — Invoice-Paid + Credit-Low (~3h)
- [ ] K34a `InvoicePaidReceipt` Template
- [ ] Trigger in `webhook/route.ts:315-352` (`handleInvoicePaid`)
- [ ] K34b Inngest-Cron `credit-low-warning` daily
- [ ] Send wenn `credits_used / credits_quota >= 0.9` UND no warning in last 7 days
- [ ] `CreditLowWarning` Template

### Phase 3 — Pack-Expire 30/7/1-day (~2h)
- [ ] `prepaid-credit-expirer.ts:125-148` Branches für 30/7/1 days
- [ ] `hasRecentWarning(daysUntilExpiry)` keyed on `daysUntilExpiry` (jetzt nur generic)
- [ ] Event-row vor email-send (S28 Wave-2 — überlappt Bundle B)

### Phase 4 — i18n + Locale (~2h)
- [ ] Subject-Lines auf de-DE (oder workspace-locale-aware Helper)
- [ ] Date-Formatter-Helper `formatDate(date, locale)` → `toLocaleDateString(locale, {...})`
- [ ] Apply auf alle 7 Templates

### Phase 5 — List-Unsubscribe + Impressum-Footer (~3h)
- [ ] `sender.ts:53-88` setzt `List-Unsubscribe` + `List-Unsubscribe-Post` headers
- [ ] One-Click-Unsubscribe-Endpoint `/api/email/unsubscribe?token=<hmac>` (für transactional: marks user.optedOutMarketing=true, NICHT transactional-stop)
- [ ] Footer-Component `<EmailFooter>` mit Impressum-Link (= Bundle F koordiniert)
- [ ] Apply auf alle 7 Templates

### Phase 6 — Dunning-Cap (~1h)
- [ ] `handleInvoicePaymentFailed`: only send wenn `attemptCount <= 3` (Stripe-Smart-Retries machen 4 attempts default)
- [ ] OR: Dunning-Email-Counter pro invoice-ID via `event`-table

### Phase 7 — Resend-Webhook-Handler (Bundle C liefert Suppression-Table)
- [ ] `apps/web/src/app/api/resend/webhook/route.ts` (= Bundle C koordiniert)
- [ ] Hard-bounce → insert into `email_suppression`
- [ ] Soft-bounce → log + count
- [ ] Complaint → suppress + alert
- [ ] `sendTransactionalEmail` checked suppression before send

### Phase 8 — Tests + Acceptance
- [ ] Vitest + `@react-email/render` für jedes Template
- [ ] Subject + body de-DE renderiert
- [ ] List-Unsubscribe-Header present
- [ ] Manual: mail-tester.com Score ≥ 9/10
- [ ] Manual: One-click-Unsubscribe-Flow
- [ ] `git mv` → done

## 7. Files-to-Change

**New:**
- `packages/auth/src/emails/MemberInviteEmail.tsx`
- `packages/auth/src/emails/InvoicePaidReceipt.tsx`
- `packages/auth/src/emails/CreditLowWarning.tsx`
- `packages/auth/src/emails/components/EmailFooter.tsx`
- `packages/auth/src/emails/helpers/format-date.ts`
- `apps/web/src/app/api/email/unsubscribe/route.ts`
- `packages/inngest/src/functions/credit-low-warning.ts`
- Email-Template-Tests (`*.test.tsx`)

**Modified:**
- `packages/auth/src/emails/sender.ts:53-88` (headers + suppression-check)
- `packages/auth/src/emails/MagicLinkEmail.tsx` (de-DE subject + footer)
- `packages/auth/src/emails/PlanChangeConfirmation.tsx` (locale + footer)
- `packages/auth/src/emails/PrepaidPackExpireWarning.tsx` (30/7/1 + locale + footer)
- `packages/auth/src/emails/SubscriptionPastDue.tsx` (locale + footer + dunning-cap)
- `apps/web/src/lib/membership.ts:80-163` (Email-Trigger)
- `apps/web/src/app/api/stripe/webhook/route.ts:315-352` (Receipt-Email)
- `packages/inngest/src/functions/prepaid-credit-expirer.ts:125-148` (Branches)

## 8. DB-Migration

Bundle C liefert `email_suppression`-Tabelle (Migration 0019). Bundle G nutzt sie.

Plus ggf. `user.optedOutMarketing` Spalte für Unsubscribe.

## 9. Test-Plan

- Vitest: Template-Render-Tests pro Template
- Integration: `sendTransactionalEmail` mit suppression-Email → wird nicht versendet
- Manual: mail-tester.com vor Launch
- Manual: One-Click-Unsubscribe-Flow

## 10. Risiken

| Risiko | Mitigation |
|---|---|
| de-DE-Translations werden generisch | de-DE-Subjects vom Anwalt/User reviewn (= Bundle F koordiniert) |
| List-Unsubscribe-Header bricht in Outlook | RFC 8058 compliant + Test in Gmail/Outlook/Apple-Mail |
| Suppression-Table verhindert dass legit Re-Login-User Magic-Link bekommt | Hard-bounce-only suppress, plus admin-override-UI in V2 |
| Member-Invite-Email landet im Spam beim ersten Send | Bundle C DKIM/SPF muss live sein vor Bundle G |

## 11. Aufwand

**2-3 dev-days** Single/Multi-Session.

## 12. Out-of-Scope

- Marketing-Newsletter (V2 nach Launch)
- Audit-Complete-Notification (V2)
- Workspace-Deleted-Notification (V2)
- Welcome-Email-Sequence (V2)
- Email-Editor für Admin-Customization (V2)

## 13. Open Items

- **Email-Locale**: workspace-locale (DB-column) ODER user-locale (Header) ODER global de-DE Default?
- **Unsubscribe-Scope**: Single-Email-Type opt-out vs all-marketing opt-out vs all-emails-stop (last is unwise für transactional)
- **Member-Invite-Style**: Branded mit Hero ODER minimal text (Magic-Link-Style)?
