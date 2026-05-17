export {
  generateFix,
  generateBatchFix,
  isSupported,
  type BatchFixResult,
} from "./generate.js";
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
