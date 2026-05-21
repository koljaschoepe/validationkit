'use client';

import type { ComponentType, SVGProps } from 'react';
import { m, useReducedMotion } from 'motion/react';
import { AlertCircle, AlertTriangle, CheckCircle, Sparkles } from 'lucide-react';
import type { SeverityBand } from '@vk/core';

/**
 * Severity-Icon rendered at the centre of a Sphere — Apple-Maps-POI-style.
 *
 * Kill   → AlertCircle, pulses scale 1→1.08 (1.4 s loop)
 * Weak   → AlertTriangle, 2 px stroke, static
 * Mid    → AlertTriangle, 1.5 px stroke, static
 * Strong → CheckCircle, static
 * Exceptional → Sparkles, rotates 0→360 over 8 s
 *
 * Size is in viewBox-units so the icon scales together with the sphere it
 * sits in (Apple-Maps "POI is a fixed proportion of the marker"). The lucide
 * <svg> is rendered as a nested SVG-viewport placed at (-size/2, -size/2).
 */

type LucideIcon = ComponentType<SVGProps<SVGSVGElement> & { size?: number; color?: string }>;

const ICON_BY_SEVERITY: Record<SeverityBand, LucideIcon> = {
  Kill: AlertCircle as LucideIcon,
  Weak: AlertTriangle as LucideIcon,
  Mid: AlertTriangle as LucideIcon,
  Strong: CheckCircle as LucideIcon,
  Exceptional: Sparkles as LucideIcon,
};

const STROKE_WIDTH: Record<SeverityBand, number> = {
  Kill: 2,
  Weak: 2,
  Mid: 1.5,
  Strong: 1.8,
  Exceptional: 1.8,
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
  const Icon = ICON_BY_SEVERITY[severity];
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
