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
import { DashboardEventBus } from "@/components/dashboard/DashboardEventBus";
import { RepoGraphClient } from "@/components/dashboard/RepoGraphClient";
import { OnboardingChecklist } from "@/components/dashboard/OnboardingChecklist";
import { SubscriptionBanner } from "@/components/dashboard/SubscriptionBanner";
import { ensureSubscription } from "@vk/billing";
import type { RepoGraphInput } from "@/components/dashboard/RepoGraph";

type SearchParams = Promise<{
  view?: string;
  severity?: string;
  activity?: string;
  display?: string;
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
  const display = sp.display === "graph" ? "graph" : "table";

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
    whereClauses.push(gte(schema.scan.createdAt, new Date(Date.now() - 24 * 3_600_000)));
  } else if (activity === "Last 7d") {
    whereClauses.push(gte(schema.scan.createdAt, new Date(Date.now() - 7 * 24 * 3_600_000)));
  } else if (activity === "Last 30d") {
    whereClauses.push(gte(schema.scan.createdAt, new Date(Date.now() - 30 * 24 * 3_600_000)));
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

  const graphData = display === "graph" ? await buildGraphInput(user.id) : null;

  const onboarding = await buildOnboardingStatus(user.id);
  const showOnboarding =
    !onboarding.hasScans || !onboarding.hasRepos || !onboarding.hasDrift;
  const subscription = await ensureSubscription(user.id);

  return (
    <SidebarProvider>
      <DashboardSidebar repos={sidebarRepos} />
      <SidebarInset>
        <DashboardEventBus />
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

        <main className="flex-1 space-y-6 p-4 sm:p-6">
          <SubscriptionBanner
            status={subscription.status}
            tierLabel={subscription.config.label}
          />
          {showOnboarding ? (
            <OnboardingChecklist status={onboarding} />
          ) : null}
          <div className="flex items-baseline justify-between">
            <p className="text-xs text-muted-foreground">
              {display === "graph" && graphData
                ? `${graphData.nodes.length} repo${graphData.nodes.length === 1 ? "" : "s"} · ${graphData.edges.length} drift edge${graphData.edges.length === 1 ? "" : "s"}`
                : `${rows.length} ${rows.length === 1 ? "scan" : "scans"}${
                    sevFilter && sevFilter !== "All" ? ` · severity: ${sevFilter}` : ""
                  }${
                    activity && activity !== "Any time"
                      ? ` · ${activity.toLowerCase()}`
                      : ""
                  }`}
            </p>
          </div>
          {display === "graph" && graphData ? (
            <RepoGraphClient data={graphData} />
          ) : (
            <DashboardTable rows={rows} />
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

async function buildOnboardingStatus(userId: string): Promise<{
  hasScans: boolean;
  hasRepos: boolean;
  hasDrift: boolean;
}> {
  const db = getDb();
  const [scanRow] = await db
    .select({ id: schema.scan.id })
    .from(schema.scan)
    .innerJoin(
      schema.workspace,
      eq(schema.scan.workspaceId, schema.workspace.id),
    )
    .where(eq(schema.workspace.ownerId, userId))
    .limit(1);
  const [repoRow] = await db
    .select({ id: schema.repo.id })
    .from(schema.repo)
    .innerJoin(
      schema.workspace,
      eq(schema.repo.workspaceId, schema.workspace.id),
    )
    .where(eq(schema.workspace.ownerId, userId))
    .limit(1);
  const [driftRow] = await db
    .select({ id: schema.driftRun.id })
    .from(schema.driftRun)
    .innerJoin(
      schema.workspace,
      eq(schema.driftRun.workspaceId, schema.workspace.id),
    )
    .where(eq(schema.workspace.ownerId, userId))
    .limit(1);
  return {
    hasScans: Boolean(scanRow),
    hasRepos: Boolean(repoRow),
    hasDrift: Boolean(driftRow),
  };
}

async function buildGraphInput(userId: string): Promise<RepoGraphInput> {
  const db = getDb();

  const repos = await db
    .select({
      id: schema.repo.id,
      label: schema.repo.label,
      rootPath: schema.repo.rootPath,
      canonicalRepoId: schema.repo.canonicalRepoId,
    })
    .from(schema.repo)
    .innerJoin(
      schema.workspace,
      eq(schema.repo.workspaceId, schema.workspace.id),
    )
    .where(eq(schema.workspace.ownerId, userId));

  // latest scan per repo (small N, simple per-repo query is fine).
  const enriched = await Promise.all(
    repos.map(async (r) => {
      const latest = await db
        .select({
          id: schema.scan.id,
          severity: schema.scan.overallSeverity,
          createdAt: schema.scan.createdAt,
        })
        .from(schema.scan)
        .where(eq(schema.scan.repoId, r.id))
        .orderBy(desc(schema.scan.createdAt))
        .limit(1);
      const top = latest[0];
      return {
        id: r.id,
        data: {
          label: shortName(r.rootPath || r.label),
          rootPath: r.rootPath,
          severity: ((top?.severity as SeverityBand) ?? "Mid") as SeverityBand,
          lastActivityIso: top?.createdAt ? top.createdAt.toISOString() : null,
          canonical: repos.some((x) => x.canonicalRepoId === r.id),
          scanId: top?.id ?? null,
        },
      };
    }),
  );

  // Drift edges: latest drift_run per (rootPathA, rootPathB) pair within workspace.
  const drifts = await db
    .select({
      id: schema.driftRun.id,
      rootPathA: schema.driftRun.rootPathA,
      rootPathB: schema.driftRun.rootPathB,
      overallSeverity: schema.driftRun.overallSeverity,
      itemsCount: schema.driftRun.itemsCount,
    })
    .from(schema.driftRun)
    .innerJoin(
      schema.workspace,
      eq(schema.driftRun.workspaceId, schema.workspace.id),
    )
    .where(eq(schema.workspace.ownerId, userId))
    .orderBy(desc(schema.driftRun.createdAt))
    .limit(50);

  const repoByPath = new Map(repos.map((r) => [r.rootPath, r.id]));
  const seenPair = new Set<string>();
  const edges = [] as RepoGraphInput["edges"];
  for (const d of drifts) {
    const src = repoByPath.get(d.rootPathA);
    const tgt = repoByPath.get(d.rootPathB);
    if (!src || !tgt || src === tgt) continue;
    const key = `${src}-${tgt}`;
    if (seenPair.has(key)) continue;
    seenPair.add(key);
    edges.push({
      id: d.id,
      sourceRepoId: src,
      targetRepoId: tgt,
      severity: d.overallSeverity as SeverityBand,
      itemsCount: d.itemsCount,
      driftId: d.id,
    });
  }

  return { nodes: enriched, edges };
}
