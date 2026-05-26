'use client';

import { m, useReducedMotion } from 'motion/react';
import type { LayoutNode, NodeKind } from '@/lib/repo-galaxie/types';
import { severityHex } from '@/lib/galaxie/severity-colors';
import { SeverityIcon } from './SeverityIcon';
import type { SeverityBand } from '@vk/core';

/**
 * Galaxie-Redesign V2 — Nebula-Folders + Solid-Planet-Files + Edge-Badge-Severity.
 *
 * Folders are atmospheric gas-cocoons (radial nebula gradient, no hard ring),
 * Files are 3D-planets with a top-left light-source and a subtle per-language
 * tint, Severity sits as an iOS-notification-style badge at the 1-o'clock edge
 * of every Sphere that has a finding.
 */

type FocusRole = 'focus' | 'descendant' | 'ancestor' | 'sibling' | 'self-or-none';

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
const EASE_CAMERA = [0.4, 0, 0.2, 1] as const;

const OUTLINE_DELAY_AFTER_REVEAL = 0.3;

// ─── Tokens ────────────────────────────────────────────────────────────────

const COLOR_LABEL_FG = 'oklch(0.94 0 0)';
const COLOR_LABEL_PILL_BG = 'oklch(0.10 0 0)';
const COLOR_LABEL_PILL_BG_OPACITY = 0.78;
const COLOR_LABEL_PILL_BORDER = 'oklch(0.45 0 0)';
const COLOR_LABEL_PILL_BORDER_OPACITY = 0.35;

const COLOR_INNER_GLOW_HINT = 'oklch(0.85 0 0)';
const COLOR_INNER_GLOW_HINT_OPACITY = 0.10;

const COLOR_RIM_HIGHLIGHT = 'oklch(0.95 0 0)';
const COLOR_RIM_HIGHLIGHT_OPACITY = 0.12;

const COLOR_HOVER_GLOW = 'oklch(0.98 0 0)';
const HOVER_GLOW_OPACITY_HOVER = 0.14;
const HOVER_GLOW_OPACITY_ACTIVE = 0.20;
const HOVER_GLOW_RADIUS_EXTRA = 10;

const FILE_HIT_TARGET_MIN = 22;
const CONTAINER_HIT_TARGET_MIN = 28;

/** Edge-Badge geometry. Sits at 1-o'clock (30° above the horizontal axis on
 *  the right). V2 Iter-2: uniform disc-size (no per-sphere scaling) — severity
 *  is a categorical signal, not a quantity, so all badges read the same. */
const BADGE_COS = Math.cos(-Math.PI / 6); // ≈ 0.866
const BADGE_SIN = Math.sin(-Math.PI / 6); // -0.5
const BADGE_DISC_RADIUS = 11;
const BADGE_ICON_RATIO = 1.3;
const BADGE_ICON_COLOR = 'oklch(0.98 0 0)';
const BADGE_PULSE_DURATION_S = 2.0;

/** Container label-pill — Polish-V font-sizes + V2 transparent glass pill. */
const CONTAINER_LABEL_FONT_SIZE: Record<NodeKind, number> = {
  workspace: 24,
  customer: 22,
  repo: 20,
  submodule: 17,
  folder: 16,
  file: 0,
};
const LABEL_PILL_PADDING_X = 18;
const LABEL_PILL_PADDING_Y = 8;
const LABEL_PILL_RX = 8;
const LABEL_PILL_OFFSET = 6;

function labelFontFamilyVar(kind: NodeKind): string {
  if (kind === 'workspace' || kind === 'customer') return 'var(--font-sans)';
  return 'var(--font-mono)';
}

/** Nebula gradient stops — outer is severity-tinted (low chroma), inner is
 *  near-black. Neutral variant has chroma 0. Hue per severity matches the
 *  hex palette in severity-colors.ts. */
interface NebulaStops {
  outerColor: string;
  outerOpacity: number;
}
const NEBULA_INNER_COLOR = 'oklch(0.04 0 0)';
const NEBULA_INNER_OPACITY = 1.0;
const NEBULA_STOPS_NEUTRAL: NebulaStops = {
  outerColor: 'oklch(0.20 0 0)',
  outerOpacity: 1.0,
};
const NEBULA_STOPS_BY_SEVERITY: Record<SeverityBand, NebulaStops> = {
  Kill:        { outerColor: 'oklch(0.30 0.18 25)',  outerOpacity: 1.0 },
  Weak:        { outerColor: 'oklch(0.28 0.14 35)',  outerOpacity: 1.0 },
  Mid:         { outerColor: 'oklch(0.30 0.14 70)',  outerOpacity: 1.0 },
  Strong:      { outerColor: 'oklch(0.30 0.12 150)', outerOpacity: 1.0 },
  Exceptional: { outerColor: 'oklch(0.32 0.14 150)', outerOpacity: 1.0 },
};

/** Planet gradient stops — top-left light-source. Per-language hue shift at
 *  low chroma (0.04) so files remain primarily grey but readable as a class. */
interface PlanetStops {
  highlight: string;
  mid: string;
  shade: string;
}
const PLANET_BY_LANG: Record<string, PlanetStops> = {
  default: {
    highlight: 'oklch(0.86 0 0)',
    mid:       'oklch(0.40 0 0)',
    shade:     'oklch(0.08 0 0)',
  },
  md: {
    highlight: 'oklch(0.86 0.04 240)',
    mid:       'oklch(0.40 0.04 240)',
    shade:     'oklch(0.08 0.04 240)',
  },
  ts: {
    highlight: 'oklch(0.86 0.04 220)',
    mid:       'oklch(0.40 0.04 220)',
    shade:     'oklch(0.08 0.04 220)',
  },
  json: {
    highlight: 'oklch(0.86 0.04 80)',
    mid:       'oklch(0.40 0.04 80)',
    shade:     'oklch(0.08 0.04 80)',
  },
  yaml: {
    highlight: 'oklch(0.86 0.04 30)',
    mid:       'oklch(0.40 0.04 30)',
    shade:     'oklch(0.08 0.04 30)',
  },
  mdc: {
    highlight: 'oklch(0.86 0.04 290)',
    mid:       'oklch(0.40 0.04 290)',
    shade:     'oklch(0.08 0.04 290)',
  },
};

/** Map a file-language to its planet-gradient-id. tsx/jsx fold into ts, mdx
 *  folds into md, yml into yaml. Unknown languages get the neutral default. */
function planetGradientIdForLang(lang: string | undefined): string {
  if (!lang) return 'planet-default';
  if (lang === 'ts' || lang === 'tsx' || lang === 'js' || lang === 'jsx') return 'planet-ts';
  if (lang === 'md' || lang === 'mdx') return 'planet-md';
  if (lang === 'json') return 'planet-json';
  if (lang === 'yaml' || lang === 'yml') return 'planet-yaml';
  if (lang === 'mdc') return 'planet-mdc';
  return 'planet-default';
}

function edgeBadgePosition(radius: number): { x: number; y: number; disc: number } {
  return {
    x: radius * BADGE_COS,
    y: radius * BADGE_SIN,
    disc: BADGE_DISC_RADIUS,
  };
}

// ─── Gradient defs (rendered once in the SVG <defs>) ───────────────────────

export function SphereGradientDefs() {
  return (
    <>
      {/* Nebula — neutral (no severity) */}
      <radialGradient id="nebula-neutral" cx="50%" cy="50%" r="50%">
        <stop offset="0%"   stopColor={NEBULA_INNER_COLOR} stopOpacity={NEBULA_INNER_OPACITY} />
        <stop offset="100%" stopColor={NEBULA_STOPS_NEUTRAL.outerColor} stopOpacity={NEBULA_STOPS_NEUTRAL.outerOpacity} />
      </radialGradient>

      {/* Nebula — severity-tinted (bubbled-up findings) */}
      {(Object.keys(NEBULA_STOPS_BY_SEVERITY) as SeverityBand[]).map((band) => {
        const stops = NEBULA_STOPS_BY_SEVERITY[band];
        return (
          <radialGradient
            key={band}
            id={`nebula-severity-${band}`}
            cx="50%"
            cy="50%"
            r="50%"
          >
            <stop offset="0%"   stopColor={NEBULA_INNER_COLOR} stopOpacity={NEBULA_INNER_OPACITY} />
            <stop offset="100%" stopColor={stops.outerColor} stopOpacity={stops.outerOpacity} />
          </radialGradient>
        );
      })}

      {/* Planet — solid 3D, top-left light source. cx=30 cy=25 r=75 places the
          highlight at the upper-left and lets the shade sweep across the
          bottom-right (Apple-classic-orb proportions). */}
      {Object.entries(PLANET_BY_LANG).map(([key, stops]) => (
        <radialGradient
          key={key}
          id={`planet-${key}`}
          cx="30%"
          cy="25%"
          r="75%"
        >
          <stop offset="0%"   stopColor={stops.highlight} />
          <stop offset="45%"  stopColor={stops.mid} />
          <stop offset="100%" stopColor={stops.shade} />
        </radialGradient>
      ))}
    </>
  );
}

// ─── Sphere root ───────────────────────────────────────────────────────────

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

  // Role-based opacity (Apple-Maps parent-ghost-ring effect).
  const roleOpacity =
    focusRole === 'ancestor' ? 0.32 :
    focusRole === 'sibling' ? 0.5 :
    1;

  // V2: hover 1.03, active 1.04. Slightly bigger than Polish-V because the
  // glow-halo carries less of the "this is hot" signal at low opacities.
  const innerScale = reducedMotion
    ? 1
    : isHovered
      ? 1.03
      : isActive
        ? 1.04
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
      )}
    </g>
  );
}

// ─── Edge-Badge severity indicator (shared between File + Container) ───────

function EdgeBadge({
  radius,
  severity,
  isPulsing,
  reducedMotion,
  revealDelay,
}: {
  radius: number;
  severity: SeverityBand;
  isPulsing: boolean;
  reducedMotion: boolean;
  revealDelay: number;
}) {
  const color = severityHex(severity);
  const { x, y, disc } = edgeBadgePosition(radius);
  const iconSize = disc * BADGE_ICON_RATIO;

  return (
    <g transform={`translate(${x} ${y})`} style={{ pointerEvents: 'none' }}>
      {/* Pulse-halo around the badge (NOT around the whole sphere) — only on
          the single chosen pulsing finding-leaf. */}
      {isPulsing && !reducedMotion ? (
        <m.circle
          r={disc + 4}
          fill={color}
          fillOpacity={0}
          animate={{
            r: [disc + 2, disc + 10, disc + 2],
            fillOpacity: [0, 0.4, 0],
          }}
          transition={{
            duration: BADGE_PULSE_DURATION_S,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: revealDelay + OUTLINE_DELAY_AFTER_REVEAL,
          }}
        />
      ) : null}

      {/* Filled severity-color disc — no border. */}
      <m.circle
        r={disc}
        fill={color}
        initial={reducedMotion ? false : { opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={
          reducedMotion
            ? { duration: 0 }
            : {
                duration: 0.4,
                delay: revealDelay + OUTLINE_DELAY_AFTER_REVEAL,
                ease: EASE_OUT_EXPO,
              }
        }
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      />

      {/* White severity-icon centred in the disc. */}
      <SeverityIcon
        severity={severity}
        size={iconSize}
        color={BADGE_ICON_COLOR}
        delay={revealDelay + OUTLINE_DELAY_AFTER_REVEAL}
      />
    </g>
  );
}

// ─── Container (workspace / customer / repo / submodule / folder) ──────────

function ContainerSphereBody({
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
  const fontSize = CONTAINER_LABEL_FONT_SIZE[node.kind];
  const fontFamily = labelFontFamilyVar(node.kind);
  const severity = node.severity ?? null;

  const nebulaId = severity ? `nebula-severity-${severity}` : 'nebula-neutral';

  // Hover-glow opacity target (rendered as a separate halo circle).
  const glowOpacity = isActive
    ? HOVER_GLOW_OPACITY_ACTIVE
    : isHovered
      ? HOVER_GLOW_OPACITY_HOVER
      : 0;

  // Label pill — V2 transparent glass.
  const pillHeight = fontSize + LABEL_PILL_PADDING_Y * 2;
  const pillY = -node.radius - LABEL_PILL_OFFSET - pillHeight;
  const labelChars = node.label.length;
  const pillWidth = Math.max(
    labelChars * fontSize * 0.6 + LABEL_PILL_PADDING_X * 2,
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
      {/* Hover-glow halo — sits BELOW the sphere body so it reads as a soft
          outer aura. Does not scale with hover (lives outside scale-group). */}
      <m.circle
        r={node.radius + HOVER_GLOW_RADIUS_EXTRA}
        fill={COLOR_HOVER_GLOW}
        fillOpacity={0}
        animate={{ fillOpacity: reducedMotion ? 0 : glowOpacity }}
        transition={{ duration: 0.18, ease: EASE_CAMERA }}
        pointerEvents="none"
      />

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

        {/* Nebula body — radial gradient, no hard ring. */}
        <circle
          r={node.radius}
          fill={`url(#${nebulaId})`}
          pointerEvents="none"
        />

        {/* Inner-glow hint — very dezenter Boundary-Marker (0.5px / 10 % op). */}
        <circle
          r={Math.max(0, node.radius - 1)}
          fill="none"
          stroke={COLOR_INNER_GLOW_HINT}
          strokeWidth={0.5}
          strokeOpacity={COLOR_INNER_GLOW_HINT_OPACITY}
          pointerEvents="none"
        />
      </m.g>

      {/* Edge-Badge severity — outside the scale-group so it stays anchored
          to the original radius; otherwise it would drift on hover. */}
      {severity ? (
        <EdgeBadge
          radius={node.radius}
          severity={severity}
          isPulsing={isPulsing}
          reducedMotion={reducedMotion}
          revealDelay={revealDelay}
        />
      ) : null}

      {/* Header pill — always-visible, above the sphere. Click-target so
          users can grab the folder by its label, not just the rim. */}
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
          rx={LABEL_PILL_RX}
          ry={LABEL_PILL_RX}
          fill={COLOR_LABEL_PILL_BG}
          fillOpacity={COLOR_LABEL_PILL_BG_OPACITY}
          stroke={COLOR_LABEL_PILL_BORDER}
          strokeOpacity={COLOR_LABEL_PILL_BORDER_OPACITY}
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
  const severity = node.severity ?? null;
  // V2 Iter-2: severity-files render as neutral 3D-planet so the badge is
  // the only severity-signal. File-type-tint only applies to clean files —
  // keeps red/orange/green badges visually unambiguous on a grey surface.
  const planetId = severity ? 'planet-default' : planetGradientIdForLang(node.language);

  const glowOpacity = isActive
    ? HOVER_GLOW_OPACITY_ACTIVE
    : isHovered
      ? HOVER_GLOW_OPACITY_HOVER
      : 0;

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
      {/* Hover-glow halo — outside the scale-group. */}
      <m.circle
        r={node.radius + HOVER_GLOW_RADIUS_EXTRA}
        fill={COLOR_HOVER_GLOW}
        fillOpacity={0}
        animate={{ fillOpacity: reducedMotion ? 0 : glowOpacity }}
        transition={{ duration: 0.18, ease: EASE_CAMERA }}
        pointerEvents="none"
      />

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

        {/* Planet body — radial gradient with top-left light source. */}
        <circle
          r={node.radius}
          fill={`url(#${planetId})`}
          pointerEvents="none"
        />

        {/* Rim highlight — hauchdünner planetary edge. */}
        <circle
          r={node.radius}
          fill="none"
          stroke={COLOR_RIM_HIGHLIGHT}
          strokeWidth={0.4}
          strokeOpacity={COLOR_RIM_HIGHLIGHT_OPACITY}
          pointerEvents="none"
        />
      </m.g>

      {/* Edge-Badge severity — outside the scale-group, anchored to original
          radius. Replaces the Polish-V centred severity-disc + outline ring. */}
      {severity ? (
        <EdgeBadge
          radius={node.radius}
          severity={severity}
          isPulsing={isPulsing}
          reducedMotion={reducedMotion}
          revealDelay={revealDelay}
        />
      ) : null}
    </m.g>
  );
}

export { type FocusRole };
