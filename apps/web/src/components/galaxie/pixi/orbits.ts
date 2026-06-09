import { Container, Graphics } from 'pixi.js';
import type { SolarLayoutNode } from '@/lib/galaxie/types';

/**
 * PIXI container holding every per-sun orbit ring as a single Graphics
 * primitive. Like {@link EdgeContainer}, hover reveal is driven by
 * Container.alpha so a single GSAP tween animates the whole layer.
 */
export class OrbitContainer extends Container {
  private graphics: Graphics;

  constructor() {
    super();
    this.alpha = 0;
    this.eventMode = 'none';
    this.graphics = new Graphics();
    this.addChild(this.graphics);
  }

  /**
   * Phase D — orbit radii are count-aware per sun, so draw each sun's rings from
   * its children's actual `orbitRadius` instead of fixed constants.
   */
  redraw(suns: SolarLayoutNode[], children: SolarLayoutNode[]): void {
    this.graphics.clear();
    const radiiBySun = new Map<string, Set<number>>();
    for (const c of children) {
      if (c.parentSunId === undefined || c.orbitRadius === undefined) continue;
      const set = radiiBySun.get(c.parentSunId) ?? new Set<number>();
      set.add(c.orbitRadius);
      radiiBySun.set(c.parentSunId, set);
    }
    for (const sun of suns) {
      const radii = radiiBySun.get(sun.id);
      if (!radii) continue;
      for (const r of radii) {
        this.graphics
          .circle(sun.x, sun.y, r)
          .stroke({ width: 0.5, color: 0xffffff, alpha: 1 });
      }
    }
  }
}
