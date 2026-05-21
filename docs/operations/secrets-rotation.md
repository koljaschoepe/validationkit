# Operations — Secrets-Inventar + Rotation

> Pro Secret: Was, wo bekommt man den Wert, wann rotieren, wer-darf-sehen.

## Auth

### `AUTH_SECRET`
- **Was:** Better-Auth Session-Encryption-Key (32 Bytes Base64).
- **Generierung:** `openssl rand -base64 32`
- **Lokal:** Dev-Wert in `.env.local` (Default in `.env.example` ist NICHT sicher).
- **Prod:** Vercel-ENV, Production-only scope.
- **Rotation:** Nach Security-Incident oder jährlich. Rotation **invalidiert alle aktiven Sessions** → User müssen sich neu einloggen.

### `AUTH_BASE_URL`, `NEXT_PUBLIC_APP_URL`
- **Was:** Canonical-URL für Magic-Link-Generation + Stripe-Redirects.
- **Lokal:** `http://localhost:3000`
- **Prod:** `https://<domain>`
- **Rotation:** Nur bei Domain-Change.

## Database

### `DATABASE_URL`
- **Was:** Postgres-Connection-String. Lokal Docker, Prod Neon.
- **Quelle:** Neon-Dashboard → Project → Connection-Details. Format: `postgres://user:pass@host:5432/db?sslmode=require`.
- **Lokal:** `postgres://vk:vk_local@127.0.0.1:5432/validationkit`
- **Rotation:** Neon erlaubt Password-Rotation ohne URL-Change (Connection-String enthält Password). Bei Rotation: neuen Connection-String in Vercel-ENV speichern, Redeploy.

## Email

### `SMTP_HOST` / `SMTP_PORT` / `SMTP_FROM` (Local-Dev only)
- **Lokal:** Mailpit auf `127.0.0.1:1025`. Mails landen in `http://localhost:8025`.
- **Prod:** Nicht setzen (Resend-Pfad nimmt Vorrang).

### `RESEND_API_KEY`, `RESEND_FROM` (Prod only)
- **Was:** Resend-Account-Credential + Sender-Email.
- **Quelle:** Resend-Dashboard → API-Keys → "Add API Key" mit Restricted-Permission "Send emails only".
- **Prod:** Vercel-ENV, Production-only.
- **Wenn gesetzt:** `packages/auth/src/server.ts:44–59` schaltet automatisch auf `smtp.resend.com:465`.
- **Rotation:** Nach Compromise. Sender-Domain (`auth@validationkit.app`) muss DKIM-verifiziert sein in Resend-Dashboard.

## Background-Jobs

### `INNGEST_BASE_URL` (Local), `INNGEST_EVENT_KEY` + `INNGEST_SIGNING_KEY` (Prod)
- **Lokal:** `http://127.0.0.1:8288` (Docker-Inngest-Dev-Server).
- **Prod:** Inngest-Cloud-Dashboard → Project-Settings → Keys.
  - `INNGEST_EVENT_KEY` = Send-Events-Authorization
  - `INNGEST_SIGNING_KEY` = Webhook-Signature-Verification
- **Rotation:** Nach Compromise. Inngest-Cloud erlaubt zweite parallele Keys während Migration.

## Billing

### `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- **Was:** Stripe API-Credentials + Webhook-Signing-Secret.
- **Quelle:** Stripe-Dashboard → Developers → API-Keys (Live-Mode für Prod, Test-Mode für Dev).
  - `STRIPE_SECRET_KEY` = `sk_live_...` (Prod) / `sk_test_...` (Dev)
  - `STRIPE_WEBHOOK_SECRET` = `whsec_...` aus Webhook-Endpoint-Detail-View
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_live_...` / `pk_test_...`
- **Rotation:** Stripe erlaubt parallel-existing Keys. Bei Rotation: neuen Key in Vercel-ENV, alten nach Verifikation löschen.

## GitHub App

### `GITHUB_APP_ID`, `GITHUB_APP_CLIENT_ID`, `GITHUB_APP_CLIENT_SECRET`, `GITHUB_APP_PRIVATE_KEY`, `GITHUB_APP_WEBHOOK_SECRET`
- **Was:** GitHub App Manifest-Credentials für PR-based-Apply-Workflow.
- **Quelle:** GitHub Org/User → Settings → Developer Settings → GitHub Apps → "ValidationKit" → General-Tab + Private-Keys-Tab.
- **`GITHUB_APP_PRIVATE_KEY`** ist ein PEM-Block; in Vercel-ENV als-multi-line speichern (Vercel UI erlaubt das).
- **Rotation:** Private-Key kann regeneriert werden ("Generate a private key") — alter Key bleibt parallel gültig bis explizit gelöscht. Client-Secret-Rotation triggert sofortigen Token-Invalidation.

## LLM-Provider

### `ANTHROPIC_API_KEY` (primary)
- **Was:** Anthropic-Console-API-Key für `claude-sonnet-4-6` (Default für Audit-Rules).
- **Quelle:** console.anthropic.com → API-Keys.
- **Rotation:** Anthropic-Console erlaubt parallel-existing Keys.
- **Ohne den Key:** LLM-Audit-Rules silent no-op (siehe [ADR-0005](../adrs/0005-llm-multi-provider.md)).

### `OPENAI_API_KEY` (optional opt-in Fallback)
- **Was:** OpenAI-API-Key für `gpt-5-nano` Cost-Floor-Pfad.
- **Quelle:** platform.openai.com → API-Keys.
- **Vorrang:** Anthropic > OpenAI. Wenn beide gesetzt → Anthropic gewinnt.

## Public-Config (nicht-Secret, aber load-bearing)

### `NEXT_PUBLIC_*`
- **Was:** Browser-exponierte Konfig (Stripe-Publishable-Key, App-URL).
- **Rotation:** Wie normale ENV-Vars, aber **Cache-Invalidation nötig** — Vercel-Build muss laufen, sonst hängt alter Wert im Bundle.

## Rotation-Routine (Solo-Dev)

Empfehlung: **einmal pro Quartal**, alle Secret-Werte einsehen:

1. Vercel-Dashboard → Project → Settings → Environment Variables.
2. Pro Variable prüfen: ist sie noch genutzt? Ist der Provider-Account noch aktiv?
3. Bei Compromise-Verdacht: sofort rotieren (Reihenfolge: erst neue Werte setzen, dann alte invalidieren).
4. Stripe-Webhook-Endpoint-Tests nach jeder `STRIPE_WEBHOOK_SECRET`-Rotation (Stripe-CLI `stripe trigger`).

## Wer-darf-sehen

Solo-Dev. Nach Hire: Vercel-Team-Permissions auf "Admin" beschränken für deploy-relevante Personen. Read-Only-Team-Permissions für Devs ohne Deploy-Rechte.
