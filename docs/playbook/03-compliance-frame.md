# 3 — Compliance-Frame Customers

**Thesis:** Pharma, Finance, and Marketing-with-PII customers are the *Strong-Pain-Segment* (Track-C1). They pay premium for the same product because the alternative — getting caught — is existential. Sell them on **defensibility**, not features.

## Concession-then-Critique

**Concession:** Most agencies refuse compliance-frame customers because the sales cycle is long, the procurement is brutal, and a single missed clause can void the contract. The instinct is rational — these customers will eat your time.

**Critique:** They will also pay 3–5× the unregulated tier for the same delivery, and they renew at 2× the rate. The Track-C1 v4 research labeled this the **Strong-Pain-Segment** for a reason: the cost of *not* having a defensible audit-trail compounds for them in a way it doesn't for a self-funded indie consultancy. The trick isn't to skip them. The trick is to be *prepared* for the procurement conversation before you have it.

This chapter is that preparation.

## Which segments

| Segment | Why compliance-frame | What they ask first |
|---|---|---|
| **Pharma** | EMA/FDA submission processes touch every dev artifact. AI-agent guidance counts. | "Show me your DPA. Show me your TOMs register." |
| **Finance** (banks, fintechs, asset managers) | MiCA / DORA in EU. SOC-2-Type-II in US. Quarterly audit cycle. | "Where is your audit-trail stored? For how long?" |
| **Marketing-with-PII** (martech, ad-tech, CDP vendors) | GDPR + ePrivacy. Joint-controller risk. Subject access requests. | "What happens to a Customer's data when they leave?" |
| **Healthcare / Insurance** (Phase-2 candidate) | HIPAA (US) / SGB (DE). | "Are you on FedRAMP? When?" (You will not be in Phase 0.) |

For Phase 0, focus on **Pharma + Finance + Marketing-with-PII**. Healthcare needs more attestations than a solo can provide; defer.

## The 5 questions you'll be asked (and how to answer each)

### 1. "Where is your DPA?"

**Wrong answer:** "We can draft one when you're ready to sign."

**Right answer:** "Here it is" — point at `docs/legal/dpa-template.md`. Already structured (12 sections). Already lawyer-pre-reviewed at M8. Already referenceable.

The DPA Template is your *single most important sales artifact* for compliance-frame customers. If you can't produce one within 24 hours of the request, the customer assumes you're not serious about their compliance posture.

### 2. "Show me your TOMs."

**Wrong answer:** "We follow industry best practices."

**Right answer:** Point at `docs/legal/toms-register.md`. 15 measures, each with a Phase-0 status and a Phase-1+ target. Honest about what you don't do yet. Specific about what you do.

The TOMs register is the second most important artifact. Compliance-frame customers will *read* it before they sign. A vague TOMs is read as "they don't actually do this."

### 3. "What happens during a breach?"

**Wrong answer:** "We'd contact you immediately."

**Right answer:** Point at `docs/legal/incident-response.md`. Show them the SEV-1 row (Personal data breach → 30-min response → GDPR Art. 33 72h notification template). Show them the runbook's 6-step process. Show them the Post-Mortem template.

What they're testing: do you have a playbook, or do you have a hope?

### 4. "How do we revoke access if we leave?"

**Wrong answer:** "We'd delete everything on request."

**Right answer:** "The DPA §10 commits us to deletion within 30 days. The GitHub App scope is read-only by default. Write access is per-repo and per the Requester→Approver-Bridge — your admin revokes it from your GitHub UI, and our webhook handles it within seconds. Audit-trail of the revoke event is in `webhook_event` and exportable at any time."

Specific. Mechanism-bound. Reversible.

### 5. "Are you SOC-2 / ISO-27001?"

**Wrong answer:** "We're working on it."

**Right answer:** "Not yet. Targeted for Phase 2 (M9+) once we cross our first $30k MRR. Until then, our security posture is documented in TOMs Register §7, our incident response is documented in `incident-response.md`, and we'll add SOC-2 Type-I to our quarterly review cycle once you sign — happy to share progress monthly."

Be **honest about what you don't have.** Compliance customers respect "not yet" with a date. They despise vague.

## The 3 questions you ask them

Don't be passive in compliance discovery. Ask, in this order:

### 1. "Which framework is your reporting against this quarter?"

Tells you what *they* care about. MiCA? DORA? GDPR? HIPAA? Their answer pins the conversation.

### 2. "Who's your DPO contact, and what's their relationship to your tooling decisions?"

Tells you the *decision-maker structure*. If the DPO has veto power, you need them in Sprint Day 1, not Day 14. If the DPO is advisory-only, the procurement-lead is your champion.

### 3. "Can I see the redacted version of your last vendor-review questionnaire?"

This is the killer. If they share it, you know exactly what they'll ask. If they don't, you've still learned (their VR is too sensitive to share = they're serious about this).

## The Compliance-Sprint differences

A Compliance-Frame Operations-Sprint differs from the standard ($4,500, 14 days) in these ways:

| Element | Standard | Compliance-Frame |
|---|---|---|
| Duration | 14 days | **21 days** (DPA review takes a week customer-side) |
| Price | $4,500 | **$8,500** (premium for documentation overhead) |
| Day-1 artifact | Day-1 kickoff doc | Day-1 kickoff doc **+ pre-signed DPA + TOMs hand-off** |
| Day-14/21 deliverable | Audit + drift + PR-workflow | Same **+ exported audit-trail (12-month retention) + DPO sign-off doc** |
| Quarterly retainer | $0–500 | **$1,500/quarter** (audit-trail export + drift cadence + breach-drill) |

A Compliance-Sprint is a different product. Don't quote the standard price by accident.

## What kills you in compliance sales

1. **Vague answers to specific questions.** "We take security seriously" = "we don't have a playbook." Avoid.
2. **Mid-sprint scope creep on compliance items.** If the customer asks for FedRAMP halfway through, **say no**. Defer to a Phase-2 conversation. Compliance scope expansion mid-sprint is unsurvivable.
3. **Hand-coded answers.** Every compliance question should map to a document you can hand them. If you're typing the answer fresh, your TOMs register is incomplete — go fix it before the next call.
4. **Solo-founder honesty about bus-factor.** Tell them upfront: "I'm currently solo. Bus-factor of one. Here's my mitigation plan." Trying to hide solo-ness backfires worse than disclosing it.

## Skeptic-Mentor counter-example

A 3-person agency pitched a pharma customer at $30k for a 4-month engagement. They had no DPA template, no TOMs register, no incident-response playbook. Three weeks into procurement, the customer's DPO sent a 47-question vendor-review questionnaire. The agency spent 6 weeks answering questions they should've had templates for. Deal closed 3 months later at $22k — same scope, lower price, 9-month sales cycle.

Same agency, post-Compliance-Frame-Playbook: pre-built DPA (pointer to `docs/legal/dpa-template.md`), pre-built TOMs (pointer to `docs/legal/toms-register.md`), pre-built incident-response (pointer to `docs/legal/incident-response.md`). Same vendor-review questionnaire arrived. Pre-built answers covered 31 of 47. Custom answers needed for the remaining 16. Sales cycle: 5 weeks. Price: $35k (premium for documentation maturity).

**Difference: $13k swing on a single deal.** That's the value of the Compliance-Frame preparation.

## Done-when

- DPA template + TOMs register + incident-response playbook all referenceable in < 1 hour of customer request.
- One compliance-frame customer signed at the premium tier ($8,500 sprint + $1,500/qtr retainer).
- One vendor-review questionnaire answered cleanly (≥ 70% of questions covered by existing artifacts).
- One DPO contact in your CRM/recruitment-tracker for the next renewal cycle.
- Mid-sprint scope-discipline tested at least once (you said no to a compliance-creep request) — documented for the retro.

If your DPA is still "in draft" when a compliance-frame customer asks, you don't yet have a compliance practice. You have an aspiration.

---

*End of Operations-Playbook v0.5. The next chapter (v1, post-LOI #3+) will cover Multi-Vendor Federation patterns for customers running 5+ agencies in parallel.*
