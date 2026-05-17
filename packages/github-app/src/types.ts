export interface GitHubAppConfig {
  appId: string;
  privateKey: string;
  webhookSecret?: string;
  /** Optional client id for future OAuth user flow (Sprint 0.7+). */
  clientId?: string;
}

export interface InstallationEvent {
  action: "created" | "deleted" | "suspend" | "unsuspend";
  installationId: number;
  accountLogin: string;
  repositories: Array<{ id: number; fullName: string }>;
  sender: { login: string };
}

export interface InstallationRepositoriesEvent {
  action: "added" | "removed";
  installationId: number;
  accountLogin: string;
  added: Array<{ id: number; fullName: string }>;
  removed: Array<{ id: number; fullName: string }>;
}

export type ParsedWebhook =
  | { kind: "installation"; event: InstallationEvent }
  | { kind: "installation_repositories"; event: InstallationRepositoriesEvent }
  | { kind: "ignored"; eventName: string; action?: string };
