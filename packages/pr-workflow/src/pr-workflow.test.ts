import { mkdtemp, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  AccessDeniedError,
  GitHubAppClient,
  LocalGitClient,
  dispatchPR,
} from "./index.js";

describe("pr-workflow", () => {
  let outDir: string;

  beforeEach(async () => {
    outDir = await mkdtemp(path.join(tmpdir(), "vk-pr-"));
  });
  afterEach(async () => {
    await rm(outDir, { recursive: true, force: true });
  });

  it("LocalGitClient writes a patch with the right header", async () => {
    const client = new LocalGitClient(outDir);
    const result = await dispatchPR({
      client,
      access: { rootPath: "/tmp/repo", writeAccessGranted: true },
      input: {
        repo: "/tmp/repo",
        branch: "feat/test",
        title: "Test patch",
        body: "Multi-line\nbody.",
        patch: "diff --git a/x b/x\n--- a/x\n+++ b/x\n@@\n-old\n+new\n",
      },
    });
    expect(result.via).toBe("local-git");
    expect(result.url.startsWith("file://")).toBe(true);
    const content = await readFile(result.ref, "utf8");
    expect(content).toContain("# Branch: feat/test");
    expect(content).toContain("# Title: Test patch");
    expect(content).toContain("diff --git a/x b/x");
  });

  it("dispatchPR throws AccessDeniedError when write isn't granted", async () => {
    const client = new LocalGitClient(outDir);
    await expect(
      dispatchPR({
        client,
        access: { rootPath: "/tmp/repo", writeAccessGranted: false },
        input: {
          repo: "/tmp/repo",
          branch: "feat/x",
          title: "x",
          body: "x",
          patch: "",
        },
      }),
    ).rejects.toBeInstanceOf(AccessDeniedError);
  });

  it("GitHubAppClient stub throws a helpful 'register the app first' error", async () => {
    const client = new GitHubAppClient();
    await expect(
      client.dispatch({
        repo: "owner/repo",
        branch: "x",
        title: "x",
        body: "x",
        patch: "",
      }),
    ).rejects.toThrow(/Register the ValidationKit GitHub App/);
  });
});
