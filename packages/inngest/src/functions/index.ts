import { auditRequested } from "./audit-requested.js";
import { autoTrackRepos } from "./auto-track-repos.js";
import { driftRequested } from "./drift-requested.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const functions: any[] = [auditRequested, autoTrackRepos, driftRequested];
