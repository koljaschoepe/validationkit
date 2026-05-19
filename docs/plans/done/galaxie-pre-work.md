# Plan — Galaxie Pre-Work (Doc-Konsolidierung + ADRs + Vision-File)

> Erstellt: 2026-05-19
> Status: ✅ Done — shipped 2026-05-19
> Slug: `galaxie-pre-work`
> Umfang: 1-2 Tage Mini-Sprint. Kein Code. Nur Doku + ADRs.
> Verifizierung §5: PRD/decisions/phase-0-Refs in geänderten Files = 0 (Treffer nur in Plan-Files selbst + legitime eval/-Historie).

---

## 1. Ziel

Saubere Basis vor Sprint G1: Doc-Inkonsistenzen aufgelöst, 3-Layer-Doc-Struktur etabliert (`vision.md` + `roadmap/phase-galaxie.md` + `plans/`), ADRs für die kritischen Master-Decisions geschrieben, CLAUDE.md + MEMORY.md mit Galaxie-Vision aktualisiert.

## 2. Endzustand

**Files NEU:**
- `docs/vision.md` — Warum bauen wir das, Persona, Capabilities (≤500 Zeilen)
- `docs/roadmap/phase-galaxie.md` — Sprint G1–G6 mit Zielen + Wochen (≤200 Zeilen)
- `docs/adrs/0001-customer-schema.md` — C2-Entscheidung dokumentiert
- `docs/adrs/0002-ui-render-stack.md` — PixiJS v8-Entscheidung dokumentiert
- `docs/plans/galaxie-sprint-1-ui-skeleton.md` — Sprint-G1-Detail-Plan

**Files UPDATE:**
- `TODO.md` — Header umschreiben (Source-of-Truth-Fix), Phase-0-History komprimieren
- `CONTRIBUTING.md` — PRD/docs/roadmap/docs/decisions-Refs ersetzen oder entfernen
- `SECURITY.md` — PRD-Ref inline machen
- `README.md` — Galaxie-Vision-Satz einfügen, Workflow-Sektion auf 3-Layer-Doc-Struktur erweitern
- `.claude/CLAUDE.md` — Galaxie-Vision-Block + 3-Layer-Doc-Pointer einfügen

**Files DELETE: keine.** (User-Constraint: nichts ohne Anfrage löschen.)

**Frontend-Code-Stand:** unverändert. Pre-Work fasst KEIN Code-File an.

## 3. Schritte

### A. Doc-Konsolidierung (≤4 Stunden)

- [x] `TODO.md`: Header-Zeile "Source-of-Truth ist STATUS.md + docs/roadmap/phase-0.md" → ersetzen durch "Source-of-Truth ist `docs/vision.md` + `docs/roadmap/phase-galaxie.md` + `docs/plans/`". Phase-1+-Section pruning (kein "W13 nach phase-1.md"-Bezug mehr).
- [x] `CONTRIBUTING.md`: alle `docs/roadmap/`, `docs/decisions/`, PRD-Referenzen identifizieren + ersetzen durch reale Doc-Pfade oder entfernen.
- [x] `SECURITY.md`: Zeile mit "PRD §9" → "solo-maintained pre-revenue" inline (kein Link).
- [x] `README.md`: 1 Satz Galaxie-Vision unter "## ValidationKit" einfügen. Workflow-Sektion erweitern: vision/roadmap/plans-Struktur erwähnen.

### B. Neue 3-Layer-Docs (≤4 Stunden)

- [x] `docs/vision.md` schreiben:
  - Was bauen wir (1 Absatz)
  - Persona Lena (1 Absatz)
  - Capabilities (Audit → Drift → AI-Solutions → Zero-Code-Apply)
  - UI-Vision Galaxie (Hierarchie + Zoom-Levels + Severity-Encoding)
  - Differenzierung (kurze White-Space-These)
  - Was NICHT in diesem Repo lebt (Strategy, Validate-Wedge, Pricing)
  - Source-of-Truth-Anker: "Wenn Repo widerspricht Vision → ADR schreiben"

- [x] `docs/roadmap/phase-galaxie.md` schreiben:
  - Sprint G1 UI-Skeleton (W1-4)
  - Sprint G2 Data-Binding + Customer-Migration (W5-6)
  - Sprint G3 Inspector + Drill-In (W7-9)
  - Sprint G4 AI-Solutions (W10-12)
  - Sprint G5 Apply-Workflow (W13-16)
  - Sprint G6 Settings + Polish + Beta-Launch (W17-20)
  - Pro Sprint: Ziel, Gate-Kriterium, Plan-File-Slug, Risiko

### C. ADRs (≤2 Stunden)

- [x] `docs/adrs/0001-customer-schema.md`:
  - Kontext: UI hat /customers, DB hat nicht
  - Optionen: C1 / C2 / C3 (siehe Master-Plan §7.1)
  - Decision: C2 (echte Customer-Tabelle)
  - Konsequenzen: Migration 0008, FK auf repo, Backfill via repo.customer_label
  - Re-Open-Trigger: falls Customer-Settings (apply_mode, github_org) sich als overkill erweisen → C3 retroaktiv

- [x] `docs/adrs/0002-ui-render-stack.md`:
  - Kontext: Galaxie-UI braucht 2D-Canvas + selektive WebGL-Wow
  - Optionen: PixiJS v8+GSAP / tldraw+Konva / R3F
  - Decision: PixiJS v8 + GSAP + Motion-LazyMotion (UI-Chrome only)
  - Konsequenzen: alle Canvas-Animations via GSAP direkt, KEIN Motion-on-Pixi, R3F vermieden (Cache-Components-Bug)
  - Re-Open-Trigger: falls in Sprint G1 Pixi-Komplexität explodiert → tldraw als Plan B

### D. Sprint-G1-Plan-Detail (≤4 Stunden)

- [x] `docs/plans/galaxie-sprint-1-ui-skeleton.md` schreiben mit:
  - Ziel: Galaxie-View rendert Mock-Daten, Pan/Zoom funktioniert, Severity sichtbar
  - Endzustand: Pixi-Island in `apps/web/src/components/galaxie/`, `app/[workspace]/page.tsx` neue Route
  - Files-to-Change-Tabelle
  - 8 Sub-Schritte mit Tasks (PixiJS-Setup, GalaxieScene-Skelett, Camera-Pan/Zoom, Severity-Color-Coding, MiniMap, Cmd+K-Skelett, Layout-Algorithmus, Fake-Data-Service)
  - Test-Plan (Manual: 60fps Desktop, ≥30fps Mobile. Vitest für Layout-Algorithmus.)
  - Risiken (Pixi-SSR-Bypass, Canvas-Performance, Mobile-Touch)

### E. CLAUDE.md + MEMORY.md (≤1 Stunde)

- [x] `.claude/CLAUDE.md` updaten:
  - "## Projekt-Vision" Sektion oben einfügen mit Galaxie-Vision-Pointer
  - "Wo finde ich was" erweitern: `docs/vision.md`, `docs/roadmap/`, `docs/adrs/`
  - Workflow-Sektion unverändert

- [x] MEMORY.md sicherstellen (Pointer ist schon updated 2026-05-19)

## 4. Files-to-Change

| Datei | Aktion | Begründung |
|---|---|---|
| `TODO.md` | Update Header + Phase-Sections | Source-of-Truth-Fix |
| `CONTRIBUTING.md` | Update Referenzen | PRD/roadmap/decisions-Refs killen |
| `SECURITY.md` | Update inline-Ref | PRD-Ref entfernen |
| `README.md` | Add Galaxie-Vision-Satz | High-Level-Vision sichtbar |
| `.claude/CLAUDE.md` | Add Vision-Sektion | Long-Running-Context |
| `docs/vision.md` | NEW | Layer-1 Doc |
| `docs/roadmap/phase-galaxie.md` | NEW | Layer-2 Doc |
| `docs/adrs/0001-customer-schema.md` | NEW | Decision-Trail |
| `docs/adrs/0002-ui-render-stack.md` | NEW | Decision-Trail |
| `docs/plans/galaxie-sprint-1-ui-skeleton.md` | NEW | Sprint-G1-Detail |

## 5. Test-Plan

- Manuell: alle .md-Links in den geänderten Files testen (kein `docs/roadmap/phase-0.md` etc. mehr referenziert).
- Manuell: `grep -r "PRD" .` darf nur in archivierten/legitimen Kontexten Treffer haben.
- Manuell: `grep -r "docs/decisions" .` muss 0 Treffer haben.
- `pnpm typecheck` muss grün bleiben (Doc-Only-Sprint, kein Code-Risk).

## 6. Risiken + Rollback

- **Risiko:** versehentlich noch nicht-existente Files referenziert. **Mitigation:** finale grep-Suite nach jedem File-Save.
- **Risiko:** CLAUDE.md zu lang (Context-Bloat). **Mitigation:** Galaxie-Vision-Sektion ≤30 Zeilen, der Rest verlinkt auf `docs/vision.md`.
- **Rollback:** alle Changes als atomare Git-Commits, `git revert` pro Commit reicht.

## 7. Open Questions

(leer — alle 10 Master-Decisions sind gelöst, siehe `master-vision-galaxie.md` §11)

---

**Ausführungs-Trigger:** `/execute galaxie-pre-work`
