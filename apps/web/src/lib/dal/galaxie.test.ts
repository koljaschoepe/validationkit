import { describe, expect, it } from 'vitest';
import {
  aggregateSeverities,
  normalizeSeverity,
  slugifyForBackfill,
} from './galaxie';
import { SEVERITY_BANDS } from '@/lib/galaxie/types';

describe('aggregateSeverities', () => {
  it('returns Exceptional for empty input', () => {
    expect(aggregateSeverities([])).toBe('Exceptional');
  });

  it('promotes to Kill if any input is Kill', () => {
    expect(aggregateSeverities(['Strong', 'Kill', 'Mid'])).toBe('Kill');
  });

  it('promotes to Weak if no Kill but any Weak', () => {
    expect(aggregateSeverities(['Strong', 'Weak', 'Mid'])).toBe('Weak');
  });

  it('returns Exceptional only when ALL inputs are Exceptional', () => {
    expect(aggregateSeverities(['Exceptional', 'Exceptional'])).toBe(
      'Exceptional',
    );
    expect(aggregateSeverities(['Exceptional', 'Strong'])).not.toBe(
      'Exceptional',
    );
  });

  it('Strong-majority promotes to Strong', () => {
    expect(aggregateSeverities(['Strong', 'Strong', 'Strong', 'Mid'])).toBe(
      'Strong',
    );
  });

  it('falls through to Mid otherwise', () => {
    expect(aggregateSeverities(['Mid', 'Strong'])).toBe('Mid');
  });
});

describe('normalizeSeverity', () => {
  it('returns the input if it is a known band', () => {
    for (const band of SEVERITY_BANDS) {
      expect(normalizeSeverity(band)).toBe(band);
    }
  });

  it('falls back to Mid for unknown/garbage', () => {
    expect(normalizeSeverity(null)).toBe('Mid');
    expect(normalizeSeverity(undefined)).toBe('Mid');
    expect(normalizeSeverity('Unknown')).toBe('Mid');
    expect(normalizeSeverity('')).toBe('Mid');
  });
});

describe('slugifyForBackfill', () => {
  it('lowercases + replaces non-alphanumeric with single dashes', () => {
    expect(slugifyForBackfill('Sample-Bad Demo')).toBe('sample-bad-demo');
    expect(slugifyForBackfill('Acme Robotics!!!')).toBe('acme-robotics');
    expect(slugifyForBackfill('   foo   bar   ')).toBe('foo-bar');
  });

  it('trims leading + trailing dashes', () => {
    expect(slugifyForBackfill('--hello--')).toBe('hello');
    expect(slugifyForBackfill('!!!hello!!!')).toBe('hello');
  });

  it('returns empty string for all-non-alphanumeric input', () => {
    expect(slugifyForBackfill('!!!')).toBe('');
    expect(slugifyForBackfill('   ')).toBe('');
  });

  it('produces same output as PG `regexp_replace + btrim` SQL — collision case', () => {
    // "Acme" and "ACME!" both collapse to "acme" — backfill DISTINCT ON
    // resolves the collision by keeping one customer row per (workspace, slug).
    expect(slugifyForBackfill('Acme')).toBe('acme');
    expect(slugifyForBackfill('ACME!')).toBe('acme');
  });
});
