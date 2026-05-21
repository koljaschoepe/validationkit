import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";
import { isAuthEnabled } from "@vk/auth";
import { SiteNav } from "@/components/SiteNav";
import { getSessionUser } from "@/lib/session";
import { resolveWorkspaceFromSlug } from "@/lib/workspace-context";
import { getCustomerById } from "@/lib/customer-dal";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { AddRepoForm } from "@/components/AddRepoForm";
import { ApplyModeSelector } from "@/components/ApplyModeSelector";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ workspace: string; customerId: string }>;
}) {
  if (!isAuthEnabled()) redirect("/login");
  const user = await getSessionUser();
  const { workspace: slug, customerId } = await params;
  if (!user) {
    redirect(
      `/login?next=${encodeURIComponent(`/${slug}/customers/${customerId}`)}`,
    );
  }

  const ws = await resolveWorkspaceFromSlug(slug, user.id);
  const result = await getCustomerById(ws.id, customerId);
  if (!result) notFound();
  const { customer, repos } = result;

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-8">
        <Link
          href={`/${ws.slug}/customers`}
          className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground"
        >
          <ChevronLeftIcon className="size-3.5" />
          All customers
        </Link>

        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">{customer.label}</h1>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="font-mono">{customer.slug}</span>
              <span>·</span>
              <SeverityBadge severity={customer.aggregateSeverity} />
              <span>·</span>
              {customer.githubOrg ? (
                <>
                  <span>·</span>
                  <span className="font-mono">github: {customer.githubOrg}</span>
                </>
              ) : null}
            </div>
          </div>
        </header>

        <section className="space-y-2">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Apply mode
          </h2>
          <p className="text-xs text-muted-foreground">
            Default for new solutions in this customer's repos. PR = review-friendly.
            Direct = commit straight to main (only if you trust auto-fixes here).
          </p>
          <ApplyModeSelector
            workspaceSlug={ws.slug}
            customerId={customer.id}
            current={customer.defaultApplyMode as "pr" | "direct"}
          />
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Repos ({repos.length})
          </h2>
          {repos.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No repos for this customer yet.
              </CardContent>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Label</TableHead>
                      <TableHead>Root</TableHead>
                      <TableHead className="w-28">Latest audit</TableHead>
                      <TableHead className="w-28">Severity</TableHead>
                      <TableHead className="w-28">Apply</TableHead>
                      <TableHead className="w-16" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {repos.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.label}</TableCell>
                        <TableCell className="font-mono text-xs">{r.rootPath}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {r.latestScanAt
                            ? r.latestScanAt.toISOString().slice(0, 10)
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <SeverityBadge severity={r.aggregateSeverity} />
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-mono type-mono-sm">
                            {r.applyMode}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link
                            href={`/${ws.slug}/repos/${r.id}`}
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            Open
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Add repo under {customer.label}
          </h2>
          <AddRepoForm workspaceSlug={ws.slug} customerId={customer.id} />
        </section>
      </main>
    </>
  );
}
