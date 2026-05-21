'use client';

import { m, useReducedMotion } from 'motion/react';
import type { LayoutNode, NodeKind } from '@/lib/repo-galaxie/types';
import { NODE_KINDS } from '@/lib/repo-galaxie/types';
import { severityHex } from '@/lib/galaxie/severity-colors';
import { SeverityIcon } from './SeverityIcon';

/**
 * One node in the Repo-Galaxie — Apple-Maps-style semantic zoom variant.
 *
 * Sub-Agent insights driving this rewrite:
 *   - Severity-Pulse = Glow-Halo (Agent 4), NOT scale-bounce. Scale wirkt "demo".
 *   - Max 1 pulsing node per viewport (avoid disco-ball) — parent picks one.
 *   - Hover-Scale 1.04 (Agent 4), not 1.15+ (too bouncy for premium audit-tool).
 *   - Folder-Labels always-visible (Agent 3 — Sourcegraph-style "lines over icons").
 *   - File-Type-Pills as secondary text below leaf-labels.
 *   - Role-based opacity for parent-ghost-ring effect on zoom-in (Apple Maps).
 */

type FocusRole = 'focus' | 'descendant' | 'ancestor' | 'sibling' | 'self-or-none';

interface SphereGradientStops {
  highlight: string;
  shade: string;
}

const GRADIENT_STOPS: Record<NodeKind, SphereGradientStops> = {
  workspace: { highlight: 'oklch(0.88 0 0)', shade: 'oklch(0.58 0 0)' },
  customer:  { highlight: 'oklch(0.78 0 0)', shade: 'oklch(0.48 0 0)' },
  repo:      { highlight: 'oklch(0.68 0 0)', shade: 'oklch(0.40 0 0)' },
  submodule: { highlight: 'oklch(0.58 0 0)', shade: 'oklch(0.35 0 0)' },
  folder:    { highlight: 'oklch(0.52 0 0)', shade: 'oklch(0.30 0 0)' },
  file:      { highlight: 'oklch(0.66 0 0)', shade: 'oklch(0.38 0 0)' },
};

/** Linear-style ease-out-expo, used everywhere for consistency. */
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
const EASE_CAMERA = [0.4, 0, 0.2, 1] as const; // Material-standard / Apple-Maps-ish

const OUTLINE_DELAY_AFTER_REVEAL = 0.6;
const GLOW_START_AFTER_REVEAL = 1.2;

export function SphereGradientDefs() {
  return (
    <>
      {NODE_KINDS.map((kind) => {
        const { highlight, shade } = GRADIENT_STOPS[kind];
        return (
          <radialGradient
            key={kind}
            id={`sphere-${kind}`}
            cx="35%"
            cy="35%"
            r="65%"
          >
            <stop offset="0%" stopColor={highlight} />
            <stop offset="65%" stopColor={shade} />
            <stop offset="100%" stopColor={shade} stopOpacity="0.85" />
          </radialGradient>
        );
      })}
    </>
  );
}

/** Label-font sized relative to the sphere radius (pack-output is dynamic). */
function labelFontSize(radius: number, kind: NodeKind): number {
  if (kind === 'repo') return Math.min(18, Math.max(13, radius * 0.16));
  if (kind === 'folder') return Math.min(14, Math.max(10, radius * 0.22));
  if (kind === 'file') {
    if (radius >= 25) return 12;
    if (radius >= 16) return 10;
    if (radius >= 10) return 9;
    return 0;
  }
  return 11;
}

const FILE_TYPE_LABELS: Record<string, string> = {
  md: 'MD',
  json: 'JSON',
  yaml: 'YML',
  mdc: 'MDC',
  ts: 'TS',
  tsx: 'TSX',
};

export function Sphere({
  node,
  isActive = false,
  isHovered = false,
  focusRole = 'self-or-none',
  isPulsing = false,
  revealDelay = 0,
  labelMode = 'all',
  onSelect,
  onHoverIn,
  onHoverOut,
}: {
  node: LayoutNode;
  isActive?: boolean;
  isHovered?: boolean;
  /** Apple-Maps ghost-ring: ancestors dim to outline, siblings fade. */
  focusRole?: FocusRole;
  /** Whether this node owns the single-active glow-pulse (parent decides). */
  isPulsing?: boolean;
  revealDelay?: number;
  /**
   * Label-visibility mode (controlled by Galaxie-Settings):
   *   'all'     — show all labels (default)
   *   'folders' — show only container labels (hide file labels at rest)
   *   'hover'   — show labels only on hover/active
   */
  labelMode?: 'all' | 'folders' | 'hover';
  onSelect?: (nodeId: string) => void;
  onHoverIn?: (nodeId: string) => void;
  onHoverOut?: (nodeId: string) => void;
}) {
  const reducedMotion = useReducedMotion();

  const hasFinding = node.severity != null;
  const severityColor = node.severity ? severityHex(node.severity) : null;
  const isLeaf = node.kind === 'file';
  const isContainer = !isLeaf;

  const fontSize = labelFontSize(node.radius, node.kind);
  const labelY = isContainer ? -node.radius - 12 : node.radius + 12 + fontSize * 0.6;
  const interactive = onSelect != null;

  // Role-based opacity (Apple-Maps parent-ghost-ring effect)
  const roleOpacity =
    focusRole === 'ancestor' ? 0.32 :
    focusRole === 'sibling' ? 0.5 :
    1;

  // Hover-scale stays VERY subtle — 1.04 not 1.18. Active gets 1.05.
  const innerScale = reducedMotion
    ? 1
    : isHovered
      ? 1.04
      : isActive
        ? 1.05
        : 1;
  const innerTransition = reducedMotion
    ? { duration: 0 }
    : { duration: 0.18, ease: EASE_CAMERA };

  // Outline opacity: subtle at rest, full on hover/active.
  const outlineOpacityTarget = isActive || isHovered ? 1.0 : 0.7;
  const outlineWidth = isActive || isHovered ? 1.8 : 1.2;

  const handleClick = interactive
    ? (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect!(node.id);
      }
    : undefined;
  const handleKeyDown = interactive
    ? (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect!(node.id);
        }
      }
    : undefined;

  // Containers translucent so children show through.
  const containerOpacity = isContainer ? 0.14 : 1;

  const typePill = node.language ? FILE_TYPE_LABELS[node.language] : undefined;

  // Label-visibility per labelMode. 'all' → always; 'folders' → containers
  // always, leaves only on hover; 'hover' → only when hovered/active.
  const labelVisible =
    labelMode === 'all'
      ? true
      : labelMode === 'folders'
        ? isContainer || isActive || isHovered
        : isActive || isHovered;

  return (
    <g
      transform={`translate(${node.x} ${node.y})`}
      style={{ opacity: roleOpacity, transition: 'opacity 320ms cubic-bezier(0.4, 0, 0.2, 1)' }}
    >
      {/* Glow-Halo BEHIND the sphere — pulsing severity indicator. Sub-Agent 4:
          replace scale-pulse with glow. Only fires when isPulsing (parent picks max 1). */}
      {hasFinding && severityColor && isPulsing && !reducedMotion ? (
        <m.circle
          r={node.radius + 16}
          fill={severityColor}
          fillOpacity={0}
          animate={{ fillOpacity: [0, 0.32, 0], r: [node.radius + 8, node.radius + 32, node.radius + 8] }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: GLOW_START_AFTER_REVEAL + revealDelay,
          }}
          pointerEvents="none"
        />
      ) : null}

      <m.g
        initial={reducedMotion ? false : { opacity: 0, scale: 0.75 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={
          reducedMotion
            ? { duration: 0 }
            : { duration: 0.7, delay: revealDelay, ease: EASE_OUT_EXPO }
        }
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      >
        <m.g
          animate={{ scale: innerScale }}
          transition={innerTransition}
          style={{
            transformBox: 'fill-box',
            transformOrigin: 'center',
            cursor: interactive ? 'pointer' : 'default',
          }}
          onMouseEnter={() => onHoverIn?.(node.id)}
          onMouseLeave={() => onHoverOut?.(node.id)}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          role={interactive ? 'button' : undefined}
          tabIndex={interactive ? 0 : undefined}
          aria-label={
            isLeaf
              ? `${node.label}, Datei${node.severity ? `, Severity ${node.severity}` : ''} — Enter zum Öffnen`
              : `${node.label}, ${node.kind} — Enter zum Zoomen`
          }
          className={
            interactive
              ? '[outline:none] focus-visible:[outline:2px_solid_var(--color-ring)] focus-visible:[outline-offset:4px]'
              : undefined
          }
        >
          {interactive ? (
            <circle
              r={Math.max(node.radius, 14)}
              fill="transparent"
              pointerEvents="all"
            />
          ) : null}
          <circle
            r={node.radius}
            fill={`url(#sphere-${node.kind})`}
            fillOpacity={containerOpacity}
            stroke={isContainer ? 'oklch(0.50 0 0)' : 'oklch(0.95 0 0)'}
            strokeWidth={isContainer ? 1 : 0.5}
            strokeOpacity={isContainer ? 0.25 : 0.18}
            pointerEvents="none"
          />
          {hasFinding && severityColor ? (
            <m.circle
              r={node.radius + 2}
              fill="none"
              stroke={severityColor}
              strokeWidth={outlineWidth}
              initial={reducedMotion ? false : { strokeOpacity: 0 }}
              animate={{ strokeOpacity: outlineOpacityTarget }}
              transition={
                reducedMotion
                  ? { duration: 0 }
                  : {
                      duration: 0.4,
                      delay: revealDelay + OUTLINE_DELAY_AFTER_REVEAL,
                      ease: EASE_OUT_EXPO,
                    }
              }
            />
          ) : null}

          {/* Severity-Icon — Apple-Maps-POI at sphere centre. 62 % diameter,
              clamped 8-32 px viewBox so it stays readable across the size range.
              Only renders on nodes that carry a finding. */}
          {hasFinding && severityColor && node.severity ? (
            <SeverityIcon
              severity={node.severity}
              size={Math.min(32, Math.max(8, node.radius * 1.24))}
              color={severityColor}
              delay={revealDelay + OUTLINE_DELAY_AFTER_REVEAL}
            />
          ) : null}
        </m.g>

        {/* Label — always-visible for folders+repo, conditional for files */}
        {labelVisible && fontSize > 0 ? (
          <text
            y={labelY}
            textAnchor="middle"
            fill="oklch(0.94 0 0)"
            fillOpacity={
              isActive || isHovered ? 1 :
              isContainer ? 0.85 :
              0.78
            }
            stroke="oklch(0.06 0 0)"
            strokeWidth={3}
            paintOrder="stroke"
            style={{
              fontFamily: isContainer ? 'var(--font-sans)' : 'var(--font-mono)',
              fontSize: `${fontSize}px`,
              fontWeight: isContainer ? 500 : 400,
              letterSpacing: '0.02em',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            {node.label}
          </text>
        ) : null}

        {/* File-Type pill — secondary mono text below file-label */}
        {labelVisible && isLeaf && fontSize > 0 && typePill ? (
          <text
            y={labelY + fontSize * 1.4 + 4}
            textAnchor="middle"
            fill="oklch(0.65 0 0)"
            fillOpacity={isActive || isHovered ? 1 : 0.55}
            stroke="oklch(0.06 0 0)"
            strokeWidth={2.5}
            paintOrder="stroke"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: `${Math.max(8, fontSize - 2)}px`,
              letterSpacing: '0.08em',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            {typePill}
          </text>
        ) : null}
      </m.g>
    </g>
  );
}

export { type FocusRole };
