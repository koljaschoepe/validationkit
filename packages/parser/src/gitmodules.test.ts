import { describe, expect, it } from "vitest";
import { parseGitmodules } from "./gitmodules.js";

describe("parseGitmodules", () => {
  it("parses the code-apps-template .claude submodule", () => {
    const content = `[submodule ".claude"]
\tpath = .claude
\turl = git@github.com:unit-ix/code-apps-context.git
`;
    expect(parseGitmodules(content)).toEqual([
      { path: ".claude", url: "git@github.com:unit-ix/code-apps-context.git" },
    ]);
  });

  it("parses multiple submodules", () => {
    const content = `[submodule "shared"]
  path = vendor/shared
  url = https://example.com/shared.git
[submodule "ctx"]
  path = .claude
  url = git@github.com:org/ctx.git
`;
    expect(parseGitmodules(content)).toEqual([
      { path: "vendor/shared", url: "https://example.com/shared.git" },
      { path: ".claude", url: "git@github.com:org/ctx.git" },
    ]);
  });

  it("skips comments, blank lines, and sections missing path or url", () => {
    const content = `# a comment
; another
[submodule "incomplete"]
  path = only-path

[submodule "ok"]
  url = https://example.com/ok.git
  path = ok
`;
    expect(parseGitmodules(content)).toEqual([
      { path: "ok", url: "https://example.com/ok.git" },
    ]);
  });

  it("returns [] for empty or non-submodule content", () => {
    expect(parseGitmodules("")).toEqual([]);
    expect(parseGitmodules("[core]\n  bare = false\n")).toEqual([]);
  });
});
