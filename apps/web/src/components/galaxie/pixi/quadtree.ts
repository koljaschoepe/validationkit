// Minimal point-quadtree for visible-set queries on the galaxie.
// Sprint G6: skip the structure entirely until node-count > 1000 — at the
// current real-data size (<200 nodes) the JS array scan beats the quadtree
// overhead by ~3x.

export interface Box {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface QuadPoint<T> {
  x: number;
  y: number;
  payload: T;
}

const MAX_NODES = 8;
const MAX_DEPTH = 8;

interface Node<T> {
  bounds: Box;
  depth: number;
  points: QuadPoint<T>[];
  children: Node<T>[] | null;
}

export class QuadTree<T> {
  private readonly root: Node<T>;

  constructor(bounds: Box) {
    this.root = { bounds, depth: 0, points: [], children: null };
  }

  insert(p: QuadPoint<T>): void {
    if (!contains(this.root.bounds, p)) return;
    insertInto(this.root, p);
  }

  /** Return all points whose (x, y) lies inside `viewport`. */
  query(viewport: Box): QuadPoint<T>[] {
    const out: QuadPoint<T>[] = [];
    queryNode(this.root, viewport, out);
    return out;
  }
}

function contains(b: Box, p: { x: number; y: number }): boolean {
  return p.x >= b.minX && p.x <= b.maxX && p.y >= b.minY && p.y <= b.maxY;
}

function intersects(a: Box, b: Box): boolean {
  return !(b.minX > a.maxX || b.maxX < a.minX || b.minY > a.maxY || b.maxY < a.minY);
}

function insertInto<T>(node: Node<T>, p: QuadPoint<T>): void {
  if (node.children) {
    for (const c of node.children) if (contains(c.bounds, p)) return insertInto(c, p);
    return; // point on boundary — drop (rare)
  }
  node.points.push(p);
  if (node.points.length > MAX_NODES && node.depth < MAX_DEPTH) {
    subdivide(node);
  }
}

function subdivide<T>(node: Node<T>): void {
  const { minX, minY, maxX, maxY } = node.bounds;
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;
  node.children = [
    { bounds: { minX, minY, maxX: midX, maxY: midY }, depth: node.depth + 1, points: [], children: null },
    { bounds: { minX: midX, minY, maxX, maxY: midY }, depth: node.depth + 1, points: [], children: null },
    { bounds: { minX, minY: midY, maxX: midX, maxY }, depth: node.depth + 1, points: [], children: null },
    { bounds: { minX: midX, minY: midY, maxX, maxY }, depth: node.depth + 1, points: [], children: null },
  ];
  const old = node.points;
  node.points = [];
  for (const p of old) {
    for (const c of node.children) {
      if (contains(c.bounds, p)) {
        insertInto(c, p);
        break;
      }
    }
  }
}

function queryNode<T>(node: Node<T>, viewport: Box, out: QuadPoint<T>[]): void {
  if (!intersects(node.bounds, viewport)) return;
  for (const p of node.points) if (contains(viewport, p)) out.push(p);
  if (node.children) for (const c of node.children) queryNode(c, viewport, out);
}
