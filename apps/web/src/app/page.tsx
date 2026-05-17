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
        Paste any public GitHub repo URL — we fetch the zipball, scan 12 vendor
        formats (<code>CLAUDE.md</code>, <code>AGENTS.md</code>,{" "}
        <code>.claude/agents/*</code>, <code>.cursor/rules/*.mdc</code>,{" "}
        <code>GEMINI.md</code>, <code>.windsurf</code>, <code>.clinerules</code>,
        plus codex + aider), and emit a deterministic audit report. 5 of 6
        finding categories are rule-based; conflicting-rules is the only
        LLM-augmented check.
      </p>

      <AuditForm defaultPath={repoRoot} />

      <footer>
        ValidationKit · <Link href="/">Audit</Link> ·{" "}
        <Link href="/drift">Drift</Link> · <Link href="/trust">Trust</Link>
      </footer>
    </main>
  );
}
