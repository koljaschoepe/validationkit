import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@vk/db";
import { isAuthEnabled } from "@vk/auth";
import { SiteNav } from "@/components/SiteNav";
import { getSessionUser } from "@/lib/session";

export default async function DriftsPage() {
  if (!isAuthEnabled()) redirect("/login");
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const db = getDb();
  const rows = await db
    .select({
      id: schema.driftRun.id,
      rootPathA: schema.driftRun.rootPathA,
      rootPathB: schema.driftRun.rootPathB,
      itemsCount: schema.driftRun.itemsCount,
      overallSeverity: schema.driftRun.overallSeverity,
      createdAt: schema.driftRun.createdAt,
    })
    .from(schema.driftRun)
    .innerJoin(
      schema.workspace,
      eq(schema.driftRun.workspaceId, schema.workspace.id),
    )
    .where(eq(schema.workspace.ownerId, user.id))
    .orderBy(desc(schema.driftRun.createdAt))
    .limit(50);

  return (
    <main>
      <SiteNav />
      <header>
        <h1>Saved drifts</h1>
        <p>
          Multi-repo comparison runs persisted to your workspace. Useful for
          tracking template harmonization across customer repos over time.
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="callout">
          No drift runs yet. Compare two repos at{" "}
          <Link href="/drift">/drift</Link> while signed in.
        </div>
      ) : (
        <table className="inventory">
          <thead>
            <tr>
              <th>Created</th>
              <th>Severity</th>
              <th>Path A → B</th>
              <th>Items</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="num">
                  {r.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                </td>
                <td>
                  <span className="sev-pill" data-sev={r.overallSeverity}>
                    {r.overallSeverity}
                  </span>
                </td>
                <td className="path">
                  {r.rootPathA} → {r.rootPathB}
                </td>
                <td className="num">{r.itemsCount}</td>
                <td>
                  <Link href={`/drifts/${r.id}`}>view →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <footer>
        ValidationKit v0.0.5 · <Link href="/">Audit</Link> ·{" "}
        <Link href="/drift">Drift</Link> · <Link href="/scans">Scans</Link> ·{" "}
        <Link href="/drifts">Drifts</Link> ·{" "}
        <Link href="/requests">Requests</Link> ·{" "}
        <Link href="/trust">Trust</Link>
      </footer>
    </main>
  );
}
