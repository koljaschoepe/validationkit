'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
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
import { severityColorVar } from '@/lib/galaxie/severity-colors';
import { generateMockGalaxieData } from '@/lib/galaxie/mock-data';
import { buildGalaxieTree, type RepoTreeNode } from '@/lib/galaxie/tree';
import { fileDisplayName, folderDisplayName } from '@/lib/galaxie/humanize';
import {
  GROUP_BY_OPTIONS,
  sectionsByCustomer,
  sectionsByRepo,
  sectionsByRule,
  severityCounts,
  worstSeverity,
  UNCATEGORIZED_KEY,
  type GroupBy,
  type RepoSection,
} from '@/lib/galaxie/console-grouping';
import { Inspector } from './Inspector';
import { EmptyGalaxie } from './EmptyGalaxie';

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60';
const FOCUS_RING_INSET =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/50';
const KILL_TEXT = 'text-[var(--color-sev-kill)]';

// Saved-Views (Block E) — seed the triage filters from the URL query so a
// shared/deep-linked console view restores group-by + severity + rule filters.
function seedGroupBy(raw: string | null): GroupBy {
  return raw === 'customer' ? 'customer' : 'repo';
}

function seedSeverities(raw: string | null): Set<Severity> {
  if (!raw) return new Set(SEVERITY_BANDS);
  const wanted = raw.split(',');
  const picked = SEVERITY_BANDS.filter((s) => wanted.includes(s));
  return picked.length ? new Set(picked) : new Set(SEVERITY_BANDS);
}

function seedCats(
  raw: string | null,
  ruleSections: ReadonlyArray<{ key: string }>,
): Set<string> {
  const all = ruleSections.map((r) => r.key);
  if (!raw) return new Set(all);
  const wanted = raw.split(',').filter((k) => all.includes(k));
  return wanted.length ? new Set(wanted) : new Set(all);
}

/**
 * Mission-Control triage console — the workspace surface.
 *
 * Persona Lena's job is triage across 5–30 repos ("what's burning, fix it
 * first") — a sortable ranking she READS, not a spatial search. So this console
 * triage-sorts each grouping (Kill-count, then Weak, then total) and shows a calm
 * worst-severity dot + Kill-count per row as the "in 3 seconds" glyph.
 *
 * Visual-overhaul (Jun 2026): grouping is just two axes — Repo and Customer
 * (organisation). Severity (chips) and Rule (a "Regel" disclosure) are FILTERS;
 * folders nest inside a repo. Built from `buildGalaxieTree`; fully keyboard-/
 * screenreader-native; clicking a file opens the same Inspector as every renderer.
 */
export function SolarListView({
  initialData,
  readOnly = false,
  workspaceSlug,
  onRepoActivate,
  urlState = false,
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
  /** Saved-Views (Block E): sync the triage filters to the URL — workspace only. */
  urlState?: boolean;
}) {
  const data = useMemo(
    () => initialData ?? generateMockGalaxieData(),
    [initialData],
  );

  const isEmptyRealWorkspace =
    initialData !== undefined && initialData.customers.length === 0;

  // Audit-rule categories present in the data → the "Regel" filter options.
  const ruleSections = useMemo(
    () => sectionsByRule(data.files),
    [data.files],
  );

  // Saved-Views (Block E): in the workspace (urlState) the triage filters live
  // in the URL so a view is shareable/deep-linkable. Seeded from the query on
  // mount; written back by the effect below. The landing demo (urlState=false)
  // keeps purely-local state so it can never rewrite the marketing URL.
  const router = useRouter();
  const pathname = usePathname();
  const seededRef = useRef(false);

  const [groupBy, setGroupBy] = useState<GroupBy>('repo');
  const [active, setActive] = useState<Set<Severity>>(
    () => new Set(SEVERITY_BANDS),
  );
  // Rule filter: all present categories on by default (empty filter = show all).
  const [activeCats, setActiveCats] = useState<Set<string>>(
    () => new Set(ruleSections.map((r) => r.key)),
  );
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [target, setTarget] = useState<InspectorTarget | null>(null);

  // Seed the filters from the URL once on mount (workspace only). Reads
  // window.location instead of useSearchParams() so the static landing build
  // (which also renders this component) isn't forced into a Suspense bailout.
  useEffect(() => {
    if (!urlState || seededRef.current) return;
    const sp = new URLSearchParams(window.location.search);
    setGroupBy(seedGroupBy(sp.get('group')));
    setActive(seedSeverities(sp.get('sev')));
    setActiveCats(seedCats(sp.get('rule'), ruleSections));
    seededRef.current = true;
  }, [urlState, ruleSections]);

  // Write the active filters back to the URL after seeding (workspace only).
  useEffect(() => {
    if (!urlState || !seededRef.current) return;
    const params = new URLSearchParams();
    if (groupBy !== 'repo') params.set('group', groupBy);
    const sevOn = SEVERITY_BANDS.filter((s) => active.has(s));
    if (sevOn.length !== SEVERITY_BANDS.length)
      params.set('sev', sevOn.join(','));
    const ruleKeys = ruleSections.map((r) => r.key);
    const ruleOn = ruleKeys.filter((k) => activeCats.has(k));
    if (ruleOn.length !== ruleKeys.length) params.set('rule', ruleOn.join(','));
    const qs = params.toString();
    router.replace((qs ? `${pathname}?${qs}` : pathname) as never, {
      scroll: false,
    });
  }, [urlState, groupBy, active, activeCats, ruleSections, pathname, router]);

  // A file is visible when its severity chip is on AND its rule category is on.
  const passesFilter = useCallback(
    (f: FileNode) =>
      active.has(f.severity) && activeCats.has(f.category ?? UNCATEGORIZED_KEY),
    [active, activeCats],
  );

  const fullTree = useMemo(() => buildGalaxieTree(data), [data]);

  // Files + tree restricted to the active filters. The chips control which
  // expanded ROWS show; per-row counts/sort stay filter-independent (fed
  // `data.files`) so the triage ranking is stable.
  const visibleFiles = useMemo(
    () => data.files.filter(passesFilter),
    [data.files, passesFilter],
  );

  const filteredTree = useMemo<RepoTreeNode[]>(() => {
    return fullTree
      .map((repo) => ({
        repo: repo.repo,
        folders: repo.folders
          .map((fn) => ({
            folder: fn.folder,
            files: fn.files.filter(passesFilter),
          }))
          .filter((fn) => fn.files.length > 0),
        rootFiles: repo.rootFiles.filter(passesFilter),
      }))
      .filter((r) => r.folders.length > 0 || r.rootFiles.length > 0);
  }, [fullTree, passesFilter]);

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

  function toggleCategory(key: string) {
    setActiveCats((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function resetFilters() {
    setActive(new Set(SEVERITY_BANDS));
    setActiveCats(new Set(ruleSections.map((r) => r.key)));
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
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-background">
      {/* Toolbar — triage summary + group-by (Repo/Kunde) + severity & rule filters. */}
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

          {/* Severity filter chips — colored dot + band + count, dimmed when off. */}
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
                    'flex items-center gap-1.5 rounded px-2 py-1 type-mono-sm transition-opacity',
                    FOCUS_RING,
                    on
                      ? 'bg-white/10 text-white'
                      : 'bg-white/[0.03] text-white/58 opacity-60',
                  )}
                >
                  <span
                    className="size-1.5 shrink-0 rounded-full"
                    style={{ background: severityColorVar(sev) }}
                    aria-hidden
                  />
                  {sev}
                  <span className="text-white/58">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Rule filter — native <details> disclosure (a11y-free, no extra deps). */}
          {ruleSections.length > 1 ? (
            <details className="group relative">
              <summary
                className={cn(
                  'flex cursor-pointer list-none items-center gap-1 rounded px-2 py-1 type-mono-sm text-white/55 transition-colors hover:text-white [&::-webkit-details-marker]:hidden',
                  FOCUS_RING,
                )}
              >
                Regel
                {activeCats.size < ruleSections.length ? (
                  <span className="text-white/80">
                    {activeCats.size}/{ruleSections.length}
                  </span>
                ) : null}
                <ChevronDownIcon
                  className="size-3 transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <div className="absolute left-0 z-20 mt-1 w-60 rounded-md border border-white/10 bg-popover p-1 shadow-xl shadow-black/40">
                {ruleSections.map((r) => {
                  const on = activeCats.has(r.key);
                  return (
                    <label
                      key={r.key}
                      className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs text-white/80 hover:bg-white/5"
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggleCategory(r.key)}
                        className="size-3.5 accent-white"
                      />
                      <span className="min-w-0 flex-1 truncate">{r.label}</span>
                      <span className="shrink-0 type-mono-sm text-white/35">
                        {r.files.length}
                      </span>
                    </label>
                  );
                })}
              </div>
            </details>
          ) : null}

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
            onClick={resetFilters}
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
              <SeverityDot counts={section.counts} />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-white">
                {section.repo.label}
              </span>
              {section.counts.Kill > 0 ? (
                <span className={cn('shrink-0 type-mono-sm font-semibold', KILL_TEXT)}>
                  {section.counts.Kill} Kill
                </span>
              ) : null}
              <span className="shrink-0 type-mono-sm text-white/35">
                {section.fileCount} Findings
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
}: {
  label: string;
  sublabel?: string;
  counts?: Record<Severity, number>;
}) {
  return (
    <div className="flex items-center gap-2.5 border-b border-white/10 bg-white/[0.05] px-3 py-2">
      {counts ? <SeverityDot counts={counts} /> : null}
      <span className="min-w-0 flex-1 truncate text-xs font-semibold uppercase tracking-wide text-white/70">
        {label}
      </span>
      {counts && counts.Kill > 0 ? (
        <span className={cn('shrink-0 type-mono-sm font-semibold', KILL_TEXT)}>
          {counts.Kill} Kill
        </span>
      ) : null}
      {sublabel ? (
        <span className="shrink-0 type-mono-sm text-white/35">{sublabel}</span>
      ) : null}
    </div>
  );
}

/**
 * Calm "how bad" glyph: a single dot in the row's WORST severity color. Replaces
 * the old 5-color heat-bar. Color is paired with the row's Kill-count + total, so
 * it never carries severity by hue alone (color-blind safe). `aria-label` names
 * the worst band for screen readers.
 */
function SeverityDot({ counts }: { counts: Record<Severity, number> }) {
  const worst = worstSeverity(counts);
  if (!worst) {
    return <span className="size-2 shrink-0" aria-hidden />;
  }
  return (
    <span
      role="img"
      aria-label={`Schlimmste Severity: ${worst}`}
      className="size-2 shrink-0 rounded-full"
      style={{ background: severityColorVar(worst) }}
    />
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
                className="size-3 shrink-0 text-white/58"
                aria-label="Hat eine governing Context-Datei"
              />
            ) : null}
            {folder.isSubmodule ? (
              <span
                className="shrink-0 rounded bg-white/10 px-1 py-0.5 text-[9px] uppercase tracking-wide text-white/55"
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
    <ChevronDownIcon className="size-4 shrink-0 text-white/58" aria-hidden />
  ) : (
    <ChevronRightIcon className="size-4 shrink-0 text-white/58" aria-hidden />
  );
}
