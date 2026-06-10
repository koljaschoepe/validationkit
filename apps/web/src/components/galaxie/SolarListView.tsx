'use client';

import { useMemo, useState } from 'react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  FileTextIcon,
  SearchXIcon,
} from 'lucide-react';
import { SeverityBadge } from '@/components/ui/severity-badge';
import { cn } from '@/lib/utils';
import type {
  FileNode,
  FolderNode,
  GalaxieData,
  InspectorTarget,
  Severity,
} from '@/lib/galaxie/types';
import { SEVERITY_BANDS } from '@/lib/galaxie/types';
import { SEVERITY_HEX } from '@/lib/galaxie/severity-colors';
import { generateMockGalaxieData } from '@/lib/galaxie/mock-data';
import { buildGalaxieTree, type RepoTreeNode } from '@/lib/galaxie/tree';
import { fileDisplayName, folderDisplayName } from '@/lib/galaxie/humanize';
import {
  GROUP_BY_OPTIONS,
  heatSegments,
  sectionsByCustomer,
  sectionsByFolder,
  sectionsByRepo,
  sectionsByRule,
  sectionsBySeverity,
  severityCounts,
  type GroupBy,
  type RepoSection,
} from '@/lib/galaxie/console-grouping';
import { Inspector } from './Inspector';
import { EmptyGalaxie } from './EmptyGalaxie';

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60';
const FOCUS_RING_INSET =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/50';
const KILL_TEXT = 'text-[var(--color-sev-kill,#f4604e)]';

/**
 * Mission-Control triage console — SaaS-Premium-Overhaul Bundle A.
 *
 * The DEFAULT workspace surface (the Pixi galaxie is now an on-demand "Map"
 * tab). Persona Lena's job is triage across 5–30 repos ("what's burning, fix it
 * first") — a sortable ranking she READS, not a spatial search. So this console
 * triage-sorts every grouping (Kill-count, then Weak, then total) with a
 * severity heat-bar per row as the "in 3 seconds" glyph, and pivots across five
 * axes (Repo · Severity · Rule · Customer · Folder). Built from the SAME
 * `buildGalaxieTree` derivation as the canvas, so the views stay in parity.
 * Fully keyboard-/screenreader-native; clicking any file/folder opens the same
 * Inspector (Datadog-pivot) as every other renderer.
 */
export function SolarListView({
  initialData,
  readOnly = false,
  workspaceSlug,
  onRepoActivate,
}: {
  initialData?: GalaxieData;
  readOnly?: boolean;
  workspaceSlug?: string;
  /**
   * Landing-only drill hook. When set, clicking a repo HEADER (repo/customer
   * group modes) fires this with the repo id instead of toggling inline
   * expansion — the landing console "zooms" into that repo's file tree on a
   * separate surface. Undefined in the workspace, where headers expand inline.
   */
  onRepoActivate?: (repoId: string) => void;
}) {
  const data = useMemo(
    () => initialData ?? generateMockGalaxieData(),
    [initialData],
  );

  const isEmptyRealWorkspace =
    initialData !== undefined && initialData.customers.length === 0;

  const [groupBy, setGroupBy] = useState<GroupBy>('repo');
  const [active, setActive] = useState<Set<Severity>>(
    () => new Set(SEVERITY_BANDS),
  );
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [target, setTarget] = useState<InspectorTarget | null>(null);

  const fullTree = useMemo(() => buildGalaxieTree(data), [data]);

  const repoLabelById = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of data.repos) m.set(r.id, r.label);
    return m;
  }, [data.repos]);

  // Files + tree restricted to the active severity-filter chips. The chips
  // control which expanded ROWS show; per-row counts/heat/sort stay
  // filter-independent (fed `data.files`) so the triage ranking is stable.
  const visibleFiles = useMemo(
    () => data.files.filter((f) => active.has(f.severity)),
    [data.files, active],
  );

  const filteredTree = useMemo<RepoTreeNode[]>(() => {
    return fullTree
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
  }, [fullTree, active]);

  const counts = useMemo(() => severityCounts(data.files), [data.files]);
  const workspaceCounts = useMemo(
    () => severityCounts(visibleFiles),
    [visibleFiles],
  );

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

  const openFile = (file: FileNode) => setTarget({ kind: 'file', file });
  const openFolder = (folder: FolderNode, files: FileNode[]) =>
    setTarget({ kind: 'folder', folder, files });

  if (isEmptyRealWorkspace) {
    return <EmptyGalaxie workspaceSlug={workspaceSlug ?? 'default'} />;
  }

  const hasAny = filteredTree.length > 0;
  const repoCount = filteredTree.length;

  // Expand/Collapse-all — only repo + customer modes nest collapsibly.
  const collapsibleIds = filteredTree.flatMap((r) => [
    r.repo.id,
    ...r.folders.map((fn) => fn.folder.id),
  ]);
  const allCollapsed =
    collapsibleIds.length > 0 &&
    collapsibleIds.every((id) => collapsed.has(id));
  const supportsCollapse = groupBy === 'repo' || groupBy === 'customer';
  const toggleAll = () =>
    setCollapsed(allCollapsed ? new Set() : new Set(collapsibleIds));

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#06080c]">
      {/* Toolbar — triage summary + group-by axes + severity filter chips.
          Row 1 keeps the desktop top-right corner clear (sm:pr-28) for the
          Console/Map view-toggle GalaxieRoot floats there in interactive mode. */}
      <div className="shrink-0 border-b border-white/10">
        <p
          role="status"
          aria-live="polite"
          className="px-3 pt-3 type-mono-sm text-white/55 sm:pr-28"
        >
          {workspaceCounts.Kill > 0 ? (
            <span className={cn('font-semibold', KILL_TEXT)}>
              {workspaceCounts.Kill} Kill
            </span>
          ) : (
            <span className="text-white/70">Keine Kill-Findings</span>
          )}
          <span className="text-white/30"> · </span>
          {visibleFiles.length} Findings
          <span className="text-white/30"> · </span>
          {repoCount} Repos
        </p>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-3">
          <div
            role="radiogroup"
            aria-label="Gruppieren nach"
            className="flex items-center gap-0.5 rounded-md border border-white/10 bg-white/[0.03] p-0.5"
          >
            {GROUP_BY_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                role="radio"
                onClick={() => setGroupBy(o.value)}
                aria-checked={groupBy === o.value}
                className={cn(
                  'rounded px-2 py-1 type-mono-sm transition-colors',
                  FOCUS_RING,
                  groupBy === o.value
                    ? 'bg-white/15 text-white'
                    : 'text-white/50 hover:bg-white/5 hover:text-white',
                )}
              >
                {o.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5">
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
                  className={cn(
                    'rounded px-2 py-1 type-mono-sm',
                    FOCUS_RING,
                    on
                      ? 'bg-white/10 text-white'
                      : 'bg-white/5 text-white/40 line-through',
                  )}
                >
                  {count} {sev}
                </button>
              );
            })}
          </div>

          {supportsCollapse && hasAny ? (
            <button
              type="button"
              onClick={toggleAll}
              className={cn(
                'ml-auto rounded px-2 py-1 type-mono-sm text-white/50 transition-colors hover:bg-white/5 hover:text-white',
                FOCUS_RING,
              )}
            >
              {allCollapsed ? 'Alle aufklappen' : 'Alle zuklappen'}
            </button>
          ) : null}
        </div>
      </div>

      {!hasAny ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-10 text-center">
          <SearchXIcon className="size-6 text-white/30" aria-hidden />
          <p className="text-xs text-white/50">
            Keine Findings für die aktiven Filter.
          </p>
          <button
            type="button"
            onClick={() => setActive(new Set(SEVERITY_BANDS))}
            className={cn(
              'rounded-md border border-white/15 px-3 py-1.5 type-mono-sm text-white/80 transition-colors hover:bg-white/5',
              FOCUS_RING,
            )}
          >
            Filter zurücksetzen
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pb-4">
          {groupBy === 'repo' && (
            <RepoGroup
              sections={sectionsByRepo(filteredTree, data.files)}
              collapsed={collapsed}
              onToggle={toggleCollapse}
              onSelectFile={openFile}
              onRepoActivate={onRepoActivate}
            />
          )}

          {groupBy === 'customer' &&
            sectionsByCustomer(data, filteredTree, data.files).map((cs) => (
              <section key={cs.customer.id}>
                <SectionHeader
                  label={cs.customer.label}
                  sublabel="Kunde"
                  counts={cs.counts}
                />
                <RepoGroup
                  sections={cs.repos}
                  collapsed={collapsed}
                  onToggle={toggleCollapse}
                  onSelectFile={openFile}
                  onRepoActivate={onRepoActivate}
                  indent
                />
              </section>
            ))}

          {groupBy === 'severity' &&
            sectionsBySeverity(visibleFiles).map((sec) => (
              <section key={sec.severity}>
                <SectionHeader
                  label={`${sec.severity}`}
                  sublabel={`${sec.files.length} Findings`}
                  badge={sec.severity}
                />
                {sec.files.map((file) => (
                  <FileRow
                    key={file.id}
                    file={file}
                    indent={2}
                    context={repoLabelById.get(file.repoId)}
                    onSelect={() => openFile(file)}
                  />
                ))}
              </section>
            ))}

          {groupBy === 'rule' &&
            sectionsByRule(visibleFiles).map((sec) => (
              <section key={sec.key}>
                <SectionHeader
                  label={sec.label}
                  sublabel={`${sec.files.length} Findings`}
                  counts={sec.counts}
                />
                {sec.files.map((file) => (
                  <FileRow
                    key={file.id}
                    file={file}
                    indent={2}
                    context={repoLabelById.get(file.repoId)}
                    onSelect={() => openFile(file)}
                  />
                ))}
              </section>
            ))}

          {groupBy === 'folder' &&
            sectionsByFolder(filteredTree).map((sec) => (
              <button
                key={sec.folder.id}
                type="button"
                onClick={() => openFolder(sec.folder, sec.files)}
                className={cn(
                  'flex w-full items-center gap-2.5 border-b border-white/[0.06] px-3 py-2.5 text-left transition hover:bg-white/[0.03] active:bg-white/5',
                  FOCUS_RING_INSET,
                )}
                style={{ minHeight: 44 }}
              >
                <SeverityBadge severity={sec.folder.aggregateSeverity} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-xs text-white/90">
                      {folderDisplayName(sec.folder)}
                    </span>
                    {sec.folder.nucleus ? (
                      <FileTextIcon
                        className="size-3 shrink-0 text-amber-200/70"
                        aria-label="Hat eine governing Context-Datei"
                      />
                    ) : null}
                  </span>
                  <span className="block truncate font-mono text-[10px] text-white/35">
                    {sec.repoLabel} · {sec.folder.name}/
                  </span>
                </span>
                {sec.counts.Kill > 0 ? (
                  <span className={cn('shrink-0 type-mono-sm font-semibold', KILL_TEXT)}>
                    {sec.counts.Kill} Kill
                  </span>
                ) : null}
                <HeatBar counts={sec.counts} className="hidden w-24 sm:flex" />
                <span className="shrink-0 type-mono-sm text-white/35">
                  {sec.files.length}
                </span>
                <ChevronRightIcon
                  className="size-4 shrink-0 text-white/30"
                  aria-hidden
                />
              </button>
            ))}
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

// ── Repo group (shared by Repo + Customer modes) ─────────────────────────────

function RepoGroup({
  sections,
  collapsed,
  onToggle,
  onSelectFile,
  onRepoActivate,
  indent = false,
}: {
  sections: RepoSection[];
  collapsed: Set<string>;
  onToggle: (id: string) => void;
  onSelectFile: (file: FileNode) => void;
  onRepoActivate?: (repoId: string) => void;
  indent?: boolean;
}) {
  return (
    <>
      {sections.map((section) => {
        // Landing drill mode: the header navigates into the repo (no inline
        // expansion). Workspace mode: the header toggles inline expansion.
        const drillMode = onRepoActivate != null;
        const repoCollapsed = drillMode || collapsed.has(section.repo.id);
        return (
          <section key={section.repo.id}>
            <button
              type="button"
              onClick={() =>
                drillMode
                  ? onRepoActivate(section.repo.id)
                  : onToggle(section.repo.id)
              }
              aria-expanded={drillMode ? undefined : !repoCollapsed}
              aria-label={
                drillMode ? `${section.repo.label} öffnen` : undefined
              }
              className={cn(
                'flex w-full items-center gap-2.5 border-b border-white/10 bg-white/[0.03] px-3 py-2.5 text-left transition hover:bg-white/[0.06] active:bg-white/10',
                FOCUS_RING_INSET,
                indent && 'pl-7',
              )}
              style={{ minHeight: 44 }}
            >
              {drillMode ? (
                <span className="w-4 shrink-0" aria-hidden />
              ) : (
                <Chevron open={!repoCollapsed} />
              )}
              <SeverityBadge severity={section.repo.aggregateSeverity} />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-white">
                {section.repo.label}
              </span>
              {section.counts.Kill > 0 ? (
                <span className={cn('shrink-0 type-mono-sm font-semibold', KILL_TEXT)}>
                  {section.counts.Kill} Kill
                </span>
              ) : null}
              <HeatBar counts={section.counts} className="hidden w-28 sm:flex" />
              <span className="shrink-0 type-mono-sm text-white/35">
                {section.fileCount}
              </span>
              {drillMode ? (
                <ChevronRightIcon
                  className="size-4 shrink-0 text-white/30"
                  aria-hidden
                />
              ) : null}
            </button>

            {repoCollapsed ? null : (
              <>
                {section.tree.folders.map((fn) => (
                  <FolderBranch
                    key={fn.folder.id}
                    folder={fn.folder}
                    files={fn.files}
                    collapsed={collapsed.has(fn.folder.id)}
                    onToggle={() => onToggle(fn.folder.id)}
                    onSelectFile={onSelectFile}
                  />
                ))}
                {section.tree.rootFiles.map((file) => (
                  <FileRow
                    key={file.id}
                    file={file}
                    indent={2}
                    onSelect={() => onSelectFile(file)}
                  />
                ))}
              </>
            )}
          </section>
        );
      })}
    </>
  );
}

function SectionHeader({
  label,
  sublabel,
  counts,
  badge,
}: {
  label: string;
  sublabel?: string;
  counts?: Record<Severity, number>;
  badge?: Severity;
}) {
  return (
    <div className="flex items-center gap-2.5 border-b border-white/10 bg-white/[0.05] px-3 py-2">
      {badge ? <SeverityBadge severity={badge} /> : null}
      <span className="min-w-0 flex-1 truncate text-xs font-semibold uppercase tracking-wide text-white/70">
        {label}
      </span>
      {counts && counts.Kill > 0 ? (
        <span className={cn('shrink-0 type-mono-sm font-semibold', KILL_TEXT)}>
          {counts.Kill} Kill
        </span>
      ) : null}
      {counts ? <HeatBar counts={counts} className="hidden w-24 sm:flex" /> : null}
      {sublabel ? (
        <span className="shrink-0 type-mono-sm text-white/35">{sublabel}</span>
      ) : null}
    </div>
  );
}

function HeatBar({
  counts,
  className,
}: {
  counts: Record<Severity, number>;
  className?: string;
}) {
  const segs = heatSegments(counts);
  if (segs.length === 0) return null;
  const label = segs.map((s) => `${s.count} ${s.severity}`).join(', ');
  return (
    <span
      role="img"
      aria-label={`Severity-Verteilung: ${label}`}
      className={cn(
        'h-1.5 shrink-0 overflow-hidden rounded-full bg-white/5',
        className,
      )}
    >
      {segs.map((s) => (
        <span
          key={s.severity}
          className="h-full first:rounded-l-full last:rounded-r-full"
          style={{
            flexBasis: `${s.pct}%`,
            flexGrow: 0,
            flexShrink: 0,
            backgroundColor: SEVERITY_HEX[s.severity],
          }}
        />
      ))}
    </span>
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
        className={cn(
          'flex w-full items-center gap-2.5 px-3 py-2.5 pl-7 text-left transition active:bg-white/5',
          FOCUS_RING_INSET,
        )}
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
                aria-label="Hat eine governing Context-Datei"
              />
            ) : null}
            {folder.isSubmodule ? (
              <span
                className="shrink-0 rounded bg-[#5eead4]/15 px-1 py-0.5 text-[9px] uppercase tracking-wide text-[#5eead4]/80"
                aria-label="Git-Submodul (geteilter Team-Context)"
              >
                Submodul
              </span>
            ) : null}
          </span>
          <span className="block truncate font-mono text-[10px] text-white/30">
            {folder.name}/
          </span>
        </span>
        <span className="shrink-0 type-mono-sm text-white/35">
          {files.length}
        </span>
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
  context,
  onSelect,
}: {
  file: FileNode;
  indent: number;
  context?: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-white/[0.02] active:bg-white/5',
        FOCUS_RING_INSET,
      )}
      style={{ minHeight: 44, paddingLeft: indent * 16 }}
    >
      <SeverityBadge severity={file.severity} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs text-white/85">
          {fileDisplayName(file)}
        </span>
        <span className="block truncate font-mono text-[10px] text-white/35">
          {context ? `${context} · ` : ''}
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
