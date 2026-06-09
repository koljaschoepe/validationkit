import { Container, Graphics, Rectangle, type Text } from 'pixi.js';
import { GlowFilter } from 'pixi-filters';
import { SOLAR_LAYOUT_CONSTANTS } from '@/lib/galaxie/solar-layout';
import type { Repo, Severity, SolarLayoutNode } from '@/lib/galaxie/types';
import { getBadgeTexture } from './edge-badge-texture';
import { buildBadge } from './FolderPlanet';
import { applyLabelLOD, createNodeLabel, setNodeLabelText } from './NodeLabel';

// Galaxie-Redesign Phase F — the sun is a warm star, not a grey disc. Layered
// concentric warm fills approximate a radial photosphere gradient (robust, no
// gradient-API dependency); a GlowFilter adds the corona bloom. The body still
// carries NO severity hue — severity lives on the planets + the Kill badge.
const PHOTO_EDGE = 0x8a4f24; // outer photosphere
const PHOTO_MID = 0xd99a5c; // mid
const PHOTO_INNER = 0xffd9a0; // inner
const PHOTO_CORE = 0xfff6e8; // bright core
const CORONA_COLOR = 0xffb060; // glow + faint corona ring

const { SUN_RADIUS } = SOLAR_LAYOUT_CONSTANTS;

export class RepoSun extends Container {
  repo: Repo;
  nodeLabel: Text;
  private graphics: Graphics;
  private mobileScale: number;
  private aggregateBadge: Container | null = null;

  private hoverGlow: Graphics | null = null;

  constructor(repo: Repo, node: SolarLayoutNode, mobileScale = 1) {
    super();
    this.repo = repo;
    this.mobileScale = mobileScale;
    this.x = node.x;
    this.y = node.y;
    this.label = repo.id;

    this.graphics = new Graphics();
    this.addChild(this.graphics);
    this.paint();
    this.updateAggregateBadge(repo.aggregateSeverity);

    // Phase E — on-canvas label (LOD-gated, updated by GalaxieWorld's ticker).
    this.nodeLabel = createNodeLabel(repo.label);
    this.addChild(this.nodeLabel);

    const hitR = (SUN_RADIUS + 4) * mobileScale;
    this.hitArea = new Rectangle(-hitR, -hitR, hitR * 2, hitR * 2);
    this.eventMode = 'static';
    this.cursor = 'pointer';
  }

  updateRepo(repo: Repo): void {
    const aggregateChanged =
      this.repo.aggregateSeverity !== repo.aggregateSeverity;
    this.repo = repo;
    if (aggregateChanged) {
      this.updateAggregateBadge(repo.aggregateSeverity);
    }
    setNodeLabelText(this.nodeLabel, repo.label);
  }

  /** Phase E — update the label's LOD state for the current camera zoom. */
  updateLabelLOD(cameraScale: number): void {
    applyLabelLOD(
      this.nodeLabel,
      cameraScale,
      'sun',
      SUN_RADIUS * this.mobileScale,
    );
  }

  refreshBadgeFromTextureCache(): void {
    this.updateAggregateBadge(this.repo.aggregateSeverity);
  }

  setHoverGlow(active: boolean): void {
    if (active && !this.hoverGlow) {
      const r = (SUN_RADIUS + 4) * this.mobileScale;
      this.hoverGlow = new Graphics();
      this.hoverGlow.circle(0, 0, r).fill({ color: 0xffffff, alpha: 0.14 });
      this.addChildAt(this.hoverGlow, 0);
    } else if (!active && this.hoverGlow) {
      this.removeChild(this.hoverGlow);
      this.hoverGlow.destroy();
      this.hoverGlow = null;
    }
  }

  private paint(): void {
    const s = this.mobileScale;
    const r = SUN_RADIUS * s;
    this.graphics.clear();
    // Faint corona ring just outside the body (the GlowFilter blooms this).
    this.graphics.circle(0, 0, r * 1.12).fill({ color: CORONA_COLOR, alpha: 0.1 });
    // Photosphere — concentric warm fills, dark edge → bright core.
    this.graphics.circle(0, 0, r).fill({ color: PHOTO_EDGE });
    this.graphics.circle(0, 0, r * 0.82).fill({ color: PHOTO_MID });
    this.graphics.circle(0, 0, r * 0.55).fill({ color: PHOTO_INNER });
    this.graphics.circle(0, 0, r * 0.32).fill({ color: PHOTO_CORE });
    // Specular hotspot (upper-left) + warm rim light.
    this.graphics
      .circle(-r * 0.26, -r * 0.26, r * 0.18)
      .fill({ color: 0xffffff, alpha: 0.5 });
    this.graphics
      .circle(0, 0, r)
      .stroke({ width: 1, color: 0xffe6c2, alpha: 0.55 });

    // Corona bloom.
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    this.filters = [
      new GlowFilter({
        distance: (reducedMotion ? 12 : 18) * s,
        outerStrength: 1.5,
        innerStrength: 0,
        color: CORONA_COLOR,
        quality: 0.3,
      }),
    ];
  }

  /** Only renders a badge when the worst-child severity is Kill — the rest of
   *  the time the sun stays a calm grey aggregate (master §5.1). */
  private updateAggregateBadge(severity: Severity): void {
    if (this.aggregateBadge) {
      this.removeChild(this.aggregateBadge);
      this.aggregateBadge.destroy({ children: true });
      this.aggregateBadge = null;
    }
    if (severity !== 'Kill') return;
    const texture = getBadgeTexture(severity);
    if (!texture) return;
    // Anchor on the outer-corona edge (slightly inside `r * 1.0`) so the badge
    // half-overlaps the sun's silhouette like the planet badges do.
    const parentRadius = SUN_RADIUS * this.mobileScale;
    this.aggregateBadge = buildBadge(severity, texture, parentRadius);
    this.addChild(this.aggregateBadge);
  }
}
