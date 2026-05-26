import { hierarchy, pack, type HierarchyCircularNode } from 'd3-hierarchy';
import type {
  GraphNode,
  LayoutNode,
  RepoGalaxieData,
} from './types';

/**
 * Circle-Pack layout via d3-hierarchy (Wang/Matousek-Sharir-Welzl front-chain
 * algorithm). Replaces the prior hierarchical-radial layout — nested circles
 * communicate containment without explicit edges, scale to 100+ files in the
 * same ~450-600 px container, and natively support Bostock's zoomable-pack
 * drill-in pattern.
 *
 * Deterministic: sort by id before pack(), so SSR + CSR produce byte-identical
 * coordinates.
 */

export interface PackOptions {
  /** SVG viewBox width — pack fits within this. */
  width: number;
  /** SVG viewBox height. */
  height: number;
  /**
   * Padding between sibling circles in viewBox-units. Either a static number
   * or a function `(depth) => number` for depth-differentiated breathing room.
   * Default: depth 0 → 20, depth 1 → 16, depth ≥2 → 8.
   */
  padding?: number | ((depth: number) => number);
}

/** Galaxie-V2 Iter-2: noch mehr Atemraum, besonders bei depth-1 (Folder-zu-
 *  Folder-Distanz) und depth-2+ (Files innerhalb Folder). */
function defaultPaddingForDepth(depth: number): number {
  if (depth === 0) return 60;
  if (depth === 1) return 52;
  return 36;
}

const DEFAULT_PACK_OPTIONS: Required<PackOptions> = {
  width: 1100,
  height: 1100,
  padding: defaultPaddingForDepth,
};

/** Internal tree shape consumed by d3-hierarchy. */
interface TreeNode {
  node: GraphNode;
  children: TreeNode[];
}

function flatToTree(nodes: GraphNode[]): TreeNode | null {
  const byId = new Map<string, TreeNode>();
  for (const n of nodes) {
    byId.set(n.id, { node: n, children: [] });
  }
  let root: TreeNode | null = null;
  for (const n of nodes) {
    const entry = byId.get(n.id)!;
    if (n.parentId === null) {
      root = entry;
    } else {
      const parent = byId.get(n.parentId);
      if (parent) parent.children.push(entry);
    }
  }
  return root;
}

/**
 * Value function for pack(). Leaves carry their file-size (bytes); internal
 * nodes return 0 — d3 sums them automatically. We sqrt-scale because raw
 * bytes vary by 40× (16 KB CLAUDE.md vs 0.4 KB aider.conf), which would
 * make small circles invisible.
 */
function packValue(d: TreeNode): number {
  const n = d.node;
  // Only leaves (files) contribute value; folders aggregate via d3.sum.
  if (n.kind !== 'file') return 0;
  const bytes = n.bytes ?? 1024;
  // sqrt-scale prevents one huge file from dominating
  return Math.sqrt(Math.max(bytes, 100));
}

export function computeLayout(
  data: RepoGalaxieData,
  options: PackOptions = DEFAULT_PACK_OPTIONS,
): LayoutNode[] {
  const opts = { ...DEFAULT_PACK_OPTIONS, ...options };

  const tree = flatToTree(data.nodes);
  if (!tree) return [];

  // 1. Build d3-hierarchy from our tree.
  const root = hierarchy<TreeNode>(tree, (d) => d.children)
    .sum((d) => packValue(d))
    // 2. Stable sort: by id alphabetically → deterministic SSR/CSR.
    .sort((a, b) => {
      const aId = a.data.node.id;
      const bId = b.data.node.id;
      return aId < bId ? -1 : aId > bId ? 1 : 0;
    });

  // 3. Apply circle-pack layout. d3-pack passes the layout-node (with `.depth`)
  // to padding(), so depth-differentiated breathing room works out of the box.
  const packLayout = pack<TreeNode>().size([opts.width, opts.height]);
  const padded =
    typeof opts.padding === 'function'
      ? packLayout.padding((d: HierarchyCircularNode<TreeNode>) =>
          (opts.padding as (depth: number) => number)(d.depth),
        )
      : packLayout.padding(opts.padding);
  const layout = padded(root);

  // 4. Translate so layout is centered around (0, 0) — easier for SVG viewBox.
  const offsetX = opts.width / 2;
  const offsetY = opts.height / 2;

  // 5. Map to flat LayoutNode[] for consumers.
  return layout.descendants().map((d: HierarchyCircularNode<TreeNode>) => ({
    ...d.data.node,
    x: d.x - offsetX,
    y: d.y - offsetY,
    radius: d.r,
  }));
}
