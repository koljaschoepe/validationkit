import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { ShieldCheck, UserPlus } from "lucide-react";
import { isAuthEnabled } from "@vk/auth";
import { getDb, schema } from "@vk/db";
import { SiteNav } from "@/components/SiteNav";
import { getSessionUser } from "@/lib/session";
import { resolveWorkspaceFromSlug } from "@/lib/workspace-context";
import {
  getUserRole,
  listMembers,
  type Role,
} from "@/lib/membership";
import {
  listPendingRequestsForWorkspace,
  listDecisionsForWorkspace,
} from "@/lib/install-requests";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AccessForms } from "./AccessForms";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<Role, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
};

export default async function AccessPage({
  params,
}: {
  params: Promise<{ workspace: string; id: string }>;
}) {
  if (!isAuthEnabled()) redirect("/login");
  const user = await getSessionUser();
  const { workspace: slug, id } = await params;
  if (!user) {
    redirect(
      `/login?next=${encodeURIComponent(`/${slug}/customers/${id}/access`)}`,
    );
  }

  const ws = await resolveWorkspaceFromSlug(slug, user.id);

  const db = getDb();
  const repoRows = await db
    .select({
      repoId: schema.repo.id,
      label: schema.repo.label,
      rootPath: schema.repo.rootPath,
    })
    .from(schema.repo)
    .where(
      and(eq(schema.repo.id, id), eq(schema.repo.workspaceId, ws.id)),
    )
    .limit(1);
  const row = repoRows[0];
  if (!row) notFound();

  // Visible only to owner+admin of the workspace.
  const role = await getUserRole(ws.id, user.id);
  const isLegacyOwner = ws.ownerId === user.id;
  if (!isLegacyOwner && role !== "owner" && role !== "admin") {
    return (
      <>
        <SiteNav />
        <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="py-4 text-sm">
              You don&apos;t have admin access to this customer-repo.{" "}
              <Link
                href={`/${ws.slug}/customers/${id}`}
                className="text-primary underline-offset-4 hover:underline"
              >
                Back to customer
              </Link>
              .
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  const [members, pending, decisions] = await Promise.all([
    listMembers(ws.id),
    listPendingRequestsForWorkspace(ws.id),
    listDecisionsForWorkspace(ws.id),
  ]);

  const isOwner = isLegacyOwner || role === "owner";

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6">
        <header className="space-y-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">
              Access · {row.label}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Workspace-level admin. Members listed here can decide
            install-requests against any repo in this workspace.{" "}
            <Link
              href={`/${ws.slug}/customers/${id}`}
              className="text-primary underline-offset-4 hover:underline"
            >
              Back to customer
            </Link>
          </p>
        </header>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base flex items-center gap-2">
                <UserPlus className="size-4" />
                Members
              </CardTitle>
              <Badge variant="outline">
                {members.length} member
                {members.length === 1 ? "" : "s"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-2 text-sm">
              {members.map((m) => (
                <li
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-card/40 px-3 py-2"
                >
                  <div className="space-y-0.5">
                    <div className="font-mono text-xs">
                      {m.email ?? m.invitedEmail ?? "(no email)"}
                    </div>
                    <div className="type-mono-sm text-muted-foreground">
                      {m.status === "pending"
                        ? `Invited ${m.invitedAt.toISOString().slice(0, 10)} · pending`
                        : `Joined ${m.acceptedAt?.toISOString().slice(0, 10) ?? m.invitedAt.toISOString().slice(0, 10)}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={m.role === "owner" ? "default" : "secondary"}
                    >
                      {ROLE_LABEL[m.role] ?? m.role}
                    </Badge>
                    {isOwner && m.role !== "owner" ? (
                      <AccessForms.RevokeButton
                        workspaceId={ws.id}
                        membershipId={m.id}
                      />
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
            <Separator />
            <AccessForms.InviteForm workspaceId={ws.id} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Pending install-requests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pending.filter((p) => p.status === "pending").length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing pending. Each new GitHub-App install on a
                read-only-default repo creates a request here.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {pending
                  .filter((p) => p.status === "pending")
                  .map((p) => (
                    <li
                      key={p.id}
                      className="rounded-md border bg-card/40 px-3 py-3 space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="font-mono text-xs">
                            {p.targetRepoLabel}
                          </div>
                          <div className="type-mono-sm text-muted-foreground font-mono">
                            {p.targetRootPath}
                          </div>
                          <div className="type-mono-sm text-muted-foreground">
                            requested by {p.requesterEmail ?? "(unknown)"} ·{" "}
                            {p.requestedAt
                              .toISOString()
                              .slice(0, 16)
                              .replace("T", " ")}
                            {" UTC"}
                          </div>
                        </div>
                        <Badge
                          variant={
                            p.requestedScope === "write"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {p.requestedScope}
                        </Badge>
                      </div>
                      <AccessForms.DecideButtons requestId={p.id} />
                    </li>
                  ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Decision history</CardTitle>
          </CardHeader>
          <CardContent>
            {decisions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No decisions yet. Every approve/reject lands here append-only
                with IP + user-agent for the DPA audit-trail.
              </p>
            ) : (
              <ul className="space-y-1 text-xs font-mono">
                {decisions.map((d) => (
                  <li
                    key={d.id}
                    className="flex flex-wrap items-center gap-2 border-b border-border/50 py-1.5 last:border-0"
                  >
                    <span className="text-muted-foreground">
                      {d.decidedAt
                        .toISOString()
                        .slice(0, 16)
                        .replace("T", " ")}
                    </span>
                    <Badge
                      variant={
                        d.decision === "approve" ? "default" : "outline"
                      }
                      className="type-mono-sm"
                    >
                      {d.decision}
                    </Badge>
                    <span className="text-muted-foreground">by</span>
                    <span>{d.deciderEmail ?? "(unknown)"}</span>
                    {d.reason ? (
                      <span className="text-muted-foreground">
                        · {d.reason}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <footer className="border-t border-border pt-6 text-xs text-muted-foreground">
          ValidationKit ·{" "}
          <Link
            href="/trust/dpa"
            className="hover:text-foreground"
          >
            DPA
          </Link>{" "}
          ·{" "}
          <Link
            href={`/${ws.slug}`}
            className="hover:text-foreground"
          >
            Galaxie
          </Link>
        </footer>
      </main>
    </>
  );
}
