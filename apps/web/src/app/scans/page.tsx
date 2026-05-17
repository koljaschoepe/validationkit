import Link from "next/link";
import { redirect } from "next/navigation";
import { ExternalLink, ScanLine } from "lucide-react";
import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@vk/db";
import { isAuthEnabled } from "@vk/auth";
import type { SeverityBand } from "@vk/core";
import { getSessionUser } from "@/lib/session";
import { SiteNav } from "@/components/SiteNav";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
    <>
      <SiteNav />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Saved scans</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Signed in as{" "}
            <code className="font-mono text-foreground">{user.email}</code>.
            Every audit you run signed-in lands here.
          </p>
        </header>

        {scans.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <ScanLine className="size-8 text-muted-foreground" />
              <div className="space-y-1">
                <p className="font-medium">No saved scans yet.</p>
                <p className="text-sm text-muted-foreground max-w-md">
                  <strong className="text-foreground">Concession:</strong>{" "}
                  scans don&apos;t auto-create until you point an audit at a
                  real repo.{" "}
                  <strong className="text-foreground">Critique:</strong> the
                  free tier covers 20 audits / month — run more than that and
                  the dashboard becomes load-bearing.
                </p>
              </div>
              <Button asChild size="sm">
                <Link href="/">Run an audit</Link>
              </Button>
            </CardContent>
          </Card>
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
                          href={`/scans/${s.id}`}
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
          ValidationKit v0.0.14 ·{" "}
          <Link href="/" className="hover:text-foreground">Audit</Link> ·{" "}
          <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link> ·{" "}
          <Link href="/drift" className="hover:text-foreground">Drift</Link>
        </footer>
      </main>
    </>
  );
}
