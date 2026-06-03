'use client';

import { SeverityBadge } from '@/components/ui/severity-badge';
import type { FileNode, FolderNode } from '@/lib/galaxie/types';

export type TooltipTarget =
  | { kind: 'file'; file: FileNode }
  | { kind: 'folder'; folder: FolderNode };

export interface TooltipState {
  x: number;
  y: number;
  target: TooltipTarget;
}

export function GalaxieTooltip({ state }: { state: TooltipState }) {
  const { x, y, target } = state;
  if (target.kind === 'file') {
    const { file } = target;
    return (
      <div
        className="pointer-events-none absolute z-20 max-w-xs rounded border border-white/10 bg-black/85 px-3 py-2 font-mono text-xs text-white shadow-lg backdrop-blur"
        style={{ left: x + 16, top: y + 12 }}
      >
        <div className="flex items-baseline justify-between gap-2 pb-1">
          <span className="text-white/90">{file.path}</span>
          <SeverityBadge severity={file.severity} />
        </div>
        <div className="text-white/70">{file.findingSnippet}</div>
      </div>
    );
  }
  const { folder } = target;
  return (
    <div
      className="pointer-events-none absolute z-20 max-w-xs rounded border border-white/10 bg-black/85 px-3 py-2 font-mono text-xs text-white shadow-lg backdrop-blur"
      style={{ left: x + 16, top: y + 12 }}
    >
      <div className="flex items-baseline justify-between gap-2 pb-1">
        <span className="text-white/90">{folder.name}/</span>
        <SeverityBadge severity={folder.aggregateSeverity} />
      </div>
      <div className="text-white/70">
        {folder.fileCount} {folder.fileCount === 1 ? 'finding' : 'findings'}
      </div>
    </div>
  );
}
