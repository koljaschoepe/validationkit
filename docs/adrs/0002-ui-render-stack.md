# ADR-0002 — UI-Render-Stack: PixiJS v8 + GSAP + Motion

> Datum: 2026-05-19
> Status: ✅ Accepted
> Entscheider: User-Decision (siehe `docs/plans/master-vision-galaxie.md` §11 Q1)

---

## Kontext

Die UI-Vision (siehe `docs/vision.md`) ist eine "Galaxie"-Navigation mit 4 Zoom-Levels, Pan/Zoom über Workspace → Customer-Planeten → Repo-Monde → File-Asteroiden. Bei einem typischen Agency-Lena-Workspace skalieren wir auf **~30 Customer × ~10 Repos × ~50 Files = ~15.000 Asteroiden** + Severity-Hotspots, Glow-Effekte, Pulsing-Animationen, smooth Camera-Tweens.

Solo-Developer, Next.js 16, deployt auf Vercel Fluid Compute. Sprint-G1 muss in 4-6 Wochen lieferbar sein.

## Anforderungen

1. **Performance**: 10–15k animierte Objekte @60fps Desktop, ≥30fps Mobile.
2. **Hybrid Canvas-2D + selektiv WebGL**: 2D-Grundgerüst + WebGL für Wow-Momente (Glow, Postprocessing).
3. **Animation**: smooth Camera-Pans, Zoom-Tweens (Cmd+0/1/2/3/4), Pulsing-Severity-Hotspots.
4. **SSR-Kompatibilität** mit Next.js 16 App Router + Cache Components.
5. **Solo-Buildability**: Sprint-G1 in 4-6 Wochen lieferbar.
6. **Mobile**: Touch-Gestures, akzeptable Performance.

## Optionen (Sub-Agent-Recherche, Mai 2026)

### A: PixiJS v8 + GSAP + Motion-LazyMotion (Empfehlung, gewählt)
- **Canvas-Lib**: PixiJS v8 mit `@pixi/react`. Bundle ~80–120 KB. WebGL/WebGPU-Renderer mit Canvas-2D-Fallback in einer Lib.
- **Animation in Canvas**: GSAP 3 Core (~25 KB). Animiert Pixi-Display-Objects direkt, kein React-Re-Render pro Frame.
- **Animation UI-Chrome**: Motion (ex-Framer-Motion) LazyMotion + `m` (~4.6 KB). Nur außerhalb Canvas.

**Pro:**
- Single-Lib für 2D + WebGL — keine Lib-Combo-Komplexität.
- PixiJS v8 macht 10k+ Sprites trivial @60fps (verifiziert in [Shirajuki/js-game-rendering-benchmark](https://github.com/Shirajuki/js-game-rendering-benchmark)).
- GSAP ist battle-tested für Canvas-Animationen, animiert *jeden* JS-Property.
- Determinist. Layout (server-berechnet, gecacht) — wir brauchen keinen freien Whiteboard-Editor.
- Bundle-Size moderat (~110 KB Canvas-Stack + ~5 KB UI-Animation).

**Contra:**
- Mehr Engine-Code selber bauen (Layout-Algorithmus, Picking, Selection, Persistence-State).
- Pixi muss `'use client' + dynamic(ssr: false)` weil `window` zur Modul-Load-Zeit benötigt wird.
- Cache-Components-Bug mit R3F existiert, ABER betrifft PixiJS nur indirekt (Pixi lebt in `'use client'` Island).

### B: tldraw SDK + Konva (custom Layer) + Framer Motion
- **Canvas**: tldraw SDK als Foundation (signal-store, R-tree spatial index, viewport-culling, Camera).
- **Custom Rendering**: Konva.js für stilisierte Planet-Rendering (Glow, Particles).
- **Animation**: Framer Motion / Motion für UI-Chrome.

**Pro:**
- Spart 3–6 Monate Engine-Code (R-Tree, Culling, Camera, Layout-Caching).
- SDK-First mit Custom-Shapes API.
- "10k shapes → 50 rendered" via Viewport-Culling out-of-box.

**Contra:**
- DOM-basiert in Teilen, kann ab >2k Shapes ruckeln (siehe Obsidian-Canvas-Reports).
- Lizenz-Check tldraw nötig (kommerziell? Restrictions?).
- Bundle ~150+ KB tldraw + 55 KB Konva → mehr als A.
- Mixing zweier Libs (tldraw + Konva) für Custom-Renders ist Komplexitätssteuer.

### C: Three.js + React-Three-Fiber + drei
- **3D**: Echtes 3D mit physikalischer Kamera, Lichteffekten, Postprocessing.

**Contra (Kill-Kriterien):**
- **Cache-Components-Bug in Next 16**: [Issue pmndrs/react-three-fiber#3595](https://github.com/pmndrs/react-three-fiber/issues/3595) — Browser-Back/Forward crasht Three-Szene.
- 3D-Engine für 2D-Hierarchie = Overkill (Polygon-/Texture-Budget streng, R3F v9 nötig für React 19).
- Bundle ~150–180 KB (drei + R3F).
- Lernkurve für Solo-Dev hoch.

## Entscheidung

**Option A — PixiJS v8 + GSAP + Motion-LazyMotion.**

### Konkrete Konventionen

1. **Pixi-Root** lebt in `apps/web/src/components/galaxie/` als `'use client'` Island.
2. **Mounting** via `dynamic(() => import('./GalaxieScene'), { ssr: false })` in `app/[workspace]/page.tsx`.
3. **Layout-Algorithmus** wird server-seitig berechnet (in `lib/galaxie/layout.ts`), Output ist JSON ({customer_id, repo_id, file_id, x, y}). Stored in `galaxie_layout` Tabelle (Sprint G2 Migration 0011).
4. **GSAP** tweent ausschließlich Pixi-Display-Object-Properties (`sprite.position.x`, `container.scale`, `sprite.alpha`). NIE React-State pro Frame.
5. **Motion-LazyMotion** für alle UI-Chrome-Animations (Sidepanels, Modals, Workspace-Switcher, Inspector-Slide-In).
6. **Striktes Verbot**: Motion-Variants auf Pixi-Objects. Frame-Re-Renders im React-Tree für 10k Sprites = Performance-Tod.
7. **Picking/Selection**: Pixi-EventSystem (built-in), kein DOM-Overlay für Hit-Testing.
8. **Quadtree-Culling** erst ab ≥5k Asteroiden (lazy-aktiviert), nicht in Sprint G1.

### Plan B (Decision-Gate W3 in Sprint G1)

Falls Pixi-Komplexität in Sprint G1 explodiert (W3-Check: GalaxieScene rendert 150 Asteroiden nicht oder mit <30fps Desktop):
- Fallback auf **Option B (tldraw SDK + Konva)** als Plan B.
- Sprint-G1-Plan dokumentiert den Decision-Gate explizit.

## Konsequenzen

**Positiv:**
- Bundle <200 KB für die ganze Galaxie-Stack.
- Solo-Dev kann Engine-Code in 4-6 Wochen liefern (determ. Layout → kein Force-Sim).
- GSAP-Lizenz seit 2024 voll OSS unter MIT.
- Mobile-Performance erwartbar gut (Pixi v8 WebGL-Renderer).

**Negativ:**
- Mehr DIY-Code (Layout, Picking, Camera-Class) — Sprint G1 ist gepackt.
- Pixi-SSR-Bypass-Boilerplate in jedem Galaxie-Route.
- R3F kann später für isolierte 3D-Wow-Szenen ergänzt werden — aber jetzt vermieden.

## Re-Open-Trigger

- Sprint-G1 W3-Decision-Gate: Pixi-Performance <30fps Desktop bei 150 Asteroiden → Plan B tldraw.
- Sprint-G1 W4: Mobile-Performance <20fps → Reduced-Motion-Toggle als G1-Pflicht.
- Sprint-G6 oder später: User-Feedback "Galaxie ist zu unübersichtlich" → Layout-Algorithmus-Update oder UI-Paradigma-Re-Check.

## Verwandte Dokumente

- Master-Plan: `docs/plans/master-vision-galaxie.md` §5.1 (Stack-Entscheidung)
- Sprint-G1-Plan: `docs/plans/galaxie-sprint-1-ui-skeleton.md`
- Vision: `docs/vision.md` (UI-Vision-Sektion)

## Quellen

- [PixiJS v8 Launch](https://pixijs.com/blog/pixi-v8-launches)
- [PixiJS Performance Tips](https://pixijs.com/8.x/guides/concepts/performance-tips)
- [PixiJS React Bindings](https://react.pixijs.io/)
- [tldraw Performance](https://tldraw.dev/sdk-features/performance)
- [R3F + Next 16 Cache Components Bug](https://github.com/pmndrs/react-three-fiber/issues/3595)
- [GSAP vs Motion (motion.dev)](https://motion.dev/docs/gsap-vs-motion)
- [Motion Reduce Bundle Size](https://motion.dev/docs/react-reduce-bundle-size)
- [Canvas Engines Benchmark](https://github.com/Shirajuki/js-game-rendering-benchmark)
