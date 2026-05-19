import { describe, expect, it } from 'vitest';
import {
  WHY_IMPORTANT_BY_CATEGORY,
  COVERED_CATEGORIES,
  whyImportantFor,
} from './inspector-templates';

const EXPECTED_CATEGORIES = [
  'unused-agent',
  'duplicate-guidance',
  'context-bloat',
  'stale-reference',
  'token-budget',
  'conflicting-rules',
];

describe('inspector-templates', () => {
  it('covers all 6 finding-categories defined by the audit pipeline', () => {
    for (const cat of EXPECTED_CATEGORIES) {
      expect(COVERED_CATEGORIES).toContain(cat);
      expect(WHY_IMPORTANT_BY_CATEGORY[cat]).toBeTruthy();
    }
  });

  it('every blurb is non-trivial (≥80 chars, persona-targeted)', () => {
    for (const cat of COVERED_CATEGORIES) {
      const blurb = WHY_IMPORTANT_BY_CATEGORY[cat]!;
      expect(blurb.length).toBeGreaterThan(80);
    }
  });

  it('whyImportantFor returns the curated blurb for known categories', () => {
    expect(whyImportantFor('unused-agent')).toBe(
      WHY_IMPORTANT_BY_CATEGORY['unused-agent'],
    );
  });

  it('whyImportantFor returns a fallback for unknown categories', () => {
    const fallback = whyImportantFor('unknown-category');
    expect(fallback).toBeTruthy();
    expect(fallback).not.toBe(WHY_IMPORTANT_BY_CATEGORY['unused-agent']);
  });
});
