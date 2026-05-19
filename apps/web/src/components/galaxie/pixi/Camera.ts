import type { Container } from 'pixi.js';

export interface CameraBounds {
  minZoom: number;
  maxZoom: number;
  /** Furthest reachable pan offset from origin (positive). */
  panHalfWidth: number;
  panHalfHeight: number;
}

export const DEFAULT_BOUNDS: CameraBounds = {
  minZoom: 0.3,
  maxZoom: 8,
  panHalfWidth: 2000,
  panHalfHeight: 2000,
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Imperative camera state for the galaxie world.
 * - `x`, `y` are pan offsets relative to the viewport center.
 * - `scale` is uniform zoom.
 * - `applyTo` writes the transform onto a Pixi Container (`world`).
 *
 * GSAP tweens this object directly via onUpdate=applyCamera (W3.4).
 * Drag/wheel/pinch handlers mutate it imperatively (W3.2 / W3.3).
 */
export class Camera {
  x = 0;
  y = 0;
  scale = 1;
  bounds: CameraBounds;

  constructor(bounds: CameraBounds = DEFAULT_BOUNDS) {
    this.bounds = bounds;
  }

  panBy(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
    this.clamp();
  }

  /**
   * Zoom by `factor`, keeping the screen-space anchor stationary.
   * `anchorOffsetX/Y` are relative to the viewport center.
   */
  zoomAt(factor: number, anchorOffsetX: number, anchorOffsetY: number): void {
    const next = clamp(
      this.scale * factor,
      this.bounds.minZoom,
      this.bounds.maxZoom,
    );
    if (next === this.scale) return;
    const ratio = next / this.scale;
    this.x = anchorOffsetX - (anchorOffsetX - this.x) * ratio;
    this.y = anchorOffsetY - (anchorOffsetY - this.y) * ratio;
    this.scale = next;
    this.clamp();
  }

  reset(): void {
    this.x = 0;
    this.y = 0;
    this.scale = 1;
  }

  clamp(): void {
    this.x = clamp(this.x, -this.bounds.panHalfWidth, this.bounds.panHalfWidth);
    this.y = clamp(this.y, -this.bounds.panHalfHeight, this.bounds.panHalfHeight);
    this.scale = clamp(this.scale, this.bounds.minZoom, this.bounds.maxZoom);
  }

  applyTo(world: Container, viewportCenterX: number, viewportCenterY: number): void {
    world.x = viewportCenterX + this.x;
    world.y = viewportCenterY + this.y;
    world.scale.set(this.scale);
  }
}
