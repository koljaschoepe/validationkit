import { Container, Graphics } from 'pixi.js';
import { severityPixiColor } from '@/lib/galaxie/severity-colors';
import type { Customer, LayoutNode } from '@/lib/galaxie/types';

export class CustomerStar extends Container {
  readonly customer: Customer;

  constructor(customer: Customer, node: LayoutNode) {
    super();
    this.customer = customer;
    this.x = node.x;
    this.y = node.y;
    this.label = customer.id;

    const color = severityPixiColor(customer.aggregateSeverity);
    const g = new Graphics();
    g.circle(0, 0, 32).fill({ color, alpha: 0.12 });
    g.circle(0, 0, 20).fill({ color, alpha: 0.32 });
    g.circle(0, 0, 11).fill({ color });
    this.addChild(g);

    // Sprint G3 — click for drill-in tween.
    this.eventMode = 'static';
    this.cursor = 'pointer';
  }
}
