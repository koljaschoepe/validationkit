# Technical and Organizational Measures (TOMs) Register

> **Status: DRAFT.** Referenced by `dpa-template.md` §7. M3 deliverable. Will be updated when the first lawyer-review pass lands.

> **Scope:** GDPR Art. 32 — Security of Processing. Lists every measure in force, the current Phase-0 state, and the Phase-1+ target.

| # | Measure | GDPR Art. 32(1) reference | Phase-0 (today) | Phase-1+ target |
|---|---|---|---|---|
| 1 | **Encryption in transit** | (a) | All local services bind to `127.0.0.1`. Better-Auth magic-link emails are LAN-only (Mailpit). | TLS 1.3 for all egress. HSTS preload. Strong-cipher pinning. |
| 2 | **Encryption at rest** | (a) | Local Postgres volume on Mac's APFS (FileVault-encrypted disk assumed). | Neon provider-managed AES-256. Dragonfly persisted volume encrypted by host disk. |
| 3 | **Pseudonymization / anonymization** | (a) | Personal data not collected today (single-author repo). | Pseudonymous internal IDs (UUID). Hash email-on-load for analytics joins. |
| 4 | **Access control** | (b) | Single founder access. Postgres bound to `127.0.0.1`. | Per-Customer workspaces. RBAC inside workspace (owner / approver / requester). SSO for Processor staff (Phase 2). |
| 5 | **Audit logging** | (f) | `install_request` table tracks all access-decisions. `scan` and `drift_run` retain raw payloads. | Append-only audit-log table. Export-on-request. Retention 12 months. |
| 6 | **Secrets management** | (b)(c) | `.env.local`, gitignored. No secrets in repo. | Vault or Doppler. Rotation policy ≤ 90 days for production credentials. Pre-commit secret-scan. |
| 7 | **Sub-Processor isolation** | (b)(d) | None — no live sub-processors. | Separate provider accounts per environment. Production read-access requires named-approval. |
| 8 | **Backup + restore** | (c) | Manual `docker compose down`-safe via named volumes. | Daily snapshots, 30-day retention, geographically separated. Quarterly restore drill. |
| 9 | **Vulnerability management** | (d) | Renovate-bot for dep updates (planned Sprint 0.7). High-severity CVEs triaged within 7 days. | Weekly automated scan. Quarterly third-party scan. SBOM on each release. |
| 10 | **Incident response** | (d) | `docs/legal/incident-response.md` playbook below. Single-author oncall. | 24/7 oncall once team > 1. 72h breach notification (GDPR Art. 33). |
| 11 | **Personnel security** | (b) | Single founder bound by self-imposed code-of-conduct. | Confidentiality binding past termination. Background checks for production-access personnel. |
| 12 | **Network security** | (a)(b) | All Postgres / Dragonfly / Mailpit / Inngest bind to localhost only. | VPC isolation. Default-deny security groups. WAF on edge. |
| 13 | **Physical security** | (b) | Founder's laptop, encrypted disk, biometric + password lock. | Sub-Processor SOC-2 / ISO-27001 attests for the hosting layer. |
| 14 | **Data minimization** | (1)(4) | Only data needed for audit/drift is read. No telemetry. | Same. Customer's own LLM-key-mode means LLM-bound payloads bypass the Processor entirely. |
| 15 | **Right-to-deletion fulfillment** | Art. 17, 28(3)(g) | Manual SQL — schema supports `DELETE FROM user WHERE id = ?` cascade. | Self-serve account-delete endpoint. Sub-Processor delete-via-API. 30-day SLA. |

## Review cadence

- Every Sprint that touches a new sub-processor → update §5 in `sub-processors.md` *and* the relevant row here.
- Quarterly (or before each external audit) → walk this list, mark each row's `Phase-1+` column with the actual state.
- Yearly → independent third-party review (Phase 2+).

## Change log

- 2026-05-16 — Initial DRAFT. Owner: Kolja Schöpe.

---

*Last updated: 2026-05-16. Owner: Kolja Schöpe. Next review trigger: M3 Anwalts-Pre-Read + M6 first external security review.*
