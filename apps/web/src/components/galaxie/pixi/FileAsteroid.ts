import { Container, Graphics } from 'pixi.js';
import { GlowFilter } from 'pixi-filters';
import { severityPixiColor } from '@/lib/galaxie/severity-colors';
import type { FileNode, LayoutNode } from '@/lib/galaxie/types';
import { alphaFor } from '@/lib/solution-alpha';

export class FileAsteroid extends Container {
  readonly file: FileNode;

  constructor(file: FileNode, node: LayoutNode) {
    super();
    this.file = file;
    this.x = node.x;
    this.y = node.y;
    this.label = file.id;
    this.alpha = alphaFor(file.solutionStatus, file.solutionConfidence);

    const color = severityPixiColor(file.severity);
    const g = new Graphics();
    g.circle(0, 0, 2.4).fill({ color });
    this.addChild(g);

    this.filters = [
      new GlowFilter({
        distance: 6,
        outerStrength: file.solutionStatus === 'ready' ? 2.4 : 1.6,
        innerStrength: 0,
        color,
        quality: 0.2,
      }),
    ];

    this.eventMode = 'static';
    this.cursor = 'pointer';
  }
}
