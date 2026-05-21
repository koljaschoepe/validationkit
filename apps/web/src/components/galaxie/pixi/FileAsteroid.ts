import { Container, Graphics, Rectangle } from 'pixi.js';
import { GlowFilter } from 'pixi-filters';
import {
  severityPixiColor,
  SEVERITY_GLOW_RADIUS,
} from '@/lib/galaxie/severity-colors';
import type { FileNode, LayoutNode } from '@/lib/galaxie/types';
import { alphaFor } from '@/lib/solution-alpha';

export class FileAsteroid extends Container {
  file: FileNode;
  private graphics: Graphics;
  private mobileScale: number;

  constructor(file: FileNode, node: LayoutNode, mobileScale = 1) {
    super();
    this.file = file;
    this.mobileScale = mobileScale;
    this.x = node.x;
    this.y = node.y;
    this.label = file.id;

    this.graphics = new Graphics();
    this.addChild(this.graphics);
    this.paint(file);

    // Hit-area expansion (WCAG): visible sprite stays small, but touch/click
    // target is 44×44 px (× mobileScale for mobile-friendly oversize).
    const hitR = 22 * mobileScale;
    this.hitArea = new Rectangle(-hitR, -hitR, hitR * 2, hitR * 2);
    this.eventMode = 'static';
    this.cursor = 'pointer';
  }

  /** Re-paint sprite for a new severity / dismiss-status without destroying
   *  it. Powers the Sprint-2 diff-update path in GalaxieScene. */
  updateFile(file: FileNode): void {
    this.file = file;
    this.paint(file);
  }

  private paint(file: FileNode): void {
    const s = this.mobileScale;
    this.alpha = alphaFor(
      file.solutionStatus,
      file.solutionConfidence,
      file.dismissStatus,
    );

    // Sprint G5 — dismissed findings render in neutral gray, no glow.
    const dimmed = file.dismissStatus === 'dismissed';
    const color = dimmed ? 0x404040 : severityPixiColor(file.severity);
    this.graphics.clear();
    this.graphics.circle(0, 0, 2.4 * s).fill({ color });

    // Glow radius encodes severity (monochrome post-Homepage-Relaunch).
    // Quarter-scale of customer-star, so the file layer stays subtle. Times
    // mobileScale so the halo grows on mobile.
    const glowRadius = SEVERITY_GLOW_RADIUS[file.severity] * 0.25 * s;
    if (!dimmed && glowRadius > 0) {
      this.filters = [
        new GlowFilter({
          distance: glowRadius,
          outerStrength: file.solutionStatus === 'ready' ? 2.4 : 1.6,
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
