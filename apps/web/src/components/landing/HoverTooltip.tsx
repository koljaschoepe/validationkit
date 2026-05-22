import type { LayoutNode } from '@/lib/repo-galaxie/types';
import { severityHex } from '@/lib/galaxie/severity-colors';

/**
 * Hover-Tooltip rendered inside the SVG so it shares the same coordinate
 * system as the spheres. Pill-style (background + border) replaces the prior
 * stroke-halo trick — readable on any sphere fill, no paint-order quirks.
 *
 * Renders for ALL nodes (containers + files), not only findings. Polish-III
 * carries the file-label information here since file spheres are icon-only.
 */

const PILL_BG = 'oklch(0.155 0.004 270)'; // matches --background
const PILL_BORDER = 'oklch(0.295 0.006 270)'; // matches --border
const FG_PRIMARY = 'oklch(0.94 0 0)';
const FG_SECONDARY = 'oklch(0.66 0 0)';

const PILL_PADDING_X = 14;
const PILL_PADDING_Y = 8;
const LINE_HEIGHT = 18;
const FONT_SIZE = 14;
const PATH_MAX_CHARS = 52;

function formatBytes(bytes: number | undefined): string | null {
  if (bytes == null) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function truncateLeft(text: string, max: number): string {
  if (text.length <= max) return text;
  return `…${text.slice(-(max - 1))}`;
}

function primaryText(node: LayoutNode): string {
  if (node.filePath) return truncateLeft(node.filePath, PATH_MAX_CHARS);
  return node.label;
}

function secondaryText(node: LayoutNode): string {
  const parts: string[] = [];
  parts.push(node.kind);
  if (node.language) parts.push(node.language.toUpperCase());
  const sizeText = formatBytes(node.bytes);
  if (sizeText) parts.push(sizeText);
  if (node.severity) {
    const count = node.findingCount ?? 1;
    parts.push(`${node.severity} · ${count} Finding${count === 1 ? '' : 's'}`);
  }
  return parts.join(' · ');
}

export function HoverTooltip({ node }: { node: LayoutNode }) {
  const primary = primaryText(node);
  const secondary = secondaryText(node);

  // Width estimate: longest line × 0.6 × fontSize is a robust proxy for the
  // mono-leaning width we render. Pad generously so border doesn't clip text.
  const longest = Math.max(primary.length, secondary.length);
  const pillWidth = longest * FONT_SIZE * 0.6 + PILL_PADDING_X * 2;
  const pillHeight = PILL_PADDING_Y * 2 + LINE_HEIGHT * 2;

  // Anchor centred above the sphere with a small gap.
  const cx = node.x;
  const baseY = node.y - node.radius - 10 - pillHeight;
  const severityColor = node.severity ? severityHex(node.severity) : null;

  return (
    <g aria-hidden="true" pointerEvents="none">
      <rect
        x={cx - pillWidth / 2}
        y={baseY}
        width={pillWidth}
        height={pillHeight}
        rx={5}
        ry={5}
        fill={PILL_BG}
        stroke={severityColor ?? PILL_BORDER}
        strokeWidth={severityColor ? 1.5 : 1}
        opacity={0.96}
      />
      <text
        x={cx}
        y={baseY + PILL_PADDING_Y + FONT_SIZE}
        textAnchor="middle"
        fill={FG_PRIMARY}
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: `${FONT_SIZE}px`,
          letterSpacing: '0.02em',
        }}
      >
        {primary}
      </text>
      <text
        x={cx}
        y={baseY + PILL_PADDING_Y + FONT_SIZE + LINE_HEIGHT}
        textAnchor="middle"
        fill={severityColor ?? FG_SECONDARY}
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: `${FONT_SIZE - 1}px`,
          letterSpacing: '0.04em',
        }}
      >
        {secondary}
      </text>
    </g>
  );
}
