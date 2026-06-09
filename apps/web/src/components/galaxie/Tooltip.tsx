'use client';

import { SeverityBadge } from '@/components/ui/severity-badge';
import type { FileNode, FolderNode } from '@/lib/galaxie/types';
import {
  fileDisplayName,
  fileSubtitle,
  fileVendor,
  folderDisplayName,
  folderSubtitle,
} from '@/lib/galaxie/humanize';

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
    const subtitle = fileSubtitle(file);
    const vendor = fileVendor(file);
    return (
      <div
        className="pointer-events-none absolute z-20 max-w-xs rounded border border-white/10 bg-black/85 px-3 py-2 text-xs text-white shadow-lg backdrop-blur"
        style={{ left: x + 16, top: y + 12 }}
      >
        <div className="flex items-baseline justify-between gap-2 pb-0.5">
          <span className="font-medium text-white/95">{fileDisplayName(file)}</span>
          <SeverityBadge severity={file.severity} />
        </div>
        {subtitle ? (
          <div className="flex items-center gap-1.5 pb-1 text-white/55">
            <span>{subtitle}</span>
            {vendor ? <VendorPill vendor={vendor} /> : null}
          </div>
        ) : null}
        <div className="font-mono text-[11px] text-white/40">{file.path}</div>
        <div className="mt-1 text-white/70">{file.findingSnippet}</div>
      </div>
    );
  }
  const { folder } = target;
  return (
    <div
      className="pointer-events-none absolute z-20 max-w-xs rounded border border-white/10 bg-black/85 px-3 py-2 text-xs text-white shadow-lg backdrop-blur"
      style={{ left: x + 16, top: y + 12 }}
    >
      <div className="flex items-baseline justify-between gap-2 pb-0.5">
        <span className="font-medium text-white/95">{folderDisplayName(folder)}</span>
        <SeverityBadge severity={folder.aggregateSeverity} />
      </div>
      <div className="pb-1 text-white/55">{folderSubtitle(folder)}</div>
      <div className="font-mono text-[11px] text-white/40">{folder.name}/</div>
      <div className="mt-1 text-white/70">
        {folder.fileCount} {folder.fileCount === 1 ? 'file' : 'files'}
      </div>
    </div>
  );
}

function VendorPill({ vendor }: { vendor: string }) {
  return (
    <span className="rounded bg-white/10 px-1 py-0.5 text-[10px] uppercase tracking-wide text-white/60">
      {vendor}
    </span>
  );
}
