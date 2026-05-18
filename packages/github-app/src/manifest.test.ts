import { describe, expect, it } from "vitest";
import {
  REQUIRED_PERMISSIONS,
  WRITE_GATED_PERMISSIONS,
  REQUIRED_EVENTS,
  permissionsFor,
} from "./manifest.js";

describe("github-app manifest", () => {
  it("default-install scope is read-only across the board", () => {
    for (const level of Object.values(REQUIRED_PERMISSIONS)) {
      expect(level).toBe("read");
    }
  });

  it("write-gated permissions are write-level only", () => {
    for (const level of Object.values(WRITE_GATED_PERMISSIONS)) {
      expect(level).toBe("write");
    }
  });

  it("write-gated set is disjoint from required-install set", () => {
    // The keys overlap (contents / pull_requests) — the LEVELS differ. We
    // never install the write level at App-registration time; it's gated.
    for (const key of Object.keys(WRITE_GATED_PERMISSIONS)) {
      const installLevel =
        REQUIRED_PERMISSIONS[key as keyof typeof REQUIRED_PERMISSIONS];
      const writeLevel =
        WRITE_GATED_PERMISSIONS[key as keyof typeof WRITE_GATED_PERMISSIONS];
      expect(installLevel).toBe("read");
      expect(writeLevel).toBe("write");
    }
  });

  it("subscribes to installation_repositories (load-bearing for Approver-Bridge)", () => {
    expect(REQUIRED_EVENTS).toContain("installation_repositories");
    expect(REQUIRED_EVENTS).toContain("installation");
  });

  it("permissionsFor returns read-only when wantWrite=false", () => {
    const repo = { writeAccessGranted: true };
    const perms = permissionsFor(repo, false);
    expect(perms.contents).toBe("read");
    expect(perms.pull_requests).toBe("read");
  });

  it("permissionsFor returns write when wantWrite=true AND repo.writeAccessGranted=true", () => {
    const repo = { writeAccessGranted: true };
    const perms = permissionsFor(repo, true);
    expect(perms.contents).toBe("write");
    expect(perms.pull_requests).toBe("write");
  });

  it("permissionsFor THROWS when wantWrite=true AND repo.writeAccessGranted=false", () => {
    const repo = { writeAccessGranted: false };
    expect(() => permissionsFor(repo, true)).toThrow(
      /writeAccessGranted=false/,
    );
  });
});
