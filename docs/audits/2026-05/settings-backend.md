# Audit 7 — Settings + Auth Backend-Gap

> 2026-05-21 · Subagent-Output. 16 Settings-Routes inventarisiert.

## Settings-Inventar

| Route | UI | DB-Read | Action/API | Status |
|-------|-----|---------|------------|--------|
| /account/settings/profile | session user.email/id | getSessionUser | — | WEAK (read-only, kein Edit) |
| /account/settings/sessions | "Coming soon" | — | — | **KILL** |
| /account/settings/notifications | "Coming soon" | — | — | **KILL** |
| /account/settings/connections | "V2-Feature" | — | — | **KILL** |
| /account/settings/delete | "Coming soon" + mailto | — | — | **KILL** |
| /[ws]/settings/general | "Coming soon" | — | — | **KILL** |
| /[ws]/settings/members | echte Tabelle | listMembers | — read-only | MID |
| /[ws]/settings/billing | Link auf /billing | session-check | — | WEAK |
| /[ws]/settings/integrations | GitHub-App-Status-Badge | env-check | — read-only | MID |
| /[ws]/settings/api-keys | EmptyState disabled-Button | — | — | **KILL** |
| /[ws]/settings/audit-apply | "Coming soon" | — | — | **KILL** |
| /[ws]/settings/galaxie | "Coming soon" | — | — | **KILL** |
| /[ws]/settings/notifications | `NotificationMatrix disabled` (Preview) | — | — | **KILL** |
| /[ws]/settings/webhooks | EmptyState disabled | — | — | **KILL** |
| /[ws]/settings/danger | DangerConfirm mit Placeholder-Name | — | — | **KILL** (Mis-Selling!) |
| /[ws]/settings/user | redirect → /account/settings/profile | — | — | OK (stub by design) |

**13 von 16 Sections sind reine Markup-Stubs.**

## KILL (für Beta-Launch besonders)

1. **/[ws]/settings/danger** — `DangerConfirm`-Mounts mit Placeholder-Name `"(workspace-name placeholder)"`. → **gefixt in Phase 1.18** (EmptyState mit Disclaimer) ✅.
2. **/[ws]/settings/notifications** — voll gerenderte Toggle-Matrix ohne Backend.
3. **/[ws]/settings/api-keys + /webhooks** — disabled-Buttons mit "Generate"/"Add"-Text.
4. **/account/settings/sessions** — Better-Auth hat die Daten, UI listet sie nicht (30-LoC-Query).

## STRONG

1. **Auth-Pipeline** Production-grade: Better-Auth 1.6 + Resend + magicLink + cookieCache, SHA-256 hashed Tokens, 10min-Expiry, Mailpit↔Resend-Fallback.
2. **Webhook-Triple** (install-webhook, notify-update, stripe/webhook) — raw-body + HMAC + timingSafeEqual + idempotency + Rate-Limit + Inngest-Dispatch.
3. **ActivationChecklist** 100% DB-driven (`lib/dal/galaxie.ts:33–80`), keine hardcoded States.

## EXCEPTIONAL

- **`getGalaxieDataForWorkspace()`** (`lib/dal/galaxie.ts:264–295`) — Membership-Gate + Role-Resolve + lazy-snooze-Expiry + bulk-loading + `unstable_cache` mit `revalidateTag`. Eine Funktion, vier Concerns sauber geschichtet.

## Wichtige Erkenntnis

Better-Auth's Organization-Plugin ist **nicht** in Verwendung. Multi-Tenant über eigene `workspace`+`membership`-Tabellen. Bewusster Build vs. Buy → ADR-würdig (gilt für Phase 2.4c, ADR-0006).

## Adressiert in

- Phase 1.18 (Danger-Zone EmptyState) ✅
- Phase 2.4a (Inventar-Doku) — wird mit diesem File abgedeckt
- Phase 2.4b (nova-2-settings-backend.md priorisieren) — pending
- Phase 2.4c (ADR-0006) — pending
