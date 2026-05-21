import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isAuthEnabled } from "@vk/auth";
import { SiteNav } from "@/components/SiteNav";
import { RequestWriteButton } from "@/components/RequestWriteButton";
import { getSessionUser } from "@/lib/session";
import { resolveWorkspaceFromSlug } from "@/lib/workspace-context";
import { getRepo } from "@/lib/customers";
import { Card, CardContent } from "@/components/ui/card";
import { SeverityBadge } from "@/components/ui/severity-badge";
import type { SeverityBand } from "@vk/core";

function statusSeverity(status: string): SeverityBand {
  if (status === "complete") return "Strong";
  if (status === "failed") return "Kill";
  return "Mid";
}

export default async function RepoDetailPage({
  params,
}: {
  params: Promise<{ workspace: string; repoId: string }>;
}) {
  if (!isAuthEnabled()) redirect("/login");
  const user = await getSessionUser();
  const { workspace: slug, repoId } = await params;
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/${slug}/repos/${repoId}`)}`);
  }

  const ws = await resolveWorkspaceFromSlug(slug, user.id);
  const data = await getRepo(ws.id, repoId);
  if (!data) notFound();

  return (
    <>
      <SiteNav />
      <main
        id="main-content"
        className="mx-auto max-w-4xl space-y-6 px-6 py-10 sm:px-8 sm:py-16"
      >
        <header className="space-y-2 border-b border-border pb-6">
          <h1 className="type-h1 font-semibold tracking-tight">
            {data.repo.label}
          </h1>
          <p className="text-sm text-muted-foreground">
            <code className="font-mono type-mono-sm">{data.repo.rootPath}</code>
            {data.repo.githubFullName ? (
              <>
                {" · GitHub "}
                <code className="font-mono type-mono-sm">
                  {data.repo.githubFullName}
                </code>
              </>
            ) : null}
          </p>
          <Link
            href={`/${ws.slug}/repos/${repoId}/access`}
            className="inline-block text-sm underline-offset-4 hover:underline"
          >
            → Access · members + pending install-requests
          </Link>
        </header>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Card>
            <CardContent className="py-3">
              <p className="type-mono-sm uppercase tracking-wider text-muted-foreground">
                Write access
              </p>
              <p className="mt-1.5">
                <SeverityBadge
                  severity={data.repo.writeAccessGranted ? "Weak" : "Strong"}
                />
                <span className="ml-2 text-sm">
                  {data.repo.writeAccessGranted ? "yes" : "read-only"}
                </span>
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3">
              <p className="type-mono-sm uppercase tracking-wider text-muted-foreground">
                Scans
              </p>
              <p className="mt-1.5 text-xl font-semibold tabular-nums">
                {data.scans.length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3">
              <p className="type-mono-sm uppercase tracking-wider text-muted-foreground">
                Added
              </p>
              <p className="mt-1.5 font-mono text-sm">
                {data.repo.createdAt.toISOString().slice(0, 10)}
              </p>
            </CardContent>
          </Card>
        </section>

        {data.repo.writeAccessGranted ? null : (
          <section className="space-y-3">
            <h2 className="text-base font-semibold">Write access</h2>
            <p className="text-sm text-muted-foreground">
              This customer-repo is read-only. Submit a request to unlock the PR
              workflow.
            </p>
            <RequestWriteButton
              workspaceSlug={ws.slug}
              repoLabel={data.repo.label}
              rootPath={data.repo.rootPath}
            />
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-base font-semibold">Recent audits</h2>
          {data.scans.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-6 text-center text-sm text-muted-foreground">
                No audits against this root path yet. Run one at{" "}
                <Link href="/" className="underline-offset-4 hover:underline">
                  /
                </Link>{" "}
                and it lands here automatically.
              </CardContent>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-4 py-2 font-medium">When</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                      <th className="px-4 py-2 font-medium">Severity</th>
                      <th className="px-4 py-2 font-medium">Findings</th>
                      <th className="px-4 py-2 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.scans.map((s) => (
                      <tr
                        key={s.id}
                        className="border-b border-border last:border-0"
                      >
                        <td className="px-4 py-2 font-mono type-mono-sm tabular-nums">
                          {s.createdAt
                            .toISOString()
                            .slice(0, 16)
                            .replace("T", " ")}
                        </td>
                        <td className="px-4 py-2">
                          <SeverityBadge severity={statusSeverity(s.status)} />
                        </td>
                        <td className="px-4 py-2">
                          <SeverityBadge
                            severity={s.overallSeverity as SeverityBand}
                          />
                        </td>
                        <td className="px-4 py-2 font-mono type-mono-sm tabular-nums">
                          {s.findingsCount}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <Link
                            href={`/${ws.slug}/scans/${s.id}`}
                            className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                          >
                            view →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </section>

        <footer className="border-t border-border pt-6 text-xs text-muted-foreground">
          <Link href={`/${ws.slug}/customers`} className="hover:text-foreground">
            ← All customers
          </Link>
        </footer>
      </main>
    </>
  );
}
