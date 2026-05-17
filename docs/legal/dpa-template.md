# Data Processing Agreement — DRAFT

> **Status: DRAFT.** Pre-M8. Not lawyer-reviewed. Do not sign this. See PRD §5.3 (M8 Anwalts-Check Sondr+Pondera, ~€5.000). This file commits the *structure* so the lawyer doesn't start from a blank page.

> **Scope:** Article-28 GDPR Auftragsverarbeitungsvertrag for ValidationKit / Sondr ("Processor") and the Customer ("Controller").

---

## 1. Definitions

Terms not defined here have the meaning given in **Articles 4 and 28 GDPR** and the **DSGVO (DE)** as applicable to the Controller's establishment.

- **"Processing"** — any operation performed on personal data, as defined in GDPR Art. 4(2).
- **"Personal Data"** — any information relating to an identified or identifiable natural person.
- **"Service"** — the ValidationKit / Sondr cross-vendor agent-file audit and operations platform.
- **"Sub-Processor"** — any third party engaged by the Processor to process Personal Data on behalf of the Controller. See <code>sub-processors.md</code>.

---

## 2. Subject Matter, Duration, Nature, Purpose

| Field | Value |
|---|---|
| **Subject Matter** | Processing of agent-configuration files and metadata required to operate the Service. |
| **Duration** | The term of the underlying Service Agreement. |
| **Nature** | Read-only scanning, deterministic and LLM-augmented audit, drift comparison, audit-report persistence and PR-workflow dispatch. |
| **Purpose** | Enable the Controller to manage and harmonize cross-vendor AI-agent guidance across owned repositories. |
| **Categories of Personal Data** | Authentication identifiers (email, GitHub OAuth subject), session tokens, and any Personal Data incidentally present in scanned files (typically commit-author names). |
| **Categories of Data Subjects** | Controller's developers and authorized Approvers. |

---

## 3. Controller Obligations

- The Controller is responsible for the lawfulness of Processing and for ensuring an appropriate legal basis (GDPR Art. 6).
- The Controller will not include special-category data (GDPR Art. 9) in scanned content without prior written agreement.
- The Controller will configure repository access scopes following the *Scope Policy* (`scope-policy.md`).

---

## 4. Processor Obligations

The Processor will:
1. Process Personal Data **only on documented instructions** from the Controller, including transfers to a third country (GDPR Art. 28(3)(a)).
2. Ensure persons authorized to process Personal Data are committed to confidentiality.
3. Implement the **Technical and Organizational Measures (TOMs)** in §7.
4. Engage Sub-Processors only under the conditions in §5.
5. Assist the Controller in fulfilling Data Subject requests (GDPR Arts. 12–22) within 30 days.
6. Assist with notifications of personal-data breaches (GDPR Art. 33) without undue delay and at the latest within **72 hours** of becoming aware.
7. Delete or return all Personal Data after the end of the Service term (Controller's choice).
8. Make available to the Controller all information necessary to demonstrate compliance with Article 28, including audit support per §8.

---

## 5. Sub-Processors

- Current Sub-Processors are listed in <code>sub-processors.md</code>.
- The Processor will give the Controller **at least 30 days' written notice** before adding or replacing a Sub-Processor.
- The Controller may object on reasonable grounds. If the parties cannot resolve the objection, the Controller may terminate the Service Agreement.
- Sub-Processors are bound by data-protection obligations no less protective than this DPA.

---

## 6. International Transfers

- Personal Data is stored in **EU/EEA by default** (planned Phase 2: Neon EU-Frankfurt; Vercel EU-Frankfurt edge). Confirm with `sub-processors.md` for live state.
- Transfers outside the EU/EEA rely on **EU Standard Contractual Clauses (2021 modules)** and a **Transfer Impact Assessment** the Processor will make available on request.

---

## 7. Technical and Organizational Measures

The Processor maintains the following TOMs (non-exhaustive; full register kept in `toms-register.md` once authored):

1. **Encryption in transit** — TLS 1.3 for all network paths; HSTS preload.
2. **Encryption at rest** — provider-managed AES-256 for Postgres and object storage.
3. **Access control** — role-based access; SSO required for Processor staff; principle of least privilege.
4. **Audit logging** — application-level audit trail for all Controller-data access; retained 12 months.
5. **Secrets management** — environment-only; no secrets in source control; rotation policy ≤ 90 days for production credentials.
6. **Sub-Processor isolation** — separate accounts per environment; production read-access requires named-approval.
7. **Backup** — daily snapshot, point-in-time recovery, 30-day retention, geographically separated.
8. **Vulnerability management** — quarterly dependency review; high-severity CVEs triaged within 7 days; weekly automated scans.
9. **Incident response** — playbook in `incident-response.md`; breach-notification template; 24/7 oncall once team > 1 (currently single-author oncall).
10. **Personnel** — confidentiality obligations binding past termination; background checks for production-access personnel (Phase 1+).

---

## 8. Audit Rights

- The Controller may, **once per calendar year and with at least 30 days' notice**, audit the Processor's compliance with this DPA, at the Controller's expense, during business hours, and subject to a mutually acceptable NDA.
- The Processor will share, on request: SOC-2 reports (once available — targeted Phase 2), penetration-test summaries (M6+), and the TOMs register.
- The Controller may delegate the audit to a qualified third-party auditor not in commercial competition with the Processor.

---

## 9. Liability

- The parties' liability under this DPA is governed by the Service Agreement.
- Each party indemnifies the other for administrative fines, claims and losses caused by its own breach of GDPR or this DPA.

---

## 10. Term and Termination

- This DPA commences on the **Effective Date of the Service Agreement** and continues until terminated with it.
- On termination, the Processor will delete or return Personal Data within **30 days** at the Controller's election, except where storage is required by law.

---

## 11. Governing Law

- For Controllers in the EU/EEA: laws of **Germany**, jurisdiction Berlin.
- For Controllers in the United Kingdom: laws of **England and Wales**.
- For Controllers in the United States: laws of **Delaware**.

> *Lawyer note (DRAFT comment, M8): consider whether to consolidate to a single jurisdiction once revenue mix is clearer. Three jurisdictions add overhead.*

---

## 12. Signatures

Controller:
- Name: _______________________
- Title: _______________________
- Date: _______________________

Processor (ValidationKit / Sondr):
- Name: Kolja Schöpe
- Title: Founder
- Date: _______________________

---

## Appendix A — Standard Contractual Clauses

> Attached as separate addendum at signing. Module 2 (Controller-to-Processor) under EU 2021 SCC framework.

## Appendix B — TOMs Register

> Pointer to live document `toms-register.md` (M3 deliverable).

## Appendix C — Sub-Processor List

> Pointer to live document `sub-processors.md`.

---

*Last updated: 2026-05-16 (initial DRAFT). Next review trigger: M8 Anwalts-Check Sondr+Pondera, ~€5.000 (PRD §5.3).*
