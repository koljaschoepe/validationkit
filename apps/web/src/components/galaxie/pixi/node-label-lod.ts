/**
 * Galaxie-Redesign Phase E — pure level-of-detail math for on-canvas node labels.
 * Kept free of any Pixi import so the thresholds + decision are unit-testable.
 *
 * Thresholds are deliberately plain constants — they are the main thing to tune
 * by eye against the running canvas.
 */
export const LABEL_LOD = {
  sun: { show: 0.6, onBody: 1.2 },
  folder: { show: 1.8, onBody: 3.2 },
  file: { show: 3.0, onBody: 5.0 },
} as const;

export type LabelTier = keyof typeof LABEL_LOD;

/** The visual state a label should be in for a given camera scale. */
export interface LabelLODState {
  visible: boolean;
  /** Counter-scale to keep ~constant screen size (world scales by cameraScale). */
  scale: number;
  /** Vertical anchor: 0 = top (under node), 0.5 = centred (on body). */
  anchorY: number;
  /** Local-y offset of the anchor point. */
  y: number;
}

/**
 * Compute the LOD state for the current camera scale. `planetRadius` is the
 * node's world-space radius (so the under-node offset tracks the planet edge).
 *   - below `show`: hidden,
 *   - between `show` and `onBody`: single line just below the node,
 *   - at/above `onBody`: centred on the body (up to 2 lines).
 */
export function computeLabelLOD(
  cameraScale: number,
  tier: LabelTier,
  planetRadius: number,
): LabelLODState {
  const { show, onBody } = LABEL_LOD[tier];
  if (cameraScale < show) {
    return { visible: false, scale: 1, anchorY: 0, y: 0 };
  }
  const scale = 1 / cameraScale;
  if (cameraScale >= onBody) {
    return { visible: true, scale, anchorY: 0.5, y: 0 };
  }
  return { visible: true, scale, anchorY: 0, y: planetRadius + 5 };
}
