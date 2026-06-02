/**
 * Single source for severity → Lucide icon mapping. Imported by Workspace PIXI
 * edge-badge textures, StaticGalaxieSVG inline badges, and Landing-V2
 * `SeverityIcon.tsx` / `RepoTreeView.tsx`. Edit here only — drift between
 * surfaces makes the conversion story (Landing demo ↔ real workspace) weaker.
 */
import {
  AlertTriangle,
  CheckCircle,
  MinusCircle,
  OctagonX,
  Sparkles,
} from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import type { Severity } from './types';

export type LucideIcon = ComponentType<
  SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number }
>;

export const SEVERITY_LUCIDE: Record<Severity, LucideIcon> = {
  Kill: OctagonX as LucideIcon,
  Weak: AlertTriangle as LucideIcon,
  Mid: MinusCircle as LucideIcon,
  Strong: CheckCircle as LucideIcon,
  Exceptional: Sparkles as LucideIcon,
};

/**
 * Bands that render an edge-badge in the workspace galaxy. Mid is the anchor
 * and intentionally has no badge — its absence reinforces neutrality.
 * (Master plan §5.3.4.)
 */
export const EDGE_BADGE_BANDS: ReadonlySet<Severity> = new Set([
  'Kill',
  'Weak',
  'Strong',
  'Exceptional',
]);

/** Badge geometry — relative to the parent planet center. */
export const BADGE_DISC_RADIUS = 5;
export const BADGE_ICON_SIZE = 6;
/** -30° = 1 o'clock. Position is `(cos(angle) * radius, sin(angle) * radius)`
 *  applied to the parent planet's radius * 0.866 / -0.5 split. */
export const BADGE_ANGLE_RAD = -Math.PI / 6;
