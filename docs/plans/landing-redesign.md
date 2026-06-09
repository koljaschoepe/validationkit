# Plan — Landing Redesign (Track 2)

> Slug: `landing-redesign` · Confidence: **High** · Erstellt 2026-06-09
> Master: [`galaxie-landing-redesign.md`](./galaxie-landing-redesign.md) · Synthese: `docs/audits/2026-06-frontend-challenge/_synthesis.md`
> Startet nach Galaxie-Phase-F (genug premium Render-Substanz für eine ehrliche Demo).

## 1. Ziel

Die Landing von „Galaxie-Spielzeug als ganzer Above-the-Fold, keine Value-Prop" auf eine text-first SaaS-Landing heben, die in 3 Sekunden „was bringt mir das" beantwortet, die Live-Demo eine Scroll-Tiefe darunter gerahmt + scroll-choreografiert zeigt (echter Pixi-Solar-Renderer, öffnet auf Agency-Portfolio), und die kanonische Devtool-Section-Order ergänzt.

## 2. User-Entscheidungen (Audit-Trail)

Siehe Master §2. Track-2-relevant:
- **Scope:** Volle SaaS-Landing (Hero → Demo+Explainer → Logos/Stat → Features → Testimonials → Pricing-Teaser → Final-CTA). Copy feilt User separat — Plan liefert Struktur + Platzhalter.
- **Renderer:** auf Pixi-Solar konsolidieren; Landing-Demo nutzt den echten Renderer.
- **Demo-Fokus:** Portfolio → Zoom-Scrollytelling (~6 Kunden-Sonnen, 1–2 brennen → scrollt in ein Repo).
- **Size-Encoding:** Severity-Weight statt Bytes (Claude-Empfehlung).

## 3. Existing-Patterns

- `components/landing/HeroSection.tsx` — heutiger Hero (`reducedMotion` via MotionConfig bereits gewired, `:220`).
- `app/page.tsx` — Landing-Komposition (Impressum/Datenschutz-Footer bereits drin).
- ADR-0004 motion-Stack; GSAP für Workspace-Solar im Stack.
- `/pricing` (SaaS-Pricing V2) existiert — Ziel des Pricing-Teasers.
- Surface-Ladder/Linear-Aesthetic: `docs/design/linear-aesthetic.md`.

## 4. Alternativen, die wir NICHT wählen

- d3-Pack-Demo behalten (Demo ≠ Produkt) — verworfen. · Demo als Hero full-bleed lassen — verworfen (text-first ist Best-Practice). · Galaxie selbst beim Scrollytelling animieren — verworfen (nur Children, gepinntes Element nie).

## 5. Endzustand (Acceptance)

- [ ] Sichtbarer Text-Hero: gestylte H1 (sr-only promotet) + Outcome-Subhead + Primary-CTA (Produkt-Verb) + Secondary (ghost → Demo-Anchor) + Friction-Microline.
- [ ] Galaxie-Demo ~1 Scroll tiefer, in App-Chrome-Card gerahmt, ~60–72vh (nicht full-bleed), mit Eyebrow + Headline + Explainer.
- [ ] Demo nutzt Pixi-Solar-Renderer, öffnet auf Portfolio, scrollt in ein Repo (Sticky-Scrollytelling), reduced-motion + Mobile-Pin-Disable gegated.
- [ ] Sektionen: Logo-Strip+Stat, 4–6 nummerierte Chess-Features, 2–3 Testimonials, Pricing-Teaser (3 Cards → /pricing), Full-Width Final-CTA. ~96px Gaps.
- [ ] Lighthouse: FCP/LCP nicht schlechter als heute trotz Pixi-Demo (lazy/in-view-mount).
- [ ] typecheck + lint + `pnpm test` grün.

## 6. Schritte (Phasen H–K)

### Phase H — Hero-Restructure (~1.5 dd) — ✅ Done 2026-06-09

> **Abgeschlossen 2026-06-09 (`/execute`) — visuell verifiziert (Landing public).** Neue `components/landing/HeroText.tsx` (sichtbare H1 „Jedes Kunden-Repo auditiert, bevor Drift live geht" [Platzhalter] + Eyebrow + Subhead + Primary-CTA `/login` „Kostenlos starten" + Secondary ghost „Live-Demo ansehen" → `#demo` + Friction-Line; LazyMotion+MotionConfig reducedMotion="user", staggerChildren 0.08, ease [0.22,1,0.36,1], mount-animate). `page.tsx`: HeroText über HeroSection. HeroSection: sr-only-h1 entfernt (HeroText owns h1), `id="demo"`+`scroll-mt-16`+Eyebrow/h2/Explainer, full-svh-Fold-Claim gelöst (Galaxie ~72vh unter dem Fold). Screenshot bestätigt: First-Paint = Headline+CTA, Demo eine Scroll-Tiefe darunter. typecheck/lint sauber, 0 Console-Errors. **Copy = Platzhalter (User liefert final, §11).**

1. **Text-Hero über die Galaxie** (`HeroSection.tsx:227,255-411`): sichtbare H1 (Outcome-led, ≤8 Wörter — Platzhalter `Audit every customer repo before drift ships`), Subhead, **Primary-Button** (Produkt-Verb, `Repo auditieren`/`Kostenlos starten`) + **Secondary** (ghost `Live-Demo ansehen` → `#demo`-Anchor), Friction-Microline (`Keine Kreditkarte`).
2. **Galaxie demoten** — raus aus dem Above-the-Fold, in eigene Sektion (Phase I). `skip-the-galaxie`/`aria-label: Demo Repository-Galaxie`-Framing entfernen.
3. **Hero-Entrance:** motion variants, `staggerChildren:0.08`, ease `[0.22,1,0.36,1]`, ~0.5s, mount-`animate` (nicht whileInView). reduced-motion-Gate.

**Acceptance:** First-Paint zeigt Headline + CTA, nicht die Galaxie.

### Phase I — Live-Demo-Section + Renderer-Konsolidierung (~3 dd, riskanteste Phase)

> **Stand 2026-06-09 (`/execute`): I.1 + I.2 + I.3 + I.4 alle ✅ — I.3 visuell verifiziert (Playwright nach Browser-Kill).** Verifiziert per Screenshot durch die 360vh-Section: p=0 Overview zeigt alle ~30 Sonnen-Cluster · p≈0.37 zoomt in Repos mit Labels (core/platform/docs-portal) + Finding-Planeten · p≈0.92 Detail + **contained** Inspector · Captions wechseln sauber 01→02→03→04 · 0 Console-Errors. **2 Bugs im Zuge gefixt:** (1) **Empty-Galaxy-Race** — der rAF-Delta-Guard (`lastProgressRef`) skippte das Kamera-Apply für immer, wenn Progress bei Mount stabil war und der erste `applyCamera()` vor `worldRef`-Ready lief → World blieb am Identity-Origin, Sonnen off-screen. Fix: Kamera jeden Frame anwenden (billig), Delta-Guard nur noch für den Inspector-setState. (2) **Caption-Doppelung** am Segment-Übergang → Fades segment-aligned ohne Overlap (kurzer Blank statt Doppel-Text). typecheck/lint/59-Tests grün. I.3-Scrollytelling gebaut: `cameraProgress?: MotionValue<number>` additiv durch GalaxieRoot→GalaxieScene; ein rAF-Loop in GalaxieScene liest die spring-smoothed Progress, lerpt über `cameraStateAtProgress` (smootherstep) zwischen layout-abgeleiteten Waypoints (overview→on-fire-Cluster→Kill-Repo-Sonne→Folder/Nukleus) und enthüllt per Threshold-Crossing den Inspector eines Kill-Findings. `PortfolioShowcase` jetzt zweigeteilt: **PinnedShowcase** (desktop+motion: 360vh-Outer + `sticky top-7vh h-86vh` Card, `useScroll`(start-start→end-end)+`useSpring`(100/30) treibt `cameraProgress`, 4 progress-gefadete Step-Captions bottom-left + ScrollHint) und **StaticShowcase** (mobile/reduced: 64vh-Card + `enableAutoTour`). Workspace unberührt (kein `cameraProgress` dort). typecheck/lint/59-Tests grün, SSR-Render verifiziert. **Offen: visuelle Prüfung der Kamera-Fahrt-Smoothness + Waypoint-Framing + Caption-Timing (User), Lighthouse-FCP/LCP, finale Copy.** I.3-Increment NOCH UNCOMMITTED.
>
> *(Historie) Teil-Stand davor: I.1 + I.2 + I.4 ✅ · I.3 offen.* Neue `components/landing/PortfolioShowcase.tsx` mountet `GalaxieRoot mode="static-demo" readOnly enableAutoTour` mit der 6-Kunden-Portfolio-Fixture (Phase K) in einem App-Chrome-Frame (Toolbar mit Traffic-Lights + HUD-Rollup „6 Kunden · 30 Repos · N Kill…", Surface-Ladder `#07080a`/`#0d0d0d`/`#242728`, 64vh) zwischen Hero und Funnel in `page.tsx`. **Bug gefixt:** der Inspector war `createPortal(…, document.body)` + `fixed` → eskapierte die Card nach rechts; jetzt im static-demo `contained` (kein Portal, `absolute` → ankert an GalaxieScenes `relative overflow-hidden` Root, von der Card geclippt) — Inspector + GalaxieScene additiv, Workspace-Drawer unberührt. **I.4-Gates gratis:** GalaxieRoot routet reduced-motion→`StaticGalaxieSVG` + mobile→`SolarListView` schon eingebaut; LCP via In-View-Mount (`useInView` margin 300px). **Phase-K-Daten:** `generateMockGalaxieData` parameterisiert (optionaler `profiles`-Param, Default=3 unverändert → Workspace+Test grün) + `LANDING_DEMO_PROFILES` (6 Kunden) + neue `calm`/`on-fire` Severity-Mixes (asymm-severity-Ehrlichkeit: ~9 Kill statt 21). typecheck/lint/59-galaxie-Tests grün, 0 Console-Errors, **erstmals Pixi-Galaxie public visuell verifizierbar.** **I.3 (echtes Sticky-Scrollytelling, 300vh-Pin + scroll-getriebene rAF-Camera via forwardRef-Handle) bewusst NICHT gebaut** — `enableAutoTour` liefert zeit-getriebene Kamera-Choreografie als Substitut; ob das reicht oder der riskante Scroll-Pin nötig ist = User-Entscheidung nach Visual-Review. Offene Tune-Forks: Kill-Dichte, Overview-Breathing-Moment vor Tour.

> **Scope-Entscheidung 2026-06-09 (`/execute` Block-Resolver): KOEXISTENZ statt Voll-Ersatz.** Recon zeigte: die heutige d3-„Demo" (`HeroSection.tsx`) ist ein voll funktionierender **anonymer Live-Audit-Funnel** (URL rein → `auditAction` → Inline-Audit-Morph), kein bloßer Demo. Statt ihn zu killen, kommt die Pixi-Solar-Scrollytelling-Showcase als **neue eigene Section** zwischen Hero und Funnel; der d3-Funnel bleibt unangetastet, `lib/repo-galaxie/` wird NICHT entfernt. §I.1 „deprecaten" → „ergänzen". GalaxieScene hat bereits `mode:'static-demo'`/`enableAutoTour`/`initialZoomLevel`/`readOnly` für einen Demo-Mount. Scroll-Kamera-Steuerung wird additiv via Imperative-Handle (forwardRef) an GalaxieScene ergänzt (opt-in, Workspace unberührt).

1. **Renderer-Konsolidierung (→ Koexistenz):** Neue Pixi-Solar-Showcase-Section (`components/landing/PortfolioShowcase.tsx`) mountet `GalaxieScene` (`mode:'static-demo'`, `readOnly`) mit Portfolio-Demo-Daten (Phase K). Der d3-Live-Audit-Funnel (`HeroSection`/`lib/repo-galaxie/`) bleibt darunter erhalten. Kein Entfernen von d3.
2. **App-Chrome-Frame:** Demo in Card (border, hairline, rounded 10–16px, Surface-Ladder canvas `#07080a`/surface `#0d0d0d`/border `#242728`), ~60–72vh, Eyebrow + Headline + 1–2-Satz-Explainer.
3. **Sticky-Scrollytelling (Variante A):** Outer-Container 300–400vh, Graphic `position:sticky;top:0`, Step-Sections scrollen vorbei (Portfolio-Overview → Zoom in ein Repo → Folder-Merge-Reveal → Inspector). `useScroll`+`useSpring`(stiffness:100,damping:30)+`useTransform`; Pixi-Camera aus spring-smoothed Progress in **rAF** treiben (nie Scroll-Event).
4. **Gates:** `useReducedMotion`/`gsap.matchMedia` → reduced-motion zeigt statische Frames/SVG; Mobile-Pin-Disable. Performance: nur transform+opacity, kein filter auf Pin-Ancestors; `ScrollTrigger.refresh()` nach Pixi-Mount; `dynamic(ssr:false)` + in-view-Mount für LCP.

**Acceptance:** Scrollen zoomt sauber Portfolio→Repo ohne Jank; reduced-motion + Mobile fallback statisch; Lighthouse okay.

### Phase J — Narrative-Sections (~2 dd) — ✅ Done 2026-06-09

> **Abgeschlossen 2026-06-09 (`/execute`) — visuell verifiziert (Screenshots).** Eine `components/landing/LandingNarrative.tsx` (client, eine LazyMotion+MotionConfig reducedMotion="user", shared `Reveal` whileInView-once margin -80px) mit allen 5 Sektionen, in `page.tsx` nach HeroSection: **LogoStrip** (6 Platzhalter-Logos + harte Usage-Stat), **4 nummerierte Chess-Feature-Blocks** (1.0 Intake/2.0 Audit/3.0 Galaxie/4.0 Fix, alternierend, Screenshot-Slot-Placeholder), **3 Testimonials** (Quote+Avatar-Initialen+Name+Rolle), **Pricing-Teaser** (Free/Pro/Team-Cards, Pro featured, je CTA → /pricing + „Alle Pläne"-Link), **Full-Width Final-CTA** (Headline + /login-Button). ~96px Gaps (gap-24), keine Deko-Divider. typecheck/lint sauber, 0 Console-Errors, Feature-Blocks + Pricing per Screenshot bestätigt. **Copy/Logos/Testimonials = Platzhalter (User liefert final, §11).**

1. **Logo-Strip + harte Usage-Stat** direkt unter Demo.
2. **4–6 Chess/Alternating-Feature-Blocks** (nummeriert wie Linear: 1.0 Intake, 2.0 Plan, …), problem-orientierte Headlines, je EIN Screenshot, benefit-led. Platzhalter-Copy + Screenshot-Slots.
3. **2–3 Testimonials** (Avatar+Name+Logo), kontextuell neben validierter Feature.
4. **Pricing-Teaser:** 3 Cards (Free/Pro/Team, je 1 CTA) → `/pricing`.
5. **Full-Width Final-CTA-Block** (1 Zeile + 1 Button). ~96px Section-Gaps, keine Deko-Divider. Sektion-Entrances `whileInView`+`once`.

**Acceptance:** Vollständige Section-Order, konsistente Gaps, Platzhalter klar als solche markiert.

### Phase K — Portfolio-Demo-Data (~1.5 dd)

1. **Demo-Daten als Agency-Workspace:** ~6 Customers, 1–2 „on fire" (Kill), realistische Folder/File/Submodule-Struktur (inkl. `.claude/`-Submodule + folder-level Context-Files für den Merge-Showcase).
2. **Size = Severity-Weight** statt Bytes.
3. **HUD-Rollup** (`N Kunden · M Repos · 2 Kill · 4 Mid`).
4. **Default-Focus auf Worst-Finding** (Kill, nicht Weak).
5. **Asymm-Severity** auf Landing portieren (nur Kill schreit). Conflict-Tether-Edges optional.

**Acceptance:** Demo zeigt sofort Multi-Tenant-Wert + Merge + Submodule.

## 7. Files-to-Change

- `apps/web/src/components/landing/HeroSection.tsx` (+ Split in `HeroText` / `DemoSection`).
- Neue Section-Komponenten unter `components/landing/` (LogoStrip, FeatureBlock, Testimonials, PricingTeaser, FinalCTA, ScrollyDemo).
- `apps/web/src/app/page.tsx` — Komposition.
- `components/galaxie/` — Demo-Daten-Adapter (von Track 1 wiederverwendet).
- `lib/repo-galaxie/` — deprecaten/entfernen nach Konsolidierung.
- Demo-Daten-Fixture (Agency-Portfolio).

## 8. DB-Migrationen

Keine (Landing nutzt Demo-Daten-Fixture).

## 9. Verifikations-Plan

Playwright pro Phase (frische Session): Hero above-the-fold, Scroll-Reveal, reduced-motion-Fallback, Mobile. Lighthouse FCP/LCP-Check vor finalem Merge. `pnpm test` + typecheck + lint vor jedem Commit. Dev-Server proaktiv.

## 10. Risiken

- **Renderer-Konsolidierung** ist die riskanteste Einzeländerung — Pixi `dynamic(ssr:false)` vs heutiges SSR-SVG; LCP-Regression-Gefahr → in-view-Mount, statisches Poster-Frame bis Interaktion.
- **Scroll+Pixi-Jank** → spring-smoothed rAF, nie Scroll-Event.
- **reduced-motion/Mobile** müssen sauber statisch fallen.
- Copy ist Platzhalter — User liefert finale Texte (Phase H/J).

## 11. Out-of-Scope

Finale Copy/Brand-Sprache. Echte Kunden-Logos/Testimonials (Platzhalter bis vorhanden). A/B-Test-Infra.

## 12. Rollout

Ersetzt `page.tsx`-Hero erst in H–J. Lighthouse-Gate vor Merge. Kein Deploy ohne User-Request.

## 13. Offen (Pre-Flight)

- Scrollytelling Variante A (motion) final vs GSAP-Pin (Pin-Präzision) — Phase I.
- Hero-Copy-Platzhalter vs finale Texte — Phase H (User).
- Anzahl Feature-Blocks (4 vs 6) + welche Features — Phase J.
- Poster-Frame-Strategie für Pixi-LCP — Phase I.
