import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@vk/db";
import { isAuthEnabled } from "@vk/auth";
import { fromAuditReport, fromDriftReport } from "@vk/bip-generator";
import type { AuditReport, DriftReport } from "@vk/core";
import { SiteNav } from "@/components/SiteNav";
import { BipDrafts } from "@/components/BipDrafts";
import { getSessionUser } from "@/lib/session";

interface BipPageProps {
  searchParams: Promise<{ source?: string; id?: string }>;
}

export default async function BipPage({ searchParams }: BipPageProps) {
  if (!isAuthEnabled()) redirect("/login");
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const source = sp.source === "drift" ? "drift" : "audit";

  const db = getDb();

  const scanOptions = await db
    .select({
      id: schema.scan.id,
      rootPath: schema.scan.rootPath,
      overallSeverity: schema.scan.overallSeverity,
      createdAt: schema.scan.createdAt,
    })
    .from(schema.scan)
    .innerJoin(
      schema.workspace,
      eq(schema.scan.workspaceId, schema.workspace.id),
    )
    .where(eq(schema.workspace.ownerId, user.id))
    .orderBy(desc(schema.scan.createdAt))
    .limit(20);

  const driftOptions = await db
    .select({
      id: schema.driftRun.id,
      rootPathA: schema.driftRun.rootPathA,
      rootPathB: schema.driftRun.rootPathB,
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
    .limit(20);

  const selectedId = sp.id;
  let drafts = null;

  if (selectedId) {
    if (source === "drift") {
      const row = await db
        .select({ rawDrift: schema.driftRun.rawDrift })
        .from(schema.driftRun)
        .innerJoin(
          schema.workspace,
          eq(schema.driftRun.workspaceId, schema.workspace.id),
        )
        .where(eq(schema.driftRun.id, selectedId))
        .limit(1);
      if (row[0]?.rawDrift) {
        drafts = fromDriftReport(row[0].rawDrift as unknown as DriftReport);
      }
    } else {
      const row = await db
        .select({ rawReport: schema.scan.rawReport })
        .from(schema.scan)
        .innerJoin(
          schema.workspace,
          eq(schema.scan.workspaceId, schema.workspace.id),
        )
        .where(eq(schema.scan.id, selectedId))
        .limit(1);
      if (row[0]?.rawReport) {
        drafts = fromAuditReport(row[0].rawReport as unknown as AuditReport);
      }
    }
  }

  return (
    <main>
      <SiteNav />
      <header>
        <h1>Build-in-Public — Post Generator</h1>
        <p>
          Three drafts per report. Skeptic-Mentor voice
          (concession-then-critique). Specific numbers, not vibe-scores. Copy
          and tweak before posting.
        </p>
      </header>

      <h2>Pick a source</h2>

      <div style={{ display: "flex", gap: "0.6rem", marginBottom: "1rem" }}>
        <Link
          href="/bip?source=audit"
          style={{
            padding: "0.4rem 0.9rem",
            borderRadius: "6px",
            border: "1px solid var(--border)",
            background: source === "audit" ? "var(--bg-elevated)" : "transparent",
            color: "var(--fg)",
          }}
        >
          Audit reports
        </Link>
        <Link
          href="/bip?source=drift"
          style={{
            padding: "0.4rem 0.9rem",
            borderRadius: "6px",
            border: "1px solid var(--border)",
            background: source === "drift" ? "var(--bg-elevated)" : "transparent",
            color: "var(--fg)",
          }}
        >
          Drift reports
        </Link>
      </div>

      <table className="inventory" style={{ marginBottom: "2rem" }}>
        <thead>
          <tr>
            <th>When</th>
            <th>Severity</th>
            <th>Path</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {source === "audit"
            ? scanOptions.map((s) => (
                <tr
                  key={s.id}
                  style={{
                    background: s.id === selectedId ? "var(--bg-elevated)" : undefined,
                  }}
                >
                  <td className="num">
                    {s.createdAt.toISOString().slice(0, 10)}
                  </td>
                  <td>
                    <span className="sev-pill" data-sev={s.overallSeverity}>
                      {s.overallSeverity}
                    </span>
                  </td>
                  <td className="path">{s.rootPath}</td>
                  <td>
                    <Link href={`/bip?source=audit&id=${s.id}`}>
                      generate →
                    </Link>
                  </td>
                </tr>
              ))
            : driftOptions.map((d) => (
                <tr
                  key={d.id}
                  style={{
                    background: d.id === selectedId ? "var(--bg-elevated)" : undefined,
                  }}
                >
                  <td className="num">
                    {d.createdAt.toISOString().slice(0, 10)}
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
                    <Link href={`/bip?source=drift&id=${d.id}`}>
                      generate →
                    </Link>
                  </td>
                </tr>
              ))}
        </tbody>
      </table>

      {drafts ? (
        <>
          <h2>Drafts</h2>
          <BipDrafts set={drafts} />
        </>
      ) : (
        <div className="callout">
          Pick a row above to generate three drafts. Run an audit at{" "}
          <Link href="/">/</Link> or a drift at <Link href="/drift">/drift</Link>{" "}
          first if you have no rows yet.
        </div>
      )}

      <footer>
        ValidationKit v0.0.7 · <Link href="/">Audit</Link> ·{" "}
        <Link href="/drift">Drift</Link> · <Link href="/customers">Customers</Link>
      </footer>
    </main>
  );
}
