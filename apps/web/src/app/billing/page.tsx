import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, ExternalLink, Sparkles } from "lucide-react";
import { isAuthEnabled } from "@vk/auth";
import {
  TIERS,
  ensureSubscription,
  canAddRepo,
  isPaid,
  type TierId,
} from "@vk/billing";
import { getSessionUser } from "@/lib/session";
import { isStripeEnabled } from "@/lib/stripe";
import {
  startCheckoutAction,
  openBillingPortalAction,
} from "@/lib/billing-actions";
import { SiteNav } from "@/components/SiteNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type SearchParams = Promise<{
  status?: string;
  reason?: string;
  session_id?: string;
}>;

const TIER_ORDER: TierId[] = [
  "free",
  "solo_indie",
  "solo_pro",
  "agency_pro",
  "agency_scale",
];

export default async function BillingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  if (!isAuthEnabled()) redirect("/login");
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const snap = await ensureSubscription(user.id);
  const repoCheck = await canAddRepo(user.id);
  const sp = await searchParams;
  const stripeOn = isStripeEnabled();

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            ValidationKit is freemium. 1 repo on Solo Free, no card. Pricing is
            flat — no per-repo metering, no usage surprises.
          </p>
        </header>

        {sp.status === "success" ? (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="py-4 text-sm">
              Thanks — checkout completed. Your tier updates once Stripe sends
              the webhook (usually a few seconds).
            </CardContent>
          </Card>
        ) : null}
        {sp.status === "cancelled" ? (
          <Card className="border-[color-mix(in_oklch,var(--color-sev-weak)_30%,transparent)]">
            <CardContent className="py-4 text-sm">
              Checkout cancelled. No charge. Pick a tier below to try again.
            </CardContent>
          </Card>
        ) : null}
        {sp.status === "error" ? (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="py-4 text-sm text-destructive">
              {sp.reason ?? "Stripe rejected the request."}
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">Current plan</CardTitle>
              <Badge variant={isPaid(snap) ? "default" : "secondary"}>
                {snap.config.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">{snap.config.description}</p>
            <Separator />
            <div className="grid gap-2 sm:grid-cols-3">
              <Stat
                label="Repos"
                value={`${repoCheck.used} / ${snap.paidReposQuota}`}
                warn={!repoCheck.allowed}
              />
              <Stat
                label="Audits this period"
                value={`${snap.runsUsedThisPeriod} / ${snap.runsQuota}`}
              />
              <Stat
                label="Status"
                value={snap.status === "active" ? "Active" : snap.status}
              />
            </div>
            {isPaid(snap) ? (
              <div className="pt-2">
                <form action={openBillingPortalAction}>
                  <Button type="submit" size="sm" variant="outline">
                    Manage in Stripe portal
                    <ExternalLink className="size-3.5" />
                  </Button>
                </form>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <section className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Plans
          </h2>
          {!stripeOn ? (
            <Card className="border-dashed">
              <CardContent className="py-4 text-sm text-muted-foreground">
                <strong className="text-foreground">Stripe is not configured.</strong>{" "}
                Set <code>STRIPE_SECRET_KEY</code> + per-tier Price IDs to enable
                checkout. Code is shipped; the toggle is yours.
              </CardContent>
            </Card>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TIER_ORDER.map((id) => {
              const tier = TIERS[id];
              const current = snap.tier === id;
              return (
                <Card
                  key={id}
                  className={current ? "border-primary" : undefined}
                >
                  <CardHeader className="space-y-1">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{tier.label}</CardTitle>
                      {current ? <Badge>Current</Badge> : null}
                    </div>
                    <div className="text-2xl font-bold tabular-nums">
                      {tier.priceUsd === 0 ? "Free" : `$${tier.priceUsd}/mo`}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p className="text-muted-foreground">{tier.description}</p>
                    <ul className="space-y-1 text-xs">
                      <FeatureRow text={`${tier.paidReposQuota} repos`} />
                      <FeatureRow text={`${tier.runsQuota} audits / month`} />
                      <FeatureRow
                        text={`${tier.seatsQuota} seat${tier.seatsQuota === 1 ? "" : "s"}`}
                      />
                    </ul>
                    {id !== "free" && !current ? (
                      <form action={startCheckoutAction}>
                        <input type="hidden" name="tier" value={id} />
                        <Button
                          type="submit"
                          size="sm"
                          disabled={!stripeOn}
                          className="w-full"
                        >
                          <Sparkles className="size-3.5" />
                          Upgrade · Stripe Test
                        </Button>
                      </form>
                    ) : null}
                    {id === "free" && !current ? (
                      <p className="text-xs text-muted-foreground">
                        Downgrade via Stripe portal (paid → free auto-handled
                        on cancellation).
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <footer className="border-t border-border pt-6 text-xs text-muted-foreground">
          ValidationKit v0.0.13 ·{" "}
          <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>{" "}
          ·{" "}
          <Link href="/trust" className="hover:text-foreground">Trust & Compliance</Link>
        </footer>
      </main>
    </>
  );
}

function Stat({
  label,
  value,
  warn,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div>
      <div className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-medium">
        {label}
      </div>
      <div
        className={`mt-1 text-lg font-semibold tabular-nums ${
          warn ? "text-[var(--color-sev-weak)]" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function FeatureRow({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-2">
      <Check className="size-3 text-primary" />
      <span>{text}</span>
    </li>
  );
}
