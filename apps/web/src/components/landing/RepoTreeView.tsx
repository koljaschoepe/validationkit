'use client';

import { useMemo, useState } from 'react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  FileIcon,
  FolderIcon,
  GitBranchIcon,
  PackageIcon,
} from 'lucide-react';
import type {
  GraphNode,
  NodeKind,
  RepoGalaxieData,
} from '@/lib/repo-galaxie/types';
import { severityHex } from '@/lib/galaxie/severity-colors';
import { SEVERITY_LUCIDE } from '@/lib/galaxie/severity-icons';
import { cn } from '@/lib/utils';

/**
 * RepoTreeView — Phase Nova-2 P6 mobile replacement for the SVG Galaxie.
 *
 * Pattern: Expand-inline accordion (iOS Files-app). Folder/Repo click toggles
 * children; File click invokes `onFileSelect` (parent opens the bottom-sheet
 * inspector). Touch-targets ≥ 44 px per WCAG 2.5.5 (large-content).
 *
 * Layout: indent depth × 16 px + 28 px row-height + severity-pill on the right.
 * Severity color is the only chroma in the tree — everything else stays
 * monochrome to match Linear/Vercel-aesthetic.
 */

const KIND_ICON: Record<NodeKind, React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>> = {
  workspace: PackageIcon,
  customer: PackageIcon,
  repo: GitBranchIcon,
  submodule: GitBranchIcon,
  folder: FolderIcon,
  file: FileIcon,
};

export function RepoTreeView({
  data,
  activeNodeId,
  onFileSelect,
}: {
  data: RepoGalaxieData;
  activeNodeId?: string | null;
  /** Called when a leaf-file is tapped. Parent opens the inspector-sheet. */
  onFileSelect?: (nodeId: string) => void;
}) {
  // Build children-by-parent map once.
  const childrenMap = useMemo(() => {
    const map = new Map<string | null, GraphNode[]>();
    for (const n of data.nodes) {
      const arr = map.get(n.parentId) ?? [];
      arr.push(n);
      map.set(n.parentId, arr);
    }
    // Deterministic order: folders first, then files; alphabetic inside.
    for (const arr of map.values()) {
      arr.sort((a, b) => {
        if (a.kind === 'file' && b.kind !== 'file') return 1;
        if (a.kind !== 'file' && b.kind === 'file') return -1;
        return a.label.localeCompare(b.label);
      });
    }
    return map;
  }, [data]);

  const root = data.nodes.find((n) => n.parentId === null);
  if (!root) return null;

  return (
    <ul
      role="tree"
      aria-label="Repository contents"
      className="overflow-hidden rounded-md border border-border bg-card"
      style={{ borderRadius: 'var(--vk-radius-card)' }}
    >
      <TreeNode
        node={root}
        depth={0}
        childrenMap={childrenMap}
        activeNodeId={activeNodeId}
        onFileSelect={onFileSelect}
        defaultExpanded
      />
    </ul>
  );
}

function TreeNode({
  node,
  depth,
  childrenMap,
  activeNodeId,
  onFileSelect,
  defaultExpanded = false,
}: {
  node: GraphNode;
  depth: number;
  childrenMap: Map<string | null, GraphNode[]>;
  activeNodeId?: string | null;
  onFileSelect?: (nodeId: string) => void;
  defaultExpanded?: boolean;
}) {
  const children = childrenMap.get(node.id) ?? [];
  const hasChildren = children.length > 0;
  const [expanded, setExpanded] = useState(defaultExpanded);

  const isFile = node.kind === 'file';
  const isActive = node.id === activeNodeId;
  const Icon = KIND_ICON[node.kind];
  const severityColor = node.severity ? severityHex(node.severity) : null;

  function handleActivate() {
    if (isFile) {
      onFileSelect?.(node.id);
      return;
    }
    if (hasChildren) setExpanded((v) => !v);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleActivate();
    }
  }

  return (
    <li role="treeitem" aria-expanded={hasChildren ? expanded : undefined}>
      <button
        type="button"
        onClick={handleActivate}
        onKeyDown={handleKey}
        className={cn(
          'flex w-full items-center gap-2 border-b border-border/50 px-3 text-left text-sm transition-colors',
          'min-h-[44px]',
          isActive
            ? 'bg-secondary/60 text-foreground'
            : 'text-foreground/85 hover:bg-secondary/30 active:bg-secondary/50',
        )}
        style={{ paddingLeft: 12 + depth * 16 }}
      >
        <span aria-hidden className="inline-flex w-4 shrink-0 justify-center">
          {hasChildren ? (
            expanded ? (
              <ChevronDownIcon className="size-3.5 text-muted-foreground" />
            ) : (
              <ChevronRightIcon className="size-3.5 text-muted-foreground" />
            )
          ) : null}
        </span>

        <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />

        <span className={cn('flex-1 truncate', isFile ? 'font-mono text-xs' : 'font-medium')}>
          {node.label}
        </span>

        {node.severity && severityColor ? (
          (() => {
            const SeverityLucide = SEVERITY_LUCIDE[node.severity];
            return (
              <span
                className="inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider"
                style={{
                  color: severityColor,
                  backgroundColor: `color-mix(in oklch, ${severityColor} 12%, transparent)`,
                  borderRadius: 'var(--vk-radius-sm)',
                }}
              >
                <SeverityLucide className="size-3" aria-hidden />
                {node.severity}
              </span>
            );
          })()
        ) : null}
      </button>

      {hasChildren && expanded ? (
        <ul role="group" className="contents">
          {children.map((c) => (
            <TreeNode
              key={c.id}
              node={c}
              depth={depth + 1}
              childrenMap={childrenMap}
              activeNodeId={activeNodeId}
              onFileSelect={onFileSelect}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
