'use client';

import type { ComponentType, SVGProps } from 'react';
import { m, useReducedMotion } from 'motion/react';
import {
  File as FileIconLucide,
  FileCode2,
  FileJson,
  FileText,
} from 'lucide-react';
import type { LayoutNode, NodeKind } from '@/lib/repo-galaxie/types';
import { NODE_KINDS } from '@/lib/repo-galaxie/types';
import { severityHex } from '@/lib/galaxie/severity-colors';
import { SeverityIcon } from './SeverityIcon';

/**
 * Galaxie-Polish-III rewrite — Linear-Aesthetic + Vercel-Files vibe.
 *
 * Split rendering: container nodes (workspace/customer/repo/submodule/folder)
 * use a ring + 5%-tint with a header-pill label sitting just above the ring;
 * file nodes keep the gradient sphere with a centred severity- OR file-type-
 * icon and have NO text label at rest — Hover-Tooltip carries that info.
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

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
const EASE_CAMERA = [0.4, 0, 0.2, 1] as const;

const OUTLINE_DELAY_AFTER_REVEAL = 0.3;
const GLOW_START_AFTER_REVEAL = 0.6;

/**
 * Color tokens for the SVG layer. Kept as OKLCH-literal strings because SVG
 * `stroke`/`fill` attributes can't read CSS custom-properties via `color-mix()`
 * the way HTML elements do. Centralised here so future re-theming is one edit.
 */
const COLOR_CONTAINER_RING = 'oklch(0.55 0 0)';
const COLOR_CONTAINER_TINT = 'oklch(0.30 0 0 / 0.05)';
const COLOR_FILE_STROKE = 'oklch(0.95 0 0)';
const COLOR_LABEL_FG = 'oklch(0.94 0 0)';
const COLOR_FILE_TYPE_ICON = 'oklch(0.78 0 0)';
const COLOR_LABEL_PILL_BG = 'oklch(0.155 0.004 270)'; // matches --background
const COLOR_LABEL_PILL_BORDER = 'oklch(0.295 0.006 270)'; // matches --border

const CONTAINER_RING_OPACITY_REST = 0.55;
const CONTAINER_RING_OPACITY_ACTIVE = 0.95;
const CONTAINER_RING_WIDTH_REST = 1.5;
const CONTAINER_RING_WIDTH_ACTIVE = 2;

/** Deterministic label-font-size per container kind. Polish-IV: deutlich erhöht
 *  damit Folder-Labels auch bei deep-nesting + Default-Zoom lesbar bleiben. */
const CONTAINER_LABEL_FONT_SIZE: Record<NodeKind, number> = {
  workspace: 24,
  customer: 22,
  repo: 20,
  submodule: 17,
  folder: 16,
  file: 0, // unused — files don't render text labels
};

/** Sans for top-level (workspace/customer), mono for code-y containers. */
function labelFontFamilyVar(kind: NodeKind): string {
  if (kind === 'workspace' || kind === 'customer') return 'var(--font-sans)';
  return 'var(--font-mono)';
}

/** File-type icon mapping. Falls back to generic FileIcon. */
type LucideIcon = ComponentType<SVGProps<SVGSVGElement> & { size?: number; color?: string }>;
const FILE_TYPE_ICON: Record<string, LucideIcon> = {
  ts: FileCode2 as LucideIcon,
  tsx: FileCode2 as LucideIcon,
  js: FileCode2 as LucideIcon,
  jsx: FileCode2 as LucideIcon,
  json: FileJson as LucideIcon,
  yaml: FileText as LucideIcon,
  yml: FileText as LucideIcon,
  md: FileText as LucideIcon,
  mdx: FileText as LucideIcon,
  mdc: FileText as LucideIcon,
};

const FILE_TYPE_ICON_MIN_RADIUS = 12;
const FILE_TYPE_ICON_MAX_SIZE = 40;
const FILE_HIT_TARGET_MIN = 22;
const CONTAINER_HIT_TARGET_MIN = 28;

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

export function Sphere({
  node,
  isActive = false,
  isHovered = false,
  focusRole = 'self-or-none',
  isPulsing = false,
  revealDelay = 0,
  onSelect,
  onHoverIn,
  onHoverOut,
}: {
  node: LayoutNode;
  isActive?: boolean;
  isHovered?: boolean;
  focusRole?: FocusRole;
  isPulsing?: boolean;
  revealDelay?: number;
  onSelect?: (nodeId: string) => void;
  onHoverIn?: (nodeId: string) => void;
  onHoverOut?: (nodeId: string) => void;
}) {
  const reducedMotion = useReducedMotion();

  // Role-based opacity (Apple-Maps parent-ghost-ring effect)
  const roleOpacity =
    focusRole === 'ancestor' ? 0.32 :
    focusRole === 'sibling' ? 0.5 :
    1;

  // Calm Motion-Budget: Hover 1.02, Active 1.03 (was 1.04 / 1.05).
  const innerScale = reducedMotion
    ? 1
    : isHovered
      ? 1.02
      : isActive
        ? 1.03
        : 1;

  const interactive = onSelect != null;
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

  const isFile = node.kind === 'file';
  const ariaLabel = isFile
    ? `${node.label}, Datei${node.severity ? `, Severity ${node.severity}` : ''} — Enter zum Öffnen`
    : `${node.label}, ${node.kind} — Enter zum Zoomen`;

  return (
    <g
      transform={`translate(${node.x} ${node.y})`}
      style={{ opacity: roleOpacity, transition: 'opacity 320ms cubic-bezier(0.4, 0, 0.2, 1)' }}
    >
      {isFile ? (
        <FileSphereBody
          node={node}
          isActive={isActive}
          isHovered={isHovered}
          isPulsing={isPulsing}
          revealDelay={revealDelay}
          reducedMotion={!!reducedMotion}
          innerScale={innerScale}
          interactive={interactive}
          onHoverIn={onHoverIn}
          onHoverOut={onHoverOut}
          handleClick={handleClick}
          handleKeyDown={handleKeyDown}
          ariaLabel={ariaLabel}
        />
      ) : (
        <ContainerSphereBody
          node={node}
          isActive={isActive}
          isHovered={isHovered}
          revealDelay={revealDelay}
          reducedMotion={!!reducedMotion}
          innerScale={innerScale}
          interactive={interactive}
          onHoverIn={onHoverIn}
          onHoverOut={onHoverOut}
          handleClick={handleClick}
          handleKeyDown={handleKeyDown}
          ariaLabel={ariaLabel}
        />
      )}
    </g>
  );
}

// ─── Container (workspace / customer / repo / submodule / folder) ──────────

function ContainerSphereBody({
  node,
  isActive,
  isHovered,
  revealDelay,
  reducedMotion,
  innerScale,
  interactive,
  onHoverIn,
  onHoverOut,
  handleClick,
  handleKeyDown,
  ariaLabel,
}: {
  node: LayoutNode;
  isActive: boolean;
  isHovered: boolean;
  revealDelay: number;
  reducedMotion: boolean;
  innerScale: number;
  interactive: boolean;
  onHoverIn?: (nodeId: string) => void;
  onHoverOut?: (nodeId: string) => void;
  handleClick?: (e: React.MouseEvent) => void;
  handleKeyDown?: (e: React.KeyboardEvent) => void;
  ariaLabel: string;
}) {
  const innerTransition = reducedMotion
    ? { duration: 0 }
    : { duration: 0.18, ease: EASE_CAMERA };
  const fontSize = CONTAINER_LABEL_FONT_SIZE[node.kind];
  const fontFamily = labelFontFamilyVar(node.kind);
  const hasFinding = node.severity != null;
  const severityColor = node.severity ? severityHex(node.severity) : null;

  const ringOpacity = isActive || isHovered
    ? CONTAINER_RING_OPACITY_ACTIVE
    : CONTAINER_RING_OPACITY_REST;
  const ringWidth = isActive || isHovered
    ? CONTAINER_RING_WIDTH_ACTIVE
    : CONTAINER_RING_WIDTH_REST;

  // Header pill sits just above the ring, anchored center.
  // Pill height ~= fontSize + 8 vertical padding.
  const labelPaddingX = Math.max(6, fontSize * 0.55);
  const labelPaddingY = 4;
  const pillHeight = fontSize + labelPaddingY * 2;
  const pillY = -node.radius - 6 - pillHeight;
  // Estimate pill width from label length (no SVG text-measurement available
  // pre-render). 0.6× font-size per character is a robust proxy for mono +
  // sans-serif at this scale.
  const labelChars = node.label.length;
  const pillWidth = Math.max(
    labelChars * fontSize * 0.6 + labelPaddingX * 2,
    fontSize * 2.5,
  );

  return (
    <m.g
      initial={reducedMotion ? false : { opacity: 0, scale: 0.75 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={
        reducedMotion
          ? { duration: 0 }
          : { duration: 0.5, delay: revealDelay, ease: EASE_OUT_EXPO }
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
        aria-label={ariaLabel}
        className={
          interactive
            ? '[outline:none] focus-visible:[outline:2px_solid_var(--color-ring)] focus-visible:[outline-offset:4px]'
            : undefined
        }
      >
        {/* Invisible hit-target — keeps clicks on the rim reliable. */}
        {interactive ? (
          <circle
            r={Math.max(node.radius, CONTAINER_HIT_TARGET_MIN)}
            fill="transparent"
            pointerEvents="all"
          />
        ) : null}

        {/* Container body: ring + 5%-tint, no gradient. */}
        <circle
          r={node.radius}
          fill={COLOR_CONTAINER_TINT}
          stroke={COLOR_CONTAINER_RING}
          strokeWidth={ringWidth}
          strokeOpacity={ringOpacity}
          pointerEvents="none"
        />

        {/* Severity outline on the ring itself when the container has a finding. */}
        {hasFinding && severityColor ? (
          <m.circle
            r={node.radius + 2}
            fill="none"
            stroke={severityColor}
            strokeWidth={ringWidth + 0.3}
            initial={reducedMotion ? false : { strokeOpacity: 0 }}
            animate={{ strokeOpacity: isActive || isHovered ? 1.0 : 0.7 }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : {
                    duration: 0.4,
                    delay: revealDelay + OUTLINE_DELAY_AFTER_REVEAL,
                    ease: EASE_OUT_EXPO,
                  }
            }
            pointerEvents="none"
          />
        ) : null}
      </m.g>

      {/* Header pill — always-visible, above the ring. Click-target too,
          so users can grab the folder by its label, not just the rim. */}
      <g
        onClick={interactive ? handleClick : undefined}
        style={{
          cursor: interactive ? 'pointer' : 'default',
          pointerEvents: interactive ? 'all' : 'none',
        }}
      >
        <rect
          x={-pillWidth / 2}
          y={pillY}
          width={pillWidth}
          height={pillHeight}
          rx={4}
          ry={4}
          fill={COLOR_LABEL_PILL_BG}
          stroke={COLOR_LABEL_PILL_BORDER}
          strokeWidth={1}
        />
        <text
          y={pillY + pillHeight / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill={COLOR_LABEL_FG}
          style={{
            fontFamily,
            fontSize: `${fontSize}px`,
            fontWeight: node.kind === 'workspace' || node.kind === 'customer' ? 500 : 400,
            letterSpacing: '0.02em',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        >
          {node.label}
        </text>
      </g>
    </m.g>
  );
}

// ─── File leaf node ────────────────────────────────────────────────────────

function FileSphereBody({
  node,
  isActive,
  isHovered,
  isPulsing,
  revealDelay,
  reducedMotion,
  innerScale,
  interactive,
  onHoverIn,
  onHoverOut,
  handleClick,
  handleKeyDown,
  ariaLabel,
}: {
  node: LayoutNode;
  isActive: boolean;
  isHovered: boolean;
  isPulsing: boolean;
  revealDelay: number;
  reducedMotion: boolean;
  innerScale: number;
  interactive: boolean;
  onHoverIn?: (nodeId: string) => void;
  onHoverOut?: (nodeId: string) => void;
  handleClick?: (e: React.MouseEvent) => void;
  handleKeyDown?: (e: React.KeyboardEvent) => void;
  ariaLabel: string;
}) {
  const innerTransition = reducedMotion
    ? { duration: 0 }
    : { duration: 0.18, ease: EASE_CAMERA };
  const hasFinding = node.severity != null;
  const severityColor = node.severity ? severityHex(node.severity) : null;

  const outlineOpacityTarget = isActive || isHovered ? 1.0 : 0.85;
  const outlineWidth = isActive || isHovered ? 3.0 : 2.2;

  // File-type icon: only render when radius is big enough AND no severity
  // (severity icon takes priority — never both centred on the same sphere).
  const fileTypeIcon = !hasFinding && node.radius >= FILE_TYPE_ICON_MIN_RADIUS && node.language
    ? FILE_TYPE_ICON[node.language] ?? FileIconLucide
    : null;
  const fileTypeIconSize = fileTypeIcon
    ? Math.min(FILE_TYPE_ICON_MAX_SIZE, node.radius * 0.85)
    : 0;

  return (
    <>
      {/* Pulsing glow halo — only on the single chosen finding-leaf. */}
      {hasFinding && severityColor && isPulsing && !reducedMotion ? (
        <m.circle
          r={node.radius + 16}
          fill={severityColor}
          fillOpacity={0}
          animate={{
            fillOpacity: [0, 0.32, 0],
            r: [node.radius + 8, node.radius + 32, node.radius + 8],
          }}
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
            : { duration: 0.5, delay: revealDelay, ease: EASE_OUT_EXPO }
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
          aria-label={ariaLabel}
          className={
            interactive
              ? '[outline:none] focus-visible:[outline:2px_solid_var(--color-ring)] focus-visible:[outline-offset:4px]'
              : undefined
          }
        >
          {interactive ? (
            <circle
              r={Math.max(node.radius, FILE_HIT_TARGET_MIN)}
              fill="transparent"
              pointerEvents="all"
            />
          ) : null}

          {/* File body — gradient sphere stays for the planetary look. */}
          <circle
            r={node.radius}
            fill={`url(#sphere-${node.kind})`}
            stroke={COLOR_FILE_STROKE}
            strokeWidth={0.5}
            strokeOpacity={0.18}
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

          {/* Severity icon takes priority — only renders when finding present.
              Disc + Icon proportional zur Sphere-Größe: ~55 % radius, capped
              bei 22 viewBox-units. Icon ist 1.4× Disc-Radius (Diameter ≈ 70 %
              der Disc-Fläche) — so sitzt das Icon klar innerhalb der Disc-Pille. */}
          {hasFinding && severityColor && node.severity ? (() => {
            const discRadius = Math.min(22, Math.max(10, node.radius * 0.55));
            const iconSize = discRadius * 1.4;
            return (
              <>
                <circle
                  r={discRadius}
                  fill="oklch(0.10 0 0)"
                  stroke={severityColor}
                  strokeWidth={1.5}
                  pointerEvents="none"
                />
                <SeverityIcon
                  severity={node.severity}
                  size={iconSize}
                  color={severityColor}
                  delay={revealDelay + OUTLINE_DELAY_AFTER_REVEAL}
                />
              </>
            );
          })() : null}

          {/* File-type codicon for clean files at a readable size. */}
          {fileTypeIcon ? (() => {
            const Icon = fileTypeIcon;
            const half = fileTypeIconSize / 2;
            return (
              <Icon
                x={-half}
                y={-half}
                width={fileTypeIconSize}
                height={fileTypeIconSize}
                stroke={COLOR_FILE_TYPE_ICON}
                strokeWidth={1.5}
                style={{ pointerEvents: 'none' }}
                aria-hidden
              />
            );
          })() : null}
        </m.g>
      </m.g>
    </>
  );
}

export { type FocusRole };
