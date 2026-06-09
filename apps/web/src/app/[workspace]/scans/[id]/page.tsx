import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@vk/db";
import { isAuthEnabled } from "@vk/auth";
import type { AuditReport, ParserResult } from "@vk/core";
import { ReportView } from "@/components/ReportView";
import { ScanStatusBanner } from "@/components/ScanStatusBanner";
import { getSessionUser } from "@/lib/session";
import { resolveWorkspaceFromSlug } from "@/lib/workspace-context";
import { SiteNav } from "@/components/SiteNav";
import { PageShell, PageHeader } from "@/components/ui-vk";

function formatScanDate(d: Date): string {
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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
    <>
      <SiteNav />
      <PageShell as="main" id="main-content" className="space-y-8">
        <PageHeader
          title="Scan detail"
          subtitle={`${row.rootPath} · ${formatScanDate(row.createdAt)}`}
          breadcrumb={
            <Link
              href={`/${ws.slug}/scans`}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              All scans
            </Link>
          }
        />

        <ScanStatusBanner scanId={id} initialStatus={status} />

        {ready ? (
          <ReportView
            scan={revivePersistedScan(row.rawScan as ParserResult)}
            report={revivePersistedReport(row.rawReport as AuditReport)}
            scanId={id}
          />
        ) : null}

        <footer className="border-t border-border pt-6 text-xs text-muted-foreground">
          <Link href={`/${ws.slug}/scans`} className="hover:text-foreground">
            ← All scans
          </Link>{" "}
          ·{" "}
          <Link href="/" className="hover:text-foreground">
            Run a new audit
          </Link>
        </footer>
      </PageShell>
    </>
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
