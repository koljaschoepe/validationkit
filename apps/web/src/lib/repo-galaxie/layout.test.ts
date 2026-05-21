import { describe, expect, it } from 'vitest';
import { computeLayout } from './layout';
import { DEMO_GALAXIE } from './demo-data';
import type { RepoGalaxieData } from './types';

describe('computeLayout (circle-pack)', () => {
  it('places all input nodes in the layout output', () => {
    const layout = computeLayout(DEMO_GALAXIE);
    expect(layout).toHaveLength(DEMO_GALAXIE.nodes.length);

    const inputIds = new Set(DEMO_GALAXIE.nodes.map((n) => n.id));
    const outputIds = new Set(layout.map((n) => n.id));
    expect(outputIds).toEqual(inputIds);
  });

  it('assigns a positive radius to every node', () => {
    const layout = computeLayout(DEMO_GALAXIE);
    for (const node of layout) {
      expect(node.radius).toBeGreaterThan(0);
    }
  });

  it('is deterministic — identical inputs produce identical layouts', () => {
    const a = computeLayout(DEMO_GALAXIE);
    const b = computeLayout(DEMO_GALAXIE);
    expect(a).toEqual(b);
  });

  it('nests files within their parent folder (rim-to-rim check)', () => {
    const layout = computeLayout(DEMO_GALAXIE);
    const byId = new Map(layout.map((n) => [n.id, n]));

    for (const node of layout) {
      if (!node.parentId) continue;
      const parent = byId.get(node.parentId);
      if (!parent) continue;

      const dx = node.x - parent.x;
      const dy = node.y - parent.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      // Child circle must be fully inside parent circle:
      //   distance + childRadius <= parentRadius (with small epsilon)
      expect(distance + node.radius).toBeLessThanOrEqual(parent.radius + 0.5);
    }
  });

  it('returns empty array for empty input', () => {
    const empty: RepoGalaxieData = { nodes: [], edges: [] };
    expect(computeLayout(empty)).toEqual([]);
  });

  it('returns empty array when no root exists', () => {
    const noRoot: RepoGalaxieData = {
      nodes: [
        {
          id: 'orphan',
          kind: 'file',
          label: 'a',
          parentId: 'nonexistent',
          depth: 1,
        },
      ],
      edges: [],
    };
    expect(computeLayout(noRoot)).toEqual([]);
  });

  it('respects the configured viewBox size (radii bounded by it)', () => {
    const layout = computeLayout(DEMO_GALAXIE, { width: 800, height: 800 });
    const root = layout.find((n) => n.parentId === null);
    expect(root).toBeDefined();
    // Root circle fits inside half of the smallest dimension.
    expect(root!.radius).toBeLessThanOrEqual(400);
  });
});
