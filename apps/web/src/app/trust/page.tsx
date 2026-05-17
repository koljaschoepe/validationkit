import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";

export const metadata = {
  title: "Trust — ValidationKit",
  description:
    "What ValidationKit reads, what it writes, what it doesn't yet do, and what's planned.",
};

export default function TrustPage() {
  return (
    <main>
      <SiteNav />
      <header>
        <h1>Trust Center</h1>
        <p>
          What ValidationKit reads, what it writes, what it doesn&apos;t yet do,
          and what&apos;s on the compliance roadmap. Pre-release. M3 will pull a
          lawyer through this; M8 will pull a second lawyer through the DPA.
        </p>
      </header>

      <h2>Default scopes</h2>
      <table className="inventory">
        <thead>
          <tr>
            <th>Surface</th>
            <th>Default</th>
            <th>Opt-in</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="path">Local filesystem</td>
            <td><span className="sev-pill" data-sev="Strong">Read</span></td>
            <td>—</td>
          </tr>
          <tr>
            <td className="path">GitHub App (planned)</td>
            <td>
              <span className="sev-pill" data-sev="Strong">
                contents:read + pull_requests:read
              </span>
            </td>
            <td>Per-repo write requires Requester→Approver flow</td>
          </tr>
          <tr>
            <td className="path">Anthropic API (for conflicting-rules)</td>
            <td><span className="sev-pill" data-sev="Strong">Opt-in via env</span></td>
            <td>Skipped when ANTHROPIC_API_KEY is unset</td>
          </tr>
        </tbody>
      </table>

      <h2>What we do</h2>
      <div className="callout">
        <strong>Concession:</strong> we deliberately ship boring fundamentals
        before any growth lever.
        <ul>
          <li>Read-only by default everywhere a write is plausible.</li>
          <li>
            5 of 6 audit categories are deterministic — every finding has a
            file:line citation. No vibe-scores.
          </li>
          <li>
            LLM-augmented findings carry a confidence band (low / mid / high)
            and only emit at mid+ by default.
          </li>
          <li>
            Anonymous mode is a first-class path. The app degrades gracefully
            when DATABASE_URL is unset.
          </li>
          <li>
            Direct Anthropic provider (no Gateway middleman). Cuts the supply
            chain by one hop. Local Postgres-cache for repeated calls (Phase 1).
          </li>
        </ul>
      </div>

      <h2>What we don&apos;t yet do (the honest part)</h2>
      <div className="callout">
        <strong>Critique:</strong> these are real gaps. Don&apos;t adopt
        ValidationKit for production yet if any of these are dealbreakers.
        <ul>
          <li>
            <strong>No SOC-2 / ISO-27001.</strong> Targeted for Phase 2 (M9–M18)
            with the Agency-Scale tier ($799/mo).
          </li>
          <li>
            <strong>No third-party penetration test.</strong> Planned with first
            external security review at M6.
          </li>
          <li>
            <strong>No GitHub App registration live.</strong> Currently the PR
            workflow only ships a LocalGitClient writing patch files. Real
            GitHub App registration follows the 4 Day-1-Mitigations (PRD §6.4).
          </li>
          <li>
            <strong>No EU-only hosting yet.</strong> Phase 2 will offer a Neon
            EU-Frankfurt option as part of the Agency-Scale tier.
          </li>
          <li>
            <strong>Single-author single-region single-vendor.</strong> Solo
            until M18 (PRD constraint #9). Bus-factor of one. Plan accordingly.
          </li>
        </ul>
      </div>

      <h2>Compliance roadmap</h2>
      <table className="inventory">
        <thead>
          <tr>
            <th>Milestone</th>
            <th>Item</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="num">M3</td>
            <td>4 GitHub-App-Day-1-Mitigations land (PRD §6.4)</td>
            <td><span className="sev-pill" data-sev="Mid">In progress</span></td>
          </tr>
          <tr>
            <td className="num">M3</td>
            <td>DPA-Template ready for lawyer review</td>
            <td><span className="sev-pill" data-sev="Mid">Drafted</span></td>
          </tr>
          <tr>
            <td className="num">M6</td>
            <td>First external security review</td>
            <td><span className="sev-pill" data-sev="Weak">Planned</span></td>
          </tr>
          <tr>
            <td className="num">M8</td>
            <td>Lawyer-reviewed DPA (DACH + EU + US)</td>
            <td><span className="sev-pill" data-sev="Weak">Planned</span></td>
          </tr>
          <tr>
            <td className="num">M9</td>
            <td>EU hosting option (Neon Frankfurt)</td>
            <td><span className="sev-pill" data-sev="Weak">Planned</span></td>
          </tr>
          <tr>
            <td className="num">Phase 2</td>
            <td>SOC-2 Type-I → Type-II</td>
            <td><span className="sev-pill" data-sev="Weak">Roadmap</span></td>
          </tr>
        </tbody>
      </table>

      <h2>Documents</h2>
      <ul>
        <li>
          <a href="https://github.com/validationkit-ai" rel="noreferrer">
            Source on GitHub
          </a>{" "}
          — once the org is reserved (Phase-0-Day-1)
        </li>
        <li>
          DPA Template — <code>docs/legal/dpa-template.md</code> in this repo
        </li>
        <li>
          Scope policy — <code>docs/legal/scope-policy.md</code>
        </li>
        <li>
          Sub-Processors — <code>docs/legal/sub-processors.md</code>
        </li>
        <li>
          TOMs Register — <code>docs/legal/toms-register.md</code>
        </li>
        <li>
          Incident-Response — <code>docs/legal/incident-response.md</code>
        </li>
      </ul>

      <h2>Install the GitHub App</h2>
      <p className="lede">
        The App is read-only by default; per-repo write requires Customer-Admin
        approval via the Requester→Approver-Bridge. Setup walkthrough lives at{" "}
        <code>docs/setup/github-app.md</code>.
      </p>

      <h2>Audit-Trail Export</h2>
      <p className="lede">
        Compliance-Frame Customers (Pharma / Finance / Marketing-with-PII) can
        export the workspace audit-trail at any time — scans, drifts,
        install_requests, repo write-grants, webhook events. Retention window:
        12 months.
      </p>
      <p>
        <a
          href="/api/audit-trail?format=json"
          style={{ marginRight: "1rem" }}
        >
          ↓ Download JSON
        </a>
        <a href="/api/audit-trail?format=csv">↓ Download CSV</a>
      </p>
      <p style={{ color: "var(--fg-muted)", fontSize: "0.85rem" }}>
        Both formats are signed-in only. Anonymous mode returns 404 (no
        side-channel). Mechanism: <code>docs/playbook/03-compliance-frame.md</code>{" "}
        §5 Q4.
      </p>

      <footer>
        ValidationKit v0.0.6 · Sprint 0.6 · <Link href="/">Audit</Link> ·{" "}
        <Link href="/drift">Drift</Link> · <Link href="/scans">Scans</Link>
      </footer>
    </main>
  );
}
