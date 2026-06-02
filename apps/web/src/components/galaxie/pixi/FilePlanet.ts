import { Container, Graphics, Rectangle } from 'pixi.js';
import { SOLAR_LAYOUT_CONSTANTS } from '@/lib/galaxie/solar-layout';
import type { FileNode, SolarLayoutNode } from '@/lib/galaxie/types';

const FILE_FILL_COLOR = 0xacacac; // oklch(0.70 0 0) — Sub-B will swap for severity

const { FILE_PLANET_RADIUS } = SOLAR_LAYOUT_CONSTANTS;

export class FilePlanet extends Container {
  file: FileNode;
  private graphics: Graphics;
  private mobileScale: number;

  constructor(file: FileNode, node: SolarLayoutNode, mobileScale = 1) {
    super();
    this.file = file;
    this.mobileScale = mobileScale;
    this.x = node.x;
    this.y = node.y;
    this.label = file.id;

    this.graphics = new Graphics();
    this.addChild(this.graphics);
    this.paint();

    const hitR = 22 * mobileScale;
    this.hitArea = new Rectangle(-hitR, -hitR, hitR * 2, hitR * 2);
    this.eventMode = 'static';
    this.cursor = 'pointer';
  }

  private paint(): void {
    const s = this.mobileScale;
    this.graphics.clear();
    this.graphics
      .circle(0, 0, FILE_PLANET_RADIUS * s)
      .fill({ color: FILE_FILL_COLOR });
  }
}
