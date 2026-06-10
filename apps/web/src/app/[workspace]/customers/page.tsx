import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRightIcon, FolderPlus } from "lucide-react";
import { isAuthEnabled } from "@vk/auth";
import { SiteNav } from "@/components/SiteNav";
import { AddCustomerForm } from "@/components/AddCustomerForm";
import { getSessionUser } from "@/lib/session";
import { resolveWorkspaceFromSlug } from "@/lib/workspace-context";
import { listCustomers } from "@/lib/customer-dal";
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
import { Badge } from "@/components/ui/badge";
import { SeverityBadge } from "@/components/ui/severity-badge";

export const dynamic = "force-dynamic";

export default async function CustomersPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  if (!isAuthEnabled()) redirect("/login");
  const user = await getSessionUser();
  const { workspace: slug } = await params;
  if (!user) redirect(`/login?next=${encodeURIComponent(`/${slug}/customers`)}`);

  const ws = await resolveWorkspaceFromSlug(slug, user.id);
  const customers = await listCustomers(ws.id);

  return (
    <>
      <SiteNav />
      <PageShell as="main" size="default" className="space-y-8" id="main-content">
        <PageHeader
          title="Customers"
          subtitle="Each customer is one client of yours with one or more repos grouped underneath. The console ranks them by severity so the worst surface first; this view is the tabular twin for bulk edits."
        />

        {customers.length === 0 ? (
          <EmptyState
            icon={FolderPlus}
            title="No customers yet."
            description="Each customer is a client-org-level grouping; repos attach to a customer. Add your first one below."
            action={
              <a
                href="#add-customer"
                className="text-sm font-medium underline-offset-4 hover:underline"
              >
                Create first customer →
              </a>
            }
            size="large"
          />
        ) : (
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead className="w-28">Slug</TableHead>
                    <TableHead className="w-20 text-right">Repos</TableHead>
                    <TableHead className="w-28">Severity</TableHead>
                    <TableHead className="w-28">Apply mode</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/${ws.slug}/customers/${c.id}`}
                          className="hover:underline"
                        >
                          {c.label}
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {c.slug}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs tabular-nums">
                        {c.repoCount}
                      </TableCell>
                      <TableCell>
                        <SeverityBadge severity={c.aggregateSeverity} />
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono type-mono-sm">
                          {c.defaultApplyMode}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/${ws.slug}/customers/${c.id}`}
                          className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground"
                        >
                          Open
                          <ChevronRightIcon className="size-3.5" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <section id="add-customer" className="space-y-3 scroll-mt-8">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Add customer
          </h2>
          <p className="text-xs text-muted-foreground max-w-2xl">
            Just the label first. You attach repos in the customer detail page.
          </p>
          <AddCustomerForm workspaceSlug={ws.slug} />
        </section>

        <footer className="border-t border-border pt-6 text-xs text-muted-foreground">
          ValidationKit ·{" "}
          <Link href="/" className="hover:text-foreground">Audit</Link> ·{" "}
          <Link href={`/${ws.slug}/customers`} className="hover:text-foreground">Customers</Link>
        </footer>
      </PageShell>
    </>
  );
}
