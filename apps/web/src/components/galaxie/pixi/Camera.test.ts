import { describe, expect, it } from 'vitest';
import { Camera, DEFAULT_BOUNDS } from './Camera';

describe('Camera', () => {
  it('starts at origin with scale 1', () => {
    const cam = new Camera();
    expect(cam.x).toBe(0);
    expect(cam.y).toBe(0);
    expect(cam.scale).toBe(1);
  });

  it('panBy accumulates and respects bounds', () => {
    const cam = new Camera({
      ...DEFAULT_BOUNDS,
      panHalfWidth: 100,
      panHalfHeight: 100,
    });
    cam.panBy(50, -30);
    expect(cam.x).toBe(50);
    expect(cam.y).toBe(-30);
    cam.panBy(80, 200);
    expect(cam.x).toBe(100);
    expect(cam.y).toBe(100);
  });

  it('zoomAt with anchor at viewport center leaves origin fixed', () => {
    const cam = new Camera();
    cam.zoomAt(2, 0, 0);
    expect(cam.scale).toBe(2);
    expect(cam.x).toBe(0);
    expect(cam.y).toBe(0);
  });

  it('zoomAt with off-center anchor keeps that screen point stable', () => {
    const cam = new Camera();
    // world-origin at viewport-center (0,0). Anchor at screen-offset (100, 0).
    // World-point under anchor before zoom: (100 - 0)/1 = 100.
    cam.zoomAt(2, 100, 0);
    // After zoom 2x: world-point 100 should still appear under screen-offset 100.
    // mapping: viewport-cx + cam.x + worldX * scale = 0 + (-100) + 100*2 = 100. ✓
    expect(cam.scale).toBe(2);
    expect(cam.x).toBe(-100);
  });

  it('clamps scale to bounds', () => {
    const cam = new Camera({ ...DEFAULT_BOUNDS, minZoom: 0.5, maxZoom: 4 });
    cam.zoomAt(100, 0, 0);
    expect(cam.scale).toBe(4);
    cam.zoomAt(0.0001, 0, 0);
    expect(cam.scale).toBe(0.5);
  });

  it('reset returns to home', () => {
    const cam = new Camera();
    cam.panBy(50, 50);
    cam.zoomAt(2, 0, 0);
    cam.reset();
    expect(cam.x).toBe(0);
    expect(cam.y).toBe(0);
    expect(cam.scale).toBe(1);
  });
});
