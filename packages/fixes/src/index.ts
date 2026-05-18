export {
  generateFix,
  generateFixAsync,
  generateBatchFix,
  isSupported,
  isDeterministicCategory,
  isLlmAugmentedCategory,
  type BatchFixResult,
} from "./generate.js";
export { generateContextBloatLlmFix } from "./context-bloat-llm.js";
export {
  type FixProposal,
  UnsupportedFixError,
  FixContextError,
} from "./types.js";
export {
  fileDeletePatch,
  fileModifyPatch,
  concatPatches,
} from "./unified-diff.js";
