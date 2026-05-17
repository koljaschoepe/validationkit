import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@vk/db";
import { isAuthEnabled } from "@vk/auth";
import type { DriftReport } from "@vk/core";
import { DriftView } from "@/components/DriftView";
import { getSessionUser } from "@/lib/session";

export default async function DriftDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isAuthEnabled()) redirect("/login");
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const db = getDb();

  const rows = await db
    .select({
      rawDrift: schema.driftRun.rawDrift,
      rootPathA: schema.driftRun.rootPathA,
      rootPathB: schema.driftRun.rootPathB,
      createdAt: schema.driftRun.createdAt,
    })
    .from(schema.driftRun)
    .innerJoin(
      schema.workspace,
      eq(schema.driftRun.workspaceId, schema.workspace.id),
    )
    .where(
      and(eq(schema.driftRun.id, id), eq(schema.workspace.ownerId, user.id)),
    )
    .limit(1);

  const row = rows[0];
  if (!row) notFound();

  const drift = revive(row.rawDrift as DriftReport);

  return (
    <main>
      <header>
        <h1>Drift detail</h1>
        <p>
          <code>{row.rootPathA}</code> → <code>{row.rootPathB}</code>{" "}
          <span style={{ color: "var(--fg-muted)" }}>
            · {row.createdAt.toISOString()}
          </span>
        </p>
      </header>
      <DriftView drift={drift} />
      <footer>
        <Link href="/drifts">← All drifts</Link> ·{" "}
        <Link href="/drift">Run a new drift</Link>
      </footer>
    </main>
  );
}

function revive(raw: DriftReport): DriftReport {
  return {
    ...raw,
    generatedAt: new Date(raw.generatedAt as unknown as string),
  };
}
