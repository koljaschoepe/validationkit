import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRightIcon, FolderIcon } from "lucide-react";
import { isAuthEnabled } from "@vk/auth";
import { SiteNav } from "@/components/SiteNav";
import { AddCustomerForm } from "@/components/AddCustomerForm";
import { getSessionUser } from "@/lib/session";
import { listCustomers } from "@/lib/customer-dal";
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

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  if (!isAuthEnabled()) redirect("/login");
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const customers = await listCustomers(user.id);

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Each customer is one client of yours with one or more repos
            grouped underneath. The Galaxie surfaces them as planets with
            severity hotspots; this view is the tabular twin for bulk edits.
          </p>
        </header>

        {customers.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center space-y-3">
              <p className="font-medium">No customers yet.</p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Add one below to start. Each customer is a client-org-level
                grouping; repos attach to a customer.
              </p>
            </CardContent>
          </Card>
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
                          href={`/customers/c/${c.id}` as never}
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
                        <Badge variant="secondary" className="font-mono text-[10px]">
                          {c.defaultApplyMode}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/customers/c/${c.id}` as never}
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

        <section className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Add customer
          </h2>
          <p className="text-xs text-muted-foreground max-w-2xl">
            Just the label first. You attach repos in the customer detail page.
          </p>
          <AddCustomerForm />
        </section>

        <footer className="border-t border-border pt-6 text-xs text-muted-foreground">
          ValidationKit ·{" "}
          <Link href="/" className="hover:text-foreground">Audit</Link> ·{" "}
          <Link href="/drift" className="hover:text-foreground">Drift</Link> ·{" "}
          <Link href="/customers" className="hover:text-foreground">Customers</Link>
        </footer>
      </main>
    </>
  );
}
