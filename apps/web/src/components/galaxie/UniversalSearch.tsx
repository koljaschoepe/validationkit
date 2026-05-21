'use client';

import { Command } from 'cmdk';
import { useEffect, useMemo, useState } from 'react';
import { SearchIcon } from 'lucide-react';
import type { Customer, FileNode, GalaxieData } from '@/lib/galaxie/types';
import { severityHex } from '@/lib/galaxie/severity-colors';

export interface SearchResult {
  kind: 'customer' | 'file';
  id: string;
  customer: Customer;
  file?: FileNode;
}

export function UniversalSearch({
  onPick,
  data,
}: {
  onPick: (result: SearchResult) => void;
  data: GalaxieData;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const { customers, files } = data;

  const customerById = useMemo(
    () => new Map(customers.map((c) => [c.id, c])),
    [customers],
  );

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="pointer-events-auto absolute bottom-2 left-2 z-20 flex items-center gap-2 rounded border border-white/10 bg-black/70 px-2.5 py-1.5 font-mono text-xs text-white/80 backdrop-blur transition hover:bg-black/85"
      >
        <SearchIcon className="size-3" />
        <span>Search</span>
        <kbd className="rounded bg-white/10 px-1 type-mono-sm text-white/60">⌘K</kbd>
      </button>
    );
  }

  return (
    <div
      className="pointer-events-auto absolute inset-0 z-30 flex items-start justify-center bg-black/40 pt-24 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <Command
        label="Universal search"
        shouldFilter={false}
        className="w-full max-w-md overflow-hidden rounded-lg border border-white/15 bg-neutral-950 shadow-2xl"
      >
        <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
          <SearchIcon className="size-4 text-white/40" />
          <Command.Input
            value={query}
            onValueChange={setQuery}
            placeholder="Suche Customer, Repo, File…"
            className="flex-1 bg-transparent font-mono text-sm text-white placeholder-white/30 outline-none"
            autoFocus
          />
          <kbd className="rounded bg-white/10 px-1 type-mono-sm text-white/50">ESC</kbd>
        </div>
        <Command.List className="max-h-72 overflow-y-auto p-1">
          <Command.Empty className="px-3 py-4 text-center font-mono text-xs text-white/40">
            Keine Treffer.
          </Command.Empty>
          {query.length === 0 ? (
            <Command.Group heading="Customers">
              {customers.map((c) => (
                <Command.Item
                  key={c.id}
                  value={c.id}
                  onSelect={() => {
                    onPick({ kind: 'customer', id: c.id, customer: c });
                    setOpen(false);
                  }}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 font-mono text-xs text-white/85 aria-selected:bg-white/10"
                >
                  <span
                    className="inline-block size-2 rounded-full"
                    style={{ background: severityHex(c.aggregateSeverity) }}
                  />
                  {c.label}
                  <span className="ml-auto type-mono-sm text-white/40">
                    {c.aggregateSeverity}
                  </span>
                </Command.Item>
              ))}
            </Command.Group>
          ) : (
            renderSearchHits(query, customers, files, customerById, (res) => {
              onPick(res);
              setOpen(false);
            })
          )}
        </Command.List>
      </Command>
    </div>
  );
}

function renderSearchHits(
  query: string,
  customers: Customer[],
  files: FileNode[],
  customerById: Map<string, Customer>,
  pick: (res: SearchResult) => void,
) {
  const q = query.toLowerCase();
  const customerHits = customers.filter(
    (c) => c.label.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q),
  );
  const fileHits = files
    .filter((f) => f.path.toLowerCase().includes(q))
    .slice(0, 20);
  return (
    <>
      {customerHits.length > 0 && (
        <Command.Group heading="Customers">
          {customerHits.map((c) => (
            <Command.Item
              key={c.id}
              value={`cust-${c.id}`}
              onSelect={() => pick({ kind: 'customer', id: c.id, customer: c })}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 font-mono text-xs text-white/85 aria-selected:bg-white/10"
            >
              <span
                className="inline-block size-2 rounded-full"
                style={{ background: severityHex(c.aggregateSeverity) }}
              />
              {c.label}
              <span className="ml-auto type-mono-sm text-white/40">
                {c.aggregateSeverity}
              </span>
            </Command.Item>
          ))}
        </Command.Group>
      )}
      {fileHits.length > 0 && (
        <Command.Group heading="Files">
          {fileHits.map((f) => {
            const c = customerById.get(f.customerId);
            if (!c) return null;
            return (
              <Command.Item
                key={f.id}
                value={`file-${f.id}`}
                onSelect={() =>
                  pick({ kind: 'file', id: f.id, customer: c, file: f })
                }
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 font-mono type-mono-sm text-white/85 aria-selected:bg-white/10"
              >
                <span
                  className="inline-block size-1.5 rounded-full"
                  style={{ background: severityHex(f.severity) }}
                />
                <span className="truncate">{f.path}</span>
                <span className="ml-auto type-mono-sm text-white/40">
                  {c.slug}
                </span>
              </Command.Item>
            );
          })}
        </Command.Group>
      )}
    </>
  );
}
