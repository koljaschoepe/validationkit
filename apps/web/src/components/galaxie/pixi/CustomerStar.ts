import { Container, Graphics, Rectangle } from 'pixi.js';
import { GlowFilter } from 'pixi-filters';
import {
  severityPixiColor,
  SEVERITY_GLOW_RADIUS,
} from '@/lib/galaxie/severity-colors';
import type { Customer, LayoutNode, Severity } from '@/lib/galaxie/types';

export class CustomerStar extends Container {
  customer: Customer;
  private graphics: Graphics;
  private mobileScale: number;

  constructor(customer: Customer, node: LayoutNode, mobileScale = 1) {
    super();
    this.customer = customer;
    this.mobileScale = mobileScale;
    this.x = node.x;
    this.y = node.y;
    this.label = customer.id;

    this.graphics = new Graphics();
    this.addChild(this.graphics);
    this.paint(customer.aggregateSeverity);

    // Hit-area expansion: 64×64 touch target around the star (scales with
    // mobileScale so the larger mobile visual also gets a proportionally
    // larger touch target). Container scale itself stays 1 — that lane is
    // reserved for hover-affordance + pulse tweens.
    const hitR = 32 * mobileScale;
    this.hitArea = new Rectangle(-hitR, -hitR, hitR * 2, hitR * 2);
    this.eventMode = 'static';
    this.cursor = 'pointer';
  }

  /** Re-paint sprite for a new severity without destroying it. Lets the
   *  diff-update path (GalaxieScene Sprint-2 refactor) recolor in place. */
  updateSeverity(severity: Severity): void {
    this.customer = { ...this.customer, aggregateSeverity: severity };
    this.paint(severity);
  }

  private paint(sev: Severity): void {
    const s = this.mobileScale;
    const color = severityPixiColor(sev);
    this.graphics.clear();
    this.graphics.circle(0, 0, 32 * s).fill({ color, alpha: 0.12 });
    this.graphics.circle(0, 0, 20 * s).fill({ color, alpha: 0.32 });
    this.graphics.circle(0, 0, 11 * s).fill({ color });

    // Severity encoded via glow radius (post-Homepage-Relaunch).
    // Larger halo = higher severity. Kill = 24, Weak = 16, Mid = 8, Strong = 0.
    // Glow distance scales with mobileScale so the halo grows in step with
    // the sprite circles.
    const glowRadius = SEVERITY_GLOW_RADIUS[sev] * s;
    if (glowRadius > 0) {
      this.filters = [
        new GlowFilter({
          distance: glowRadius,
          outerStrength: 1.4,
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
