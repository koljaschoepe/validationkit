import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isAuthEnabled } from "@vk/auth";
import { SiteNav } from "@/components/SiteNav";
import { RequestWriteButton } from "@/components/RequestWriteButton";
import { getSessionUser } from "@/lib/session";
import { getCustomer } from "@/lib/customers";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isAuthEnabled()) redirect("/login");
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const data = await getCustomer(user.id, id);
  if (!data) notFound();

  return (
    <main>
      <SiteNav />
      <header>
        <h1>{data.repo.label}</h1>
        <p>
          <code>{data.repo.rootPath}</code>
          {data.repo.githubFullName ? (
            <>
              {" "}
              · GitHub <code>{data.repo.githubFullName}</code>
            </>
          ) : null}
        </p>
      </header>

      <section className="summary">
        <div className="stat">
          <div className="label">Write access</div>
          <div className="value">
            <span
              className="sev-pill"
              data-sev={data.repo.writeAccessGranted ? "Weak" : "Strong"}
            >
              {data.repo.writeAccessGranted ? "yes" : "read-only"}
            </span>
          </div>
        </div>
        <div className="stat">
          <div className="label">Scans</div>
          <div className="value">{data.scans.length}</div>
        </div>
        <div className="stat">
          <div className="label">Drifts</div>
          <div className="value">{data.drifts.length}</div>
        </div>
        <div className="stat">
          <div className="label">Added</div>
          <div className="value">
            {data.repo.createdAt.toISOString().slice(0, 10)}
          </div>
        </div>
      </section>

      {data.repo.writeAccessGranted ? null : (
        <>
          <h2>Write access</h2>
          <p className="lede">
            This customer-repo is read-only. Submit a request to unlock the PR
            workflow.
          </p>
          <RequestWriteButton
            repoLabel={data.repo.label}
            rootPath={data.repo.rootPath}
          />
        </>
      )}

      <h2>Recent audits</h2>
      {data.scans.length === 0 ? (
        <div className="callout">
          No audits against this root path yet. Run one at{" "}
          <Link href="/">/</Link> and it lands here automatically.
        </div>
      ) : (
        <table className="inventory">
          <thead>
            <tr>
              <th>When</th>
              <th>Status</th>
              <th>Severity</th>
              <th>Findings</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.scans.map((s) => (
              <tr key={s.id}>
                <td className="num">
                  {s.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                </td>
                <td>
                  <span
                    className="sev-pill"
                    data-sev={
                      s.status === "complete"
                        ? "Strong"
                        : s.status === "failed"
                          ? "Kill"
                          : "Mid"
                    }
                  >
                    {s.status}
                  </span>
                </td>
                <td>
                  <span className="sev-pill" data-sev={s.overallSeverity}>
                    {s.overallSeverity}
                  </span>
                </td>
                <td className="num">{s.findingsCount}</td>
                <td>
                  <Link href={`/scans/${s.id}`}>view →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Recent drift comparisons (workspace-wide)</h2>
      {data.drifts.length === 0 ? (
        <div className="callout">
          No drift runs yet in this workspace. Compare two repos at{" "}
          <Link href="/drift">/drift</Link>.
        </div>
      ) : (
        <table className="inventory">
          <thead>
            <tr>
              <th>When</th>
              <th>Severity</th>
              <th>A → B</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.drifts.map((d) => (
              <tr key={d.id}>
                <td className="num">
                  {d.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                </td>
                <td>
                  <span className="sev-pill" data-sev={d.overallSeverity}>
                    {d.overallSeverity}
                  </span>
                </td>
                <td className="path">
                  {d.rootPathA} → {d.rootPathB}
                </td>
                <td>
                  <Link href={`/drifts/${d.id}`}>view →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <footer>
        <Link href="/customers">← All customers</Link>
      </footer>
    </main>
  );
}
