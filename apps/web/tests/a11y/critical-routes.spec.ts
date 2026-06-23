import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Critical public routes — no auth / no DB, so they render in CI without a
 * database. Fails the build on any serious/critical WCAG 2 A/AA violation;
 * minor/moderate are surfaced but non-blocking (tune as the design settles).
 */
const ROUTES = ['/', '/pricing', '/login'] as const;

for (const route of ROUTES) {
  test(`a11y: ${route} has no serious/critical axe violations`, async ({
    page,
  }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    const blocking = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    expect(
      blocking,
      `axe violations on ${route}:\n${JSON.stringify(blocking, null, 2)}`,
    ).toEqual([]);
  });
}
