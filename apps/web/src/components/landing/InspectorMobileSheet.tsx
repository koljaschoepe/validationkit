'use client';

import { useState } from 'react';
import { Drawer } from 'vaul';
import type { GraphNode } from '@/lib/repo-galaxie/types';
import { RepoInspector } from './RepoInspector';

/**
 * InspectorMobileSheet — Phase Nova-2 P6 mobile inspector.
 *
 * Vaul Drawer with two snap-points: 40 % (peek) and 90 % (full). `modal=false`
 * keeps the tree-view tappable while the sheet is open — users can scroll the
 * tree and pop a different file into the sheet without dismissing. Drag-handle
 * up top, `aria-label` for screen-readers.
 */

export function InspectorMobileSheet({
  open,
  onOpenChange,
  node,
  onFixClick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  node: GraphNode | undefined;
  onFixClick: () => void;
}) {
  const [activeSnap, setActiveSnap] = useState<number | string | null>(0.4);
  return (
    <Drawer.Root
      open={open}
      onOpenChange={onOpenChange}
      modal={false}
      snapPoints={[0.4, 0.9]}
      activeSnapPoint={activeSnap}
      setActiveSnapPoint={setActiveSnap}
    >
      <Drawer.Portal>
        <Drawer.Content
          aria-label="Finding inspector"
          className="fixed inset-x-0 bottom-0 z-40 flex h-full max-h-[96svh] flex-col rounded-t-xl border-t border-border bg-background"
          style={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
        >
          <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-foreground/20" />
          <Drawer.Title className="sr-only">Inspector</Drawer.Title>
          <Drawer.Description className="sr-only">
            File metadata + audit-findings detail.
          </Drawer.Description>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <RepoInspector node={node} onFixClick={onFixClick} />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
