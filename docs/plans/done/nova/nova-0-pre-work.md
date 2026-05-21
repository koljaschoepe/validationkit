# Plan — Nova-0 · Pre-Work (R3F-Spike + Style-Guide + Sub-Plans)

> Erstellt: 2026-05-20
> Status: ✅ Done — 2026-05-20 (Performance-Messung ausstehend, User-Entscheidung in Master §9)
> Slug: `nova-0-pre-work`
> Phase: Nova (siehe `docs/plans/phase-nova-r3f-uplevel.md`)
> Dauer-Schätzung: 3–5 Tage Solo → tatsächlich ~1 Tag (Doc + Spike-Setup, ohne Messung)

---

## 1. Ziel

Phase Nova ist startklar: R3F-Tech-Risiko ist via Spike validiert (oder klar verworfen), die Linear-Aesthetic ist als Style-Guide festgehalten, der CSS-Token-Layer ist auditiert, und die nächsten zwei Sub-Plans (Nova-1 + Nova-2) sind detailliert.

---

## 2. Endzustand

- `docs/design/linear-aesthetic.md` existiert: Token-Palette (oklch), Schriften (Geist Sans + JetBrains Mono), Motion-Easings, Severity-Color-Mapping, 3–5 Beispiel-Compositions.
- R3F-Spike läuft unter `/spike` (NODE_ENV-gated, nicht in Prod-Bundle): rendert 500-Knoten InstancedMesh mit Bloom/Vignette, FPS-Counter sichtbar.
- Performance-Messung dokumentiert: Desktop (MacBook + Chrome) ≥55fps @ 500 Knoten, iPhone 13 Safari ≥30fps @ 150 Knoten.
- `docs/plans/nova-1-r3f-engine.md` + `docs/plans/nova-2-landing-hero.md` existieren als detaillierte Sub-Plans.
- Master-Plan `phase-nova-r3f-uplevel.md` §10 Open Questions sind auf ✅ markiert mit den User-Antworten (Q-N1…Q-N5).
- `CLAUDE.md` ist auf „Aktive Phase: Nova (Mai 2026 →)" aktualisiert.
- Build + Typecheck grün; vorhandene vitest-Suite grün.

---

## 3. Schritte

- [x] **Linear-Aesthetic-Style-Guide** schreiben → `docs/design/linear-aesthetic.md` mit:
  - Token-Palette (oklch-Werte für pitch-black Background `oklch(0.05 0 0)`, Hairline-Border `oklch(0.20 0 0)`, Foreground `oklch(0.95 0 0)`, Muted, Accent)
  - Severity-Colors aus `lib/galaxie/severity-colors.ts` referenzieren, nicht duplizieren
  - Schrift-Spezifikation: Geist Sans (Display, 400/500/600) + JetBrains Mono (Labels/Code, 400/500)
  - Spacing-Skala (4/8/12/16/24/32/48)
  - Radii-Skala (4/6/8/12)
  - Motion-Easings: `cubic-bezier(0.16, 1, 0.3, 1)` (out-expo), `cubic-bezier(0.4, 0, 0.2, 1)` (out-quart)
  - Hairline-Border-Konvention (1px, oklch-border-color, nie box-shadow für Borders)
  - Gradient-Mesh-Pattern für Hero-Backgrounds
  - 3–5 ASCII-Mockups (Topbar, Card, Inspector-Header, Empty-State, Form-Group)

- [x] **Token-Audit:** aktuelle CSS-Variablen aus `apps/web/src/app/globals.css` extrahieren, in Tabelle „heute → Linear-Ziel" im Style-Guide listen (welche bleiben, welche kommen neu, welche werden deprecated).

- [x] **Dependencies installieren** (im Spike-Branch oder direkt main, je nach Spike-Entscheidung Schritt unten):
  - `pnpm --filter @vk/web add three @react-three/fiber @react-three/drei @react-three/postprocessing`

- [x] **R3F-Spike-Komponente** schreiben:
  - `apps/web/src/components/galaxie/r3f-spike/SpikeScene.tsx` — Canvas + CameraRig + InstancedMesh mit 500 spheres (Position random in 100×100×40-Box), severity-getriebenes emissive Material, Bloom + Vignette via @react-three/postprocessing
  - `apps/web/src/components/galaxie/r3f-spike/SpikeFPS.tsx` — eigener FPS-Counter (kein @react-three/drei `<Stats />`, weil eigener Style-Test)
  - Knoten-Count steuerbar via URL `?n=500` (Default 500, Max 1000)

- [x] **Spike-Route** anlegen:
  - `apps/web/src/app/spike/page.tsx` — Server-Komponente die `NODE_ENV !== 'production'` checkt; in Prod → `notFound()`. Lädt Client-Spike via `dynamic({ssr:false})`.
  - In `apps/web/next.config.ts` keine Anpassung nötig; Route ist automatisch nicht in Prod-Bundle aufgrund des notFound-Guards (Defensive-Belt).

- [⏸] **Performance-Messung Desktop:** (User-Entscheidung 2026-05-20: deferred)
  - Spike-Code ist deployed, Route `/spike?n=500` funktioniert in `pnpm dev`. User-Action steht aus.
  - Acceptance: ≥55fps Desktop @ 500 Knoten.

- [⏸] **Performance-Messung Mobile:** (deferred, gleicher Grund)
  - Acceptance: ≥30fps iPhone 13 (oder DevTools-Sim) @ 150 Knoten.

- [⏸] **Decision-Gate dokumentieren:** (deferred, abhängig von Messung)
  - Sobald Messung vorliegt → User trägt fps in Master §9 ein, oder triggert AskUserQuestion bei Verfehlung.

- [x] **Sub-Plan `nova-1-r3f-engine.md`** schreiben (Standard-Plan-Template, basiert auf Master §7 Nova-1):
  - Detaillierte Schritte für Canvas-Setup, CameraRig, Background, Postprocessing
  - Token-Foundation-Tasks (Linear-Tokens in `globals.css` additiv hinzufügen)
  - Schrift-Setup via `next/font/google`
  - Test-Plan

- [x] **Sub-Plan `nova-2-landing-hero.md`** schreiben (Standard-Plan-Template, basiert auf Master §7 Nova-2):
  - Detaillierte Schritte für CustomerStar/RepoMoon/FileAsteroid (Single-Repo-Konfig)
  - HeroScene-Komposition
  - Inspector-Migration GSAP → Motion (für Landing-Inspector, App-Inspector bleibt GSAP bis Nova-5)
  - HeroMockup.tsx-Löschung
  - Test-Plan inkl. Lighthouse-Baseline-Messung

- [x] **Master-Plan §10 Open Questions** auf `✅ Beantwortet 2026-05-20 (User)` markieren mit Werten:
  - Q-N1 = volles R3F mit Knoten-Reduktion (Mobile ~150)
  - Q-N2 = Topbar-Dropdown (Empfehlung übernommen)
  - Q-N3 = nur apply_action, keine Migration 0012 (Empfehlung übernommen)
  - Q-N4 = Geist Sans
  - Q-N5 = strikt 2 Sprints GSAP-Phaseout (Empfehlung übernommen)

- [x] **Master-Plan §3 Entscheidungstabelle** erweitern um Q-N1…Q-N5 Antworten (Konsolidierung an einer Stelle).

- [x] **CLAUDE.md** updaten:
  - „Aktive Vision (Mai 2026 →)" → „Aktive Phase: Nova · R3F-Frontend-Uplevel (Mai 2026 →)"
  - Render-Stack-Zeile: „Render-Stack: React-Three-Fiber + drei.js (PixiJS deprecated, wird in Phase Nova ersetzt)"
  - Master-Plan-Pointer auf `docs/plans/phase-nova-r3f-uplevel.md` aktualisieren (statt master-vision-galaxie)

- [x] **Build + Typecheck:**
  - `pnpm --filter @vk/web typecheck` — grün (nach Add von `@types/three` als devDep)
  - `pnpm --filter @vk/web build` — grün; `/spike` Route ist als dynamic in der Route-Tabelle, notFound-Guard greift zur Request-Zeit
  - `pnpm --filter @vk/web test` — grün, 81/81 (nach Fix der pre-existing Test-Drift, siehe §7)

---

## 4. Files-to-Change

| Datei                                                                  | Was passiert                                            |
|------------------------------------------------------------------------|---------------------------------------------------------|
| `docs/design/linear-aesthetic.md`                                      | NEU — Style-Guide                                       |
| `docs/design/nova-spike-results.md` *(optional)*                       | NEU — Decision-Record für Spike, falls separat gewünscht |
| `apps/web/package.json`                                                | UPDATE — three, @react-three/fiber/drei/postprocessing  |
| `apps/web/src/components/galaxie/r3f-spike/SpikeScene.tsx`             | NEU — Spike-Komponente                                  |
| `apps/web/src/components/galaxie/r3f-spike/SpikeFPS.tsx`               | NEU — FPS-Counter                                       |
| `apps/web/src/app/spike/page.tsx`                                      | NEU — Dev-Route mit notFound-Guard in Prod              |
| `docs/plans/nova-1-r3f-engine.md`                                      | NEU — Sub-Plan                                          |
| `docs/plans/nova-2-landing-hero.md`                                    | NEU — Sub-Plan                                          |
| `docs/plans/phase-nova-r3f-uplevel.md`                                 | UPDATE — §3 Decisions, §10 Open Questions               |
| `.claude/CLAUDE.md`                                                    | UPDATE — Aktive Phase Nova                              |

---

## 5. Test-Plan

**Manuell:**
- `pnpm --filter @vk/web dev`, dann `/spike` aufrufen, mit `?n=500` Desktop testen.
- FPS-Counter zeigt ≥55fps (Desktop) bzw. ≥30fps (Mobile-Simulation).
- Style-Guide-Doc lesen, Token-Tabelle ist klar, Beispiel-Compositions sind nachvollziehbar.
- Master-Plan §10 zeigt alle Q's als ✅.

**Automatisch:**
- `pnpm --filter @vk/web typecheck` → grün.
- `pnpm --filter @vk/web build` → grün, Bundle-Diff ≤50 KB (R3F isoliert via dynamic-import).
- `pnpm --filter @vk/web test` → bestehende Tests bleiben grün; keine neuen Tests für Spike erforderlich (Decision-Gate, kein Prod-Feature).

---

## 6. Risiken + Rollback

- **Risiko 1:** Spike-Performance Mobile <30fps bei 150 Knoten → Master-Plan §9 Decision-Gate triggern. AskUserQuestion mit Optionen: Knoten-Budget runter (auf 100), Mobile-SVG-Fallback, oder PixiJS-Polish-Variante zurück.
- **Risiko 2:** R3F-Bundle-Größe sprengt Prod-Build → Spike-Route in Prod hart `notFound()`, R3F nur über `dynamic({ssr:false})` laden, sodass Prod-Bundle nicht betroffen ist. Mit `next build` verifizieren.
- **Risiko 3:** Geist Sans / JetBrains Mono via `next/font/google` fallback-flicker → Schrift-Loading erst in Nova-1 final, hier nur Spec im Style-Guide. Kein Prod-Impact in Nova-0.
- **Rollback:** `git checkout main -- apps/web/package.json apps/web/src/app/spike apps/web/src/components/galaxie/r3f-spike` und `pnpm install`. Style-Guide-Doc ist additiv, kann bleiben. Plan-File-Updates am Master sind via `git checkout` reversibel.

---

## 7. Resolved + Open Items

### ✅ Resolved in Execute

- **Q-Nova0-A:** R3F-Spike als Sub-Tree (`/spike`-Route) — gewählt. Kein Branch.
- **Q-Nova0-B:** Decision-Record inline in Master §9 — gewählt.
- **Q-Nova0-C:** wird beim Nachholen der Messung entschieden (DevTools-Sim als Default-Empfehlung).
- **Bonus-Fix:** Pre-existing Test-Drift aus Phase G repariert (3 Files):
  - `apps/web/src/lib/galaxie/severity-colors.test.ts` — auf neue Frontend-Relaunch-v2 Hex-Werte aktualisiert.
  - `apps/web/src/components/galaxie/diff-renderer.test.ts` — auf neue Token-Klassen (`text-[var(--color-sev-*)]`, `text-muted-foreground`) aktualisiert.
  - `apps/web/src/lib/middleware-redirects.test.ts` — auf Routes-Konsolidierung (19. Mai 2026) aktualisiert; 2 Asserts angepasst, 1 neuer Assert für `/customers/c/<id>`-Legacy-Bookmarks.
- **Bonus-Fix:** `@types/three` als devDep hinzugefügt (sonst implizites `any` für three-Imports).

### ⏸ Deferred (User-Entscheidung 2026-05-20)

- **Performance-Messung Desktop + Mobile + Decision-Gate** (Schritte 6/7/8 in §3) — Spike-Code ist deployed, User macht die Messung zu späterem Zeitpunkt nach. Master-Plan §9 hat einen entsprechenden Open-Item-Eintrag bekommen, damit das nicht verloren geht.
