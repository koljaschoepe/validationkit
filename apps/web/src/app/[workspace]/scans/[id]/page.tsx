import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@vk/db";
import { isAuthEnabled } from "@vk/auth";
import type { AuditReport, ParserResult } from "@vk/core";
import { ReportView } from "@/components/ReportView";
import { ScanStatusBanner } from "@/components/ScanStatusBanner";
import { getSessionUser } from "@/lib/session";
import { resolveWorkspaceFromSlug } from "@/lib/workspace-context";

export default async function ScanDetailPage({
  params,
}: {
  params: Promise<{ workspace: string; id: string }>;
}) {
  if (!isAuthEnabled()) redirect("/login");
  const user = await getSessionUser();
  const { workspace: slug, id } = await params;
  if (!user) redirect(`/login?next=${encodeURIComponent(`/${slug}/scans/${id}`)}`);

  const ws = await resolveWorkspaceFromSlug(slug, user.id);
  const db = getDb();

  const rows = await db
    .select({
      rawScan: schema.scan.rawScan,
      rawReport: schema.scan.rawReport,
      rootPath: schema.scan.rootPath,
      status: schema.scan.status,
      failureReason: schema.scan.failureReason,
      createdAt: schema.scan.createdAt,
    })
    .from(schema.scan)
    .where(
      and(eq(schema.scan.id, id), eq(schema.scan.workspaceId, ws.id)),
    )
    .limit(1);

  const row = rows[0];
  if (!row) notFound();

  const status = row.status as
    | "queued"
    | "running"
    | "complete"
    | "failed";
  const ready =
    status === "complete" &&
    row.rawScan !== null &&
    row.rawReport !== null;

  return (
    <main>
      <header>
        <h1>Scan detail</h1>
        <p>
          <code>{row.rootPath}</code> · {row.createdAt.toISOString()}
        </p>
      </header>

      <ScanStatusBanner scanId={id} initialStatus={status} />

      {ready ? (
        <ReportView
          scan={revivePersistedScan(row.rawScan as ParserResult)}
          report={revivePersistedReport(row.rawReport as AuditReport)}
          scanId={id}
        />
      ) : null}

      <footer>
        <Link href={`/${ws.slug}/scans`}>← All scans</Link> ·{" "}
        <Link href="/">Run a new audit</Link>
      </footer>
    </main>
  );
}

function revivePersistedScan(raw: ParserResult): ParserResult {
  return {
    ...raw,
    scannedAt: new Date(raw.scannedAt as unknown as string),
    files: raw.files.map((f) => ({
      ...f,
      lastModified: f.lastModified
        ? new Date(f.lastModified as unknown as string)
        : null,
    })),
  };
}

function revivePersistedReport(raw: AuditReport): AuditReport {
  return {
    ...raw,
    generatedAt: new Date(raw.generatedAt as unknown as string),
  };
}
