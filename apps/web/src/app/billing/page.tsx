import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Check, ExternalLink, Sparkles } from "lucide-react";
import { isAuthEnabled } from "@vk/auth";
import {
  TIERS,
  ANNUAL_DISCOUNT,
  ensureSubscription,
  canAddRepo,
  isPaid,
  monthlyEquivalent,
  priceForCycle,
  type BillingCycle,
  type TierId,
} from "@vk/billing";
import { getSessionUser } from "@/lib/session";
import { isStripeEnabled } from "@/lib/stripe";
import {
  startCheckoutAction,
  openBillingPortalAction,
} from "@/lib/billing-actions";
import { resolveVatContext, applyVat } from "@/lib/vat";
import { SiteNav } from "@/components/SiteNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type SearchParams = Promise<{
  status?: string;
  reason?: string;
  session_id?: string;
  cycle?: string;
}>;

const TIER_ORDER: TierId[] = [
  "free",
  "solo_indie",
  "solo_pro",
  "agency_pro",
  "agency_scale",
  "agency_scale_plus",
];

function parseCycle(input: string | undefined): BillingCycle {
  return input === "annual" ? "annual" : "monthly";
}

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
  const cycle = parseCycle(sp.cycle);

  const hdrs = await headers();
  const country = hdrs.get("x-vercel-ip-country") ?? hdrs.get("cf-ipcountry") ?? null;
  const vat = resolveVatContext(country);

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
                warn={snap.status === "past_due"}
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
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Plans
            </h2>
            <CycleToggle cycle={cycle} />
          </div>
          {vat.inclusive ? (
            <p className="text-xs text-muted-foreground">
              Prices include {Math.round(vat.rate * 100)}% VAT (detected{" "}
              <code className="font-mono">{vat.country}</code>). Net amount on
              your invoice; reverse-charge applies if you provide a valid
              VAT-ID at checkout.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              USD prices, VAT excluded. EU customers see VAT-inclusive prices
              automatically; reverse-charge available on B2B checkout with a
              VAT-ID.
            </p>
          )}
          {!stripeOn ? (
            <Card className="border-dashed">
              <CardContent className="py-4 text-sm text-muted-foreground">
                <strong className="text-foreground">Stripe is not configured.</strong>{" "}
                Set <code>STRIPE_SECRET_KEY</code> + per-tier Price IDs to
                enable checkout. Code is shipped; the toggle is yours.
              </CardContent>
            </Card>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TIER_ORDER.map((id) => {
              const tier = TIERS[id];
              const current = snap.tier === id;
              const effectiveCycle = tier.annualOnly ? "annual" : cycle;
              const monthlyDisplayNet =
                id === "free"
                  ? 0
                  : monthlyEquivalent(tier, effectiveCycle);
              const monthlyDisplay = applyVat(monthlyDisplayNet, vat);
              const annualTotal =
                id === "free"
                  ? 0
                  : applyVat(priceForCycle(tier, "annual"), vat);
              return (
                <Card
                  key={id}
                  className={current ? "border-primary" : undefined}
                >
                  <CardHeader className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base">{tier.label}</CardTitle>
                      <div className="flex flex-wrap items-center gap-1">
                        {current ? <Badge>Current</Badge> : null}
                        {tier.annualOnly ? (
                          <Badge variant="outline" className="text-[0.6rem]">
                            Annual only
                          </Badge>
                        ) : null}
                        {tier.msaRequired ? (
                          <Badge variant="outline" className="text-[0.6rem]">
                            MSA
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                    <div className="text-2xl font-bold tabular-nums">
                      {tier.priceUsd === 0
                        ? "Free"
                        : `${formatMoney(monthlyDisplay, vat)} / mo`}
                    </div>
                    {tier.priceUsd > 0 && effectiveCycle === "annual" ? (
                      <p className="text-xs text-muted-foreground">
                        {formatMoney(annualTotal, vat)} billed annually
                        {" · "}
                        <span className="text-primary">
                          {Math.round(ANNUAL_DISCOUNT * 100)}% off monthly
                        </span>
                      </p>
                    ) : null}
                    {tier.priceUsd > 0 && effectiveCycle === "monthly" ? (
                      <p className="text-xs text-muted-foreground">
                        or {formatMoney(monthlyEquivalent(tier, "annual"), vat)}/mo
                        billed annually
                      </p>
                    ) : null}
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
                        <input
                          type="hidden"
                          name="cycle"
                          value={effectiveCycle}
                        />
                        <Button
                          type="submit"
                          size="sm"
                          disabled={!stripeOn || tier.msaRequired}
                          className="w-full"
                        >
                          <Sparkles className="size-3.5" />
                          {tier.msaRequired
                            ? "Contact sales (MSA)"
                            : `Upgrade · ${effectiveCycle}`}
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
          ValidationKit v0.0.16 ·{" "}
          <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>{" "}
          ·{" "}
          <Link href="/trust" className="hover:text-foreground">Trust</Link>
          {" · "}
          <Link href="/trust/dpa" className="hover:text-foreground">DPA</Link>
        </footer>
      </main>
    </>
  );
}

function CycleToggle({ cycle }: { cycle: BillingCycle }) {
  return (
    <div className="inline-flex items-center rounded-md border bg-background p-0.5">
      <Link
        href="/billing"
        className={cn(
          "rounded px-2.5 py-1 text-xs",
          cycle === "monthly"
            ? "bg-secondary text-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        Monthly
      </Link>
      <Link
        href="/billing?cycle=annual"
        className={cn(
          "rounded px-2.5 py-1 text-xs",
          cycle === "annual"
            ? "bg-secondary text-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        Annual <span className="text-primary">−{Math.round(ANNUAL_DISCOUNT * 100)}%</span>
      </Link>
    </div>
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

function formatMoney(
  amount: number,
  vat: { inclusive: boolean },
): string {
  // Display in USD until Phase-2 multi-currency support. VAT-inclusive prices
  // are still USD-denominated — Stripe Tax handles per-country FX at charge time.
  return `$${amount.toLocaleString("en-US")}`;
}
