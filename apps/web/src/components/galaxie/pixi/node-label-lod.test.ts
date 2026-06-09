import { describe, expect, it } from 'vitest';
import { LABEL_LOD, computeLabelLOD } from './node-label-lod';

describe('computeLabelLOD', () => {
  it('hides the label below the tier show threshold', () => {
    expect(computeLabelLOD(LABEL_LOD.file.show - 0.1, 'file', 5).visible).toBe(false);
    expect(computeLabelLOD(0.5, 'sun', 28).visible).toBe(false);
  });

  it('shows a single line under the node between show and onBody', () => {
    // folder: show 1.8, onBody 3.2
    const s = computeLabelLOD(2.0, 'folder', 9);
    expect(s.visible).toBe(true);
    expect(s.anchorY).toBe(0);
    expect(s.y).toBe(9 + 5);
    expect(s.scale).toBeCloseTo(1 / 2.0);
  });

  it('moves onto the body (centred) at/above onBody', () => {
    const s = computeLabelLOD(LABEL_LOD.folder.onBody, 'folder', 9);
    expect(s.visible).toBe(true);
    expect(s.anchorY).toBe(0.5);
    expect(s.y).toBe(0);
  });

  it('counter-scales so on-screen size stays ~constant', () => {
    expect(computeLabelLOD(4, 'sun', 28).scale).toBeCloseTo(0.25);
    expect(computeLabelLOD(2, 'sun', 28).scale).toBeCloseTo(0.5);
  });

  it('respects per-tier thresholds (sun shows earliest, file latest)', () => {
    expect(computeLabelLOD(0.7, 'sun', 28).visible).toBe(true);
    expect(computeLabelLOD(0.7, 'folder', 9).visible).toBe(false);
    expect(computeLabelLOD(0.7, 'file', 5).visible).toBe(false);
    expect(computeLabelLOD(3.5, 'file', 5).visible).toBe(true);
  });
});
