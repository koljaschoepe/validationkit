"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Background,
  Controls,
  ReactFlow,
  Position,
  type Edge,
  type Node,
  type NodeProps,
  Handle,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { SeverityBand } from "@vk/core";
import { SeverityBadge } from "@/components/ui/severity-badge";

export interface RepoGraphNodeData {
  label: string;
  rootPath: string;
  severity: SeverityBand;
  lastActivityIso: string | null;
  canonical: boolean;
  scanId: string | null;
  [key: string]: unknown;
}

export interface RepoGraphEdge {
  id: string;
  sourceRepoId: string;
  targetRepoId: string;
  severity: SeverityBand;
  itemsCount: number;
  driftId: string;
}

export interface RepoGraphInput {
  nodes: Array<{
    id: string;
    data: RepoGraphNodeData;
  }>;
  edges: RepoGraphEdge[];
}

const SEV_EDGE_COLOR: Record<SeverityBand, string> = {
  Kill: "var(--color-sev-kill)",
  Weak: "var(--color-sev-weak)",
  Mid: "var(--color-sev-mid)",
  Strong: "var(--color-sev-strong)",
  Exceptional: "var(--color-sev-exceptional)",
};

function relativeTime(iso: string | null): string {
  if (!iso) return "never";
  const d = new Date(iso);
  const ms = Date.now() - d.getTime();
  const h = Math.floor(ms / 3_600_000);
  if (h < 24) return `${Math.max(1, h)}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  return d.toISOString().slice(0, 10);
}

function RepoNode({ data }: NodeProps<Node<RepoGraphNodeData>>) {
  const stale =
    data.lastActivityIso &&
    Date.now() - new Date(data.lastActivityIso).getTime() > 7 * 24 * 3_600_000;

  return (
    <div
      className={`rounded-lg border bg-card px-3 py-2 shadow-sm min-w-[180px] ${
        data.canonical ? "border-primary" : "border-border"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-border" />
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="font-mono text-xs font-bold">{data.label}</span>
        <SeverityBadge severity={data.severity} />
      </div>
      <div className="text-[0.65rem] text-muted-foreground font-mono">
        {relativeTime(data.lastActivityIso)}
        {stale ? <span className="text-[var(--color-sev-weak)] ml-1">· stale</span> : null}
      </div>
      {data.canonical ? (
        <div className="mt-1 text-[0.6rem] uppercase tracking-wider text-primary font-semibold">
          canonical
        </div>
      ) : null}
      <Handle type="source" position={Position.Bottom} className="!bg-border" />
    </div>
  );
}

const nodeTypes = { repo: RepoNode };

function layout(input: RepoGraphInput): { nodes: Node[]; edges: Edge[] } {
  // Simple radial: canonical at center, others on a circle.
  const canonical = input.nodes.find((n) => n.data.canonical);
  const others = input.nodes.filter((n) => !n.data.canonical);

  const radius = 220 + Math.min(150, others.length * 8);
  const nodes: Node[] = [];

  if (canonical) {
    nodes.push({
      id: canonical.id,
      type: "repo",
      position: { x: 0, y: 0 },
      data: canonical.data,
    });
  }
  others.forEach((n, i) => {
    const angle = (2 * Math.PI * i) / Math.max(others.length, 1);
    nodes.push({
      id: n.id,
      type: "repo",
      position: {
        x: Math.round(Math.cos(angle) * radius),
        y: Math.round(Math.sin(angle) * radius),
      },
      data: n.data,
    });
  });

  if (!canonical && others.length === 0) return { nodes: [], edges: [] };

  const edges: Edge[] = input.edges.map((e) => ({
    id: e.id,
    source: e.sourceRepoId,
    target: e.targetRepoId,
    label: `${e.itemsCount} drift`,
    labelStyle: { fontSize: 10, fill: "var(--foreground)" },
    style: {
      stroke: SEV_EDGE_COLOR[e.severity],
      strokeWidth: 2,
    },
    animated: e.severity === "Kill" || e.severity === "Weak",
  }));

  return { nodes, edges };
}

export function RepoGraph({ data }: { data: RepoGraphInput }) {
  const router = useRouter();
  const { nodes, edges } = useMemo(() => layout(data), [data]);

  if (nodes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-card/30 p-12 text-center">
        <p className="font-medium">Need at least 2 repos to see connections.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add another customer-repo to unlock the graph view.
        </p>
      </div>
    );
  }

  return (
    <div className="h-[600px] w-full rounded-lg border bg-card/30">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: false }}
        onNodeClick={(_e, node) => {
          const d = node.data as RepoGraphNodeData;
          if (d.scanId) router.push(`/scans/${d.scanId}`);
        }}
        onEdgeClick={(_e, edge) => {
          const driftId = edge.id;
          if (driftId) router.push(`/drifts/${driftId}`);
        }}
      >
        <Background gap={20} size={1} color="var(--border)" />
        <Controls className="!bg-card !border-border" />
      </ReactFlow>
    </div>
  );
}
