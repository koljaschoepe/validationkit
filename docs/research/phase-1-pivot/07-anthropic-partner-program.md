# A7 — Anthropic Partner Program 2026 H2: AAIF Silver $5k Decision

**Research-Agent:** A7 (Partner-Program-Audit)
**Date:** 2026-05-17
**Scope:** PRD §11 — AAIF Silver-Membership $5k/yr Phase-1-Spend, Status & Alternativen
**Severity-Band:** **KILL** (PRD §11 line-item ist faktisch falsch benannt; das was gemeint ist, kostet 2× und ist ein Linux-Foundation-Stack, nicht Anthropic)
**Decision:** **NO** auf AAIF-Silver $5k Phase-1. **GO** auf Claude Partner Network ($0 entry) ab M3.

---

## TL;DR (Concession-then-Critique)

Du hast den richtigen Instinkt — 2026 ist *das* Jahr der Anthropic-Ecosystem-Plays, und ein $5k-Phase-1-Co-Marketing-Hebel wäre ein gutes ROI-Bet für einen Solo-Founder mit $0–10k Revenue-Floor. **Aber das PRD §11 line-item ist drei Sachen falsch zugleich:**

1. **"AAIF" steht nicht für "Anthropic AI Inference Forum"** — es ist die **Agentic AI Foundation**, ein Linux-Foundation-Projekt (Dez 2025 gegründet), wo Anthropic, OpenAI und Google gemeinsam Platinum-Member sind ([Linux Foundation Press, 2025-12-09](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation)). Keine Anthropic-only-Org.
2. **Silver-Membership kostet $10k/yr, nicht $5k** ([Superagentic Blog, 2025-12](https://shashikantjagtap.net/agentic-ai-foundation-where-open-innovations-meet-closed-governance-and-a-platinum-paywall/)) — und **setzt vorab Linux-Foundation-Silver-Membership voraus** (zusätzliche Kosten + Compliance-Overhead).
3. **Der eigentliche Anthropic-Co-Marketing-Channel ist seit 2026-03-12 das Claude Partner Network** ([Anthropic News, 2026-03-12](https://www.anthropic.com/news/claude-partner-network)) — $100M-Fund, $0 entry cost, Co-Sell-Support, Skills-Marketplace-Listing-Pfad.

Sprich: Wir würden $10k zahlen, um in einem Linux-Foundation-Komitee zu sitzen, wo wir gegen WorkOS, Hugging Face und Zapier als Silver-Member kaum sichtbar sind ([AAIF Members, 2026-04](https://aaif.io/members/)) — während der eigentliche Anthropic-Hebel kostenlos und konkret ist.

---

## 1. Claude Partner Network (CPN) — der richtige Hebel

**Launch:** 2026-03-12, $100M Fund ([Anthropic, 2026-03-12](https://www.anthropic.com/news/claude-partner-network); [TheNextWeb, 2026-03-12](https://thenextweb.com/news/anthropic-commits-100m-to-claude-partner-network)).

**Cost:** $0 entry ([Lowcode.agency, 2026-04](https://www.lowcode.agency/blog/claude-partner-network-worth-it)).

**Anchor-Partner:** Accenture, Deloitte, Cognizant, Infosys, PwC — Enterprise-System-Integratoren. Aber: **Reddit-Bericht zeigt 3-Personen-Agentur akzeptiert** ([BSWEN, 2026-03-21](https://docs.bswen.com/blog/2026-03-21-claude-partner-network-requirements/)) — Solo ist nicht automatisch ausgeschlossen.

**Tracks:** Technology Partners (build products) | Consulting Partners (deploy für Enterprise) | Solution Partners. **VK passt zu Technology Partner** (OSS-Framework + Hosted-App), nicht Consulting.

**Requirements:**
- Mindestens 1 Team-Member mit *Claude Certified Architect (CCA)*-Zertifikat ([Anthropic Skilljar](https://anthropic.skilljar.com/page/claude-partner-network-learning-path))
- Live deployments oder published integrations
- 60-Day Onboarding mit Capability Review + Reference Check ([Anthropic Help Center](https://support.claude.com/en/articles/11174108-about-the-development-partner-program))

**Benefits:**
- Preferred Directory Listing (claude.com/partners)
- Co-Sell mit Applied-AI-Engineers auf Live-Deals
- Joint Campaigns + Events
- Early Product Access (relevant für Cross-Vendor-Wedge — wir sehen Skills/MCP-Roadmap früher)

**Phase-Fit für VK:** Realistisch **M3–M6** (nach CCA-Zertifikat + 2 Engagements als Live-Deployment-Proof). Vorher Capability-Review-Risiko: Deferral, kein Reject.

---

## 2. Skills Marketplace — der zweite Hebel

**Launch:** 2025-12-18 ([Anthropic, 2025-12-18](https://www.anthropic.com/news/skills); [VentureBeat, 2025-12-18](https://venturebeat.com/technology/anthropic-launches-enterprise-agent-skills-and-opens-the-standard)).

**Launch-Partner:** Atlassian, Canva, Cloudflare, Figma, Notion, Ramp, Sentry, Stripe, Zapier — 10 Partners.

**Partner-Pfad für VK:** Skills via Plugin im `anthropics/skills` Marketplace ([GitHub](https://github.com/anthropics/skills)) oder Custom-Skill via Claude API + Partner-Waitlist.

**Konkrete VK-Skill-Ideen:** `validationkit-pre-build-validation` (Indie-Wedge) + `agency-operations-audit` (Agency-Wedge). Beide passen perfekt zu Skills' "cross-platform portability"-Pitch.

**ROI-Schätzung:** Anthropic-Skills-Repo hat über 4.200 Skills (PRD §13 Konkurrenz-Map). Sichtbarkeit ohne Featured-Listing = gering. **Featured nur via CPN-Membership erreichbar** — das verstärkt Hebel #1.

---

## 3. API Pricing Tiers — was wir realistisch erreichen

| Tier | Deposit | RPM | Monthly Spend | ITPM | Key Feature |
|------|---------|-----|---------------|------|-------------|
| 1 | $5 | low | <$100 | low | Default |
| 3 | ? | 2.000 | $1.000 | 800k+ | Production-Scale |
| 4 | $400 cumul. | 4.000 | $5.000 | 2M (Sonnet) / 4M (Haiku) | **1M-Token-Context-Window-Beta** |

Quelle: [AI Free API, 2026](https://www.aifreeapi.com/en/posts/claude-api-quota-tiers-limits), [Finout, 2026](https://www.finout.io/blog/anthropic-api-pricing).

**Volume-Discounts:** Batch-API 50% off ([Anthropic Docs](https://docs.anthropic.com/en/api/service-tiers)). Prompt-Caching 90% off auf cached input. Keine separaten Partner-Discounts publiziert — Volume-Tier kommt durch Usage, nicht Membership.

**Phase-1-Realismus:** Mit 5 LOI-Engagements à ~$5k Sprints + Solo-Dogfood landen wir bei Tier 2–3 organisch. Tier 4 = unrealistisch vor M9. **1M-Context-Window ist für Audit-Report-Wedge (Cross-Vendor-Inventory großer Repos) konkret wertvoll — das ist ein eigener Trigger für Phase-2-Investment, nicht Phase-1.**

---

## 4. Co-Marketing-Empirie (Cursor / Linear / Vercel)

**Cursor:** $2,5B Bewertung → $30B in 12 Monaten ([Fortune, 2026-03-21](https://fortune.com/2026/03/21/cursor-ceo-michael-truell-ai-coding-claude-anthropic-venture-capital/)). Aber: Cursor zahlt Retail während Anthropic Claude Code zum Wholesale-Preis launcht ([TechCrunch, 2025-12-09](https://techcrunch.com/2025/12/09/why-cursors-ceo-believes-openai-anthropic-competition-wont-crush-his-startup/)) — Partner-Status hat sie **nicht vor Anthropic-eigener-Konkurrenz geschützt**.

**Vercel/Replit/Datadog/Netflix/Cursor/GitHub:** Auf der Code-with-Claude-Bühne 2025 als Platform-Defender-Cohort ([IntuitionLabs](https://intuitionlabs.ai/articles/ai-agents-b2b-productivity-anthropic-2)). Konkrete Traffic-Numbers: nicht publiziert.

**Lesson für VK:** Anthropic-Co-Marketing ist real, aber asymmetrisch. Anthropic schlägt Partner mit eigenen Produkten, sobald die Kategorie heiß wird. **Cross-Vendor-Differenzierung (Cursor + Codex + Gemini parallel) ist unsere einzige defensive Versicherung** — und passt perfekt zur Anti-Lock-in-Story bei Capability-Review.

---

## 5. Defensibility-Check des $5k AAIF-Line-Items

| Kriterium | Result |
|-----------|--------|
| Cost-Accuracy | **FAIL** — $10k, nicht $5k |
| Name-Accuracy | **FAIL** — Agentic AI Foundation, nicht Anthropic-Forum |
| Solo-Sichtbarkeit | **WEAK** — 170+ Members, 23 Silver, kein Founder-Voice-Channel |
| Anthropic-Co-Marketing | **NONE** — LF-neutrales Konsortium, kein Direct-Anthropic-Push |
| OSS-Standards-Hebel | **MID** — MCP + AGENTS.md sind dort governanced; relevant für unseren Parser, aber wir können öffentlich beitragen ohne Membership |
| Opportunity-Cost | **HIGH** — $10k = 2 Mom-Test-Reise-Budgets oder 6 Monate Tier-3-API-Spend |

---

## Decision: NO auf AAIF $5k Phase-1 / GO auf CPN $0 ab M3

**Concrete Replacement-Plan:**
1. **PRD §11 korrigieren:** AAIF-Line-Item streichen. Naming-Fix ("Agentic AI Foundation, Linux-Foundation-Hosted, $10k Silver mit LF-Prerequisite") in ADR-Footnote.
2. **M3 (Phase-0-Gate erreicht):** Claude Partner Network Application — Technology-Track. Vorbedingung: 1× CCA-Zertifikat (Solo = Kolja selbst, ca. 2 Wochen Lernaufwand, Anthropic Skilljar kostenlos).
3. **M6:** Skills-Marketplace-Submission `validationkit-pre-build-validation` + `agency-operations-audit` via Partner-Waitlist.
4. **M9+:** Beobachten ob AAIF-MCP-Spec-Working-Group ein Working-Group-Seat als Contributor (nicht Member) ohne $-Cost öffnet — dann nur Spec-Beteiligung, keine Membership.
5. **Optional M12+:** Wenn $30k-MRR-Ziel erreicht und Cross-Vendor-Wedge bestätigt, *dann* AAIF-Silver-Re-Evaluation als Standards-Defense-Move — nicht als Marketing-Move.

**Was wir damit gewinnen:** $10k cash conserviert (= 60–80% eines Mom-Test-Reise-Budgets DACH), klarer 60-Day-CPN-Onboarding-Pfad mit Anthropic-Engineer-Pairing, Skills-Marketplace-Listing-Optionalität ohne Sunk-Cost.

**Risiko-Restposten:** CPN-Capability-Review kann Solo-Founder mit nur 2 Engagements ablehnen → Deferral-Feedback erhalten, M6 nachreichen. Das ist ein 2-Monats-Slip, kein $10k-Sunk-Cost.

---

**Skeptic-Mentor-Closer:** Du hast den Markt richtig gelesen — Anthropic-Ecosystem-Plays sind 2026 H2 das richtige Spielfeld. Aber der Hebel den du im PRD geplant hast, existiert so nicht, und der existierende Hebel ist kostenlos. Spar dir die $10k, kauf dir das CCA-Zertifikat (gratis), und investier die freigewordene Zeit in den zweiten Mom-Test-Sprint. Anthropic interessiert sich für Live-Deployments, nicht für Linux-Foundation-Logos.

---

*Sources inline. Letzter Cross-Check der Membership-Tiers: [AAIF Members, 2026-04](https://aaif.io/members/); [Linux Foundation, 2025-12-09](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation); [Anthropic Claude Partner Network, 2026-03-12](https://www.anthropic.com/news/claude-partner-network).*
