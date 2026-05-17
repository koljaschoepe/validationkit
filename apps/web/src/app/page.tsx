import Link from "next/link";
import { AuditForm } from "@/components/AuditForm";
import { SiteNav } from "@/components/SiteNav";

export default function Home() {
  const cwd = process.cwd();
  const repoRoot = cwd.replace(/\/apps\/web$/, "");

  return (
    <main>
      <SiteNav />
      <header>
        <h1>ValidationKit — Audit</h1>
        <p>Cross-vendor agent-file trust. Point at a repo. Get a deterministic report.</p>
      </header>

      <p className="lede">
        Reads 12 vendor formats: <code>CLAUDE.md</code>, <code>AGENTS.md</code>,{" "}
        <code>.claude/agents/*</code>, <code>.claude/commands/*</code>,{" "}
        <code>SKILL.md</code>, <code>GEMINI.md</code>,{" "}
        <code>.cursor/rules/*.mdc</code>, <code>.cursorrules</code>,{" "}
        <code>.windsurf/rules</code>, <code>.clinerules</code>, plus codex +
        aider. 5 of 6 finding categories are deterministic; conflicting-rules is
        the only LLM-augmented check.
      </p>

      <AuditForm defaultPath={repoRoot} />

      <footer>
        ValidationKit v0.0.5 · Sprint 0.5 · Hardcore-Local-Only ·{" "}
        <Link href="/">Audit</Link> · <Link href="/drift">Drift</Link> ·{" "}
        <Link href="/trust">Trust</Link>
      </footer>
    </main>
  );
}
