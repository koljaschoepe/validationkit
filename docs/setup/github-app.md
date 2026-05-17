# GitHub App Setup

> One-time setup for the ValidationKit GitHub App. Skippable in pure Hardcore-Local-Only mode (LocalGitClient handles PR-dispatch as a patch file). Required before Sprint 0.6+ Customer-PR-Workflow goes live.

## Why register the App?

Per PRD §6.4, the GitHub App is the canonical (and **only** non-deprecated) integration path. PAT-fallback is explicitly out-of-scope (GDPR Joint-Controller-Falle). Four Day-1-Mitigations gate this rollout:

1. ✅ Read-Only-Default — enforced in `@vk/pr-workflow` (Sprint 0.5)
2. ✅ Trust-Center-Pseudo-MVP — `/trust` page (Sprint 0.5)
3. ✅ DPA-Template — `docs/legal/dpa-template.md` (Sprint 0.5)
4. ⏳ Requester→Approver-Bridge — schema + UI ready (Sprint 0.5); webhook real-wiring follows below.

## Registration (one-time, ~5 min)

1. **Open** `https://github.com/settings/apps/new` (or `https://github.com/organizations/<org>/settings/apps/new` for org-owned).
2. **Pre-fill** with the manifest from `docs/setup/github-app.json`:
   - Click "Create a GitHub App using a manifest" (alternative path).
   - Paste the JSON.
   - GitHub will prompt for the webhook URL and redirect URL.
3. **Replace placeholders** before submitting:
   - `hook_attributes.url`: point at your live tunnel (e.g., `https://<yourname>.ngrok.app/api/install-webhook`). For local dev, use `ngrok http 3000` or `cloudflared tunnel`.
   - `redirect_url`: keep `http://localhost:3000/api/auth/github/callback` for local dev. Switch to your production domain in Phase 2.
4. **Generate** a webhook secret (`openssl rand -hex 32`) and paste it into GitHub's webhook-secret field.
5. **Generate** a private key (GitHub UI → "Private keys" → "Generate a private key"). Save the downloaded `.pem`.
6. **Note** the App ID, Client ID, and Client Secret.
7. **Set scopes** (manifest covers default; verify after creation):
   - Repository permissions: Contents = Read-only, Pull requests = Read-only, Metadata = Read-only.
   - Subscribe to events: Installation, Installation repositories.

## Local environment

Add to `.env.local`:

```bash
GITHUB_APP_ID="1234567"                            # numeric, from app settings page
GITHUB_APP_CLIENT_ID="Iv23xxxxxxxxxxxxxxxx"        # for future OAuth User flow
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
<paste contents of downloaded .pem, including BEGIN/END lines>
-----END RSA PRIVATE KEY-----"
GITHUB_APP_WEBHOOK_SECRET="hex32"                  # same value pasted into GitHub
GITHUB_APP_INSTALL_URL="https://github.com/apps/validationkit/installations/new"
```

> Multi-line private keys must be quoted. If using `.env`-style loaders that strip newlines, base64-encode the PEM and decode in `@vk/github-app`.

## How the install flow lands in your DB

1. Customer-Admin opens `<your-domain>/login` and signs in (Better-Auth magic link).
2. The customer clicks "Install ValidationKit on your repos".
3. GitHub redirects to the install page; the admin selects which repos to grant.
4. GitHub fires an `installation` (and `installation_repositories`) webhook to `/api/install-webhook`.
5. The handler verifies the HMAC signature, looks up the workspace, and flips any matching `install_request` rows from `pending` to `approved`.
6. If the request was `requestedScope: "write"`, the `repo.write_access_granted` flag goes to `true`.

## Uninstall + revoke

- Customer-Admin uninstalls the App from `<org>/settings/installations`.
- GitHub fires `installation.deleted`. Handler flips matching `install_request` to `revoked`, sets `repo.write_access_granted = false`.
- In-flight dispatches complete; subsequent dispatches raise `AccessDeniedError`.

## Until you register

`LocalGitClient` from `@vk/pr-workflow` writes a `.patch` file you can hand-apply with `git apply` or `git am --3way`. The Trust-Center page documents this. Web-UI surfaces a clear "App not yet registered" affordance.
