# Plan — Galaxie-Workspace-Solar Sub-Phase B: Severity-Palette + Kill-Pulse + Edge-Badges

> Erstellt: 2026-06-02
> Status: ✅ Done — 2026-06-02 (Confidence-At-Start: High, 12/12 Steps abgehakt, 0 deferred, 0 manuelle Verifikationen pending — inkl. Pflicht-Cross-Impact-Walk auf Landing-Hero)
> Slug: `galaxie-workspace-solar-B-severity`
> Confidence: **High** — basiert auf 4 User-Entscheidungen (1 Discovery-Runde, alle Recommended) + Code-Audit von `severity-colors.ts` (74 LOC) + 6 SEVERITY_HEX-Konsumenten + Landing-V2 `SeverityIcon.tsx` (Lucide-Mapping) + Master-Plan §5.3
> Voraussetzung: Baut auf Sub-A (`docs/plans/done/galaxie-workspace-solar-A-layout.md`) auf. Sub-A liefert neutral-grey Sonnensystem-Layout, Sub-B fügt Severity-Render hinzu. Sub-Plan von `docs/plans/galaxie-workspace-solar-redesign.md` (Master).

---

## 1. Ziel

Workspace-Galaxie wechselt von **neutral-grey** (Sub-A-Endzustand) zu **asymmetrisch-salienter Severity-Render**: Kill schreit (sattes Rot + Pulse + Bloom), Weak/Mid/Strong/Exceptional bleiben ruhig (gedämpft, kein Pulse, kein Glow). Edge-Badges (Lucide-Icons auf Severity-Disc) markieren Schwere kategorisch am 1-Uhr-Rand jedes Planeten (Mid bekommt keinen Badge — Anker-Status). Worst-Child-Aggregate-Badge auf Sonne wenn `repo.aggregateSeverity === 'Kill'`. Dismissed-Files rendern dunkel-grau mit Alpha 0.35. Solution-Status-Alpha bleibt erhalten. Cross-Impact: `SEVERITY_HEX` Hard-Replace betrifft Landing-Hero V2 — Re-Walk Pflicht.

## 2. User-Entscheidungen (Audit-Trail aus Discovery)

| ID  | Runde | Frage                                          | Antwort                                                                                              |
|-----|-------|------------------------------------------------|------------------------------------------------------------------------------------------------------|
| QB1 | 1.1   | `SEVERITY_HEX` Cross-Impact-Strategie          | **Hard-Replace + Landing-Hero mit-updaten** — visuelle Konsistenz Landing+Workspace, Asymm-Salienz greift überall. Re-Walk auf `/` pflichtig. |
| QB2 | 1.2   | Edge-Badge-Render-Tech                         | **PIXI.Texture aus rasterisierter Lucide-SVG, einmal cached** — `renderToStaticMarkup` → SVG-String → `HTMLImageElement` → Canvas → `PIXI.Texture.from(canvas)`. Sprite-Reuse pro Severity-Band. |
| QB3 | 1.3   | Dismissed-Alpha + Solution-Status-Alpha        | **Sub-B mit** — Dismissed = `oklch(0.40 0 0)` Dark-Grey, Alpha 0.35. `lib/solution-alpha.ts`-Logik wird reaktiviert für File-Planeten. |
| QB4 | 1.4   | Worst-Child-Aggregate-Badge auf Sun            | **Sub-B mit** — Sun bekommt Edge-Badge wenn `repo.aggregateSeverity === 'Kill'` (sonst kein Badge auf Sun). Kommt aus `data.repos[].aggregateSeverity` (existiert schon). |

## 3. Existing-Patterns im Repo (Vorbild + zu Touch)

- **`apps/web/src/lib/galaxie/severity-colors.ts`** — Single-Source `SEVERITY_HEX` (5 Hex-Werte) + Pixi-Number-Helper + `SEVERITY_GLOW_RADIUS` (Kill=24/Weak=16/…) + `SEVERITY_PULSE_RATE` (Kill=1.8Hz/Weak=1.0Hz/…) + `getPulseDuration()`. **Wird Major-Edit**: neue OKLCH-Approximations, neue Pulse-Rate (nur Kill), neue Glow-Radii (nur Kill=6, Rest=0).
- **`apps/web/src/components/landing/SeverityIcon.tsx`** — Lucide-Mapping V2: `Kill=AlertCircle, Weak=AlertTriangle, Mid=AlertTriangle, Strong=CheckCircle, Exceptional=Sparkles`. **Drift zu Master-Plan §5.3.3** (`octagon-x/triangle-alert/minus-circle/check-circle/sparkles`). Sub-B nutzt **Master-Mapping** (jüngere Spec) + updatet Landing-V2-File konsistent.
- **`apps/web/src/components/landing/RepoTreeView.tsx:177`** — bestehende Pattern `SeverityLucide` als React-Component-Map. Wird übernommen für die neue `severity-icons.ts` (kann direkt importiert werden statt zweifacher Map).
- **`apps/web/src/components/galaxie/pixi/RepoSun.ts`** + `FolderPlanet.ts` + `FilePlanet.ts` (Sub-A) — bekommen Severity-Render-Pfad. Pattern für `paint()`-Methode existiert, wird um Severity-Fill + Edge-Badge-Sprite-AddChild erweitert.
- **`apps/web/src/lib/solution-alpha.ts`** — `alphaFor(solutionStatus, solutionConfidence, dismissStatus)` existiert bereits (war in FileAsteroid genutzt). Wird reaktiviert.
- **alter `FileAsteroid.ts`-Code** (gelöscht in Sub-A, im git-log `41bba80` davor): hatte GlowFilter + alphaFor + updateFile-Diff-Pattern. **Pattern wird übernommen** für neue `FilePlanet.ts`.
- **GSAP-Context-Pattern in `GalaxieScene.tsx` Sub-A**: `ctxRef.current = gsap.context(...)`, `ctx.add(() => gsap.to(...))`. Wird übernommen für Kill-Pulse-Tween.

## 4. Alternativen, die wir bewusst NICHT wählen

- **Alt-A: Parallel-Isolierung `SEVERITY_HEX_SOLAR`** → Verworfen (QB1). Visueller Mismatch zwischen Landing-Demo und Workspace würde Conversion-Story schwächen — "schau wie deine Galaxie aussehen wird" passt nicht mit unterschiedlicher Palette.
- **Alt-B: Hybrid (Hard-Replace HEX, Landing-Glow-Constants separat)** → Verworfen (QB1). Erhöht Konzept-Komplexität ohne klaren Gewinn — wenn neue Palette für Landing zu gedämpft wirkt, ist das ein Master-Design-Issue, nicht ein Mappings-Issue.
- **Alt-C: Sprite-Sheet für 5 Lucide-Icons** → Verworfen (QB2). Build-Step + Asset-Generation für Sprite-Sheet ist disproportional zu 5 statischen Icons. PIXI.Texture-from-Canvas ist 30-Zeilen-Code.
- **Alt-D: Inline-SVG-DOM-Overlay** → Verworfen (QB2). React-DOM-Sync mit PIXI-Camera-Transform = Sync-Risiko + Performance-Hit bei 100+ Badges (jeder Badge wäre ein React-DOM-Knoten).
- **Alt-E: Dismissed/Solution-Alpha in Sub-C** → Verworfen (QB3). Würde Sub-B-Acceptance-Walk visuell verwirren (Dismissed-Files würden noch in Severity-Color rendern, was Visual-Regression-Symptome zeigt).
- **Alt-F: Sun-Aggregate-Badge in Sub-C oder Out-of-Scope** → Verworfen (QB4). 15-min-Erweiterung in Sub-B, klar im Severity-Spirit (nicht Hover-Sensitive), spart Re-Visit von `RepoSun.ts` in Sub-C.
- **Alt-G: SVG-Pfad-Strings hardcoded statt Lucide-Komponente** → Verworfen. Lucide bumps in Folge-Sessions würden manuelles Sync nötig machen. `renderToStaticMarkup(<OctagonX/>)` gibt Lucide-Auto-Update for free.

## 5. Endzustand

### 5.1 Neue OKLCH-Severity-Palette (`severity-colors.ts` Hard-Replace)

Asymmetrische Salienz (Master §5.3.3):

| Band         | Hex (OKLCH-Approx)                       | OKLCH (Doku)                  | Pulse-Rate-Hz | Glow-Radius | Edge-Badge |
|--------------|------------------------------------------|-------------------------------|---------------|-------------|------------|
| Kill         | `#c64a3a` (≈ oklch 0.58 0.20 25)          | `oklch(0.58 0.20 25)`         | **0.625** (= 1.6 s yoyo half-period 0.8 s) | **6** | `OctagonX` weiß |
| Weak         | `#cf8a4f` (≈ oklch 0.70 0.13 55)          | `oklch(0.70 0.13 55)`         | 0             | 0           | `AlertTriangle` weiß |
| Mid          | `#9aa3b3` (≈ oklch 0.68 0.02 250)         | `oklch(0.68 0.02 250)`        | 0             | 0           | **—** (Anker, kein Badge) |
| Strong       | `#7eb8a4` (≈ oklch 0.74 0.06 165)         | `oklch(0.74 0.06 165)`        | 0             | 0           | `CheckCircle` weiß |
| Exceptional  | `#acacac` (= oklch 0.70 0 0) + 1 px Stroke `#7a73d8` (oklch 0.62 0.14 270) | `oklch(0.70 0 0)` neutral + 1 px Indigo-Stroke | 0 | 0 | `Sparkles` weiß |
| (Dismissed)  | `#4d4d4d` (≈ oklch 0.40 0 0), Alpha 0.35  | `oklch(0.40 0 0)` Dark-Grey   | —             | —           | — |

**Begründung Asymm-Salienz**: Lightness-Band 0.58-0.74 ist schmal → keine Stufe wirkt durch reine Helligkeit "lauter" außer Kill (dunkler + max Chroma 0.20). Chroma-Sprung Kill 0.20 → Rest ≤ 0.13 macht die Asymmetrie. Mid bei Chroma 0.02 ist quasi-neutral. Teal (165°) und Indigo (270°) für Strong/Exceptional umgehen die Rot-Grün-Achse → Deuteranopie-safe.

`SEVERITY_HEX` Map wird hard-replaced. `SEVERITY_PULSE_RATE` Map wird hard-replaced (nur Kill > 0). `SEVERITY_GLOW_RADIUS` Map wird hard-replaced (nur Kill = 6, Rest = 0). `severity-colors.test.ts` wird passend angepasst.

Zusätzlich neue Konstanten:
- `SEVERITY_OUTLINE_HEX: Partial<Record<Severity, string>>` — `{ Exceptional: '#7a73d8' }`. Andere Bänder bekommen keinen Outline.
- `DISMISSED_FILL_HEX = '#4d4d4d'` + `DISMISSED_ALPHA = 0.35`.

### 5.2 Lucide-Icon-Mapping (`severity-icons.ts` NEW)

```ts
import { OctagonX, AlertTriangle, MinusCircle, CheckCircle, Sparkles } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import type { Severity } from './types';

export type LucideIcon = ComponentType<SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number }>;

export const SEVERITY_LUCIDE: Record<Severity, LucideIcon> = {
  Kill: OctagonX,
  Weak: AlertTriangle,
  Mid: MinusCircle,
  Strong: CheckCircle,
  Exceptional: Sparkles,
};

/** Bands that render an edge-badge in the workspace galaxy. Mid is the anchor
 *  and intentionally has no badge (master plan §5.3.4). */
export const EDGE_BADGE_BANDS: ReadonlySet<Severity> = new Set(['Kill', 'Weak', 'Strong', 'Exceptional']);
```

Wird zentral importiert von Workspace-PIXI + StaticGalaxieSVG + Landing-V2 (`SeverityIcon.tsx` wird Re-Export oder direkter Konsument — siehe §5.7).

### 5.3 PIXI-Edge-Badge-Texture-Cache (`pixi/edge-badge-texture.ts` NEW)

Async-init: beim ersten Aufruf von `ensureBadgeTexturesReady()` werden 5 Lucide-Icons via `renderToStaticMarkup` zu SVG-Strings → `HTMLImageElement` (data-URL) → `HTMLCanvasElement` (DPR-2 für Retina) → `PIXI.Texture.from(canvas)` konvertiert. Cache pro Severity-Band.

```ts
import { Texture } from 'pixi.js';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { SEVERITY_LUCIDE, EDGE_BADGE_BANDS } from '@/lib/galaxie/severity-icons';
import type { Severity } from '@/lib/galaxie/types';

const ICON_SIZE = 12; // Source-svg px; renders to disc-radius 5 + slight overhang
const DPR = 2;        // Retina-Texture
const cache = new Map<Severity, Texture>();

export async function ensureBadgeTexturesReady(): Promise<void> {
  await Promise.all(
    [...EDGE_BADGE_BANDS].map(async (band) => {
      if (cache.has(band)) return;
      const Component = SEVERITY_LUCIDE[band];
      const svg = renderToStaticMarkup(createElement(Component, { size: ICON_SIZE, strokeWidth: 2.4, color: '#ffffff' }));
      const dataUrl = `data:image/svg+xml;base64,${btoa(svg)}`;
      const img = await loadImage(dataUrl);
      const canvas = document.createElement('canvas');
      canvas.width = ICON_SIZE * DPR;
      canvas.height = ICON_SIZE * DPR;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(DPR, DPR);
      ctx.drawImage(img, 0, 0, ICON_SIZE, ICON_SIZE);
      cache.set(band, Texture.from(canvas));
    }),
  );
}

export function getBadgeTexture(severity: Severity): Texture | null {
  return cache.get(severity) ?? null;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
```

Init-Order in `GalaxieScene.tsx`: `useEffect` mit `ensureBadgeTexturesReady().then(() => setBadgesReady(true))`. Diff-Loop rendert Badges erst wenn `badgesReady === true` — vorher Planet ohne Badge (deferred-mount). Auf Reduced-Motion-Pfad (StaticGalaxieSVG) wird kein PIXI-Texture genutzt, inline-SVG-Render via Lucide-Komponente direkt.

### 5.4 Planet-Render-Erweiterung (`FolderPlanet.ts` + `FilePlanet.ts` Edit)

`paint()` wird Severity-aware:

```ts
import { SEVERITY_HEX, hexToPixiNumber, SEVERITY_OUTLINE_HEX, DISMISSED_FILL_HEX, DISMISSED_ALPHA } from '@/lib/galaxie/severity-colors';
import { GlowFilter } from 'pixi-filters';

private paint(): void {
  const dismissed = /* file.dismissStatus === 'dismissed' */;
  const baseColor = dismissed
    ? hexToPixiNumber(DISMISSED_FILL_HEX)
    : hexToPixiNumber(SEVERITY_HEX[severity]);
  this.alpha = dismissed ? DISMISSED_ALPHA : 1; // Sub-A neutral baseline
  // (für FilePlanet zusätzlich: this.alpha *= alphaFor(solutionStatus, …))

  this.graphics.clear();
  this.graphics.circle(0, 0, RADIUS).fill({ color: baseColor });

  // Exceptional bekommt 1 px Outline
  if (!dismissed && severity === 'Exceptional') {
    const outlineColor = hexToPixiNumber(SEVERITY_OUTLINE_HEX.Exceptional!);
    this.graphics.circle(0, 0, RADIUS).stroke({ width: 1, color: outlineColor });
  }

  // Kill bekommt 6 px Bloom in Severity-Color
  if (!dismissed && severity === 'Kill') {
    this.filters = [new GlowFilter({ distance: 6, outerStrength: 1.4, innerStrength: 0, color: baseColor, quality: 0.2 })];
  } else {
    this.filters = [];
  }
}
```

**Edge-Badge** wird als Child-Sprite gemounted (nicht in `paint()`-Graphics-Layer, weil Sprite-Reuse cleaner):

```ts
import { Sprite } from 'pixi.js';
import { getBadgeTexture } from './edge-badge-texture';
import { EDGE_BADGE_BANDS } from '@/lib/galaxie/severity-icons';

private badgeSprite: Sprite | null = null;

private updateBadge(severity: Severity): void {
  if (this.badgeSprite) {
    this.removeChild(this.badgeSprite);
    this.badgeSprite.destroy();
    this.badgeSprite = null;
  }
  if (!EDGE_BADGE_BANDS.has(severity)) return; // Mid skip
  const texture = getBadgeTexture(severity);
  if (!texture) return; // Texture-Cache noch nicht ready — wird beim nächsten paint() retried
  const disc = new Graphics();
  const discColor = hexToPixiNumber(SEVERITY_HEX[severity]);
  disc.circle(0, 0, 5).fill({ color: discColor });
  const icon = new Sprite(texture);
  icon.anchor.set(0.5);
  icon.width = 6;
  icon.height = 6;
  const badge = new Container();
  badge.addChild(disc);
  badge.addChild(icon);
  // 1-o'clock relative to planet center: angle -30°, distance = RADIUS * 0.866
  badge.x = RADIUS * 0.866;
  badge.y = -RADIUS * 0.5;
  badge.eventMode = 'none'; // Badge ist nicht hit-target, Planet ist
  this.addChild(badge);
  this.badgeSprite = badge as unknown as Sprite; // keep ref for cleanup
}
```

Konstanten exportiert aus `solar-layout.ts` (bestehend) oder neu in `severity-icons.ts`:
- `BADGE_DISC_RADIUS = 5`
- `BADGE_ICON_SIZE = 6`
- `BADGE_ANGLE_RAD = -Math.PI / 6` (= -30° = 1-Uhr)

### 5.5 RepoSun Worst-Child-Aggregate-Badge

In `RepoSun.ts`: gleiche Badge-Mount-Logik wie Planeten, aber nur wenn `repo.aggregateSeverity === 'Kill'`. Position: 1-Uhr auf Sun-Outer-Korona (Distanz `SUN_RADIUS * 0.866`, etwas außerhalb der Mid-Halo). Sun-Body bleibt neutral-grey (Master §5.1 explizit: "Keine Severity-Farbe auf der Sonne").

### 5.6 Kill-Pulse via GSAP (`GalaxieScene.tsx` GalaxieWorld-Diff-Loop)

In Sub-A wurde `initPulse` aus dem Diff-Loop entfernt. Sub-B reaktiviert es **nur für Kill**:

```ts
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const initPulse = (sprite: Container, severity: Severity) => {
  if (severity !== 'Kill' || reducedMotion) return;
  const duration = getPulseDuration(severity); // = 0.8s für 0.625Hz half-period
  if (duration === null) return;
  ctx.add(() => {
    gsap.to(sprite.scale, {
      x: 1.12, y: 1.12,
      duration,
      yoyo: true, repeat: -1,
      ease: 'sine.inOut',
    });
  });
};
```

Aufgerufen bei Mount + bei Severity-Wechsel (Diff-Update). Bei Severity-Wechsel `gsap.killTweensOf(sprite.scale)` + `sprite.scale.set(1)` + `paint()` + `initPulse()`. Hover-Tween-Restart in `onOut` (wie alter Code): `onComplete: () => initPulse(target, severityOf(target))`.

`severityOf`-Helper wird neu eingeführt:
```ts
const severityOf = (target: RepoSun | FolderPlanet | FilePlanet): Severity => {
  if (target instanceof FilePlanet) return target.file.severity;
  if (target instanceof FolderPlanet) return target.folder.aggregateSeverity;
  return target.repo.aggregateSeverity;
};
```

### 5.7 Landing-V2 Cross-Impact (`SeverityIcon.tsx` Update + Acceptance-Walk)

- `apps/web/src/components/landing/SeverityIcon.tsx` wird re-mapped auf Master-Lucide (`OctagonX`/`AlertTriangle`/`MinusCircle`/`CheckCircle`/`Sparkles`) ODER importiert direkt aus neuer `severity-icons.ts` (Single-Source-Pattern stärken). **Empfehlung: direkter Import**, damit zukünftige Mapping-Changes nur an einer Stelle passieren.
- `Sphere.tsx`, `RepoTreeView.tsx`, `HoverTooltip.tsx`, `MiniMap.tsx`, `UniversalSearch.tsx` — alle konsumieren weiterhin `severityHex(s)` aus `severity-colors.ts`. Hex-Werte ändern sich → die Files brauchen **keinen Code-Edit**, nur visuelle Verifikation im Acceptance-Walk.

### 5.8 Reduced-Motion (`StaticGalaxieSVG.tsx` Severity-Render)

- Severity-Fill: `fill={SEVERITY_HEX[severity]}` via Color-CSS-Variable oder direkt.
- Edge-Badge: inline-SVG via Lucide-Component (kein PIXI-Texture-Cache). Disc + Lucide-Icon-Sub-SVG-Group, 1-Uhr-Position.
- **Kein Pulse**, **kein Glow** (Reduced-Motion-Spirit). Kill ist immer noch sat-Rot + Edge-Badge, was die Hierarchie ohne Motion erhält.
- Dismissed-Files: `fill={DISMISSED_FILL_HEX}` + `fillOpacity={0.35}`.

### 5.9 Tests grün (Acceptance Bottom-Line)

- `pnpm typecheck` ✓
- `pnpm test apps/web/src/lib/galaxie/` ✓ — `severity-colors.test.ts` mit neuen OKLCH-Approx-Hex-Werten + neuer Pulse-Rate-Assertion (Kill > 0, Rest = 0) + `getPulseDuration(Kill)` ≈ 0.8 s, `getPulseDuration(Weak)` === null.
- `pnpm --filter @vk/web build` ✓
- Acceptance-Walk auf `http://localhost:3000/[workspace]` UND `http://localhost:3000/` (Landing-Hero V2) per §8.

## 6. Schritte

- [x] **Step 1**: `severity-colors.ts` hard-replaced — neue OKLCH-Hex-Werte, `SEVERITY_PULSE_RATE` (Kill=0.625, Rest=0), `SEVERITY_GLOW_RADIUS` (Kill=6, Rest=0), `SEVERITY_OUTLINE_HEX` + `DISMISSED_FILL_HEX` + `DISMISSED_ALPHA` exportiert.
- [x] **Step 2**: `severity-colors.test.ts` updated — 8 Tests grün (Hex, Outline, Dismissed, Pulse-Rate, Glow-Radius, getPulseDuration).
- [x] **Step 3**: `severity-icons.ts` (NEW) — `SEVERITY_LUCIDE` Single-Source-Map, `EDGE_BADGE_BANDS` Set (Mid skip), `BADGE_DISC_RADIUS=5` + `BADGE_ICON_SIZE=6` + `BADGE_ANGLE_RAD=-π/6`.
- [x] **Step 4**: `edge-badge-texture.ts` (NEW) — `ensureBadgeTexturesReady()` idempotent + Blob-URL-Image-Load (UTF-safe) + DPR-2-Canvas-Render + Texture-Cache.
- [x] **Step 5**: `FolderPlanet.ts` erweitert — Severity-Fill, Exceptional-Outline, Kill-Glow, Edge-Badge-Sprite (außer Mid), `updateFolder()` + `refreshBadgeFromTextureCache()` Diff. `buildBadge()`-Helper exported für Reuse in FilePlanet + RepoSun.
- [x] **Step 6**: `FilePlanet.ts` erweitert — Severity-Fill, Dismissed-Fill, `alphaFor()` Solution-Alpha (existiert in `lib/solution-alpha.ts`), Edge-Badge (skip bei dismissed), Exceptional-Outline, Kill-Glow, `updateFile()` + `refreshBadgeFromTextureCache()`.
- [x] **Step 7**: `RepoSun.ts` erweitert — Worst-Child-Aggregate-Badge nur bei `aggregateSeverity === 'Kill'`, Position auf Outer-Korona via `buildBadge` (DRY). Sun-Body bleibt neutral-grey 3-Layer.
- [x] **Step 8**: `GalaxieScene.tsx` erweitert — `ensureBadgeTexturesReady()` + `badgesReady`-State, `severityOf` Helper (Modul-Level), `startPulse` Closure (nur Kill, 0.8s yoyo scale 1.0↔1.12), Hover-Out-Tween mit `onComplete: startPulse`, Diff-Sweep ruft `updateRepo()/updateFolder()/updateFile()` auf bestehenden Sprites + Pulse-Toggle-Handling beim Kill-Wechsel, `badgesReady`-Effect refresht alle Badges nach Cache-Ready.
- [x] **Step 9**: `StaticGalaxieSVG.tsx` erweitert — Severity-Fill für Folder + File, Exceptional-Stroke, inline-`<Badge>`-Sub-Component nutzt `SEVERITY_LUCIDE`-React-Komponente, Dismissed-Files mit Dark-Grey-Fill + Alpha 0.35, Sun-Worst-Child-Kill-Aggregate-Badge.
- [x] **Step 10**: Landing `SeverityIcon.tsx` + `RepoTreeView.tsx` konsolidiert auf neue `SEVERITY_LUCIDE` aus `severity-icons.ts` (Single-Source). Lokale Drift-Maps gelöscht. Animations (Kill-Pulse + Exceptional-Spin) bleiben unverändert (Landing-V2-spec).
- [x] **Step 11**: `pnpm typecheck` grün (23/23). `pnpm test` apps/web/src/lib/galaxie/ + pixi/: 36 Tests grün (5 Files, +5 neue Severity-Tests gegenüber Sub-A). `pnpm --filter @vk/web build`: Compiled successfully in 6.5s.
- [x] **Step 12**: Dev-Server frisch (Next 16.2.6, 289ms ready). Acceptance-Walk komplett: Severity-Palette+Pulse korrekt, Edge-Badges sauber (Mid skip), Console clean, Interaktion ok, **Landing-Hero V2 Cross-Impact-Re-Walk grün**, Reduced-Motion-SVG-Fallback grün.

## 7. Files-to-Change

| Datei                                                                  | Aktion | Was passiert                                                                                              |
|------------------------------------------------------------------------|--------|-----------------------------------------------------------------------------------------------------------|
| `apps/web/src/lib/galaxie/severity-colors.ts`                          | EDIT   | OKLCH-Approx-Hex hard-replace, Pulse-Rate-Map (nur Kill), Glow-Radius-Map (nur Kill), neue Exports.        |
| `apps/web/src/lib/galaxie/severity-colors.test.ts`                     | EDIT   | Hex-Werte + Pulse-Rate + Glow-Radius Assertions auf neue Werte.                                            |
| `apps/web/src/lib/galaxie/severity-icons.ts`                           | CREATE | `SEVERITY_LUCIDE` Map + `EDGE_BADGE_BANDS` Set + Badge-Konstanten.                                         |
| `apps/web/src/components/galaxie/pixi/edge-badge-texture.ts`           | CREATE | Async-Texture-Cache mit `renderToStaticMarkup` → SVG → Canvas → PIXI.Texture.                              |
| `apps/web/src/components/galaxie/pixi/FolderPlanet.ts`                 | EDIT   | Severity-Fill, Outline für Exceptional, Glow für Kill, Edge-Badge-Sprite, `updateFolder()` Diff.           |
| `apps/web/src/components/galaxie/pixi/FilePlanet.ts`                   | EDIT   | Severity-Fill + Dismissed-Fill/Alpha + `alphaFor` Solution-Status, Edge-Badge, `updateFile()` Diff.         |
| `apps/web/src/components/galaxie/pixi/RepoSun.ts`                      | EDIT   | Worst-Child-Aggregate-Badge nur bei Kill. Sun-Body bleibt neutral-grey.                                    |
| `apps/web/src/components/galaxie/GalaxieScene.tsx`                     | EDIT   | `ensureBadgeTexturesReady`-State, `severityOf`-Helper, `initPulse` für Kill, Hover-Pulse-Restart, Severity-Diff-Update-Sweep. |
| `apps/web/src/components/galaxie/StaticGalaxieSVG.tsx`                 | EDIT   | Severity-Fill, inline-SVG-Edge-Badges, Dismissed-Render, Exceptional-Stroke.                                |
| `apps/web/src/components/landing/SeverityIcon.tsx`                     | EDIT   | Lucide-Map durch direkten Import aus `severity-icons.ts` ersetzen (Single-Source-Stärkung).                |

**Bewusst NICHT touched in Sub-B**:
- `lib/galaxie/solar-layout.ts` + `solar-layout.test.ts` (Layout-Coords sind in Sub-A finalisiert)
- `lib/galaxie/types.ts` (keine neuen Typen nötig)
- `lib/galaxie/layout.ts` (frozen für MiniMap-Bridge)
- `MiniMap.tsx`, `UniversalSearch.tsx` (Hex-Werte ändern sich automatisch durch SEVERITY_HEX-Update, kein Edit)
- `lib/repo-galaxie/*` (Landing-Hero-V2-eigene Layout-Pipeline, nutzt aber dieselben severity-colors → Wert-Change wirkt automatisch)
- Inngest, DAL, Drizzle-Schema, API-Routes (rein UI-Refactor)
- Stripe-Tier-Definitionen, Billing-Logic

## 8. Test-Plan

**Automatisch:**

- `pnpm typecheck` ✓ (monorepo)
- `pnpm test apps/web/src/lib/galaxie/` ✓ — `severity-colors.test.ts` neu (Hex-Werte, Pulse-Rate, getPulseDuration), `solar-layout.test.ts` bleibt grün (kein Touch), `mock-data.test.ts` bleibt grün.
- `pnpm test apps/web/src/components/galaxie/pixi/` ✓ — `Camera.test.ts`, `quadtree.test.ts` bleiben grün. Optional: `edge-badge-texture.test.ts` falls jsdom-Canvas-Mock funktioniert (nicht required — hauptsächlich integration-getestet via Acceptance-Walk).
- `pnpm --filter @vk/web build` ✓

**Manuell (Acceptance-Checkliste — `http://localhost:3000/[workspace]`):**

Severity-Render:
- [ ] Kill-Planeten leuchten sattes Rot (`#c64a3a`) + Bloom-Halo + pulsen sichtbar (~0.8s ↑↓-Phase, scale 1.0 ↔ 1.12, sine.inOut).
- [ ] Weak-Planeten Orange-gedämpft (`#cf8a4f`), kein Pulse, kein Bloom.
- [ ] Mid-Planeten neutral-blau-grau (`#9aa3b3`), KEIN Edge-Badge sichtbar.
- [ ] Strong-Planeten leiser Teal-Tint (`#7eb8a4`), sehr ruhig, kein Pulse.
- [ ] Exceptional-Planeten neutral-grau Fill + 1 px Indigo-Outline (`#7a73d8`).
- [ ] Dismissed-Files dark-grey (`#4d4d4d`) + Alpha 0.35, kein Edge-Badge.
- [ ] Galaxie wirkt überwiegend monochromatisch-ruhig, Blick wandert sofort zu Kill-Planeten.

Edge-Badges (Lucide via PIXI-Texture):
- [ ] Kill-Badge: roter Disc + weißes OctagonX-Icon, 1-Uhr halb-überlappend.
- [ ] Weak-Badge: oranger Disc + weißes AlertTriangle.
- [ ] Mid: **kein** Badge.
- [ ] Strong-Badge: Teal-Disc + weißes CheckCircle.
- [ ] Exceptional-Badge: neutral-grauer Disc + weißes Sparkles + Indigo-Outline am Planet.
- [ ] Badges sind scharf gerendert (DPR-2-Texture), nicht pixelig.

Sun-Aggregate-Badge:
- [ ] Sonnen mit `repo.aggregateSeverity === 'Kill'`: Edge-Badge auf Outer-Korona, 1-Uhr.
- [ ] Sonnen mit anderer aggregateSeverity: kein Sun-Badge (Sun-Body bleibt neutral-grey).

Bestehende Interaktion:
- [ ] Hover auf Planet → Scale 1.5x (wie Sub-A), Hover-Out → zurück + Kill-Pulse restartet sauber.
- [ ] Click auf Sun/Folder/File: wie Sub-A (Sun→Pan, Folder→Pan deeper, File→Inspector).

Cross-Impact Landing-Hero V2 (`http://localhost:3000/`):
- [ ] Landing-Hero rendert weiter ohne Console-Errors.
- [ ] Severity-Color-Palette ist visuell konsistent mit Workspace (gleiche Hex-Werte).
- [ ] Lucide-Icons in `RepoTreeView`-Severity-Badges nutzen neue Mapping (OctagonX/AlertTriangle/MinusCircle/CheckCircle/Sparkles).
- [ ] Demo-Tour-Flow läuft unverändert.

Console:
- [ ] Keine React-Hydration-Warnings.
- [ ] Keine PixiJS-Errors.
- [ ] Keine "Texture loading failed"-Warnings (Badge-Cache-Init grün).

Reduced-Motion (System-Pref ON):
- [ ] Static-SVG-Fallback rendert Severity-Fill + inline-SVG-Edge-Badges.
- [ ] Kein Pulse, kein Bloom, kein Hover-Glow.
- [ ] Dismissed-Files mit reduzierter Alpha sichtbar.

## 9. Risiken + Mitigation

| Risiko                                                                                              | Severity | Mitigation                                                                                              |
|-----------------------------------------------------------------------------------------------------|----------|---------------------------------------------------------------------------------------------------------|
| **Cross-Impact Landing-Hero V2**: neue gedämpfte Palette wirkt visuell zu ruhig auf Landing-Demo    | Strong   | Pflicht-Re-Walk im Acceptance-Walk. Fallback bei kritischer Visual-Regression: zurück zu Option B (parallel-isoliert `SEVERITY_HEX_SOLAR`). Master-Plan-Vision war explizit Asymm-Salienz auch auf Landing → User-Subjekt-Check beim Re-Walk. |
| PIXI-Texture-Cache async-init: erste Frames vor Cache-Ready haben keine Badges → Flicker            | Mid      | `badgesReady`-State im Diff-Loop. Wenn `false`, kein `updateBadge()` Call. Wenn `true`, Re-Run Diff-Update. Texture-Cache-Init <100 ms erwartet bei 5 Icons.                                  |
| `renderToStaticMarkup` ist React-Server-Render-API → läuft sie clientside in Browser-Bundle?         | Strong   | `react-dom/server` ist Client-fähig wenn explizit importiert. Vercel/Next 16 Turbopack bundled das problemlos. Acceptance: Build grün + Bundle-Size-Check (`pnpm --filter @vk/web build` Output). Wenn Bundle-Bloat > 20 KB → switch zu `lucide-static`-Strings. |
| Lucide-Icons als PIXI-Textures bei DPR < 2: unscharf                                                | Mid      | `DPR = 2` hardcoded im Texture-Cache (Retina-default). Auf 1× Displays leicht oversharpened, akzeptabel. |
| Pulse-Tween-Pool bei vielen Kill-Files: CPU-Spike                                                    | Mid      | GSAP-Tween-Pooling: jeder Sprite hat eigene Timeline (existierender Code-Pfad). Wenn >50 Kill gleichzeitig → Profile-Check; ggf. Shared-Timeline-Optimierung (Master §9 Risk-3, deferred). |
| Edge-Badge auf File-Planet mit Radius 4 ist größer als Planet selbst (Badge-Disc-Radius 5)          | Mid      | Acceptance-Walk-Check. Wenn visuelle Hierarchie kaputt → Adaptive Disc-Radius (4 statt 5) bei File-Planeten. Sub-B fix in-line oder Open-Question für Folge-Iter. |
| `severity-colors.test.ts` Snapshot-style-Test: bricht durch neue Hex-Werte                          | Weak     | Test-File wird in Step 2 mit-updated. Erwartete Assertion-Werte auf neue OKLCH-Approx-Hex angepasst.    |
| `lib/solution-alpha.ts` existiert nicht mehr (Sub-A hat es nicht verifiziert)                       | Mid      | Step 6 Pre-Check: existiert die Datei? Wenn nein → entweder aus git-log `41bba80` zurückholen oder neue Min-Impl schreiben (3 Lines: confidence + status → alpha). Block-Step-Resolver bei Drift. |
| Mock-Daten `aggregateSeverity` für Repos: ist bestehend in Mock-Data, aber Folder-Aggregate ist Sub-A-synthetisch | Weak | Sub-A's `FolderNode.aggregateSeverity` wird in Sub-B-`FolderPlanet.paint()` konsumiert. Sub-A hat den Wert berechnet (`aggregateSeverity()`-Helper). Direkt nutzbar.                          |
| Hover-Out-Pulse-Restart bei Severity-Change während Hover                                            | Weak     | GSAP-Tween-Replay-Logic existiert im alten Code (`onComplete: () => initPulse(...)` Pattern). Wird übernommen. |
| StaticGalaxieSVG inline-SVG-Badges: Lucide-React in SVG-Output ist möglicherweise SSR-incompatible    | Mid      | Lucide-React-Komponente in Client-Component nutzen (`'use client'` ist gesetzt). Server-Render würde nur `aria-hidden`-Outer-Wrapper machen.                                                |
| Kill-Pulse + Scale-1.5-Hover: Tween-Konflikt wenn beide active                                       | Mid      | `gsap.killTweensOf(target.scale)` vor Hover-Tween + Hover-Out-Tween startet Pulse neu. Code-Pfad aus altem `GalaxieScene` adaptiert.                                                          |
| `SEVERITY_LUCIDE` Drift wenn Landing-V2 + Workspace beide importieren — sobald jemand das nicht weiß | Weak     | `severity-icons.ts` mit JSDoc-Header "**Single source for severity → Lucide icon mapping. Imported by Workspace PIXI textures, StaticGalaxieSVG, Landing-V2 RepoTreeView. Edit here only.**" |

## 10. Rollout

- **Strategie**: Hard-Replace (Master Q12). Solo-Dev. **Sub-B = 1 PR oder Direct-Commit**.
- **Pre-Deploy-Gates** (vor Sub-B-Done):
  - `pnpm typecheck` grün
  - `pnpm test apps/web/src/lib/galaxie/` grün
  - `pnpm --filter @vk/web build` grün
  - Acceptance-Walk `/[workspace]` komplett (User-OK durch alle §8-Workspace-Checks)
  - **Acceptance-Walk `/` Landing-Hero** komplett (Cross-Impact-Verifikation)
  - Reduced-Motion Static-SVG verifiziert
- **Post-Deploy-Verifikation**: kein Deploy in Sub-B (geht in `main`, Sub-C wird deployed).
- **Rollback-Trigger**:
  - Landing-Hero V2 visuell broken oder Console-Errors.
  - Workspace-Galaxie: Pulse pulst ALLE Planeten statt nur Kill / Badge fehlt komplett / Kill-Glow flutet Viewport.
  - Texture-Cache-Init-Errors in Console.
  - Performance: Pulse-Tween treibt CPU > 30 % auf Mid-Range-Laptop.
- **Rollback-Schritte**:
  - Bei Landing-Cross-Impact-Visual-Regression: `git revert` Step 1 (severity-colors.ts) + Re-Apply via `SEVERITY_HEX_SOLAR` parallel-isoliert. Workspace-Klassen importieren von `SEVERITY_HEX_SOLAR`, Landing bleibt mit alten Werten.
  - Vollständig: `git revert <sub-B-commit>` → zurück zu Sub-A-Endzustand (neutral-grey).
- Sub-B-Plan-File bleibt in `docs/plans/` bis ✅, dann `git mv` nach `done/`.

## 11. Out-of-Scope (Sub-C / V2)

- **Edge-Render Sun → Children on-hover** → **Sub-C**
- **Orbit-Reveal on Hover-Sun** → **Sub-C**
- **Hover-Glow-Halo + Tooltip-Pill (Path · Severity · Findings-Count)** → **Sub-C**
- **Datadog-Pivot (Center-Tween + Side-Panel slide-in)** → **Sub-C**
- **Side-Panel-Komponente `SolarInspectorPanel.tsx`** → **Sub-C** (Inspector-Modal bleibt aktiv in Sub-B)
- **Mobile-List-View ≤768 px** → **Sub-C**
- **ESC + Click-Outside-Handling für Side-Panel** → **Sub-C**
- **Rekursive Folder-Hierarchie + Sub-Sonnen-Pivot** → **Sub-C**
- **MiniMap-Migration** auf Sonnensystem-Layout (immer noch Legacy-Bridge) → Folge-Phase nach Sub-C
- **UniversalSearch-Layout** Anpassung → Folge-Phase
- **Pulse-Tween-Pooling-Optimierung** für 50+ Kill-Files → Folge-Phase bei Perf-Bedarf
- **GlowFilter-Performance auf Mobile** (deferred-load oder fallback) → Folge-Phase
- **Submodul-Drift-Edges** → Folge-Phase

## 12. Open Questions (Post-Execute-Items)

- **Edge-Badge auf File-Planet R=4**: Disc-Radius 5 > Planet-Radius 4 → Badge größer als Planet. Acceptance-Walk-Visual-Check; bei Hierarchie-Kollaps Adaptive-Disc-Radius (4 statt 5) bei File-Planeten in-line patchen.
- **`lib/solution-alpha.ts`-Existenz**: Pre-Step-6-Check. Wenn weg → Min-Impl in Step 6 schreiben (3 LOC: dismissed → 0.35; ready → 1.0; pending → 0.6; rest → 1.0).
- **Landing-Hero-Acceptance-Test**: subjektive Visual-Quality-Frage ob die neue gedämpfte Palette auf Landing-Demo "schwächer wirkt". User-Subjekt-Check entscheidet ob Hard-Replace bleibt oder Rollback zu parallel-isoliert.
- **Reduced-Motion-Lucide-SVG-Inline**: jsdom-Test-Compat unklar. Acceptance-Walk verifiziert visuell; falls SSR-Mismatch → React-Memo + Mount-only-Render.

## 13. Geschätzter Aufwand

- **Step 1 (severity-colors.ts)**: ~15 min
- **Step 2 (severity-colors.test.ts)**: ~10 min
- **Step 3 (severity-icons.ts)**: ~10 min
- **Step 4 (edge-badge-texture.ts)**: ~40 min (async-init + DPR-rasterizer + error-handling)
- **Step 5 (FolderPlanet)**: ~25 min
- **Step 6 (FilePlanet)**: ~30 min (mehr States als FolderPlanet: dismissed + solution-status)
- **Step 7 (RepoSun)**: ~15 min
- **Step 8 (GalaxieScene Pulse + Diff-Update-Sweep)**: ~35 min
- **Step 9 (StaticGalaxieSVG)**: ~25 min
- **Step 10 (Landing SeverityIcon)**: ~10 min
- **Step 11 (Tests + Build)**: ~15 min
- **Step 12 (Acceptance-Walk Workspace + Landing)**: ~25 min

**Gesamt Sub-B: ~3.5–4 h** (Master schätzte 2.5–3 h; +30–60 min wegen Cross-Impact-Re-Walk auf Landing + Texture-Cache-async-Komplexität). 1 PR oder Direct-Commit auf `main`.

**Nach Sub-B-Done**: User reviewt Acceptance-Walks → `/plan galaxie-workspace-solar-C-hover-mobile` als finaler Sub-Plan-Cycle.
