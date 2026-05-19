import { describe, expect, it } from 'vitest';
import { QuadTree, type Box } from './quadtree';

const BOUNDS: Box = { minX: -1000, minY: -1000, maxX: 1000, maxY: 1000 };

describe('QuadTree', () => {
  it('returns all points inserted within a query viewport', () => {
    const qt = new QuadTree<string>(BOUNDS);
    qt.insert({ x: 100, y: 100, payload: 'a' });
    qt.insert({ x: -200, y: -200, payload: 'b' });
    qt.insert({ x: 500, y: 500, payload: 'c' });
    const result = qt.query({ minX: 0, minY: 0, maxX: 600, maxY: 600 });
    const ids = result.map((p) => p.payload).sort();
    expect(ids).toEqual(['a', 'c']);
  });

  it('drops points outside the root bounds', () => {
    const qt = new QuadTree<string>(BOUNDS);
    qt.insert({ x: 5000, y: 5000, payload: 'outside' });
    expect(qt.query(BOUNDS)).toEqual([]);
  });

  it('subdivides past 8 points', () => {
    const qt = new QuadTree<number>(BOUNDS);
    for (let i = 0; i < 50; i++) {
      qt.insert({ x: i * 5, y: i * 5, payload: i });
    }
    // All 50 should be findable.
    const result = qt.query(BOUNDS);
    expect(result.length).toBe(50);
  });

  it('viewport completely outside returns empty', () => {
    const qt = new QuadTree<string>(BOUNDS);
    qt.insert({ x: 0, y: 0, payload: 'origin' });
    expect(
      qt.query({ minX: 5000, minY: 5000, maxX: 6000, maxY: 6000 }),
    ).toEqual([]);
  });
});
