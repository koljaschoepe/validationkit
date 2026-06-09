import { Text, type TextStyleOptions } from 'pixi.js';
import { computeLabelLOD, type LabelTier } from './node-label-lod';

export { LABEL_LOD, computeLabelLOD, type LabelTier } from './node-label-lod';

/**
 * Galaxie-Redesign Phase E — on-canvas node labels with hybrid level-of-detail.
 * Each sun/folder/file carries a humanized {@link Text} label (a child of the
 * sprite, so it pans + zooms with the world). The LOD math lives in the pure
 * `./node-label-lod` module; this file applies it to live Pixi Text objects.
 */
const BASE_FONT_SIZE = 13;

const LABEL_STYLE: TextStyleOptions = {
  fontFamily:
    'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  fontSize: BASE_FONT_SIZE,
  fill: 0xffffff,
  align: 'center',
  wordWrap: true,
  wordWrapWidth: 120,
  lineHeight: Math.round(BASE_FONT_SIZE * 1.15),
  // Dark outline so labels stay legible over the starfield / planets.
  stroke: { color: 0x05070a, width: 3, alpha: 0.7 },
};

/** Create a hidden, non-interactive label for a node. */
export function createNodeLabel(text: string): Text {
  const label = new Text({ text, style: LABEL_STYLE });
  label.anchor.set(0.5, 0);
  label.eventMode = 'none';
  label.visible = false;
  // Bake at 2× so the glyphs stay crisp when counter-scaled.
  label.resolution = 2;
  return label;
}

/** Apply {@link computeLabelLOD} to a live label. */
export function applyLabelLOD(
  label: Text,
  cameraScale: number,
  tier: LabelTier,
  planetRadius: number,
): void {
  const s = computeLabelLOD(cameraScale, tier, planetRadius);
  label.visible = s.visible;
  if (!s.visible) return;
  label.scale.set(s.scale);
  label.anchor.set(0.5, s.anchorY);
  label.position.set(0, s.y);
}

/** Update the label's text in place (cheap; only re-bakes the glyphs). */
export function setNodeLabelText(label: Text, text: string): void {
  if (label.text !== text) label.text = text;
}
