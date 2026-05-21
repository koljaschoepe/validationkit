/**
 * Onboarding-State type — used by ActivationChecklist + GalaxieScene + RepoTreeView.
 *
 * The former <OnboardingBanner> top-banner component (Phase Galaxie G6) was
 * replaced by <ActivationChecklist> (Phase Nova-2 P4 Right-Rail) and removed
 * 2026-05-21 (repo-health Phase 2.2c). Only the State-type stays here as the
 * shared shape consumed by the workspace galaxie surface.
 */

export interface OnboardingState {
  workspaceId: string;
  customerCount: number;
  repoCount: number;
  scanCount: number;
  /** Phase Nova-2 P4 — added for ActivationChecklist. Defaults to 0 if unset. */
  applyCount?: number;
  /** Phase Nova-2 P4 — added for ActivationChecklist. Defaults to 0 if unset. */
  memberCount?: number;
  gitHubAppConfigured: boolean;
}
