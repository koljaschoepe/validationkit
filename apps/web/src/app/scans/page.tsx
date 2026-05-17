import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@vk/db";
import { isAuthEnabled } from "@vk/auth";
import { getSessionUser } from "@/lib/session";

export default async function ScansPage() {
  if (!isAuthEnabled()) {
    redirect("/login");
  }
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const db = getDb();
  const scans = await db
    .select({
      id: schema.scan.id,
      rootPath: schema.scan.rootPath,
      fileCount: schema.scan.fileCount,
      overallSeverity: schema.scan.overallSeverity,
      findingsCount: schema.scan.findingsCount,
      createdAt: schema.scan.createdAt,
    })
    .from(schema.scan)
    .innerJoin(
      schema.workspace,
      eq(schema.scan.workspaceId, schema.workspace.id),
    )
    .where(eq(schema.workspace.ownerId, user.id))
    .orderBy(desc(schema.scan.createdAt))
    .limit(50);

  return (
    <main>
      <header>
        <h1>Saved scans</h1>
        <p>
          Signed in as <code>{user.email}</code>. Every audit you run while
          signed in is persisted here.
        </p>
      </header>

      {scans.length === 0 ? (
        <div className="callout">
          No scans yet. Run an audit at <Link href="/">the home page</Link>{" "}
          while signed in and it will land here.
        </div>
      ) : (
        <table className="inventory">
          <thead>
            <tr>
              <th>Created</th>
              <th>Severity</th>
              <th>Path</th>
              <th>Files</th>
              <th>Findings</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {scans.map((s) => (
              <tr key={s.id}>
                <td className="num">
                  {s.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                </td>
                <td>
                  <span className="sev-pill" data-sev={s.overallSeverity}>
                    {s.overallSeverity}
                  </span>
                </td>
                <td className="path">{s.rootPath}</td>
                <td className="num">{s.fileCount}</td>
                <td className="num">{s.findingsCount}</td>
                <td>
                  <Link href={`/scans/${s.id}`}>view →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <footer>
        ValidationKit v0.0.4 · <Link href="/">Audit</Link> ·{" "}
        <Link href="/drift">Drift</Link> · <Link href="/scans">Scans</Link>
      </footer>
    </main>
  );
}
