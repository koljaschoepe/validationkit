import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { PRClient, PRDispatchInput, PRDispatchResult } from "./types.js";

const SAFE_NAME = /[^A-Za-z0-9._-]+/g;

export class LocalGitClient implements PRClient {
  readonly kind = "local-git" as const;

  constructor(private readonly outDir: string) {}

  async dispatch(input: PRDispatchInput): Promise<PRDispatchResult> {
    await mkdir(this.outDir, { recursive: true });
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .replace(/Z$/, "");
    const filename =
      timestamp +
      "-" +
      input.branch.replace(SAFE_NAME, "-") +
      ".patch";
    const filePath = path.join(this.outDir, filename);
    const header =
      `# ValidationKit local PR dispatch\n` +
      `# Repo: ${input.repo}\n` +
      `# Branch: ${input.branch}\n` +
      `# Title: ${input.title}\n` +
      `#\n` +
      `# ${input.body.replace(/\n/g, "\n# ")}\n` +
      `#\n` +
      `# Apply with: git -C <repo> apply ${filename}\n` +
      `# Or 3-way:   git -C <repo> am --3way ${filename}\n\n`;
    await writeFile(filePath, header + input.patch, "utf8");
    return {
      url: `file://${filePath}`,
      via: "local-git",
      ref: filePath,
    };
  }
}
