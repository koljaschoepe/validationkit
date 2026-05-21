import type { LayoutNode } from '@/lib/repo-galaxie/types';

/**
 * Hover-Tooltip rendered inside the SVG so it shares the same coordinate
 * system as the spheres. Uses `paint-order: stroke` to give the text a
 * dark "halo" — readable against any background, no separate rect needed.
 *
 * Only renders for nodes that carry a finding (severity present).
 */

export function HoverTooltip({ node }: { node: LayoutNode }) {
  if (!node.severity) return null;

  // Position: just above the sphere, anchored center.
  const x = node.x;
  const y = node.y - node.radius - 8;

  const text = `${node.label} · ${node.severity} · ${node.findingCount ?? 1} Finding`;

  return (
    <g aria-hidden="true" pointerEvents="none">
      <text
        x={x}
        y={y}
        textAnchor="middle"
        fill="oklch(0.95 0 0)"
        stroke="oklch(0.06 0 0)"
        strokeWidth={3}
        paintOrder="stroke"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          letterSpacing: '0.04em',
        }}
      >
        {text}
      </text>
    </g>
  );
}
