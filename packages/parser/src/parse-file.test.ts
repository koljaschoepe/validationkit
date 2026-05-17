import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parseFile } from "./parse-file.js";

describe("parseFile", () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(path.join(tmpdir(), "vk-parser-"));
  });
  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it("tolerates a stray leading newline before frontmatter", async () => {
    const file = path.join(root, ".claude/agents/agent.md");
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(
      file,
      "\n\n---\nname: agent\ndescription: ok\n---\n\n# body\n",
      "utf8",
    );
    const { file: parsed, warning } = await parseFile(file, { rootPath: root });
    expect(warning).toBeUndefined();
    expect(parsed?.kind).toBe("claude-agent");
    expect(parsed?.name).toBe("agent");
    expect(parsed?.description).toBe("ok");
  });

  it("extracts only path-like outlinks (no prose placeholders)", async () => {
    const file = path.join(root, "CLAUDE.md");
    await writeFile(
      file,
      "# t\n\nSee [link](url) and [real](./docs/handbook.md).\n",
      "utf8",
    );
    const { file: parsed } = await parseFile(file, { rootPath: root });
    expect(parsed?.outlinks).toEqual(["./docs/handbook.md"]);
  });

  it("derives cursor activationMode: always (alwaysApply)", async () => {
    const file = path.join(root, ".cursor/rules/r.mdc");
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(
      file,
      "---\nalwaysApply: true\ndescription: x\n---\nbody\n",
      "utf8",
    );
    const { file: parsed } = await parseFile(file, { rootPath: root });
    expect(parsed?.activationMode).toBe("always");
  });

  it("derives cursor activationMode: auto-attached (globs only)", async () => {
    const file = path.join(root, ".cursor/rules/r.mdc");
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, '---\nglobs: ["**/*.tsx"]\n---\nbody\n', "utf8");
    const { file: parsed } = await parseFile(file, { rootPath: root });
    expect(parsed?.activationMode).toBe("auto-attached");
    expect(parsed?.globs).toEqual(["**/*.tsx"]);
  });

  it("derives cursor activationMode: agent-requested (description only)", async () => {
    const file = path.join(root, ".cursor/rules/r.mdc");
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, "---\ndescription: when needed\n---\nbody\n", "utf8");
    const { file: parsed } = await parseFile(file, { rootPath: root });
    expect(parsed?.activationMode).toBe("agent-requested");
  });

  it("derives cursor activationMode: manual (empty frontmatter)", async () => {
    const file = path.join(root, ".cursor/rules/r.mdc");
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, "---\n---\nbody\n", "utf8");
    const { file: parsed } = await parseFile(file, { rootPath: root });
    expect(parsed?.activationMode).toBe("manual");
  });
});
