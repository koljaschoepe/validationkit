import { mkdtemp, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parseFile } from "./parse-file.js";

describe("aider.conf.yml parser", () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(path.join(tmpdir(), "vk-aider-"));
  });
  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it("parses pure YAML as frontmatter with empty body", async () => {
    const file = path.join(root, "aider.conf.yml");
    await writeFile(
      file,
      "model: claude-3-5-sonnet-20241022\nedit-format: diff\nstream: true\n",
      "utf8",
    );
    const { file: parsed, warning } = await parseFile(file, { rootPath: root });
    expect(warning).toBeUndefined();
    expect(parsed?.kind).toBe("aider-conf");
    expect(parsed?.body).toBe("");
    expect(parsed?.frontmatter.model).toBe("claude-3-5-sonnet-20241022");
    expect(parsed?.frontmatter["edit-format"]).toBe("diff");
    expect(parsed?.frontmatter.stream).toBe(true);
  });

  it("emits a warning but stays parseable when YAML is broken", async () => {
    const file = path.join(root, "aider.conf.yml");
    await writeFile(file, "model: claude\nbroken: [a, b\n", "utf8");
    const { file: parsed, warning } = await parseFile(file, { rootPath: root });
    expect(warning?.message).toMatch(/yaml parse failed/);
    expect(parsed?.kind).toBe("aider-conf");
  });

  it("returns empty frontmatter for empty file", async () => {
    const file = path.join(root, "aider.conf.yml");
    await writeFile(file, "", "utf8");
    const { file: parsed } = await parseFile(file, { rootPath: root });
    expect(parsed?.kind).toBe("aider-conf");
    expect(parsed?.frontmatter).toEqual({});
  });
});
