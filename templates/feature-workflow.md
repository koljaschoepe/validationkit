# Feature-Workflow — Decision-Tree + Template-Index

> **Wann verwende ich welches Template?** Diese Datei ist die Antwort.
> Generiert aus Track C v5-Recherche (`docs/research/v5/03-feature-workflow-template.md`).

---

## Quick-Reference Decision-Tree

```
Neue Idee oder Bug
        │
        ▼
┌─────────────────────────────────────────────┐
│ Q1: <1h Work + kein strategisches Touch?    │
│     → JUST-CODE                              │
│     (Conventional Commit reicht, kein Doc)   │
└─────────────────────────────────────────────┘
        │ Nein
        ▼
┌─────────────────────────────────────────────┐
│ Q2: Berührt es load-bearing strategy        │
│     (Pricing-Tier / neuer Paid-Vendor /     │
│     Breaking-Change / Constraint-Verstoß)?  │
│     → ADR ZUERST (templates/ADR-template.md)│
│     (Spec/Build nur nach ADR-Accept)         │
└─────────────────────────────────────────────┘
        │ Nein
        ▼
┌─────────────────────────────────────────────┐
│ Q3: Optionen offen / unklar welcher Pfad?   │
│     → RFC ZUERST (templates/RFC-template.md)│
│     (Decision innerhalb 1 Woche)             │
└─────────────────────────────────────────────┘
        │ Nein
        ▼
┌─────────────────────────────────────────────┐
│ Q4: ≥2 Tage Work ODER ≥3 AC ODER ≥2 Packages│
│     → FULL FEATURE-SPEC                     │
│     (templates/feature-spec-template.md +   │
│      templates/test-plan-template.md)        │
└─────────────────────────────────────────────┘
        │ Nein
        ▼
┌─────────────────────────────────────────────┐
│ PR-DESCRIPTION-AS-SPEC                       │
│ (Inline-Spec im PR-Body, keine externe       │
│  Datei. Acceptance Criteria in PR-Description)│
└─────────────────────────────────────────────┘
```

---

## Template-Index

| Template | Wann verwenden | Pflicht-Sections |
|---|---|---|
| `RFC-template.md` | Optionen offen, Decision innerhalb 1 Wo nötig | Frage, ≥2 Optionen, Concession-then-Critique, Empfehlung |
| `ADR-template.md` | Strategische Decision, Constraint-Berührung | Kontext, Decision, Re-Open-Trigger, ≥2 Counter-Arguments |
| `feature-spec-template.md` | ≥2d Work / ≥3 AC / ≥2 Packages | AC, Out-of-Scope, Edge-Cases, Severity-Banding |
| `test-plan-template.md` | Pflicht für jedes Feature, das LLM-Output produziert | Verification-Story, Dogfood-Step, Eval-Set |
| `release-notes-template.md` | Jede Release (Patch/Minor/Major) | Changelog, Brand-Voice-Why, Build-in-Public-Skeleton |
| `sprint-planning-template.md` | Wöchentlich Montag morgens (30 min) | Goal, Committed, Friday-Retro-Slot |

---

## 3 Beispiel-Walkthroughs

### Walk-1 — Mom-Test-Interviewer-Subagent (Medium, ~3 Tage)

**Decision-Tree:** <1h? Nein. Strategisch? Nein. Unklar? Nein. ≥2d / ≥3 AC? Ja → **Feature-Spec**.

**Workflow:**
1. `features/active/FEAT-007-mom-test-interviewer.md` aus `feature-spec-template.md`.
2. Branch `feat/007-mom-test-interviewer`, PR draft.
3. Build (2–3 Tage) — TODO-Liste im Spec abhaken.
4. `features/active/FEAT-007-mom-test-interviewer/test-plan.md` aus `test-plan-template.md`.
5. Dogfood-Run (Kolja interviewt befreundeten Indie-Hacker).
6. Merge → `features/active/` → `features/shipped/`.
7. Release-Note in `releases/v0.2.0.md` aus `release-notes-template.md`.

**Overhead:** ~2h Doc-Work für 3 Tage Build = 8 %. Akzeptabel.

### Walk-2 — Skeptic-Coach-Tier $49 (strategisch, ADR-Touch)

**Decision-Tree:** Strategisch? **Ja** (bricht "kein $99-Sandwich"-Constraint aus PRD §2 Constraint #11/12). → **RFC** (weil unklar) **dann evtl. ADR**.

**Workflow:**
1. `rfcs/RFC-005-skeptic-coach-tier.md` aus `RFC-template.md`.
2. Optionen A/B/C, Concession-then-Critique.
3. Decision innerhalb 1 Wo.
4. **Wenn Option-A (Tier einführen):** Neuer ADR-NNNN mit `supersedes: ["ADR-0018 (partial)"]`.
5. **Wenn Option-B/C:** RFC accepted, kein ADR, ADR-0018-Constraint bleibt intakt.
6. Erst nach ADR (falls nötig) → Feature-Spec FEAT-NNN für Stripe-Tier-Implementation.

**Overhead:** ~2h RFC + ~3h ADR (wenn nötig). Akzeptabel — strategische Decisions müssen teurer sein.

### Walk-3 — Parser-Bug-Fix YAML-Frontmatter-Leading-Newline (Trivial)

**Decision-Tree:** <1h? **Ja**. → **JUST-CODE**.

**Workflow:**
1. Branch (optional) `fix/parser-frontmatter-leading-newline`.
2. Test-Case + Fix.
3. Conventional Commit:
   ```
   fix(parser): tolerate leading newline before YAML frontmatter

   Was breaking on .claude/agents/* files exported from Notion that had
   a stray newline. Test added in packages/parser/__tests__.

   Closes #14.
   ```
4. Fix landet in der "Fixed"-Sektion der nächsten Release-Note.

**Overhead:** ~0. Genau richtig.

---

## Was NICHT zu templaten ist

- Typo-Fixes, Linter-Anpassungen, Dependency-Bumps (non-breaking): Conventional-Commit reicht.
- Tweets / Ad-hoc-Marketing-Posts: NICHT in den Repo (außer Release-Note-BiP-Skeleton).
- Bug-Reports <30min Fix: GitHub-Issue mit Labels reicht.
- Refactors innerhalb eines Packages, <1 Tag, kein API-Change: PR-Description-as-Spec reicht.
- Internal Tooling-Scripts (nur Kolja-Use): Keine Spec.
- Notes-to-Self in `TODO.md` / Tagebuch: Frei-Form.

---

## ROADMAP.md / TODO.md / STATUS.md Aufteilung

- **`docs/roadmap/ROADMAP.md`** — Phase-by-Phase Index + Current-Status (top-level, edited weekly).
- **`docs/roadmap/phase-0.md`** — Week-by-Week Plan für aktuelle Phase (live während Phase 0).
- **`STATUS.md` (Root)** — Tägliche Counter + Burnout-Flag + Engagement-Pipeline. Edited daily evening (30 sec).
- **`TODO.md` (Root)** — Free-Form Ideen-Capture. Wird in RFC / Feature-Spec konvertiert wenn Idee reift.

---

*Generiert 2026-05-16 aus Track C v5-Recherche. Bei Workflow-Anpassung: ADR schreiben + diese Datei updaten + zugehörige Templates anpassen.*
