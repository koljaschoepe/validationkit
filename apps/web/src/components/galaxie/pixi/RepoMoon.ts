import { Container, Graphics } from 'pixi.js';
import { severityPixiColor } from '@/lib/galaxie/severity-colors';
import type { Repo, LayoutNode } from '@/lib/galaxie/types';

export class RepoMoon extends Container {
  readonly repo: Repo;

  constructor(repo: Repo, node: LayoutNode) {
    super();
    this.repo = repo;
    this.x = node.x;
    this.y = node.y;
    this.label = repo.id;

    const color = severityPixiColor(repo.aggregateSeverity);
    const g = new Graphics();
    g.circle(0, 0, 9).fill({ color, alpha: 0.22 });
    g.circle(0, 0, 5.5).fill({ color });
    this.addChild(g);

    // Sprint G3 — click for drill-in tween.
    this.eventMode = 'static';
    this.cursor = 'pointer';
  }
}
