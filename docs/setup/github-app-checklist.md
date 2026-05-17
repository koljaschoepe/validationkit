# GitHub App Registration — Single-Sheet Checklist

> Single-sheet TODO for the ~30-min one-time setup. Pair with the long-form walkthrough in [`github-app.md`](./github-app.md).

> **Pre-req:** Local stack up (`pnpm stack:up`), DB migrated (`pnpm db:migrate`), `.env.local` working with auth enabled.

## Pre-setup (5 min)

- [ ] **ngrok or cloudflared installed.** `brew install ngrok` or `brew install cloudflared`.
- [ ] **Dev server running on localhost:3000.** `pnpm --filter @vk/web dev`.
- [ ] **Tunnel up.** `ngrok http 3000` → note the `https://<…>.ngrok.app` URL.
- [ ] **Auth working.** Visit `http://localhost:3000/login`, send yourself a magic link via Mailpit (http://localhost:8025), confirm signed in.

## Register the app (10 min)

- [ ] Open <https://github.com/settings/apps/new> (personal) or `/organizations/<org>/settings/apps/new` (org-owned).
- [ ] **GitHub App name:** `ValidationKit (dev)` for now. Production rename later.
- [ ] **Homepage URL:** your tunnel URL (`https://<…>.ngrok.app`).
- [ ] **Webhook URL:** `https://<…>.ngrok.app/api/install-webhook`.
- [ ] **Webhook secret:** Generate now — `openssl rand -hex 32`. Save it somewhere local; you'll paste into `.env.local` next.
- [ ] **Repository permissions:**
  - Contents → **Read-only**.
  - Pull requests → **Read-only**.
  - Metadata → **Read-only** (auto-checked).
- [ ] **Subscribe to events:** ☑ Installation · ☑ Installation repositories.
- [ ] **Where can this app be installed?** "Only on this account" for now.
- [ ] Click **Create GitHub App**.

## Capture credentials (5 min)

- [ ] **App ID** — numeric, displayed at the top of the app's settings page. Copy to `.env.local` as `GITHUB_APP_ID`.
- [ ] **Client ID** — copy to `.env.local` as `GITHUB_APP_CLIENT_ID`.
- [ ] **Webhook secret** — paste the value you generated as `GITHUB_APP_WEBHOOK_SECRET`.
- [ ] **Private key** — click "Generate a private key". A `.pem` downloads. Open it. The contents (including `-----BEGIN/END-----` lines) go into `.env.local` as `GITHUB_APP_PRIVATE_KEY` (quoted; preserve newlines).
- [ ] **Install URL** — copy `https://github.com/apps/<your-app-slug>/installations/new` to `.env.local` as `GITHUB_APP_INSTALL_URL`.

## Restart + verify (5 min)

- [ ] **Restart the dev server.** `Ctrl-C` then `pnpm --filter @vk/web dev` again. Env vars only re-load on restart.
- [ ] **Confirm wiring.** Visit `https://<…>.ngrok.app/api/install-webhook` (GET). Should return `{"ok": true, "hint": "POST GitHub webhook payloads here. ..."}`.
- [ ] **Install on a test repo.** From `GITHUB_APP_INSTALL_URL`, install onto a repo you control (preferably a fresh test repo). Confirm GitHub UI redirects to `/requests` after install.
- [ ] **Check webhook_event.** In Postgres (`pnpm db:studio` or `psql`):
  ```sql
  SELECT delivery_id, event_name, action, status FROM webhook_event ORDER BY received_at DESC LIMIT 5;
  ```
  → You should see at least 1 row with `event_name='installation' AND action='created' AND status='processed'`.

## First real PR dispatch (10 min)

- [ ] On `/customers`, add a customer-repo pointing at the test repo via `github://owner/repo`.
- [ ] On `/customers/<id>`, click **Request write access** → submit.
- [ ] On `/requests`, approve the request as the workspace owner.
- [ ] Verify in Postgres that `repo.write_access_granted = true` for that row.
- [ ] (Optional, Sprint 0.9 candidate) — programmatically call `dispatchPR()` via a test script, confirm a real PR opens on the test repo.

## What to do if it breaks

| Symptom | Diagnosis | Fix |
|---|---|---|
| `verifyWebhookSignature` returns false | Secret mismatch between GitHub UI and `.env.local`. | Re-paste secret, restart dev server. |
| `installation.created` fires but DB has no row | `pickWorkspaceForInstallation` raised — no prior install. | Either install creates the workspace OR you've installed on a repo not matching any pending `install_request`. |
| Real PR fails with 422 | Branch already exists OR PR already open. | This is idempotent-handled — read `GitHubAppPRClient.dispatch` for the catch logic. |
| Tunnel URL expires daily (ngrok free) | Free tier rotates URLs. | Update `Webhook URL` in GitHub settings each day, OR upgrade to ngrok paid OR switch to cloudflared with a static subdomain. |

## When you're done

- ☑ Webhook fires on install.
- ☑ Install creates a `repo` row.
- ☑ Install_request can be approved end-to-end.
- ☑ webhook_event audit-trail captures every delivery.
- ☑ Replay of the same `x-github-delivery` is a no-op (idempotency check).

You now have a real GitHub App. The `LocalGitClient` becomes the fallback path; `GitHubAppPRClient` is your customer-PR-dispatch.

---

*Last updated: 2026-05-16. Source-of-truth: this checklist + [`github-app.md`](./github-app.md).*
