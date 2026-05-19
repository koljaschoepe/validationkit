// "Why important" curated blurbs per finding category. Persona-targeted at
// Agency-Lena: each blurb explains the *consequence* of the finding pattern
// across 5–30 customer repos, not just the local symptom.
//
// Sprint G4 will replace some of this with LLM-generated reasoning where
// useful; the static fallback stays as the offline/cached path.

export const WHY_IMPORTANT_BY_CATEGORY: Record<string, string> = {
  'unused-agent':
    'An agent file that no command ever references is dead weight: it costs context tokens on every invocation, drifts out of sync with the rest, and silently sets wrong expectations for the next dev who reads it. Across 5–30 customer repos, even a handful of unused agents per repo compounds into significant token-budget and review-fatigue costs.',
  'duplicate-guidance':
    'Two files giving the same guidance is the first step toward conflicting guidance. One will get updated; the other will rot. Engineers reading the agent stack will eventually hit the contradiction at 11pm on a Friday and pick the wrong copy. Pick one canonical home and delete the other.',
  'context-bloat':
    'Once a single file passes ~8k tokens, models start dropping middle-section instructions during long sessions ("lost in the middle"). For consultancy work where agents drive autonomous edits, that is the gap where production bugs sneak in. Split into focused 2–4k-token files instead of one mega-doc.',
  'stale-reference':
    'A link to a file that does not exist is documentation lying. The model still follows the link in its planning, which means it will either generate hallucinated content for the missing file or skip the step entirely. Either failure mode is silent. Fix the path or remove the reference.',
  'token-budget':
    'When the always-loaded context for a workspace passes ~25k tokens, every single LLM call pays for the bloat — including the cheap classification calls that never needed it. Tightening the load-order saves real money and latency, and it forces the team to be explicit about what belongs in the always-on slot vs. on-demand.',
  'conflicting-rules':
    'Two related agent/rule files say opposite things ("always use X" vs "never use X"). The model picks one at random per call, so behavior is non-reproducible. This is the highest-severity finding because it makes audit trails useless — you cannot tell after the fact why an edit went one way or the other.',
};

const FALLBACK_BLURB =
  'No category-specific guidance yet. The finding detail and citations below carry the full context. We add curated reasoning as patterns get verified across customers.';

export function whyImportantFor(category: string): string {
  return WHY_IMPORTANT_BY_CATEGORY[category] ?? FALLBACK_BLURB;
}

/** Stable list of categories that have a curated blurb. */
export const COVERED_CATEGORIES = Object.keys(WHY_IMPORTANT_BY_CATEGORY);
