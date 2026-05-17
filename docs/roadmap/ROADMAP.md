# ROADMAP — ValidationKit / Sondr

> **Stand:** 2026-05-16 | **Current Phase:** Phase 0 (M0–M3, W1–W13) | **Mode:** Hardcore-Local-Only
> **Operational-File.** Diese Datei wird live während Phase 0 gepflegt. Updates via Edit, kein Re-Write.
> **PRD-Anchor:** `docs/PRD.md` §7 + §6.5

---

## Current Status (live)

**Today:** 2026-05-16 (= Start of Week 1)

| Phase-0-Gate-Criterion | Target | Current | Status |
|---|---|---|---|
| 1. Indie-Mom-Tests | 20 | 0 | ⏳ W1 starting |
| 2. Agency-Discovery-Interviews | 10 | 0 | ⏳ W6 starting |
| 3. Agency-LOIs signed | 5 | 0 | ⏳ W9+ |
| 4. OSS v0.1 lokal lauffähig | 1 | 0 | ⏳ W8 target |
| 5. Parser MUST-5 done | 5 | 0 | ⏳ W3–W5 |
| 6. GitHub-App-Mitigations | 4 | 0 | ⏳ W5–W11 |
| 7. 30-File-Golden-Set | 30 annotated | 0 | ⏳ W1–W2 |
| 8. Validation-Handbook v0 | 8 Kapitel | 0 | ⏳ W8–W13 |
| 9. Operations-Playbook v0 | 2 Kapitel | 0 | ⏳ W11–W13 |
| 10. Build-in-Public-Posts | 55–65 | 0 | ⏳ W1 daily |
| 11. Phase-0-Retro + Phase-1-Doc | 2 docs | 0 | ⏳ W13 |

**Engagement-Pipeline (parallel):**
- Engagement #1 Lead-Identification: W6
- Engagement #1 Sales: W8–W9
- Engagement #1 Execute: W10–W11
- Engagement #2 Sales: W11–W12
- Engagement #2 Execute: W12–W13

---

## Phase-Overview

### Phase 0 — Foundation (M0–M3, W1–W13)

**Anchor:** PRD §6.5 + `docs/roadmap/phase-0.md`

**Eines harte Ziel:** Phase-0-Gate erreichen (5 Agency-LOIs + 20 Mom-Tests + OSS v0.1 lokal lauffähig).

**5 Cluster:**
| Cluster | Wochen | Theme |
|---|---|---|
| C1 — Foundation & First Contact | W1–W2 | Ground-Set-up, Golden-Set, erste 2 Mom-Tests |
| C2 — Parser & Mom-Test-Velocity | W3–W5 | 12-Format-Parser-MUST-5, Mom-Test-Cadence, Dogfood-Lite |
| C3 — Agency-Discovery + OSS v0.1 | W6–W8 | 10 Agency-Interviews, GitHub-App-Mitigations, OSS v0.1-Tag |
| C4 — Engagement-Sales + LOI-Push | W9–W11 | 2 Engagements, 5 LOI-Push, Handbook v0 |
| C5 — Gate-Close + Phase-1-Setup | W12–W13 | LOI-Reach, Retro, Phase-1-Plan |

### Phase 1 — Cash + Loop (M3–M9)

**Wird in W13 als Phase-0-Deliverable konkret geplant** (`docs/roadmap/phase-1.md`). High-Level:

- **Dual-Sprint-Mix:** 4–6 Validation-Sprints + 4–6 Operations-Sprints à $4.500 = $45k–$108k.
- **Studio-Tier-Build:** Indie ($19/$79) + Agency ($299/$799), kein $99-Sandwich.
- **AAIF-Silver-Membership** ($5k/yr).
- **OSS v0.2 → v1.0** emergiert aus Engagement-Patterns.
- **Naming-Decision M8** (Anwalts-Check + Wahl).

### Phase 2 — PLG-Scale (M9–M18)

- **Vollständige Hosted-Web-App** mit `/validate` + `/operations`-Surfaces.
- **Ziel:** $30k MRR by M18 ($360k ARR-run-rate).
- **Splits:** $15k MRR PLG + $15k MRR Service-Engagements.

### Phase 3 — Optional MM-Expand (M18–M24+)

- **Trigger-bedingt** (PRD §11 + ADR-0017 + ADR-0018).
- Wenn Trigger erfüllt: MM-Expand auf bewährter Agency-Operations-Wedge, NICHT Konzern-IT-Wedge.

---

## Operational Cadence (alle Phasen)

### Daily
- Build-in-Public-Post (30 min, Mo–Fr)
- Customer-Contact-Touch (≥1 Mom-Test- oder Discovery-DM, ≥1 Engagement-Status-Update)
- `STATUS.md`-Update (30 Sek, abends)

### Weekly
- Sprint-Planning (Mo morgens, 30 min) — Template `templates/sprint-planning-template.md`
- Friday-Retro (Fr nachmittags, 30 min) — Concession-then-Critique
- ROADMAP.md-Update (Fr abends, 5 min)

### Bi-Weekly
- Mid-Phase-Retro (`retros/`-Ordner)

### Quarterly
- `/compete-check` Konkurrenz-Map-Refresh
- Risk-Register-Re-Calibrate

---

## How to add a new Feature

1. **Idea:** Capture in `TODO.md` (root) oder direkt Branch wenn klar + <1h Work.
2. **Decision-Tree** (siehe `templates/feature-workflow.md`):
   - <1h, kein strategisches Touch? → **Just-Code** (Conventional Commit reicht).
   - Strategisch / Breaking / Pricing-Tier / new Paid-Vendor? → **ADR zuerst** (`templates/ADR-template.md`).
   - Unklar, Optionen offen? → **RFC zuerst** (`templates/RFC-template.md`).
   - ≥2 Tage ODER ≥3 AC ODER ≥2 Packages? → **Feature-Spec** (`templates/feature-spec-template.md`).
3. **Build:** Branch `feat/NNN-<slug>`, PR draft.
4. **Verify:** `templates/test-plan-template.md` ausfüllen + Dogfood-Step.
5. **Ship:** Release-Note in `releases/vX.Y.Z.md` + Build-in-Public-Post.
6. **Archive:** Spec verschiebt `features/active/` → `features/shipped/`. ROADMAP-Status-Update.

---

## Hard Don'ts (Anti-Patterns)

Aus den 14 PRD-Constraints + den 7 Phase-0-Anti-Patterns:

1. Kein npm-Publish in Phase 0 (lokal-tagged genug)
2. Kein Domain-Buy bis nach Phase-0-Gate
3. Kein SaaS-Signup bis nach Phase-0-Gate
4. Kein Anwalts-Check Sondr+Pondera vor M8
5. Keine LinkedIn-Mass-DMs jemals
6. Keine "AI Review"-Marketing (heißt "Audit Report", deterministic-first)
7. Keine 2 Engagements parallel (Spike-Wochen würden 50+ h kosten)
8. Kein Handbook + Playbook upfront (iterativ aus Quotes)
9. Kein Naming-Decision-Final vor M8
10. Kein Sales-Hire vor M18, kein VC-Pre-Seed vor M18
11. Kein PAT-Fallback statt GitHub-App (GDPR-Joint-Controller-Falle)
12. Kein $99-Pricing-Tier (Sandwich-Trap)
13. Kein Multi-Model-Compare-Marketing ohne Eval-Beleg
14. Kein Pure-MM-Pivot-Re-Open ohne ADR-0017-Trigger
15. Kein Voller-Replacement-Pivot ohne ADR-0018-Trigger

---

## Phase-0-Day-1-Quick-Start (90 min)

(Aus `docs/roadmap/phase-0.md` §9 für sofortigen Start.)

**Minute 0–15 — Local Repo Bootstrap**
```bash
cd ~/Documents/rohan
mkdir -p packages/{agents,runners,cli,integrations} apps/web eval interviews engagements retros quotes
touch STATUS.md recruitment.md agency-recruitment.md quotes.md voice-diff.md TODO.md
```

**Minute 15–30 — GitHub-Org Reservierung**
GitHub.com → `validationkit-ai` Org create (kostenlos). 1-Satz-README.

**Minute 30–60 — Mom-Test-Recruitment-Start**
`recruitment.md` Tabelle anlegen. 10 DACH-Indie-Hacker eintragen. 2 Outreach-DMs schicken (Mom-Test-Template, kein Pitch).

**Minute 60–90 — Build-in-Public-Post #1**
Twitter/X Tweet-Thread "Day 1 of building ValidationKit in public. Constraint: solo, 20h/week, 13 weeks. Phase-0-Gate." Posten.

→ Danach W1-Plan in `docs/roadmap/phase-0.md` weiter abarbeiten.

---

*Letztes Update: 2026-05-16. Live-File: täglich Status-Update, wöchentlich Phase-Status-Update.*
