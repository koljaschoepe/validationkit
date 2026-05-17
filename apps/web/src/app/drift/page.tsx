import Link from "next/link";
import { DriftForm } from "@/components/DriftForm";

export default function DriftPage() {
  const cwd = process.cwd();
  const repoRoot = cwd.replace(/\/apps\/web$/, "");
  const defaultA = `${repoRoot}/examples/sample-good`;
  const defaultB = `${repoRoot}/examples/sample-bad`;

  return (
    <main>
      <header>
        <h1>ValidationKit — Drift</h1>
        <p>
          Compare two repos for template drift. Built for Agency-Lena: keep 5–30
          customer repos aligned with your canonical templates.
        </p>
      </header>
      <p className="lede">
        Detects: <code>only-in-A</code>, <code>only-in-B</code>,{" "}
        <code>content-drift</code> (similarity &lt; 85%),{" "}
        <code>frontmatter-drift</code>, <code>token-drift</code> (&gt; 25%).
        Deterministic.
      </p>
      <DriftForm defaultA={defaultA} defaultB={defaultB} />
      <footer>
        ValidationKit v0.0.3 · Sprint 0.3 · <Link href="/">Audit</Link> ·{" "}
        <Link href="/drift">Drift</Link>
      </footer>
    </main>
  );
}
