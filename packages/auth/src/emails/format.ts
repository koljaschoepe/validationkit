/**
 * Shared de-DE long-date formatter for transactional emails (DACH audience).
 * e.g. `18. Juni 2026`. Kept in one place so every template formats dates
 * identically — replaces the per-template `toLocaleDateString("en-US", …)`.
 */
export function formatDateDe(d: Date): string {
  return d.toLocaleDateString("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
