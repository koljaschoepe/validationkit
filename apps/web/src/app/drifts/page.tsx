import Link from "next/link";
import { redirect } from "next/navigation";
import { GitCompareIcon, ExternalLink } from "lucide-react";
import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@vk/db";
import { isAuthEnabled } from "@vk/auth";
import type { SeverityBand } from "@vk/core";
import { SiteNav } from "@/components/SiteNav";
import { getSessionUser } from "@/lib/session";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SeverityBadge } from "@/components/ui/severity-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
    <>
      <SiteNav />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Saved drifts</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Multi-repo comparison runs persisted to your workspace. The
            agency-wedge load-bearing artefact: customer repos kept aligned to
            a canonical template.
          </p>
        </header>

        {rows.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <GitCompareIcon className="size-8 text-muted-foreground" />
              <div className="space-y-1">
                <p className="font-medium">No drift runs yet.</p>
                <p className="text-sm text-muted-foreground max-w-md">
                  <strong className="text-foreground">Concession:</strong>{" "}
                  drift only matters when you have a canonical to drift
                  against.{" "}
                  <strong className="text-foreground">Critique:</strong> if
                  you&apos;re running ValidationKit on a single repo and never
                  hit this page, the Operations-wedge isn&apos;t for you yet —
                  stay on the validation side.
                </p>
              </div>
              <Button asChild size="sm">
                <Link href="/drift">Run a drift</Link>
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
                    <TableHead>Path A → B</TableHead>
                    <TableHead className="w-20 text-right">Items</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {r.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                      </TableCell>
                      <TableCell>
                        <SeverityBadge
                          severity={r.overallSeverity as SeverityBand}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {r.rootPathA} → {r.rootPathB}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs tabular-nums">
                        {r.itemsCount}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/drifts/${r.id}`}
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
          <Link href="/drift" className="hover:text-foreground">Drift</Link> ·{" "}
          <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link> ·{" "}
          <Link href="/trust" className="hover:text-foreground">Trust</Link>
        </footer>
      </main>
    </>
  );
}
