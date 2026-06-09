'use client';

import { useMemo, useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon, FileTextIcon } from 'lucide-react';
import { SeverityBadge } from '@/components/ui/severity-badge';
import type {
  FileNode,
  FolderNode,
  GalaxieData,
  InspectorTarget,
  Severity,
} from '@/lib/galaxie/types';
import { SEVERITY_BANDS } from '@/lib/galaxie/types';
import { generateMockGalaxieData } from '@/lib/galaxie/mock-data';
import { buildGalaxieTree } from '@/lib/galaxie/tree';
import { fileDisplayName, folderDisplayName } from '@/lib/galaxie/humanize';
import { Inspector } from './Inspector';
import { EmptyGalaxie } from './EmptyGalaxie';

/**
 * Reduced-motion / mobile (≤639 px) replacement for the PixiJS galaxy, and the
 * canonical keyboard surface. Galaxie-Redesign Phase G: a hierarchical
 * repo→folder→file tree (collapsible, aggregate-severity rows) built from the
 * SAME `buildGalaxieTree`/`computeSolarLayout` derivation as the canvas, so the
 * three renderers stay in parity. Tapping a file opens the Inspector.
 */
export function SolarListView({
  initialData,
  readOnly = false,
  workspaceSlug,
}: {
  initialData?: GalaxieData;
  readOnly?: boolean;
  workspaceSlug?: string;
}) {
  const data = useMemo(
    () => initialData ?? generateMockGalaxieData(),
    [initialData],
  );

  const isEmptyRealWorkspace =
    initialData !== undefined && initialData.customers.length === 0;

  const [active, setActive] = useState<Set<Severity>>(
    () => new Set(SEVERITY_BANDS),
  );
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [target, setTarget] = useState<InspectorTarget | null>(null);

  const tree = useMemo(() => buildGalaxieTree(data), [data]);

  const counts = useMemo(() => {
    const c: Record<Severity, number> = {
      Kill: 0, Weak: 0, Mid: 0, Strong: 0, Exceptional: 0,
    };
    for (const f of data.files) c[f.severity] += 1;
    return c;
  }, [data.files]);

  // Apply the severity filter, dropping empty folders + empty repos.
  const filtered = useMemo(() => {
    return tree
      .map((repo) => ({
        repo: repo.repo,
        folders: repo.folders
          .map((fn) => ({
            folder: fn.folder,
            files: fn.files.filter((f) => active.has(f.severity)),
          }))
          .filter((fn) => fn.files.length > 0),
        rootFiles: repo.rootFiles.filter((f) => active.has(f.severity)),
      }))
      .filter((r) => r.folders.length > 0 || r.rootFiles.length > 0);
  }, [tree, active]);

  function toggleSeverity(sev: Severity) {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(sev)) next.delete(sev);
      else next.add(sev);
      return next;
    });
  }

  function toggleCollapse(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (isEmptyRealWorkspace) {
    return <EmptyGalaxie workspaceSlug={workspaceSlug ?? 'default'} />;
  }

  const hasAny = filtered.length > 0;

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#06080c]">
      <div className="flex flex-wrap gap-1.5 border-b border-white/10 px-3 py-3">
        {SEVERITY_BANDS.map((sev) => {
          const count = counts[sev];
          if (count === 0) return null;
          const on = active.has(sev);
          return (
            <button
              key={sev}
              type="button"
              onClick={() => toggleSeverity(sev)}
              aria-pressed={on}
              className={
                on
                  ? 'rounded bg-white/10 px-2 py-1 type-mono-sm text-white'
                  : 'rounded bg-white/5 px-2 py-1 type-mono-sm text-white/40 line-through'
              }
            >
              {count} {sev}
            </button>
          );
        })}
      </div>

      {!hasAny ? (
        <p className="px-4 py-10 text-center text-xs text-white/40">
          No findings match the active filters.
        </p>
      ) : (
        <div className="h-[calc(100%-3.25rem)] overflow-y-auto pb-4">
          {filtered.map((repo) => {
            const repoCollapsed = collapsed.has(repo.repo.id);
            const fileCount =
              repo.folders.reduce((n, f) => n + f.files.length, 0) +
              repo.rootFiles.length;
            return (
              <section key={repo.repo.id}>
                <button
                  type="button"
                  onClick={() => toggleCollapse(repo.repo.id)}
                  aria-expanded={!repoCollapsed}
                  className="flex w-full items-center gap-2.5 border-b border-white/10 bg-white/[0.03] px-3 py-2.5 text-left transition active:bg-white/10"
                  style={{ minHeight: 44 }}
                >
                  <Chevron open={!repoCollapsed} />
                  <SeverityBadge severity={repo.repo.aggregateSeverity} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-white">
                    {repo.repo.label}
                  </span>
                  <span className="shrink-0 type-mono-sm text-white/35">
                    {fileCount}
                  </span>
                </button>

                {repoCollapsed ? null : (
                  <>
                    {repo.folders.map((fn) => (
                      <FolderBranch
                        key={fn.folder.id}
                        folder={fn.folder}
                        files={fn.files}
                        collapsed={collapsed.has(fn.folder.id)}
                        onToggle={() => toggleCollapse(fn.folder.id)}
                        onSelectFile={(file) => setTarget({ kind: 'file', file })}
                      />
                    ))}
                    {repo.rootFiles.map((file) => (
                      <FileRow
                        key={file.id}
                        file={file}
                        indent={2}
                        onSelect={() => setTarget({ kind: 'file', file })}
                      />
                    ))}
                  </>
                )}
              </section>
            );
          })}
        </div>
      )}

      {target ? (
        <Inspector
          target={target}
          onClose={() => setTarget(null)}
          onSelectFile={(file) => setTarget({ kind: 'file', file })}
          readOnly={readOnly}
        />
      ) : null}
    </div>
  );
}

function FolderBranch({
  folder,
  files,
  collapsed,
  onToggle,
  onSelectFile,
}: {
  folder: FolderNode;
  files: FileNode[];
  collapsed: boolean;
  onToggle: () => void;
  onSelectFile: (file: FileNode) => void;
}) {
  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={!collapsed}
        className="flex w-full items-center gap-2.5 px-3 py-2.5 pl-7 text-left transition active:bg-white/5"
        style={{ minHeight: 44 }}
      >
        <Chevron open={!collapsed} />
        <SeverityBadge severity={folder.aggregateSeverity} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-xs text-white/90">
              {folderDisplayName(folder)}
            </span>
            {folder.nucleus ? (
              <FileTextIcon
                className="size-3 shrink-0 text-amber-200/70"
                aria-label="Has a governing context file"
              />
            ) : null}
            {folder.isSubmodule ? (
              <span
                className="shrink-0 rounded bg-[#5eead4]/15 px-1 py-0.5 text-[9px] uppercase tracking-wide text-[#5eead4]/80"
                aria-label="Git submodule (shared team context)"
              >
                submodule
              </span>
            ) : null}
          </span>
          <span className="block truncate font-mono text-[10px] text-white/30">
            {folder.name}/
          </span>
        </span>
        <span className="shrink-0 type-mono-sm text-white/35">{files.length}</span>
      </button>
      {collapsed
        ? null
        : files.map((file) => (
            <FileRow
              key={file.id}
              file={file}
              indent={3}
              onSelect={() => onSelectFile(file)}
            />
          ))}
    </>
  );
}

function FileRow({
  file,
  indent,
  onSelect,
}: {
  file: FileNode;
  indent: number;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition active:bg-white/5"
      style={{ minHeight: 44, paddingLeft: indent * 16 }}
    >
      <SeverityBadge severity={file.severity} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs text-white/85">
          {fileDisplayName(file)}
        </span>
        <span className="block truncate font-mono text-[10px] text-white/35">
          {file.path}
        </span>
      </span>
      <ChevronRightIcon className="size-4 shrink-0 text-white/30" aria-hidden />
    </button>
  );
}

function Chevron({ open }: { open: boolean }) {
  return open ? (
    <ChevronDownIcon className="size-4 shrink-0 text-white/40" aria-hidden />
  ) : (
    <ChevronRightIcon className="size-4 shrink-0 text-white/40" aria-hidden />
  );
}
