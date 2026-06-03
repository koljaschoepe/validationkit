'use client';

import { useMemo, useState } from 'react';
import { ChevronRightIcon } from 'lucide-react';
import { SeverityBadge } from '@/components/ui/severity-badge';
import type { FileNode, GalaxieData, Severity } from '@/lib/galaxie/types';
import { SEVERITY_BANDS } from '@/lib/galaxie/types';
import { generateMockGalaxieData } from '@/lib/galaxie/mock-data';
import { Inspector } from './Inspector';
import { EmptyGalaxie } from './EmptyGalaxie';

const SEVERITY_RANK: Record<Severity, number> = {
  Kill: 0,
  Weak: 1,
  Mid: 2,
  Strong: 3,
  Exceptional: 4,
};

/**
 * Mobile (≤639 px) replacement for the PixiJS galaxy. Renders a flat severity-
 * sorted list of findings with severity filter chips and a 44-pt tap target
 * per row. Tapping a row opens the existing Inspector in mobile-bottom-sheet
 * mode (Inspector already detects `window.innerWidth < 640` internally).
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
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);

  const counts = useMemo(() => {
    const c: Record<Severity, number> = {
      Kill: 0, Weak: 0, Mid: 0, Strong: 0, Exceptional: 0,
    };
    for (const f of data.files) c[f.severity] += 1;
    return c;
  }, [data.files]);

  const visible = useMemo(() => {
    return data.files
      .filter((f) => active.has(f.severity))
      .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
  }, [data.files, active]);

  function toggle(sev: Severity) {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(sev)) next.delete(sev);
      else next.add(sev);
      return next;
    });
  }

  if (isEmptyRealWorkspace) {
    return <EmptyGalaxie workspaceSlug={workspaceSlug ?? 'default'} />;
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <div className="flex flex-wrap gap-1.5 border-b border-white/10 px-3 py-3">
        {SEVERITY_BANDS.map((sev) => {
          const count = counts[sev];
          if (count === 0) return null;
          const on = active.has(sev);
          return (
            <button
              key={sev}
              type="button"
              onClick={() => toggle(sev)}
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

      {visible.length === 0 ? (
        <p className="px-4 py-10 text-center text-xs text-white/40">
          No findings match the active filters.
        </p>
      ) : (
        <ul className="divide-y divide-white/5 overflow-y-auto">
          {visible.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => setSelectedFile(f)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition active:bg-white/5"
                style={{ minHeight: 44 }}
              >
                <SeverityBadge severity={f.severity} />
                <span className="min-w-0 flex-1 truncate font-mono text-xs text-white/85">
                  {f.path}
                </span>
                <ChevronRightIcon
                  className="size-4 text-white/30"
                  aria-hidden
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      {selectedFile ? (
        <Inspector
          target={{ kind: 'file', file: selectedFile }}
          onClose={() => setSelectedFile(null)}
          readOnly={readOnly}
        />
      ) : null}
    </div>
  );
}
