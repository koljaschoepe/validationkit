// Shared style constants for ValidationKit transactional emails.
// All templates use the same Linear/Vercel dark aesthetic — pitch-black
// background, hairline borders, monospace for monospace-y details.

export const STYLES = {
  bg: "#0a0a0c",
  surface: "#111114",
  border: "#222226",
  text: "#fafafa",
  muted: "#888892",
  accent: "#fafafa",
  danger: "#ef4444",
  success: "#22c55e",
  warning: "#f59e0b",
} as const;

export const FONT_SANS =
  'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
export const FONT_MONO =
  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace';
