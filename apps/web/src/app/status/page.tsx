import Link from "next/link";
import { Activity, CircleDot, CircleSlash } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { probeAll, type HealthStatus } from "@/lib/health-check";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<HealthStatus, string> = {
  green: "var(--color-sev-exceptional)",
  yellow: "var(--color-sev-mid)",
  red: "var(--color-sev-kill)",
  disabled: "var(--color-muted-foreground)",
};

const STATUS_LABEL: Record<HealthStatus, string> = {
  green: "Operational",
  yellow: "Degraded",
  red: "Down",
  disabled: "Not wired",
};

const STATUS_BADGE: Record<HealthStatus, "default" | "secondary" | "destructive" | "outline"> = {
  green: "default",
  yellow: "secondary",
  red: "destructive",
  disabled: "outline",
};

export default async function StatusPage() {
  const surfaces = await probeAll();
  const checkedAt = new Date();

  const liveSurfaces = surfaces.filter((s) => s.status !== "disabled");
  const downCount = liveSurfaces.filter((s) => s.status === "red").length;
  const degradedCount = liveSurfaces.filter((s) => s.status === "yellow").length;

  const overall: HealthStatus =
    downCount > 0 ? "red" : degradedCount > 0 ? "yellow" : "green";

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
        <header className="space-y-2">
          <div className="flex items-center gap-2">
            <Activity className="size-5 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">
              ValidationKit status
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Live per-surface health-check. Probed on each page load — no
            Statuspage.io subscription, no historical-uptime UI yet. If
            something looks red here, sign-in flows + checkout will probably
            error.
          </p>
          <p className="text-xs font-mono text-muted-foreground">
            Checked at {checkedAt.toISOString().slice(0, 19).replace("T", " ")} UTC
          </p>
        </header>

        <Card
          className={
            overall === "red"
              ? "border-destructive/40 bg-destructive/5"
              : overall === "yellow"
                ? "border-[color-mix(in_oklch,var(--color-sev-mid)_30%,transparent)] bg-[color-mix(in_oklch,var(--color-sev-mid)_5%,transparent)]"
                : "border-primary/30 bg-primary/5"
          }
        >
          <CardContent className="flex items-center justify-between gap-3 py-4 text-sm">
            <div className="space-y-0.5">
              <p className="font-medium">
                {overall === "green"
                  ? "All systems operational."
                  : overall === "yellow"
                    ? `${degradedCount} surface${degradedCount === 1 ? "" : "s"} degraded.`
                    : `${downCount} surface${downCount === 1 ? "" : "s"} down.`}
              </p>
              <p className="text-xs text-muted-foreground">
                Disabled surfaces (e.g. Stripe pre-KYC) are intentional, not
                an outage.
              </p>
            </div>
            <Badge variant={STATUS_BADGE[overall]} className="uppercase text-xs">
              {STATUS_LABEL[overall]}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Surfaces</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {surfaces.map((s) => (
              <div
                key={s.name}
                className="flex items-center justify-between gap-3 rounded-md border bg-card/40 px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  {s.status === "disabled" ? (
                    <CircleSlash
                      className="size-4 shrink-0"
                      style={{ color: STATUS_TONE[s.status] }}
                    />
                  ) : (
                    <CircleDot
                      className="size-4 shrink-0"
                      style={{ color: STATUS_TONE[s.status] }}
                    />
                  )}
                  <div className="space-y-0.5">
                    <div className="font-medium">{s.name}</div>
                    <div className="text-[0.7rem] font-mono text-muted-foreground">
                      {s.detail}
                    </div>
                  </div>
                </div>
                <Badge variant={STATUS_BADGE[s.status]}>
                  {STATUS_LABEL[s.status]}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">What we don&apos;t monitor yet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Concession:</strong> this
              page is a snapshot per request — refresh to re-probe. No
              historical uptime, no SLA badge, no email alerts.
            </p>
            <p>
              <strong className="text-foreground">Critique:</strong> the
              founder also doesn&apos;t monitor this page on a schedule —
              outages get caught by the next user pageview or the SSE
              reconnection loop. We&apos;ll add a Better Stack / Vercel
              Monitoring layer once {">"}5 paying agencies depend on uptime.
              Sprint 1.7+.
            </p>
          </CardContent>
        </Card>

        <footer className="border-t border-border pt-6 text-xs text-muted-foreground">
          ValidationKit v0.0.18 ·{" "}
          <Link href="/" className="hover:text-foreground">Audit</Link>{" "}
          ·{" "}
          <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
          {" · "}
          <Link href="/trust" className="hover:text-foreground">Trust</Link>
        </footer>
      </main>
    </>
  );
}
