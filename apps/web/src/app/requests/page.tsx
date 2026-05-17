import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthEnabled } from "@vk/auth";
import { SiteNav } from "@/components/SiteNav";
import { RequestActions } from "@/components/RequestActions";
import { getSessionUser } from "@/lib/session";
import { listRequestsForOwner } from "@/lib/install-requests";

export default async function RequestsPage() {
  if (!isAuthEnabled()) redirect("/login");
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const rows = await listRequestsForOwner(user.id);

  return (
    <main>
      <SiteNav />
      <header>
        <h1>Install Requests</h1>
        <p>
          Read-only is the default for every repo. Write-scope dispatch (the
          PR-Workflow) requires per-repo Customer-Admin approval — see{" "}
          <Link href="/trust">Trust Center</Link> and{" "}
          <code>docs/legal/scope-policy.md</code>.
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="callout">
          No install requests yet. Anyone in your workspace can request
          write-access by calling <code>requestInstall</code> in a server action
          (or via the future GitHub-App-install-webhook in Sprint 0.7).
        </div>
      ) : (
        <table className="inventory">
          <thead>
            <tr>
              <th>Requested</th>
              <th>Repo</th>
              <th>Scope</th>
              <th>Status</th>
              <th>Decided</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="num">
                  {r.requestedAt.toISOString().slice(0, 16).replace("T", " ")}
                </td>
                <td className="path">{r.targetRepoLabel}</td>
                <td>
                  <span
                    className="sev-pill"
                    data-sev={
                      r.requestedScope === "write" ? "Weak" : "Strong"
                    }
                  >
                    {r.requestedScope}
                  </span>
                </td>
                <td>
                  <span
                    className="sev-pill"
                    data-sev={
                      r.status === "approved"
                        ? "Strong"
                        : r.status === "rejected"
                          ? "Kill"
                          : r.status === "revoked"
                            ? "Weak"
                            : "Mid"
                    }
                  >
                    {r.status}
                  </span>
                </td>
                <td className="num">
                  {r.decidedAt
                    ? r.decidedAt.toISOString().slice(0, 16).replace("T", " ")
                    : "—"}
                </td>
                <td>
                  {r.status === "pending" ? (
                    <RequestActions requestId={r.id} />
                  ) : (
                    <span style={{ color: "var(--fg-muted)" }}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <footer>
        ValidationKit v0.0.5 · <Link href="/">Audit</Link> ·{" "}
        <Link href="/drift">Drift</Link> · <Link href="/scans">Scans</Link> ·{" "}
        <Link href="/requests">Requests</Link> ·{" "}
        <Link href="/trust">Trust</Link>
      </footer>
    </main>
  );
}
