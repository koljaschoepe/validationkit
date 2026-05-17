import { redirect } from "next/navigation";
import { desc, eq, and, inArray, gte } from "drizzle-orm";
import { getDb, schema } from "@vk/db";
import { isAuthEnabled } from "@vk/auth";
import type { SeverityBand } from "@vk/core";
import { getSessionUser } from "@/lib/session";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardFilterStrip } from "@/components/dashboard/DashboardFilterStrip";
import { DashboardTable } from "@/components/dashboard/DashboardTable";

type SearchParams = Promise<{
  view?: string;
  severity?: string;
  activity?: string;
}>;

const SEVERITY_VALUES: SeverityBand[] = [
  "Kill",
  "Weak",
  "Mid",
  "Strong",
  "Exceptional",
];

function shortName(rootPath: string): string {
  if (rootPath.startsWith("github.com/")) {
    return rootPath.replace("github.com/", "");
  }
  const parts = rootPath.split("/").filter(Boolean);
  return parts.slice(-2).join("/") || rootPath;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  if (!isAuthEnabled()) {
    redirect("/login");
  }
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const sevFilter = sp.severity;
  const view = sp.view ?? "all";
  const activity = sp.activity;

  const db = getDb();

  const whereClauses = [eq(schema.workspace.ownerId, user.id)];

  if (view === "critical" || sevFilter === "Kill") {
    whereClauses.push(inArray(schema.scan.overallSeverity, ["Kill", "Weak"]));
  } else if (sevFilter && SEVERITY_VALUES.includes(sevFilter as SeverityBand)) {
    whereClauses.push(
      eq(schema.scan.overallSeverity, sevFilter as SeverityBand),
    );
  }

  if (activity === "Last 24h") {
    whereClauses.push(gte(schema.scan.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)));
  } else if (activity === "Last 7d") {
    whereClauses.push(gte(schema.scan.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)));
  } else if (activity === "Last 30d") {
    whereClauses.push(gte(schema.scan.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)));
  }

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
    .where(and(...whereClauses))
    .orderBy(desc(schema.scan.createdAt))
    .limit(50);

  const rows = scans.map((s) => ({
    ...s,
    overallSeverity: s.overallSeverity as SeverityBand,
  }));

  const sidebarRepos = rows.slice(0, 8).map((s) => ({
    scanId: s.id,
    rootPath: s.rootPath,
    shortName: shortName(s.rootPath),
  }));

  return (
    <SidebarProvider>
      <DashboardSidebar repos={sidebarRepos} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />
          <div className="flex flex-1 items-center justify-between">
            <h1 className="text-sm font-semibold">Dashboard</h1>
            <span className="text-xs text-muted-foreground font-mono">
              {user.email}
            </span>
          </div>
        </header>

        <DashboardFilterStrip />

        <main className="flex-1 p-4 sm:p-6">
          <div className="mb-4 flex items-baseline justify-between">
            <p className="text-xs text-muted-foreground">
              {scans.length} {scans.length === 1 ? "scan" : "scans"}
              {sevFilter && sevFilter !== "All" ? ` · severity: ${sevFilter}` : ""}
              {activity && activity !== "Any time" ? ` · ${activity.toLowerCase()}` : ""}
            </p>
          </div>
          <DashboardTable rows={rows} />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
