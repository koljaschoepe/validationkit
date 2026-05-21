---
id: 0004
title: Landing-Hero-Render-Stack — SVG + motion
status: accepted
date: 2026-05-20
supersedes-partial: 0002
---

# ADR-0004 — Landing-Hero-Render-Stack: SVG + motion

> Datum: 2026-05-20
> Status: ✅ Accepted
> Entscheider: User-Decision (siehe `docs/plans/done/galaxie/repo-galaxie-mvp.md`)
> Supersedes-Partial: [ADR-0002](./0002-ui-render-stack.md) — nur Landing-Hero-Scope. Workspace-Galaxie nutzt PixiJS unverändert weiter.

---

## Kontext

ADR-0002 hatte PixiJS v8 + `@pixi/react` als einheitlichen Render-Stack für alle Canvas-/Galaxie-Aufgaben beschlossen. Während der Phase-Nova-Implementierung (Mai 2026) stellte sich heraus, dass der Landing-Hero — eine statische, dekorative Galaxie-Visualisierung auf der `/` Marketing-Page — durch Pixi überspezifiziert war:

- Landing-Hero hat **keine 10k+ Sprites**, sondern ~50 statische Punkte + ~3 Animations-Layer.
- Pixi initialisiert `window` at module-eval time → muss komplett über `dynamic(ssr: false)` geladen werden → First-Contentful-Paint-Hit für eine kosmetische Visualisierung.
- Bundle-Cost: Pixi + Pixi-React + Pixi-Filters + GSAP ≈ ~150 KB gz für eine Page, deren primärer Job CRO + SEO ist.
- Reduced-Motion-Pfad in Pixi war fragil (User-Setting flackerte zwischen Pixi-Init und Reduced-Static-Render).

## Entscheidung

Landing-Hero und alle dekorativen Marketing-Visualisierungen verwenden **SVG + motion** (LazyMotion + `m`-Komponenten):

- `apps/web/src/components/landing/RepoGalaxie.tsx` — primäres Landing-Hero.
- `apps/web/src/components/galaxie/StaticGalaxieSVG.tsx` — Reduced-Motion-Fallback (auch innerhalb von `/[workspace]` einsetzbar).
- Lucide-Icons für Severity-Marker (statt Pixi-Filter-Glow).

Die **Workspace-Galaxie** (`/[workspace]/...`) — interaktive Navigation mit Pan/Zoom über echte Customer/Repo/File-Daten — bleibt unverändert auf PixiJS v8 + GSAP.

## Optionen, die wir verworfen haben

- **PixiJS auch für Landing behalten:** verworfen wegen Bundle-Cost vs. statischer Nutzwert.
- **R3F/three.js für alle Galaxie-Aufgaben:** mehrfach evaluiert (siehe gelöschte `nova-1-r3f-engine.md` etc.), in 3 Anläufen verworfen — Solo-Build-Komplexität, Mobile-Performance, kein zwingender 3D-Use-Case.
- **Canvas-2D vanilla für Landing:** zu nah am Pixi-Code-Style, wenig Aesthetic-Win, SVG ist deklarativ + a11y-freundlicher.

## Consequences

**Positiv:**
- Landing FCP-Win (kein Pixi-Init im Critical-Path).
- a11y: SVG ist Screen-Reader-zugänglich, Reduced-Motion via CSS-Media-Query trivial.
- Wartbarkeit: Designer können SVG direkt in Figma exportieren.
- Eine Render-Strategie pro Scope (Marketing = SVG, Product = Pixi).

**Negativ:**
- Codebase hat jetzt zwei Render-Stacks parallel. Mental-Load: "wo bin ich gerade?" — adressiert durch klare Pfad-Trennung (`components/landing/*` vs. `components/galaxie/pixi/*`).
- Wenn Landing später interaktiv wird (Drag-Pan auf Hero) → Migration-Punkt.

## Re-Open-Trigger

- Nova-3-Plan, der die Workspace-Galaxie auf SVG migrieren würde → ADR-0002 wird vollständig superseded.
- Performance-Regression auf Landing (FCP > 1.5s) durch SVG-Komplexität → SVG-Optimierung oder zurück zu Pixi.
