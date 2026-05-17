import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthEnabled } from "@vk/auth";
import { SiteNav } from "@/components/SiteNav";
import { AddCustomerForm } from "@/components/AddCustomerForm";
import { getSessionUser } from "@/lib/session";
import { listCustomers } from "@/lib/customers";

export default async function CustomersPage() {
  if (!isAuthEnabled()) redirect("/login");
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const customers = await listCustomers(user.id);

  return (
    <main>
      <SiteNav />
      <header>
        <h1>Customers</h1>
        <p>
          Per-customer repo list with the latest audit severity at a glance. The
          Operations-Wedge promise (PRD §3): 5–30 customer-repos, kept aligned.
        </p>
      </header>

      {customers.length === 0 ? (
        <div className="callout">
          No customers yet. Add one below, or install the GitHub App on a repo —
          installs auto-create customer rows once the install-webhook lands.
        </div>
      ) : (
        <table className="inventory">
          <thead>
            <tr>
              <th>Label</th>
              <th>Root</th>
              <th>Last audit</th>
              <th>Severity</th>
              <th>Scans</th>
              <th>Write</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <td>{c.label}</td>
                <td className="path">{c.rootPath}</td>
                <td className="num">
                  {c.latestScanAt
                    ? c.latestScanAt.toISOString().slice(0, 10)
                    : "—"}
                </td>
                <td>
                  {c.latestScanSeverity ? (
                    <span
                      className="sev-pill"
                      data-sev={c.latestScanSeverity}
                    >
                      {c.latestScanSeverity}
                    </span>
                  ) : (
                    <span style={{ color: "var(--fg-muted)" }}>—</span>
                  )}
                </td>
                <td className="num">{c.scanCount}</td>
                <td>
                  <span
                    className="sev-pill"
                    data-sev={c.writeAccessGranted ? "Weak" : "Strong"}
                  >
                    {c.writeAccessGranted ? "yes" : "read-only"}
                  </span>
                </td>
                <td>
                  <Link href={`/customers/${c.id}`}>open →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Add customer</h2>
      <AddCustomerForm />

      <footer>
        ValidationKit v0.0.7 · <Link href="/">Audit</Link> ·{" "}
        <Link href="/drift">Drift</Link> · <Link href="/customers">Customers</Link>
      </footer>
    </main>
  );
}
