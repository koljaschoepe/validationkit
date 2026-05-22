/**
 * Client-safe pure-function exports — no side-effect imports, no transitive
 * pull-in of `@vk/llm` or `@vk/db` (postgres) into the browser bundle.
 *
 * UI components that only need to ask "is this finding-category fixable?"
 * should import from `@vk/fixes/client`, not the full `@vk/fixes` entry.
 */

const DETERMINISTIC = new Set([
  "unused-agent",
  "duplicate-guidance",
  "stale-reference",
  "token-budget",
] as const);

const LLM_AUGMENTED = new Set(["context-bloat"] as const);

export function isSupported(category: string): boolean {
  return (
    DETERMINISTIC.has(category as never) ||
    LLM_AUGMENTED.has(category as never)
  );
}

export function isDeterministicCategory(category: string): boolean {
  return DETERMINISTIC.has(category as never);
}

export function isLlmAugmentedCategory(category: string): boolean {
  return LLM_AUGMENTED.has(category as never);
}
