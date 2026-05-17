import Link from "next/link";
import { redirect } from "next/navigation";
import { MoreHorizontal, ExternalLink } from "lucide-react";
import { isAuthEnabled } from "@vk/auth";
import { SiteNav } from "@/components/SiteNav";
import { AddCustomerForm } from "@/components/AddCustomerForm";
import { getSessionUser } from "@/lib/session";
import { listCustomers } from "@/lib/customers";
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
import { Button } from "@/components/ui/button";
import { SeverityBadge } from "@/components/ui/severity-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
            Per-customer repo list with latest audit severity. The
            Operations-Wedge promise (PRD §3): 5–30 customer-repos, kept aligned.
          </p>
        </header>

        {customers.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center space-y-3">
              <p className="font-medium">No customers yet.</p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Add one below, or install the GitHub App on a repo — installs
                auto-create customer rows once the install-webhook lands.
              </p>
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
                    <TableHead className="w-28">Last audit</TableHead>
                    <TableHead className="w-28">Severity</TableHead>
                    <TableHead className="w-16 text-right">Scans</TableHead>
                    <TableHead className="w-28">Write access</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.label}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {c.rootPath}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {c.latestScanAt
                          ? c.latestScanAt.toISOString().slice(0, 10)
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {c.latestScanSeverity ? (
                          <SeverityBadge severity={c.latestScanSeverity} />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs tabular-nums">
                        {c.scanCount}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={c.writeAccessGranted ? "default" : "secondary"}
                        >
                          {c.writeAccessGranted ? "write" : "read-only"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-7">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/customers/${c.id}`}>
                                <ExternalLink className="size-3.5" />
                                Open
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem disabled>
                              Re-audit (Sprint 0.12)
                            </DropdownMenuItem>
                            <DropdownMenuItem disabled>
                              Drift against canonical (Sprint 0.12)
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem disabled className="text-destructive">
                              Delete (Sprint 0.13)
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
          <AddCustomerForm />
        </section>

        <footer className="border-t border-border pt-6 text-xs text-muted-foreground">
          ValidationKit v0.0.11 ·{" "}
          <Link href="/" className="hover:text-foreground">Audit</Link> ·{" "}
          <Link href="/drift" className="hover:text-foreground">Drift</Link> ·{" "}
          <Link href="/customers" className="hover:text-foreground">Customers</Link>
        </footer>
      </main>
    </>
  );
}
