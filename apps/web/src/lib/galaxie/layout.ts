import type { GalaxieData, GalaxieLayout, LayoutNode } from './types';

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

interface LayoutOptions {
  customerOrbitRadius?: number;
  repoOrbitRadius?: number;
  fileOrbitRadius?: number;
  seed?: string;
}

const DEFAULTS: Required<LayoutOptions> = {
  customerOrbitRadius: 600,
  repoOrbitRadius: 180,
  fileOrbitRadius: 55,
  seed: 'galaxie-layout-v1',
};

export function computeLayout(
  data: GalaxieData,
  opts: LayoutOptions = {},
): GalaxieLayout {
  const cfg = { ...DEFAULTS, ...opts };
  const rng = mulberry32(hashString(cfg.seed));
  const nodes: LayoutNode[] = [];

  // Level 1 — Customers on a circle around origin
  const customerN = Math.max(data.customers.length, 1);
  const customerNodes: LayoutNode[] = data.customers.map((c, i) => {
    const angle = (i / customerN) * Math.PI * 2 + rng() * 0.2;
    return {
      id: c.id,
      level: 1,
      x: Math.cos(angle) * cfg.customerOrbitRadius,
      y: Math.sin(angle) * cfg.customerOrbitRadius,
    };
  });
  nodes.push(...customerNodes);

  const customerById = new Map(customerNodes.map((n) => [n.id, n]));

  // Level 2 — Repos on a circle around their customer
  const reposByCustomer = new Map<string, typeof data.repos>();
  for (const r of data.repos) {
    const arr = reposByCustomer.get(r.customerId) ?? [];
    arr.push(r);
    reposByCustomer.set(r.customerId, arr);
  }

  const repoNodes: LayoutNode[] = [];
  for (const r of data.repos) {
    const center = customerById.get(r.customerId);
    if (!center) continue;
    const siblings = reposByCustomer.get(r.customerId)!;
    const idx = siblings.findIndex((rr) => rr.id === r.id);
    const angle =
      (idx / siblings.length) * Math.PI * 2 + rng() * 0.3;
    repoNodes.push({
      id: r.id,
      level: 2,
      x: center.x + Math.cos(angle) * cfg.repoOrbitRadius,
      y: center.y + Math.sin(angle) * cfg.repoOrbitRadius,
      parentId: r.customerId,
    });
  }
  nodes.push(...repoNodes);

  const repoById = new Map(repoNodes.map((n) => [n.id, n]));

  // Level 3 — Files on a circle around their repo
  const filesByRepo = new Map<string, typeof data.files>();
  for (const f of data.files) {
    const arr = filesByRepo.get(f.repoId) ?? [];
    arr.push(f);
    filesByRepo.set(f.repoId, arr);
  }

  for (const f of data.files) {
    const center = repoById.get(f.repoId);
    if (!center) continue;
    const siblings = filesByRepo.get(f.repoId)!;
    const idx = siblings.findIndex((ff) => ff.id === f.id);
    const angle =
      (idx / siblings.length) * Math.PI * 2 + rng() * 0.4;
    const jitter = (rng() - 0.5) * 8;
    nodes.push({
      id: f.id,
      level: 3,
      x: center.x + Math.cos(angle) * (cfg.fileOrbitRadius + jitter),
      y: center.y + Math.sin(angle) * (cfg.fileOrbitRadius + jitter),
      parentId: f.repoId,
    });
  }

  return { nodes };
}
