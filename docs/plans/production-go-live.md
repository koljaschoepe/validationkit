# Plan — Production-Go-Live (der eine manuelle Launch-Block)

> Erstellt: 2026-06-18 · Status: 🔵 Offen — **der einzige verbleibende Plan, der echte User-Aktion / Geld / externe Accounts braucht.**
> Slug: `production-go-live`
> Confidence: **High** — basiert auf der 16-Subagent-Plan-Reconciliation vom 2026-06-18 (jeder Punkt code-verifiziert), die den alten 10-Bundle-Master (`docs/plans/done/production-launch-readiness/`) ablöst.
> Schwester-Plan (alles Code, ohne Geld/Domain): `docs/plans/frontend-and-polish.md`.

## 1. Ziel

ValidationKit von „code-komplett + Test-Mode-verifiziert" auf **„live, mit erstem zahlenden DACH-B2B-Kunden auf eigener Domain"** bringen. Dieser Plan bündelt **ausschließlich** Schritte, die ich (Claude) nicht autonom erledigen kann, weil sie eine **Domain-Registrierung, echtes Geld, Stripe-Live-KYC, oder das Provisionieren externer Accounts** (Sentry, Upstash, Resend-Custom-Domain) erfordern — plus die wenigen Code-Stücke, die ohne diese externen Voraussetzungen sinnlos sind (Live-Webhook-Secret, `__Host-`-Cookie, CSP-Enforce-Flip).

**Leitprinzip (unverändert seit Master):** Möglichst spät Geld ausgeben. Aller Code + Test-Mode ist fertig; hier fließt zum ersten Mal Geld.

## 2. Was VORHER schon erledigt ist (Kontext, nicht mehr zu tun)

Code-verifiziert abgeschlossen (Stand 2026-06-18, Branch `launch-prep-execute`):
- **Auth/IDOR**: alle Cross-Tenant-Kills zu (`authz.ts`-SSOT, `customers.ts` server-only, `pollPRStatus`-Gate). CSP/HSTS/Rate-Limit-Config vorhanden (Rate-Limit noch in-memory — siehe §4 Upstash).
- **Stripe-Geld-Pfad (Test-Mode)**: dahlia-invoice-Shape, Monats-Grant, Overage-Ledger→Meter, Idempotenz-Migration `0016`, `customer.deleted`, Tax-Code, J5-Refund-on-Failure — alle live im Code + Test-Mode-verifizierbar.
- **Legal-Content**: Impressum, Datenschutz, **AGB-de (neu)**, OSS-Notices (neu), TIA, Email-Footer-Impressum, LegalFooter, Subprozessor-Single-Source. (Nur Adressdaten + Domain offen — §4.)
- **Infra-Code**: Env-Fail-Fast-Validator, Inngest-Signing-Key-Enforce, Hot-Query-Indices (`0017`), frozen-lockfile, `VERCEL_ENV=preview`-Migrations-Guard.

## 3. User-Entscheidungen (noch offen, vor Wave-Start zu klären)

| ID | Frage | Default-Empfehlung |
|----|-------|--------------------|
| G1 | Domain-Name + TLD | `validationkit.app` ist überall Platzhalter; **`.de` für DACH-B2B-Trust** erwägen. **Entscheidung nötig vor DNS.** |
| G2 | Observability-Tiefe | Sentry-free reicht für GA (Default). Axiom/PostHog später. |
| G3 | AI-Markup-Billing | Aktuell `markupMicrocents:0` (out-of-scope). GA so lassen (Default) oder aktivieren? |
| G4 | Eigene Invoice-Receipt-Mail vs. Stripe-native | Stripe verschickt bei aktiviertem Setting selbst Belege. Eigene Mail nur, wenn Branding gewünscht (→ Schwester-Plan). |

## 4. Schritte (Reihenfolge: extern-langwierig zuerst anstoßen)

### Block 0 — Sofort out-of-band anstoßen (Wartezeit-Treiber)
- [ ] **Stripe-Live-KYC** beantragen: Account-/Business-Verifikation (Gewerbeschein/USt-ID), Bankkonto, Stripe-Tax-DE-Registrierung → Freigabe abwarten (1–2 Wochen). *(Bundle E, Phase 0)*
- [ ] **Domain-Entscheidung** treffen (G1) und registrieren (~10–20 €/Jahr).

### Block 1 — Externe Accounts provisionieren (free tier, aber manueller Klick)
- [ ] **Upstash-Redis** (Vercel-Marketplace, free) provisionieren → liefert `UPSTASH_REDIS_*`-Env. *(löst K10 Rate-Limit-Backend)*
- [ ] **Sentry** (free) provisionieren → `SENTRY_DSN` + `SENTRY_AUTH_TOKEN`.
- [ ] **Resend** Custom-Domain anlegen (braucht die Domain aus Block 0).

### Block 2 — Code, das diese Accounts braucht (klein, mechanisch)
- [ ] **Rate-Limit auf Upstash** umstellen: `apps/web/src/lib/rate-limit.ts` (in-memory `Map` → Upstash) + Better-Auth `rateLimit.storage` auf `secondary-storage`. *(K10)*
- [ ] **`@sentry/nextjs` verdrahten**: install + `sentry.*.config.ts` + `next.config` wrap + Webhook-`captureException`. Env-gated (no-op ohne DSN), DSN aus Block 1.
- [ ] **`__Host-`-Cookie-Prefix** auf Better-Auth-Session setzen (`packages/auth/src/server.ts:93-95` — bewusst aufgeschoben bis Domain steht; falsch gesetzt bricht Sign-in).
- [ ] **CSP von Report-Only → Enforce** flippen (`next.config.ts:34`) + `connect-src` auf exakte Hosts (Sentry/Upstash/Stripe) einengen — **nach** ein paar Tagen Report-Monitoring.

### Block 3 — DNS / Email-Deliverability (Domain steht)
- [ ] 7 DNS-Records: A/AAAA, www-CNAME, MX, **DKIM**, **SPF**, **DMARC**, Stripe-Verify-TXT.
- [ ] Resend-Domain verifizieren → `RESEND_FROM` auf Domain-Adresse; Catch-all-Forwarding für `impressum@`/`datenschutz@`/`dpa@`/`unsubscribe@`.
- [ ] **Email-Suppression-Infra aktivieren** (Code ist im Schwester-Plan vorbereitet bzw. hier zu bauen, weil Live-Webhook-gekoppelt): `email_suppression`-Migration, `/api/resend/webhook` (Svix-Verify → Bounce/Complaint-Rows), Pre-Send-Suppression-Check in `sender.ts`, RFC-8058 One-Click-`/api/email/unsubscribe` + `user.opted_out_marketing`-Spalte.
- [ ] **mail-tester.com ≥ 9/10** + One-Click-Unsubscribe manuell prüfen.

### Block 4 — Stripe-Live-Flip (KYC durch)
- [ ] **Live-Bootstrap**: `scripts/stripe-setup-live.ts` (bzw. `--allow-live`-Flag — Code-Stub im Schwester-Plan vorbereitet) ausführen → Live-Products/Prices/Meters.
- [ ] Customer-Portal-Branding + erlaubte Aktionen konfigurieren.
- [ ] Live-Webhook-Endpoint registrieren → `STRIPE_WEBHOOK_SECRET_LIVE`.
- [ ] **14 Env-Vars Test→Live** in Vercel-Production swappen.
- [ ] **Live-Smoke-Test** (echtes Geld, 100 % Refund danach): Checkout → Tax-Rechnung → Portal-Cancel/Reactivate → Overage → Refund.

### Block 5 — Deploy-Hardening (Hosting)
- [ ] **Migration aus dem Build lösen**: `vercel.json` `buildCommand` entkoppeln → eigener `db:migrate:prod`-Schritt (Vercel-Cron-One-Shot oder GitHub-Action mit Prod-`DATABASE_URL`-Secret). *(K-DB1 — der `VERCEL_ENV=preview`-Guard ist nur die halbe Lösung.)*
  - ⬑ Über diesen Schritt fließen auch die **Settings-Backend-Migrationen `0020`/`0021`/`0022`** (API-Keys / Notification-Preferences / Webhooks — additiv + idempotent, aus `done/frontend-and-polish.md`) auf Prod. Lokal: Docker Desktop starten → `pnpm db:migrate`.
- [ ] **`membership_pending_unique`**-Migration: partial-unique `(workspace_id, lower(invited_email)) WHERE status='pending' AND user_id IS NULL` + `inviteAdmin`-onConflict-Handling. *(Daten-Integrität; bewusst nicht autonom wg. Constraint-Verhalten.)*
- [ ] `vercel.json`: `regions:['fra1']` + `functions`-Memory/maxDuration-Profil (DACH-Latenz).
- [ ] `.lighthouserc.json` nuancieren (numberOfRuns 1→3, Marketing-85-vs-App-Tiers, warn-Levels) + Lighthouse-CI im CI aktivieren.
- [ ] Deps-Bump `tmp`/`hono` (moderate CVEs). (`vitest` 3→4-CVE-Bump ✅ im Schwester-Plan erledigt 2026-06-23.)

### Block 6 — Final
- [ ] **Impressum/Datenschutz-Adressdaten** ausfüllen (`impressum/page.tsx:30-34` Platzhalter: Straße/PLZ/Ort/Telefon/USt-IdNr) — nur der Inhaber kann das.
- [ ] **Subprozessor-Status** in `lib/sub-processors.ts` mit der Realität abgleichen (mehrere stehen auf `planned`).
- [ ] `docs/operations/stripe-go-live.md` §4 Doc-Lüge korrigieren (behauptet `stripe:setup-test` „supports live keys" — tut es nicht).
- [ ] **Pre-Launch-Verify-Checkliste** durchgehen → **Soft-Launch** (3–5 Friends, Live-Mode, 7-Tage-Refund) → bei 0 Critical-Sentry-Alerts public.

## 5. Endzustand (Acceptance)
Domain live + DKIM/SPF/DMARC grün · Stripe-Live mit echter getesteter Transaktion + Tax-Rechnung · Sentry empfängt Events · Rate-Limit über Upstash global · `__Host-`-Cookie + CSP enforced · Impressum vollständig · mail-tester ≥9 · Migration nicht mehr im Build.

## 6. Out-of-Scope (→ Schwester-Plan `frontend-and-polish.md`)
Alles Code ohne externe Voraussetzung: Frontend-Visual-Politur, Settings-Backend-Features, GitHub-Background-Audit-Refactor, Inngest-`onFailure`-Resilience, Email-Copy-de + neue Templates, axe-Harness, Saved-Views.

## 7. Risiken
| Risiko | Mitigation |
|--------|-----------|
| Stripe-Live-KYC > 2 Wochen | Block 0 sofort starten |
| DKIM-Propagation 48h | Buffer einplanen |
| CSP-Enforce bricht Live-Seite | Erst Report-Only-Monitoring, dann Flip |
| `membership_pending_unique` bricht bestehende Invites | onConflict-Handling zusammen mit Migration |
| migrate-out-of-build vergessen → Prod-Deploy ohne Migration | `db:migrate:prod` als CI-Gate, nicht optional |
