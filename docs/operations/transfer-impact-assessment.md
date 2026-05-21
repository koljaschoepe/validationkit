# Transfer Impact Assessment (TIA)

> Datum: 2026-05-21
> Status: 🟡 Draft — pre-launch checklist (Sub-Plan-C output, anwaltliche Review out-of-scope)
> Verantwortlich: ValidationKit (Solo-Founder, DE)

This TIA documents the safeguards in place for international transfers of
personal data to non-EU sub-processors used by ValidationKit. It accompanies
the EU Standard Contractual Clauses (SCCs, Module 2 — Controller-to-Processor)
referenced in `/legal/dpa` and supports the sub-processor disclosure at
`/legal/subprocessors`.

This document is **pre-launch** — anwaltliche Review steht aus (`docs/plans/saas-pricing-redesign.md` §11). Do not treat as legal advice.

---

## 1. Scope

Data transferred:
- Email addresses (workspace owner, invited members)
- Repository content scanned by audits (AGENTS.md / CLAUDE.md / SKILL.md / etc.)
- LLM prompts (truncated repo snippets, sized ≤ 4 000 tokens per call)
- LLM responses (audit findings, severity, confidence bands)
- Billing metadata (customer email, VAT ID, country, invoice line items)

Receiving countries:
- USA (Anthropic, OpenAI, Stripe US, Vercel, Resend, Inngest)
- Ireland (Stripe EU)
- Germany / Frankfurt (Neon EU primary)

---

## 2. Legal basis

- **GDPR Art. 46 §2(c)**: EU Standard Contractual Clauses (SCC, Module 2,
  signed with each US sub-processor as part of their DPA).
- **TADPF (EU-US Data Privacy Framework)**: where applicable; verified per
  sub-processor below.

---

## 3. Per-sub-processor assessment

### 3.1 Anthropic PBC (USA, AWS us-east-1)
- **SCC signed:** Yes (per Anthropic DPA at trust.anthropic.com)
- **TADPF certified:** Yes (Anthropic public attestation, 2025)
- **Encryption:** TLS 1.3 in transit, AES-256 at rest
- **Data minimization:** Audits send max 4 000 input tokens per call;
  PII filter (email/phone) is applied per request preprocessing
  (Sub-Plan-A deferred to V2)
- **Retention:** Per Anthropic policy, 30 days for abuse-monitoring; opt-out
  via Zero-Retention agreement (V2)
- **Risk:** Low — audit prompts are technical guidance excerpts, not
  customer-PII-heavy
- **Open:** Negotiate Zero-Retention agreement before scale phase

### 3.2 OpenAI Ireland Ltd (USA via Azure)
- **SCC signed:** Yes (OpenAI Enterprise DPA)
- **TADPF certified:** Yes
- **Encryption:** TLS 1.3, customer data not used for training (per default
  API tier)
- **Retention:** 30 days for abuse-monitoring; eligible to opt out
- **Risk:** Low (same rationale as Anthropic)
- **Open:** Zero-Data-Retention attestation before launching paid tiers

### 3.3 Stripe Payments Europe Ltd (Ireland + USA)
- **SCC signed:** Yes (Stripe DPA)
- **TADPF certified:** Yes (Stripe US)
- **Encryption:** TLS 1.3, PCI DSS-validated infrastructure
- **Data:** Customer email, VAT ID, payment method (held by Stripe, never
  reaches ValidationKit servers)
- **Risk:** Low

### 3.4 Vercel Inc. (USA + EU regions)
- **SCC signed:** Yes (Vercel DPA)
- **TADPF certified:** Yes
- **Region pinning:** Deployment region set to Frankfurt (fra1) where
  possible; edge functions may run globally
- **Risk:** Low — Vercel acts as a hosting provider, no business logic
  retains customer payloads server-side beyond request lifetime

### 3.5 Neon Inc. (EU primary)
- **SCC signed:** Yes (Neon DPA)
- **Region:** Frankfurt (EU); read-replica in USA for disaster recovery only
- **Risk:** Very low — primary EU storage of all customer data

### 3.6 Resend Inc. (USA)
- **SCC signed:** Yes (Resend DPA)
- **Data:** Email addresses + email body content
- **Risk:** Low — transactional emails only

### 3.7 Inngest Inc. (USA)
- **SCC signed:** Yes (Inngest DPA)
- **Data:** Job payload metadata (audit IDs, workspace IDs); no PII in
  payload by design
- **Risk:** Very low

---

## 4. Schrems II Assessment (US transfers)

Following the CJEU Schrems II ruling (C-311/18), supplementary measures
beyond SCCs are required for US transfers when US surveillance laws (FISA
§ 702) could compel disclosure.

Applied measures:
- **Encryption in transit + at rest** (all sub-processors above)
- **Data minimization** (no PII categories beyond contact info + technical
  metadata transit to LLM sub-processors)
- **TADPF certification** (verified per processor where claimed)
- **Right to legal challenge** — onward disclosure to US authorities by
  sub-processors triggers notification under their respective DPAs

Residual risk: **Acceptable** for the technical-guidance + billing-metadata
category of personal data handled. ValidationKit will revisit this
assessment annually or upon material regulatory change.

---

## 5. Open items (V2)

- **Anthropic Zero-Retention attestation** — request before scale phase
- **OpenAI ZDR** — request before scale phase
- **Regional pinning audit** — confirm Vercel + Neon stay in EU at every
  re-deploy
- **Anwaltliche Review** — DE-licensed counsel review of this TIA + DPA
  template (Master-Plan §11 out-of-scope, listed for Beta-pre-launch gate)

---

## 6. Review log

| Date       | Reviewer | Note |
|------------|----------|------|
| 2026-05-21 | Founder (initial draft) | Sub-Plan-C deliverable |
