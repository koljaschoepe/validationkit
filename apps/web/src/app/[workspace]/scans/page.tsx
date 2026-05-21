import Link from "next/link";
import { redirect } from "next/navigation";
import { ExternalLink, ScanLine } from "lucide-react";
import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@vk/db";
import { isAuthEnabled } from "@vk/auth";
import type { SeverityBand } from "@vk/core";
import { getSessionUser } from "@/lib/session";
import { resolveWorkspaceFromSlug } from "@/lib/workspace-context";
import { SiteNav } from "@/components/SiteNav";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageShell, PageHeader, EmptyState } from "@/components/ui-vk";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function ScansPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  if (!isAuthEnabled()) redirect("/login");
  const user = await getSessionUser();
  const { workspace: slug } = await params;
  if (!user) redirect(`/login?next=${encodeURIComponent(`/${slug}/scans`)}`);

  const ws = await resolveWorkspaceFromSlug(slug, user.id);

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
    .where(eq(schema.scan.workspaceId, ws.id))
    .orderBy(desc(schema.scan.createdAt))
    .limit(50);

  return (
    <>
      <SiteNav />
      <PageShell as="main" id="main-content" className="space-y-8">
        <PageHeader
          title="Saved scans"
          subtitle={`Workspace ${ws.name}. Every audit you run signed-in lands here.`}
        />

        {scans.length === 0 ? (
          <EmptyState
            icon={ScanLine}
            title="No saved scans yet."
            description="Scans don't auto-create until you point an audit at a real repo. The free tier covers 20 audits / month — run more than that and the dashboard becomes load-bearing."
            action={
              <Button asChild size="sm">
                <Link href="/">Run an audit</Link>
              </Button>
            }
            size="large"
          />
        ) : (
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-40">Created</TableHead>
                    <TableHead className="w-28">Severity</TableHead>
                    <TableHead>Path</TableHead>
                    <TableHead className="w-20 text-right">Files</TableHead>
                    <TableHead className="w-24 text-right">Findings</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scans.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {s.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                      </TableCell>
                      <TableCell>
                        <SeverityBadge
                          severity={s.overallSeverity as SeverityBand}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {s.rootPath}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs tabular-nums">
                        {s.fileCount}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs tabular-nums">
                        {s.findingsCount}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/${ws.slug}/scans/${s.id}`}
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline underline-offset-4"
                        >
                          view
                          <ExternalLink className="size-3" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <footer className="border-t border-border pt-6 text-xs text-muted-foreground">
          ValidationKit ·{" "}
          <Link href="/" className="hover:text-foreground">Audit</Link> ·{" "}
          <Link href={`/${ws.slug}`} className="hover:text-foreground">Galaxie</Link>
        </footer>
      </PageShell>
    </>
  );
}
