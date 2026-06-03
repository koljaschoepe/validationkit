import { Container, Graphics } from 'pixi.js';
import { SOLAR_LAYOUT_CONSTANTS } from '@/lib/galaxie/solar-layout';
import type { SolarLayoutNode } from '@/lib/galaxie/types';

const { FOLDER_ORBITS, FILE_ORBIT } = SOLAR_LAYOUT_CONSTANTS;
const ORBIT_RADII = [...FOLDER_ORBITS, FILE_ORBIT] as const;

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

  redraw(suns: SolarLayoutNode[]): void {
    this.graphics.clear();
    for (const sun of suns) {
      for (const r of ORBIT_RADII) {
        this.graphics
          .circle(sun.x, sun.y, r)
          .stroke({ width: 0.5, color: 0xffffff, alpha: 1 });
      }
    }
  }
}
