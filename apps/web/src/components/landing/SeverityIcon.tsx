'use client';

import { m, useReducedMotion } from 'motion/react';
import type { SeverityBand } from '@vk/core';
import { SEVERITY_LUCIDE } from '@/lib/galaxie/severity-icons';

/**
 * Severity-Icon rendered at the centre of a Sphere — Apple-Maps-POI-style.
 *
 * Kill   → OctagonX, pulses scale 1→1.08 (1.4 s loop)
 * Weak   → AlertTriangle, 2 px stroke, static
 * Mid    → MinusCircle, 1.5 px stroke, static
 * Strong → CheckCircle, static
 * Exceptional → Sparkles, rotates 0→360 over 8 s
 *
 * Lucide mapping comes from the single source `@/lib/galaxie/severity-icons.ts`
 * so the landing demo and the real workspace galaxy stay in sync.
 *
 * Size is in viewBox-units so the icon scales together with the sphere it
 * sits in (Apple-Maps "POI is a fixed proportion of the marker"). The lucide
 * <svg> is rendered as a nested SVG-viewport placed at (-size/2, -size/2).
 */

const STROKE_WIDTH: Record<SeverityBand, number> = {
  Kill: 2.6,
  Weak: 2.4,
  Mid: 2.4,
  Strong: 2.4,
  Exceptional: 2.4,
};

export function SeverityIcon({
  severity,
  size,
  color,
  delay = 0,
}: {
  severity: SeverityBand;
  /** Icon size in viewBox-units (equals on-screen pixels at 1× camera scale). */
  size: number;
  /** Stroke colour — usually the severity hex. */
  color: string;
  /** Optional animation delay (used for reveal-stagger). */
  delay?: number;
}) {
  const reducedMotion = useReducedMotion();
  const Icon = SEVERITY_LUCIDE[severity];
  const half = size / 2;

  const iconEl = (
    <Icon
      x={-half}
      y={-half}
      width={size}
      height={size}
      stroke={color}
      strokeWidth={STROKE_WIDTH[severity]}
      style={{ pointerEvents: 'none' }}
      aria-hidden
    />
  );

  if (reducedMotion) return iconEl;

  if (severity === 'Kill') {
    return (
      <m.g
        animate={{ scale: [1, 1.08, 1] }}
        transition={{
          duration: 1.4,
          repeat: Infinity,
          ease: 'easeInOut',
          delay,
        }}
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      >
        {iconEl}
      </m.g>
    );
  }

  if (severity === 'Exceptional') {
    return (
      <m.g
        animate={{ rotate: 360 }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'linear',
          delay,
        }}
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      >
        {iconEl}
      </m.g>
    );
  }

  return iconEl;
}
