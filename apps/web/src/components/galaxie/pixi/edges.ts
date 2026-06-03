import { Container, Graphics } from 'pixi.js';
import type { SolarLayoutNode } from '@/lib/galaxie/types';

/**
 * PIXI container holding every sun→child edge as a single Graphics primitive.
 * Hover-reveal is driven by Container.alpha (default 0 = hidden) so a single
 * GSAP tween reveals all edges at once. Selected-state edges live in a
 * separate {@link SelectedEdgeContainer} so dim-others tweens don't fight.
 */
export class EdgeContainer extends Container {
  private graphics: Graphics;

  constructor() {
    super();
    this.alpha = 0;
    this.eventMode = 'none';
    this.graphics = new Graphics();
    this.addChild(this.graphics);
  }

  redraw(
    sunPositions: Map<string, { x: number; y: number }>,
    children: SolarLayoutNode[],
  ): void {
    this.graphics.clear();
    for (const child of children) {
      if (!child.parentSunId) continue;
      const sun = sunPositions.get(child.parentSunId);
      if (!sun) continue;
      this.graphics
        .moveTo(sun.x, sun.y)
        .lineTo(child.x, child.y)
        .stroke({ width: 0.5, color: 0xffffff, alpha: 1 });
    }
  }
}

/**
 * Single sticky edge shown when a node is selected via the Datadog pivot. Its
 * alpha is driven directly (no inherited Container fade), so it can stay
 * visible at 0.30 while the surrounding {@link EdgeContainer} fades back to 0.
 */
export class SelectedEdgeContainer extends Container {
  private graphics: Graphics;

  constructor() {
    super();
    this.alpha = 0;
    this.eventMode = 'none';
    this.graphics = new Graphics();
    this.addChild(this.graphics);
  }

  drawSegment(
    from: { x: number; y: number },
    to: { x: number; y: number },
  ): void {
    this.graphics.clear();
    this.graphics
      .moveTo(from.x, from.y)
      .lineTo(to.x, to.y)
      .stroke({ width: 0.6, color: 0xffffff, alpha: 1 });
  }

  clearSegment(): void {
    this.graphics.clear();
  }
}
