export const CURRENT_DPA_VERSION = "v0-draft-2026-05-17";

export interface DpaAcceptanceState {
  accepted: boolean;
  acceptedAt: Date | null;
  acceptedVersion: string | null;
}
