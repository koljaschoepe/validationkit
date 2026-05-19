import { describe, expect, it } from 'vitest';
import { generateMockGalaxieData, DEFAULT_MOCK_SEED } from './mock-data';
import { SEVERITY_BANDS } from './types';

describe('generateMockGalaxieData', () => {
  it('produces 3 × 5 × 10 = 150 nodes (3 customers, 15 repos, 150 files)', () => {
    const data = generateMockGalaxieData();
    expect(data.customers).toHaveLength(3);
    expect(data.repos).toHaveLength(15);
    expect(data.files).toHaveLength(150);
  });

  it('is deterministic for the default seed', () => {
    const a = generateMockGalaxieData();
    const b = generateMockGalaxieData(DEFAULT_MOCK_SEED);
    expect(a).toEqual(b);
  });

  it('produces different output for different seeds', () => {
    const a = generateMockGalaxieData('seed-A');
    const b = generateMockGalaxieData('seed-B');
    expect(a.files).not.toEqual(b.files);
  });

  it('every file has a valid severity band and snippet', () => {
    const data = generateMockGalaxieData();
    for (const f of data.files) {
      expect(SEVERITY_BANDS).toContain(f.severity);
      expect(f.findingSnippet.length).toBeGreaterThan(10);
    }
  });

  it('every repo and customer carries a valid aggregateSeverity', () => {
    const data = generateMockGalaxieData();
    for (const r of data.repos) expect(SEVERITY_BANDS).toContain(r.aggregateSeverity);
    for (const c of data.customers) expect(SEVERITY_BANDS).toContain(c.aggregateSeverity);
  });

  it('every file has a parent repo that exists', () => {
    const data = generateMockGalaxieData();
    const repoIds = new Set(data.repos.map((r) => r.id));
    for (const f of data.files) expect(repoIds.has(f.repoId)).toBe(true);
  });
});
