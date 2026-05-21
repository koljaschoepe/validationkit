import Link from "next/link";
import { redirect } from "next/navigation";
import { Inbox } from "lucide-react";
import { isAuthEnabled } from "@vk/auth";
import { SiteNav } from "@/components/SiteNav";
import { RequestActions } from "@/components/RequestActions";
import { getSessionUser } from "@/lib/session";
import { resolveWorkspaceFromSlug } from "@/lib/workspace-context";
import { listRequestsForWorkspace } from "@/lib/install-requests";
import { Card, CardContent } from "@/components/ui/card";
import { SeverityBadge } from "@/components/ui/severity-badge";
import type { SeverityBand } from "@vk/core";

function scopeSeverity(scope: string): SeverityBand {
  return scope === "write" ? "Weak" : "Strong";
}

function statusSeverity(status: string): SeverityBand {
  if (status === "approved") return "Strong";
  if (status === "rejected") return "Kill";
  if (status === "revoked") return "Weak";
  return "Mid";
}

export default async function RequestsPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  if (!isAuthEnabled()) redirect("/login");
  const user = await getSessionUser();
  const { workspace: slug } = await params;
  if (!user) redirect(`/login?next=${encodeURIComponent(`/${slug}/requests`)}`);

  const ws = await resolveWorkspaceFromSlug(slug, user.id);
  const rows = await listRequestsForWorkspace(ws.id);

  return (
    <>
      <SiteNav />
      <main id="main-content" className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Install Requests</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Read-only is the default for every repo. Write-scope dispatch (the
            PR-Workflow) requires per-repo Customer-Admin approval — see{" "}
            <Link href="/trust" className="underline-offset-4 hover:underline">
              Trust Center
            </Link>{" "}
            and <code className="font-mono type-mono-sm">docs/legal/scope-policy.md</code>.
          </p>
        </header>

        {rows.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <Inbox
                className="size-8 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="font-medium">No install requests yet.</p>
              <p className="max-w-md text-sm text-muted-foreground">
                Anyone in your workspace can request write-access by calling{" "}
                <code className="font-mono type-mono-sm">requestInstall</code>{" "}
                in a server action, or via the GitHub-App install-webhook.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-2 font-medium">Requested</th>
                    <th className="px-4 py-2 font-medium">Repo</th>
                    <th className="px-4 py-2 font-medium">Scope</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                    <th className="px-4 py-2 font-medium">Decided</th>
                    <th className="px-4 py-2 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-2 font-mono type-mono-sm tabular-nums">
                        {r.requestedAt.toISOString().slice(0, 16).replace("T", " ")}
                      </td>
                      <td className="px-4 py-2 font-mono type-mono-sm">
                        {r.targetRepoLabel}
                      </td>
                      <td className="px-4 py-2">
                        <SeverityBadge severity={scopeSeverity(r.requestedScope)} />
                      </td>
                      <td className="px-4 py-2">
                        <SeverityBadge severity={statusSeverity(r.status)} />
                      </td>
                      <td className="px-4 py-2 font-mono type-mono-sm tabular-nums text-muted-foreground">
                        {r.decidedAt
                          ? r.decidedAt
                              .toISOString()
                              .slice(0, 16)
                              .replace("T", " ")
                          : "—"}
                      </td>
                      <td className="px-4 py-2">
                        {r.status === "pending" ? (
                          <RequestActions requestId={r.id} />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        <footer className="border-t border-border pt-6 text-xs text-muted-foreground">
          ValidationKit · <Link href="/" className="hover:text-foreground">Audit</Link>{" "}
          · <Link href={`/${ws.slug}/scans`} className="hover:text-foreground">Scans</Link>{" "}
          · <Link href={`/${ws.slug}/requests`} className="hover:text-foreground">Requests</Link>{" "}
          · <Link href="/trust" className="hover:text-foreground">Trust</Link>
        </footer>
      </main>
    </>
  );
}
