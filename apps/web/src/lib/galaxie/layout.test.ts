import { describe, expect, it } from 'vitest';
import { computeLayout } from './layout';
import { generateMockGalaxieData } from './mock-data';

describe('computeLayout', () => {
  it('emits one node per customer, repo, and file (= 168 for 3×5×10)', () => {
    const data = generateMockGalaxieData();
    const layout = computeLayout(data);
    // 3 customers + 15 repos + 150 files = 168
    expect(layout.nodes).toHaveLength(168);
  });

  it('is deterministic across runs for identical input + seed', () => {
    const data = generateMockGalaxieData();
    const a = computeLayout(data);
    const b = computeLayout(data);
    expect(a).toEqual(b);
  });

  it('places level-1 customers near the configured orbit radius', () => {
    const data = generateMockGalaxieData();
    const layout = computeLayout(data, { customerOrbitRadius: 600 });
    const customers = layout.nodes.filter((n) => n.level === 1);
    expect(customers.length).toBe(3);
    for (const c of customers) {
      const distance = Math.hypot(c.x, c.y);
      expect(distance).toBeGreaterThan(550);
      expect(distance).toBeLessThan(650);
    }
  });

  it('level-2 repo nodes carry a parentId that maps to a level-1 customer node', () => {
    const data = generateMockGalaxieData();
    const layout = computeLayout(data);
    const customerIds = new Set(
      layout.nodes.filter((n) => n.level === 1).map((n) => n.id),
    );
    const repoNodes = layout.nodes.filter((n) => n.level === 2);
    for (const r of repoNodes) {
      expect(r.parentId).toBeDefined();
      expect(customerIds.has(r.parentId!)).toBe(true);
    }
  });

  it('level-3 file nodes carry a parentId that maps to a level-2 repo node', () => {
    const data = generateMockGalaxieData();
    const layout = computeLayout(data);
    const repoIds = new Set(
      layout.nodes.filter((n) => n.level === 2).map((n) => n.id),
    );
    const fileNodes = layout.nodes.filter((n) => n.level === 3);
    expect(fileNodes.length).toBe(150);
    for (const f of fileNodes) {
      expect(f.parentId).toBeDefined();
      expect(repoIds.has(f.parentId!)).toBe(true);
    }
  });
});
