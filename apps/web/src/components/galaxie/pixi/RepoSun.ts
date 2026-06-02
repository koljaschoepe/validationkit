import { Container, Graphics, Rectangle } from 'pixi.js';
import { SOLAR_LAYOUT_CONSTANTS } from '@/lib/galaxie/solar-layout';
import type { Repo, SolarLayoutNode } from '@/lib/galaxie/types';

// Neutral-grey approximations of the OKLCH lightness layers defined in
// the master plan §5.1 (Sub-B will switch to OKLCH severity-aware fills).
const INNER_CORE_COLOR = 0xececec; // oklch(0.92 0 0)
const MID_HALO_COLOR = 0x7f7f7f; // oklch(0.55 0 0)
const OUTER_CORONA_COLOR = 0x1f1f1f; // oklch(0.20 0 0)

const { SUN_RADIUS } = SOLAR_LAYOUT_CONSTANTS;

export class RepoSun extends Container {
  repo: Repo;
  private graphics: Graphics;
  private mobileScale: number;

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

    const hitR = (SUN_RADIUS + 4) * mobileScale;
    this.hitArea = new Rectangle(-hitR, -hitR, hitR * 2, hitR * 2);
    this.eventMode = 'static';
    this.cursor = 'pointer';
  }

  private paint(): void {
    const s = this.mobileScale;
    const r = SUN_RADIUS * s;
    this.graphics.clear();
    this.graphics.circle(0, 0, r * 1.0).fill({ color: OUTER_CORONA_COLOR, alpha: 0.18 });
    this.graphics.circle(0, 0, r * 0.75).fill({ color: MID_HALO_COLOR, alpha: 0.45 });
    this.graphics.circle(0, 0, r * 0.45).fill({ color: INNER_CORE_COLOR, alpha: 1.0 });
  }
}
