# SaaS Premium Overhaul — Master-Plan

> Status: 🔵 Active — Confidence: Mid — erstellt 2026-06-10 (Multi-Agent-Audit-Synthese)
> Methodik: adversarialer 41-Subagent-Workflow (17 Auditoren · Per-Bereich-Verifikation · Galaxie-Design-Panel + Judge). Roh-Ergebnis: 185 Findings → **162 verifiziert** (23 verworfen).
> Quelle: `wf_08a6c474-46c` (2.8M Tokens, ~63 min).

## 1. Executive-Summary

ValidationKit ist funktional GA-nah, aber gegen die selbstgesetzte Premium-Latte — „ein Werkzeug, das eine DACH-B2B-Consultancy für 200+ €/Monat ohne Zögern aufs Team ausrollt" — klafft eine Lücke zwischen *fertig gebaut* und *fühlt sich wertvoll an*. Die zentrale konzeptuelle Wahrheit aus dem Audit: **die tägliche Triage-Schleife der Persona Lena ist nicht premium** — die Default-Surface (Pixi-Galaxie) zwingt zum *Suchen* statt *Lesen*, und die Orbit-Geometrie trägt beweisbar keine Sortier-Information. Der teuerste Hebel ist deshalb die Inversion von **Galaxie-als-Default → Mission-Control-Konsole-als-Default** (Bundle A), gefolgt von Polish-Bundles.

## 2. ⚠️ Reconciliation (Pflicht vor jedem `/plan`)

Der Completeness-Critic hat ein **Ist-Stand-Blindheits-Problem** der Roh-Synthese aufgedeckt (Cluster-Agent war an einem Socket-Fehler gestorben → Bundle-Input leer → der Master-Writer hat die Ladder improvisiert, ohne bestehende Pläne zu kennen). **Mehrere Bundles überlappen aktive High-Confidence-Pläne:**

| Bundle | Überlappt | Konsequenz |
|--------|-----------|------------|
| **B** Severity-Konsistenz | `galaxie-legibility-rework.md` (High, pixelgenau) — Palette Kill `#f4604e` etc. **ist bereits in `severity-colors.ts` geshippt** | **Großteils erledigt** → nur Rest-Audit, kein Neubau |
| **C** State-Polish | `frontend-pre-ga-polish.md` (High) — Loading-Skelett, CLS, Error-`lang=de`, Toast | **Defer** an frontend-pre-ga-polish, dort vervollständigen |
| **D** Mobile-Dichte | `frontend-pre-ga-polish.md` — Touch-Targets ≥44px, Settings-Accordion | **Defer** an frontend-pre-ga-polish |
| **E** Onboarding | Komponenten existieren: `OnboardingBanner`, `ActivationChecklist`, `EmptyGalaxie` | Erst inventarisieren, nicht neu bauen |
| **F** Map-Tab a11y | `galaxie-legibility-rework.md` Sub-Step D (List-Toggle K-A11Y1) | **Bundle A absorbiert** den a11y-Teil (Liste = Default) |

**Regel:** Vor `/plan <bundle>` zwingend gegen `galaxie-legibility-rework.md` + `frontend-pre-ga-polish.md` rückverifizieren. Nicht duplizieren — erweitern oder dorthin verschieben.

## 3. Bundle-Ladder

| Bundle | Severity | Theme | Effort | Status |
|--------|----------|-------|--------|--------|
| **A** | Kill | Mission Control — Konsole=Default, Galaxie=Map-Tab | M–L | 🟡 **In Arbeit** (`overnight/saas-premium-overhaul`) |
| B | Strong | Severity-Sprache-Konsistenz (Rest-Audit) | S | ⏸ Defer → legibility-rework |
| C | Strong | State-Polish (Empty/Loading/Error) | M | ⏸ Defer → frontend-pre-ga-polish |
| D | Mid | Mobile-Dichte & Responsive-Triage | S–M | ⏸ Defer → frontend-pre-ga-polish |
| E | Mid | Onboarding & First-Run-to-Value | M | 🔵 Draft (erst Inventar) |
| F | Mid | Map-Tab-Job schärfen (Click-Sun→Konsole-Filter) | S | 🔵 Draft (folgt auf A) |
| G | Weak | Micro-Polish (Motion · Copy · Reste) | S | 🔵 Draft (zuletzt) |
| **H** | Strong | **Billing/Credits als Premium-Surface** (Critic #3 — Scope-Lücke!) | M | 🔵 **NEU** |

Sub-Pläne: `docs/plans/saas-premium-overhaul/`. Sequenz: **A → (B-Audit) → E → F → H → C/D via frontend-pre-ga-polish → G**.

## 4. Galaxie-Entscheidung (Design-Panel + Judge)

**Verdict: Hybrid „Mission Control mit Galaxie-als-Map-Tab" (Judge-Score 9/9). Evolution, kein Rewrite.**

Die Workspace-Galaxie verliert auf **zwei harten Achsen** ihren Default-Status:
1. **Klarheit/kognitive Last** — Triage über 5–30 Repos ist eine nach Kill-Count sortierbare Rangliste, die man LESEN können muss, statt 30 Sonnensysteme nach dem rötesten Punkt abzusuchen.
2. **Time-to-Insight / native Integration** — Group-by-Severity zeigt alle Kills sofort sortiert im nativen DOM/SSR-Pfad; die Galaxie ist mouse-only (a11y nur via sr-only-Krücke) und verlangt Hover/Zoom/Pivot pro Sonne.

Bonus-Achse (vom Critic präzisiert): Orbit-**Winkel** sind `hashString`-Anti-Kollision (bedeutungslos); **Radien** sind count-aware (tragen also etwas Information — die ursprüngliche „NULL Information"-Behauptung war überzogen).

**Drei Code-Fakten stützen Low-Risk-Evolution:** (1) `GalaxieRoot.tsx` hatte den View-Toggle bereits (Z. 110–143); (2) Landing-Hero ist **entkoppelt** (`landing/RepoGalaxie.tsx`, NICHT `GalaxieScene`) → Marketing-Wow bleibt; (3) keine Pixi/GSAP-Löschung. Verworfen: reines Board (Identitätsverlust) und Treemap (echter Neubau + Sunk-Cost auf frisch gelandetem Premium-Rendering).

**Nicht anfassen:** `solar-layout.ts` · `GalaxieScene.tsx`-Innereien · `Inspector.tsx` · `severity-colors.ts` · `types.ts` · `landing/RepoGalaxie.tsx`.

## 5. Out-of-Scope

- Keine Pixi/GSAP-Löschung, kein Treemap-Neubau, keine `solar-layout.ts`-Geometrie-Änderung.
- Kein Touch am Landing-Hero (entkoppelter Marketing-Pfad).
- Kein Backend-/Schema-/Tier-Change (Konsole speist aus `buildGalaxieTree`). Backend-Findings aus den 17 Bereichen (Auth/Billing/DB/Security) liegen außerhalb dieser Frontend-Ladder und gehören in `production-launch-readiness.md` bzw. eigene Pläne.

## 6. Anhang — Completeness-Critic (priorisierte Lücken)

1. **[KILL] Plan-Kollision** (→ §2 Reconciliation adressiert).
2. **[KILL] Bundle B evtl. schon gelöst** (Palette ist Single-Source in `severity-colors.ts`).
3. **[STRONG] Billing/Credits als Premium-Surface komplett ausgeklammert** → als **Bundle H** ergänzt.
4. **[STRONG] Bundle A unterschätzt:** SolarListView hat KEIN group-by/sort/heat-bar → echte Aggregation, Effort M–L (in Sub-Plan A korrigiert).
5. **[STRONG]** „solar-layout NULL Info" überzeichnet — Radien sind count-aware (→ §4 korrigiert).
6. **[STRONG] Saved-Views/URL-State/Deep-Links** fehlen — premium Triage braucht persistente Filter (→ Sub-Plan A Out-of-Scope / Bundle G).
7. **[MID] Virtualisierung** der Konsole bei 30+ Repos × N Findings ungeklärt (→ Sub-Plan A Risiken).
8. **[MID] F-Mehrwert wackelig** — Map-Tab darf nicht verwaisen (→ Sub-Plan F Kern).
9. **[MID] Keine Mess-Definition** für „premium" (Time-to-first-Kill, axe=0, CLS-Budget).
10. **[WEAK] E ignoriert** existierende Onboarding-Bausteine.

## 7. Hinweis

Dieser Master bleibt in `docs/plans/` bis A–H ✅. Backend-/Security-/Infra-Findings der 17-Bereiche-Synthese sind NICHT Teil dieser Frontend-Premium-Ladder und werden separat (production-launch-readiness) geführt.
