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

### Phase H — Hero-Restructure (~1.5 dd)

1. **Text-Hero über die Galaxie** (`HeroSection.tsx:227,255-411`): sichtbare H1 (Outcome-led, ≤8 Wörter — Platzhalter `Audit every customer repo before drift ships`), Subhead, **Primary-Button** (Produkt-Verb, `Repo auditieren`/`Kostenlos starten`) + **Secondary** (ghost `Live-Demo ansehen` → `#demo`-Anchor), Friction-Microline (`Keine Kreditkarte`).
2. **Galaxie demoten** — raus aus dem Above-the-Fold, in eigene Sektion (Phase I). `skip-the-galaxie`/`aria-label: Demo Repository-Galaxie`-Framing entfernen.
3. **Hero-Entrance:** motion variants, `staggerChildren:0.08`, ease `[0.22,1,0.36,1]`, ~0.5s, mount-`animate` (nicht whileInView). reduced-motion-Gate.

**Acceptance:** First-Paint zeigt Headline + CTA, nicht die Galaxie.

### Phase I — Live-Demo-Section + Renderer-Konsolidierung (~3 dd, riskanteste Phase)

1. **Renderer-Konsolidierung:** Landing-Demo rendert den Pixi-Solar-Renderer (`components/galaxie/`) mit Demo-Daten statt d3-Circle-Pack (`lib/repo-galaxie/`). Geteilte Render-Primitives; `lib/repo-galaxie/` deprecaten/entfernen sobald ersetzt.
2. **App-Chrome-Frame:** Demo in Card (border, hairline, rounded 10–16px, Surface-Ladder canvas `#07080a`/surface `#0d0d0d`/border `#242728`), ~60–72vh, Eyebrow + Headline + 1–2-Satz-Explainer.
3. **Sticky-Scrollytelling (Variante A):** Outer-Container 300–400vh, Graphic `position:sticky;top:0`, Step-Sections scrollen vorbei (Portfolio-Overview → Zoom in ein Repo → Folder-Merge-Reveal → Inspector). `useScroll`+`useSpring`(stiffness:100,damping:30)+`useTransform`; Pixi-Camera aus spring-smoothed Progress in **rAF** treiben (nie Scroll-Event).
4. **Gates:** `useReducedMotion`/`gsap.matchMedia` → reduced-motion zeigt statische Frames/SVG; Mobile-Pin-Disable. Performance: nur transform+opacity, kein filter auf Pin-Ancestors; `ScrollTrigger.refresh()` nach Pixi-Mount; `dynamic(ssr:false)` + in-view-Mount für LCP.

**Acceptance:** Scrollen zoomt sauber Portfolio→Repo ohne Jank; reduced-motion + Mobile fallback statisch; Lighthouse okay.

### Phase J — Narrative-Sections (~2 dd)

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
