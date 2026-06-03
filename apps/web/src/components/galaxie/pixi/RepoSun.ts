import { Container, Graphics, Rectangle } from 'pixi.js';
import { SOLAR_LAYOUT_CONSTANTS } from '@/lib/galaxie/solar-layout';
import type { Repo, Severity, SolarLayoutNode } from '@/lib/galaxie/types';
import { getBadgeTexture } from './edge-badge-texture';
import { buildBadge } from './FolderPlanet';

// Neutral-grey approximations of the OKLCH lightness layers (master §5.1).
// The sun body intentionally never takes a severity hue — the planets carry
// severity, the sun aggregates spatially. Only the worst-child Kill-aggregate
// gets a thin badge on the outer corona; everything else stays grey.
const INNER_CORE_COLOR = 0xececec; // oklch(0.92 0 0)
const MID_HALO_COLOR = 0x7f7f7f; // oklch(0.55 0 0)
const OUTER_CORONA_COLOR = 0x1f1f1f; // oklch(0.20 0 0)

const { SUN_RADIUS } = SOLAR_LAYOUT_CONSTANTS;

export class RepoSun extends Container {
  repo: Repo;
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
    this.graphics
      .circle(0, 0, r * 1.0)
      .fill({ color: OUTER_CORONA_COLOR, alpha: 0.18 });
    this.graphics
      .circle(0, 0, r * 0.75)
      .fill({ color: MID_HALO_COLOR, alpha: 0.45 });
    this.graphics
      .circle(0, 0, r * 0.45)
      .fill({ color: INNER_CORE_COLOR, alpha: 1.0 });
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
