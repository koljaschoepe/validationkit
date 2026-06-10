'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { m, useReducedMotion } from 'motion/react';
import { computeLayout } from '@/lib/repo-galaxie/layout';
import type { LayoutNode, RepoGalaxieData, GraphNode } from '@/lib/repo-galaxie/types';
import { Sphere, SphereGradientDefs, type FocusRole } from './Sphere';
import { BackgroundStars } from './BackgroundStars';
import { HoverTooltip } from './HoverTooltip';

/**
 * Repo-Galaxie — Apple-Maps-style semantic-zoom hero with cooperative
 * user-pan/zoom on top.
 *
 * Two transform layers compose:
 *   - Outer <g> — user-pan (translate) + user-zoom (scale). No animation,
 *     applied immediately from pointer/wheel/keyboard handlers.
 *   - Inner <m.g> — semantic camera animation (focus → child-folder zoom).
 *     Driven by the `focusId` prop, tweened with cubic-bezier easing.
 *
 * Pan/zoom interaction model (Phase Nova-2):
 *   - Wheel without modifier  → propagates → page scrolls.
 *   - Wheel + ctrl/metaKey   → zoom-at-cursor (trackpad-pinch fires wheel
 *                                with ctrlKey=true natively).
 *   - Mouse-drag (button 0)  → pan after 4 px movement threshold; small
 *                                clicks still fire normally.
 *   - Touch                  → pan-y in the browser handles 1-finger
 *                                page-scroll. 2-finger gestures are deferred
 *                                to Phase 6 (mobile gets Tree-View instead).
 *   - Keyboard               → Arrow-keys pan 40 vb-units, +/- zoom, 0 reset.
 */

export type GalaxieSettings = {
  pulseOn: boolean;
  zoomSpeed: 'slow' | 'standard' | 'fast';
  reducedMotionMode: 'auto' | 'on' | 'off';
};

export const DEFAULT_GALAXIE_SETTINGS: GalaxieSettings = {
  pulseOn: true,
  zoomSpeed: 'standard',
  reducedMotionMode: 'auto',
};

const VIEWBOX_SIZE = 1100;
const ZOOM_TARGET_FILL = 0.82;
const EASE_CAMERA = [0.4, 0, 0.2, 1] as const;
const USER_ZOOM_MIN = 0.5;
const USER_ZOOM_MAX = 4;
const KEYBOARD_PAN_STEP = 40;
const DRAG_THRESHOLD_PX = 4;

const ZOOM_SPEED_FACTOR: Record<GalaxieSettings['zoomSpeed'], number> = {
  slow: 2.4,
  standard: 4.5,
  fast: 7.0,
};

export function RepoGalaxie({
  data,
  activeNodeId,
  focusId,
  onNodeSelect,
  onFocusChange,
  settings = DEFAULT_GALAXIE_SETTINGS,
}: {
  data: RepoGalaxieData;
  activeNodeId?: string | null;
  /** Controlled zoom-focus from parent (kept in sync with breadcrumb). */
  focusId?: string;
  onNodeSelect?: (nodeId: string) => void;
  onFocusChange?: (focusId: string) => void;
  settings?: GalaxieSettings;
}) {
  const reducedMotion = useReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null);

  const layout = useMemo(
    // padding omitted → depth-differentiated default (20/16/8) kicks in.
    () => computeLayout(data, { width: VIEWBOX_SIZE, height: VIEWBOX_SIZE }),
    [data],
  );
  const layoutMap = useMemo<Map<string, LayoutNode>>(
    () => new Map(layout.map((n) => [n.id, n])),
    [layout],
  );
  const nodeMap = useMemo<Map<string, GraphNode>>(
    () => new Map(data.nodes.map((n) => [n.id, n])),
    [data],
  );

  const root = layout.find((n) => n.parentId === null);
  const effectiveFocusId = focusId ?? root?.id ?? '';
  const focusNode = layoutMap.get(effectiveFocusId) ?? root ?? null;

  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const hoveredNode = hoveredNodeId ? layoutMap.get(hoveredNodeId) : null;

  // User-pan + user-zoom (in viewBox units). Reset when semantic-focus changes.
  const [userPan, setUserPan] = useState({ x: 0, y: 0 });
  const [userZoom, setUserZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{
    panX: number; panY: number; clientX: number; clientY: number;
  } | null>(null);
  const draggedRef = useRef(false);
  const suppressClickRef = useRef(false);

  useEffect(() => {
    setUserPan({ x: 0, y: 0 });
    setUserZoom(1);
  }, [effectiveFocusId]);

  // Semantic camera transform: scale so focus circle fills ~45 % viewBox.
  const zoom = useMemo(() => {
    if (!focusNode) return { scale: 1, x: 0, y: 0 };
    const targetSize = VIEWBOX_SIZE * ZOOM_TARGET_FILL;
    const scale = Math.min(targetSize / (focusNode.radius * 2), 4.5);
    return {
      scale,
      x: -focusNode.x * scale,
      y: -focusNode.y * scale,
    };
  }, [focusNode]);

  // Compute focus-role per node: focus / descendant / ancestor / sibling.
  const focusRoles = useMemo<Map<string, FocusRole>>(() => {
    const roles = new Map<string, FocusRole>();
    if (!focusNode || focusNode.parentId === null) {
      for (const n of layout) roles.set(n.id, 'self-or-none');
      return roles;
    }
    const ancestors = new Set<string>();
    let cursor: LayoutNode | undefined = focusNode;
    while (cursor?.parentId) {
      ancestors.add(cursor.parentId);
      cursor = layoutMap.get(cursor.parentId);
    }
    const descendants = new Set<string>();
    const queue: string[] = [focusNode.id];
    while (queue.length > 0) {
      const id = queue.shift()!;
      for (const n of data.nodes) {
        if (n.parentId === id) {
          descendants.add(n.id);
          queue.push(n.id);
        }
      }
    }
    for (const n of layout) {
      if (n.id === focusNode.id) roles.set(n.id, 'focus');
      else if (descendants.has(n.id)) roles.set(n.id, 'descendant');
      else if (ancestors.has(n.id)) roles.set(n.id, 'ancestor');
      else roles.set(n.id, 'sibling');
    }
    return roles;
  }, [focusNode, layout, layoutMap, data.nodes]);

  // Single pulsing node — settings.pulseOn gates the whole effect.
  const pulsingNodeId = useMemo(() => {
    if (!settings.pulseOn) return null;
    const findings = layout.filter((n) => n.severity);
    const kills = findings.filter((n) => n.severity === 'Kill').sort((a, b) => a.id.localeCompare(b.id));
    if (kills[0]) return kills[0].id;
    const weaks = findings.filter((n) => n.severity === 'Weak').sort((a, b) => a.id.localeCompare(b.id));
    return weaks[0]?.id ?? null;
  }, [layout, settings.pulseOn]);

  function isInFocusedTree(role: FocusRole): boolean {
    return role === 'focus' || role === 'descendant' || role === 'ancestor';
  }

  const handleSelect = (nodeId: string) => {
    const node = nodeMap.get(nodeId);
    if (!node) return;
    onNodeSelect?.(nodeId);
    if (node.kind === 'file') return;
    onFocusChange?.(nodeId);
  };

  const handleBackgroundClick = () => {
    if (suppressClickRef.current) return; // recent drag-pan, swallow click
    if (!focusNode) return;
    if (focusNode.parentId === null) return;
    onFocusChange?.(focusNode.parentId);
  };

  // Convert pixel-delta on the SVG into viewBox-unit-delta.
  const pxToViewBox = useCallback((deltaPx: number): number => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return 0;
    return deltaPx * (VIEWBOX_SIZE / rect.width);
  }, []);

  // --- Wheel: cooperative zoom (⌘/ctrl+wheel = zoom-at-cursor, else propagates).
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const onWheel = (e: WheelEvent) => {
      // Trackpad-pinch sends wheel with ctrlKey=true; modifier wheel = explicit zoom.
      const isZoomGesture = e.ctrlKey || e.metaKey;
      if (!isZoomGesture) return; // plain wheel → page scrolls
      e.preventDefault();

      const rect = svg.getBoundingClientRect();
      // cursor in viewBox-coords (viewBox is centred at 0, 0)
      const cursorVbX = ((e.clientX - rect.left) / rect.width) * VIEWBOX_SIZE - VIEWBOX_SIZE / 2;
      const cursorVbY = ((e.clientY - rect.top) / rect.height) * VIEWBOX_SIZE - VIEWBOX_SIZE / 2;

      const factor = Math.exp(-e.deltaY * 0.0015 * ZOOM_SPEED_FACTOR[settings.zoomSpeed]);

      setUserZoom((prevZoom) => {
        const newZoom = Math.max(USER_ZOOM_MIN, Math.min(USER_ZOOM_MAX, prevZoom * factor));
        const actualFactor = newZoom / prevZoom;
        // Anchor cursor-world-position by adjusting pan.
        setUserPan((prevPan) => ({
          x: cursorVbX - actualFactor * (cursorVbX - prevPan.x),
          y: cursorVbY - actualFactor * (cursorVbY - prevPan.y),
        }));
        return newZoom;
      });
    };

    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [settings.zoomSpeed]);

  // --- Pointer-drag: pan (mouse only — touch falls through to browser scroll).
  // Polish-IV: setPointerCapture verhinderte click-Events auf den Spheres
  // (Browser ordnete pointerup dem SVG zu, nicht dem darunterliegenden Element).
  // Capture wird daher erst aktiviert wenn der drag-threshold überschritten ist.
  function onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if (e.pointerType !== 'mouse') return;
    if (e.button !== 0) return;
    dragStartRef.current = {
      panX: userPan.x,
      panY: userPan.y,
      clientX: e.clientX,
      clientY: e.clientY,
    };
    draggedRef.current = false;
  }
  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!dragStartRef.current) return;
    const dxPx = e.clientX - dragStartRef.current.clientX;
    const dyPx = e.clientY - dragStartRef.current.clientY;
    // Below threshold → keep click semantics, don't pan.
    if (!draggedRef.current && Math.hypot(dxPx, dyPx) < DRAG_THRESHOLD_PX) return;
    if (!draggedRef.current) {
      draggedRef.current = true;
      setIsDragging(true);
      // Erst jetzt capture — Click bleibt vorher dem Sphere zugeordnet.
      svgRef.current?.setPointerCapture(e.pointerId);
    }
    setUserPan({
      x: dragStartRef.current.panX + pxToViewBox(dxPx),
      y: dragStartRef.current.panY + pxToViewBox(dyPx),
    });
  }
  function onPointerUp(e: React.PointerEvent<SVGSVGElement>) {
    if (!dragStartRef.current) return;
    if (draggedRef.current) {
      svgRef.current?.releasePointerCapture(e.pointerId);
      // Swallow the trailing click — user dragged, didn't intend to select.
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    }
    dragStartRef.current = null;
    setIsDragging(false);
  }

  // --- Keyboard: ESC + Cmd+[ zoom-out; Arrow-pan; +/- zoom; 0 reset.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const wantsBack =
        e.key === 'Escape' ||
        ((e.metaKey || e.ctrlKey) && e.key === '[');
      if (wantsBack) {
        if (!focusNode || focusNode.parentId === null) return;
        e.preventDefault();
        onFocusChange?.(focusNode.parentId);
        return;
      }

      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) return;

      switch (e.key) {
        case 'ArrowUp':
          setUserPan((p) => ({ ...p, y: p.y + KEYBOARD_PAN_STEP }));
          e.preventDefault();
          break;
        case 'ArrowDown':
          setUserPan((p) => ({ ...p, y: p.y - KEYBOARD_PAN_STEP }));
          e.preventDefault();
          break;
        case 'ArrowLeft':
          setUserPan((p) => ({ ...p, x: p.x + KEYBOARD_PAN_STEP }));
          e.preventDefault();
          break;
        case 'ArrowRight':
          setUserPan((p) => ({ ...p, x: p.x - KEYBOARD_PAN_STEP }));
          e.preventDefault();
          break;
        case '+':
        case '=':
          setUserZoom((z) => Math.min(USER_ZOOM_MAX, z * 1.2));
          e.preventDefault();
          break;
        case '-':
        case '_':
          setUserZoom((z) => Math.max(USER_ZOOM_MIN, z * 0.83));
          e.preventDefault();
          break;
        case '0':
          setUserPan({ x: 0, y: 0 });
          setUserZoom(1);
          e.preventDefault();
          break;
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focusNode, onFocusChange]);

  const svgCursor = isDragging ? 'grabbing' : 'grab';

  return (
    <svg
      ref={svgRef}
      viewBox={`${-VIEWBOX_SIZE / 2} ${-VIEWBOX_SIZE / 2} ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
      preserveAspectRatio="xMidYMid meet"
      role="application"
      aria-label="Repository-Galaxie. Maus ziehen zum Pannen, ⌘+Scroll zum Zoomen, Pfeiltasten zum Navigieren"
      className="h-full w-full"
      style={{ cursor: svgCursor, touchAction: 'pan-y' }}
      onClick={handleBackgroundClick}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <defs>
        <SphereGradientDefs />
      </defs>

      <BackgroundStars />

      <g transform={`translate(${userPan.x} ${userPan.y}) scale(${userZoom})`}>
        <m.g
          animate={{ x: zoom.x, y: zoom.y, scale: zoom.scale }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : { duration: 0.18, ease: EASE_CAMERA }
          }
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          onClick={(e) => e.stopPropagation()}
        >
          {layout.map((node) => {
            const role = focusRoles.get(node.id) ?? 'self-or-none';
            return (
              <Sphere
                key={node.id}
                node={node}
                isActive={node.id === activeNodeId}
                isHovered={node.id === hoveredNodeId}
                focusRole={role}
                isPulsing={node.id === pulsingNodeId && isInFocusedTree(role)}
                revealDelay={REVEAL_DELAYS[depthOf(node, layoutMap)] ?? 0.5}
                onSelect={handleSelect}
                onHoverIn={setHoveredNodeId}
                onHoverOut={() => setHoveredNodeId(null)}
              />
            );
          })}
        </m.g>
      </g>

      {hoveredNode ? <HoverTooltip node={hoveredNode} /> : null}
    </svg>
  );
}

const REVEAL_DELAYS = [0.0, 0.08, 0.16, 0.24, 0.32, 0.4, 0.48];

function depthOf(node: LayoutNode, layoutMap: Map<string, LayoutNode>): number {
  let depth = 0;
  let cursor: LayoutNode | undefined = node;
  while (cursor?.parentId) {
    const parent = layoutMap.get(cursor.parentId);
    if (!parent) break;
    depth++;
    cursor = parent;
  }
  return depth;
}
