# Incident Response Playbook

> **Status: DRAFT.** Referenced by `dpa-template.md` §7 + `toms-register.md` row #10. M3 deliverable.

> Single source of truth for "something just went wrong." Designed to be useful at 3am with one founder oncall.

---

## Severity Matrix

| Severity | Definition | Examples | Time to first response | Customer notification |
|---|---|---|---|---|
| **SEV-1** | Personal-data breach OR full Customer-data loss | Unauthorized access to scan/finding rows; backup corruption | 30 minutes | GDPR Art. 33 — within **72h** without undue delay |
| **SEV-2** | Customer-facing outage OR auth broken OR write-scope misuse | `/scans` 500s, magic-link emails not arriving, write-PR opened without `repo.write_access_granted` | 2 hours | Within 24h, status page update |
| **SEV-3** | Degraded but functional | Inngest backlog growing, LLM-Audit rate-limited, slow audit | 1 business day | Optional, status page when known |
| **SEV-4** | Cosmetic / non-blocking | UI glitch, typo, slow non-critical page | Next business day | None |

---

## Detection Sources

- **GlitchTip / Sentry** (Phase 1+) — error rate spike.
- **Webhook signature failures** — `verifyWebhookSignature` returning false too often.
- **Customer report** — email to `incident@validationkit.local` (Phase 1+ alias).
- **Background-job stall** — Inngest dashboard at `http://localhost:8288/queue` (dev) or Inngest Cloud (Phase 1+).
- **Postgres backup drift** — daily restore-drill smoke (Phase 1+).
- **Manual review** — weekly Friday-retro per Sprint cadence.

---

## Escalation Chain

| Role | Sprint 0 | Phase 1 | Phase 2 |
|---|---|---|---|
| **Incident Commander** | Kolja | Kolja | First eng | 
| **Comms Lead** | Kolja | Kolja | Founder |
| **Tech Lead** | Kolja | Kolja | Eng-on-call |
| **Customer Liaison** | Kolja | Kolja | Customer-Success |
| **Legal Liaison** | M8-lawyer (engaged on demand) | M8-lawyer | Outside counsel |

> **Solo-Constraint until M18** (PRD §2 Constraint #9): the one-person bench is acknowledged. SEV-1 calls the M8-lawyer phone-tree before doing anything else.

---

## Runbook Skeleton

### 1. Triage (first 30 min)

- [ ] **Identify** the affected system: web / db / auth / inngest / github-app / pr-workflow.
- [ ] **Classify** severity using the matrix above.
- [ ] **Open** an incident channel (Slack `#incident-YYYY-MM-DD-NN` or Signal group).
- [ ] **Page** the lawyer if SEV-1 (72h GDPR clock starts at *discovery*, not at *cause*).

### 2. Contain (first 2 h)

- [ ] **Rotate** any potentially-leaked secret (`openssl rand` then `pnpm stack:reset` plus regen `AUTH_SECRET` + `GITHUB_APP_WEBHOOK_SECRET`).
- [ ] **Revoke** affected sessions: `DELETE FROM session WHERE user_id IN (...)`.
- [ ] **Disable** the offending feature flag or scope: `UPDATE repo SET write_access_granted = false WHERE ...`.
- [ ] **Snapshot** the live DB before any destructive remediation.

### 3. Investigate

- [ ] **Capture** logs from app + Inngest + GitHub webhook deliveries (GitHub UI keeps last 30 days).
- [ ] **Reproduce** in a local copy of the DB snapshot.
- [ ] **Hypothesize** root cause; write it into the incident channel as it solidifies.

### 4. Remediate

- [ ] **Patch** root cause (PR + test).
- [ ] **Backfill** corrupted data if possible.
- [ ] **Re-enable** disabled features once the patch is live.

### 5. Communicate

- [ ] **Status-page** update (Phase 1+).
- [ ] **Direct Customer notification** per severity table.
- [ ] **GDPR Art. 33 notification** if SEV-1, within 72h.

### 6. Post-mortem (within 5 business days)

Use the template below. Publish internally; share with affected Customers on request.

---

## Breach Notification Template (GDPR Art. 33)

> Send within 72h of discovery to the competent supervisory authority. Cc affected Customers. Lawyer should review *before* sending — but don't miss the 72h window waiting.

```
Subject: Data breach notification — ValidationKit / Sondr — <YYYY-MM-DD>

Identification
- Notifier: <name, role>
- Organization: ValidationKit / Sondr
- Contact: <email + phone>

Description of the breach
- Nature: <e.g. "unauthorized read access via misconfigured GitHub App webhook">
- Date/time of occurrence: <UTC>
- Date/time of discovery: <UTC>
- Method of detection: <e.g. "automated alert on x-hub-signature-256 failures spike">

Affected data
- Categories of data subjects: <e.g. "Customer developers, ~25 individuals">
- Categories of personal data: <e.g. "email addresses, names, GitHub usernames">
- Approximate number of affected data subjects: <N>
- Approximate number of affected records: <N>

Likely consequences
- <e.g. "no evidence of data exfiltration; access was read-only and logged">

Measures taken / proposed
- Immediate: <e.g. "revoked App installation, rotated webhook secret">
- Short-term (≤ 7 days): <e.g. "deployed signature-verification fix">
- Long-term (≤ 30 days): <e.g. "added webhook_event audit-trail table">

Notification to data subjects
- Required: <yes / no — Art. 34 standard>
- Method: <email / in-app banner>
- Date sent: <UTC>

Signature
- <name>
- <date>
```

---

## Post-Mortem Template

```markdown
# Post-Mortem — <YYYY-MM-DD> — <one-line summary>

**Severity:** SEV-N
**Duration:** <hh:mm> from <discovery time UTC> to <resolution time UTC>
**Author:** <name>

## Impact

- Customers affected: <count + list if small>
- Records affected: <count>
- Revenue impact: <€>
- Data classification: <none | metadata | PII | secrets>

## Timeline (all times UTC)

- HH:MM — first signal: <where + what>
- HH:MM — triage start: <who>
- HH:MM — contain action: <what>
- HH:MM — fix deployed: <PR link>
- HH:MM — all-clear

## Root Cause

<one paragraph. Use 5 Whys if multi-layer.>

## What went well

- <…>

## What went poorly

- <…>

## Action items

| # | Action | Owner | Due | PR / Ticket |
|---|---|---|---|---|
| 1 | <e.g. "Add idempotency keys to install-webhook"> | Kolja | <date> | <link> |

## External communications sent

- <Customer X — email at HH:MM>
- <Supervisory authority notification — Y/N, at HH:MM if Y>
```

---

*Last updated: 2026-05-16. Owner: Kolja Schöpe. Next review trigger: first real incident, or M3 Anwalts-Pre-Read (whichever comes first).*
