# Roadmap — Phase Galaxie

> Sprint-Reihenfolge für den Galaxie-Refactor.
> Master-Plan: [docs/plans/master-vision-galaxie.md](../plans/master-vision-galaxie.md).
> Vision: [docs/vision.md](../vision.md).

---

## Übersicht

```
Pre-Work    (1-2 Tage) → Doc-Konsolidierung + ADRs + Sprint-G1-Plan
Sprint G1   (W1-4)      → Galaxie-UI-Skeleton (PixiJS + GSAP)
Sprint G2   (W5-6)      → Customer-Migration + DAL + Echt-Daten
Sprint G3   (W7-9)      → Inspector + Drill-In + Cmd+K
Sprint G4   (W10-12)    → AI-Solutions (Claude Opus Single-Pass)
Sprint G5   (W13-16)    → Zero-Code-Apply via PR
Sprint G6   (W17-20)    → Settings + Billing-Refactor + Beta-Launch
```

Geschätztes Ziel: **Beta-Launch nach ~20 Wochen** ab Pre-Work-Start.

---

## Pre-Work — Foundation (1-2 Tage)

**Slug:** `galaxie-pre-work`
**Ziel:** Doc-Inkonsistenzen aufgelöst, 3-Layer-Doc-Struktur etabliert, ADRs geschrieben, Sprint-G1-Plan detailliert.
**Gate:** alle Pre-Work-Checkboxen grün, `pnpm typecheck` grün.
**Plan-File:** `docs/plans/galaxie-pre-work.md` → `done/` nach Abschluss.
**Risiko:** Niedrig (Doc-Only).

---

## Sprint G1 — UI-Skeleton (W1-4)

**Slug:** `galaxie-sprint-1-ui-skeleton`
**Ziel:** Galaxie-View rendert visuell mit Mock-Daten. Pan/Zoom/Hover funktioniert, Severity-Hotspots sichtbar.
**Gate-Kriterien:**
- 3 fake-Customers × 5 fake-Repos × 10 fake-Files = 150 Asteroiden rendern @60fps Desktop, ≥30fps Mobile
- Pan, Zoom, Hover, Severity-Color-Coding funktional
- MiniMap + Cmd+K-Skelett + Workspace-Switcher
- `/` (Public-Demo-Galaxie mit Fake-Daten) + `/[workspace]` (Authentifizierte Galaxie mit Mock-DAL)

**Plan-File:** `docs/plans/galaxie-sprint-1-ui-skeleton.md`
**Risiko:** Mid (Pixi-Komplexität, SSR-Bypass, Mobile-Performance)
**Decision-Gate W3:** falls Pixi-Komplexität explodiert → Fallback auf tldraw SDK (siehe ADR-0002)

---

## Sprint G2 — Data-Binding + Customer-Migration (W5-6)

**Slug:** `galaxie-sprint-2-data-binding`
**Ziel:** Echte Daten aus DB in der Galaxie. Customer-Tabelle migriert + Backfill.
**Schritte:**
- Migration 0008: `customer` Tabelle (id, workspace_id, slug, label, default_apply_mode, github_org)
- Backfill via existing `repo.customer_label` Daten
- Migration 0009: `repo.apply_mode` enum ('pr','direct') DEFAULT 'pr'
- Migration 0010: composite Index `(scan_id, severity)` auf `finding`
- Migration 0011: Tabelle `galaxie_layout` (workspace_id, customer_id, repo_id, file_id, coord_x, coord_y, computed_at, version)
- DAL-Layer `lib/dal/galaxie.ts` mit cacheTag-Konvention
- `app/[workspace]/layout.tsx` mit Better-Auth Organization-Active-Set
- Slug-Hijacking-Schutz im Layout

**Gate-Kriterien:**
- Galaxie zeigt echte Customer/Repos/Files für einen Test-Workspace
- DAL hat Membership-Check, sonst `forbidden()`
- Cache-Invalidation funktioniert (Customer hinzufügen → Galaxie aktualisiert sich)

**Risiko:** Mid (DB-Migration, Customer-Backfill)

---

## Sprint G3 — Inspector + Drill-In (W7-9)

**Slug:** `galaxie-sprint-3-inspector`
**Ziel:** Click auf Customer → Zoom L2. Click auf Repo → Zoom L3. Click auf File → Inspector öffnet.
**Schritte:**
- GSAP-Camera-Tween-Animationen (Level 1 → 2 → 3 → 4)
- Inspector-Panel mit 3 Sektionen (Finding-Detail, Why-Important, AI-Solution-Placeholder) + Tabs
- Direct-Links `/[workspace]/c/[customer]/r/[repo]/f/[file]`
- Cmd+K Universal-Search (Customer, Finding, File-Path)
- Workspace-Switcher-Component

**Gate-Kriterien:**
- 4-Level-Drill-In funktioniert in <500ms pro Transition
- Inspector zeigt echte Findings aus DB
- Cmd+K findet Customer/File in <100ms

**Risiko:** Mid (Camera-Animation-Komplexität)

---

## Sprint G4 — AI-Solutions (W10-12)

**Slug:** `galaxie-sprint-4-ai-solutions`
**Ziel:** Pro Finding eine AI-Solution mit Diff-Preview im Inspector.
**Schritte:**
- `@vk/fixes` Integration: Single-Pass Anthropic Claude Opus, Output = Diff + Rationale + Confidence
- Solution-Cache: pro Finding 1 Solution, gecached bis Finding mutiert
- Inspector "Solutions"-Tab mit Diff-Preview-Component
- Confidence-Visualization auf Asteroid (Opacity)
- Background-Job via Inngest: bei neuem Finding → Solution generieren

**Gate-Kriterien:**
- 95% der Mid+Strong Findings bekommen eine Solution
- Solution-Generation <30s pro Finding (Inngest-Background)
- Diff-Preview rendert korrekt mit Syntax-Highlighting

**Risiko:** Mid (LLM-Quality, Cost-Tracking)
**Re-Open-Trigger:** ≥30% Solutions als "False-Positive" dismissed → Multi-Pass-Upgrade in Sprint-N

---

## Sprint G5 — Zero-Code-Apply (W13-16)

**Slug:** `galaxie-sprint-5-apply`
**Ziel:** Apply-Button im Inspector erzeugt PR oder Direct-Commit im Customer-Repo.
**Schritte:**
- Repo-Setting `apply_mode` UI (in Customer-System-Level)
- Apply-as-PR via `@vk/github-app` + `@vk/pr-workflow`
- Apply-direct via GitHub-App (mit Confirmation)
- Audit-Trail-Eintrag (`install_decision`) pro Apply
- Dismiss-with-Reason (False-Positive / Acceptable-Risk / Won't-Fix)
- Snooze-Action (24h/7d/forever)
- PR-Status-Polling im Inspector

**Gate-Kriterien:**
- E2E-Test: Finding → Solution → Apply → PR im Test-Repo
- GitHub-App registriert + funktional (TODO.md Sprint 0.11 muss parallel fertig sein)
- Audit-Trail komplett

**Risiko:** Strong (GitHub-App-E2E, Security-Boundaries)

---

## Sprint G6 — Settings + Billing + Beta-Launch (W17-20)

**Slug:** `galaxie-sprint-6-polish`
**Ziel:** SaaS-Polish, Beta-Launch.
**Schritte:**
- Settings-Subtree `/[workspace]/settings` (User, Members, Customer-Defaults)
- Billing-Migration `/billing` → `/[workspace]/settings/billing`
- Onboarding als Inline-Checklist (kein separater /onboarding-Page) — Linear-Pattern
- Empty-State für leere Galaxien
- Mobile-Tuning + Touch-Gestures (`@use-gesture/react`)
- Performance-Tuning (Quadtree-Culling bei ≥5k Asteroiden)
- Final Doc-Pass + alle `done/`-Plan-Files archiviert
- Public Beta-Launch

**Gate-Kriterien:**
- Lighthouse Performance ≥85 (Desktop + Mobile)
- Onboarding-Activation in <5 Minuten
- Public-Demo + Auth-Onboarding beide funktional

**Risiko:** Mid (Billing-Migration ist Stripe-Webhook-sensitiv)

---

## Parallele Streams

Diese Workstreams laufen NEBEN den G1–G6 Sprints und müssen vor ihrem jeweiligen Gate fertig sein:

| Stream | Gate (vor welchem Sprint?) | Status |
|---|---|---|
| GitHub-App registrieren + E2E-Smoke (TODO.md Sprint 0.11) | vor G5 | offen |
| Pre-Work Doc-Konsolidierung | vor G1 | in progress |
| ADR-0001 Customer-Schema | vor G2 | in progress |
| ADR-0002 UI-Render-Stack | vor G1 | in progress |
| Customer-Onboarding-Templates (Mock-Daten) | vor G1 (Public-Demo) | offen |

---

## Re-Open-Triggers (Phase-Galaxie Anpassung)

Falls einer dieser Trigger eintritt → ADR-Re-Open + Roadmap-Update:

- **W6 Galaxie auf Mobile <30fps** → Reduced-Motion-Toggle als G6-Pflicht, ggf. Galaxie-Mobile-Limit auf Level 1-2 only
- **W12 LLM-Solution-Quality <70% accept-rate** → Multi-Pass-Upgrade in eigenem Sprint
- **W16 GitHub-App-Registration verzögert** → G5 Apply-Workflow blockt, fallback auf "Copy-to-Clipboard"-Mode
- **Konkurrent shippt vergleichbare Galaxie** → Differentiator-Audit + Strategie-Update

---

## Post-Galaxie (nach G6)

Phase-Future wird in `docs/roadmap/phase-future.md` skizziert wenn G5 erreicht. Mögliche Themen:
- Skill-Distribution-Workflow (`@vk/skills` Package)
- Multi-Workspace-Aggregation (für Mega-Agencies mit Sub-Tenancies)
- Self-Hosted-OSS-Variante
- AAIF-Membership
- Multi-Pass AI-Solutions
- Compliance-Tier (SOC-2 light)

Heute (2026-05-19): out-of-scope. Erst nach Beta-Launch entscheiden.
