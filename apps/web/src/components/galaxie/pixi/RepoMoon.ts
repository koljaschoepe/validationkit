import { Container, Graphics, Rectangle } from 'pixi.js';
import { GlowFilter } from 'pixi-filters';
import {
  severityPixiColor,
  SEVERITY_GLOW_RADIUS,
} from '@/lib/galaxie/severity-colors';
import type { Repo, LayoutNode, Severity } from '@/lib/galaxie/types';

export class RepoMoon extends Container {
  repo: Repo;
  private graphics: Graphics;
  private mobileScale: number;

  constructor(repo: Repo, node: LayoutNode, mobileScale = 1) {
    super();
    this.repo = repo;
    this.mobileScale = mobileScale;
    this.x = node.x;
    this.y = node.y;
    this.label = repo.id;

    this.graphics = new Graphics();
    this.addChild(this.graphics);
    this.paint(repo.aggregateSeverity);

    // Hit-area expansion: 44×44 touch target around the moon, scales with
    // mobileScale to match the larger mobile visual.
    const hitR = 22 * mobileScale;
    this.hitArea = new Rectangle(-hitR, -hitR, hitR * 2, hitR * 2);
    this.eventMode = 'static';
    this.cursor = 'pointer';
  }

  /** Re-paint sprite for a new severity without destroying it. */
  updateSeverity(severity: Severity): void {
    this.repo = { ...this.repo, aggregateSeverity: severity };
    this.paint(severity);
  }

  private paint(sev: Severity): void {
    const s = this.mobileScale;
    const color = severityPixiColor(sev);
    this.graphics.clear();
    this.graphics.circle(0, 0, 9 * s).fill({ color, alpha: 0.22 });
    this.graphics.circle(0, 0, 5.5 * s).fill({ color });

    // Moons get half the customer-star halo, scaled by severity + mobile.
    const glowRadius = SEVERITY_GLOW_RADIUS[sev] * 0.5 * s;
    if (glowRadius > 0) {
      this.filters = [
        new GlowFilter({
          distance: glowRadius,
          outerStrength: 1.2,
          innerStrength: 0,
          color,
          quality: 0.2,
        }),
      ];
    } else {
      this.filters = [];
    }
  }
}
