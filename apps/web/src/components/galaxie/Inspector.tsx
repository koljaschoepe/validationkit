'use client';

import { useEffect, useRef } from 'react';
import { XIcon } from 'lucide-react';
import gsap from 'gsap';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { FileNode } from '@/lib/galaxie/types';
import { severityHex } from '@/lib/galaxie/severity-colors';
import { whyImportantFor } from './inspector-templates';
import { AISolutionPlaceholder } from './AISolutionPlaceholder';

const PANEL_WIDTH = 380;

export function Inspector({
  file,
  onClose,
}: {
  file: FileNode;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Slide-in animation on mount.
  useEffect(() => {
    if (!panelRef.current) return;
    gsap.fromTo(
      panelRef.current,
      { x: PANEL_WIDTH, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.3, ease: 'power3.out' },
    );
  }, []);

  // ESC closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      className="pointer-events-auto absolute right-0 top-0 z-30 flex h-full w-[380px] flex-col border-l border-white/10 bg-black/85 backdrop-blur"
    >
      <header className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-black"
              style={{ background: severityHex(file.severity) }}
            >
              {file.severity}
            </span>
            <span className="truncate font-mono text-xs text-white/60">
              {file.path}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-white/50 transition hover:bg-white/10 hover:text-white"
          title="Close (Esc)"
        >
          <XIcon className="size-4" />
        </button>
      </header>

      <Tabs defaultValue="detail" className="flex-1 overflow-hidden">
        <TabsList className="m-3 grid w-[calc(100%-1.5rem)] grid-cols-3 bg-white/5">
          <TabsTrigger value="detail" className="text-xs">
            Detail
          </TabsTrigger>
          <TabsTrigger value="why" className="text-xs">
            Why important
          </TabsTrigger>
          <TabsTrigger value="ai" className="text-xs">
            AI solution
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <TabsContent value="detail" className="space-y-3 text-sm text-white/85">
            <div>
              <h3 className="font-mono text-xs uppercase tracking-wider text-white/40">
                Finding
              </h3>
              <p className="mt-1 font-mono text-sm text-white">{file.path}</p>
            </div>
            <div>
              <h3 className="font-mono text-xs uppercase tracking-wider text-white/40">
                Detail
              </h3>
              <p className="mt-1 whitespace-pre-wrap leading-relaxed">
                {file.findingSnippet}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="why" className="text-sm text-white/85">
            <p className="leading-relaxed">{whyImportantFor(inferCategory(file.path))}</p>
          </TabsContent>

          <TabsContent value="ai">
            <AISolutionPlaceholder file={file} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function inferCategory(path: string): string {
  const lower = path.toLowerCase();
  if (lower.includes('ghost') || lower.includes('unused') || lower.includes('never referenced'))
    return 'unused-agent';
  if (lower.includes('duplicate') || lower.includes('similarity')) return 'duplicate-guidance';
  if (lower.includes('bloat')) return 'context-bloat';
  if (lower.includes('not found') || lower.includes('stale')) return 'stale-reference';
  if (lower.includes('budget')) return 'token-budget';
  if (lower.includes('conflict')) return 'conflicting-rules';
  return 'unknown';
}
