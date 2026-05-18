import Link from "next/link";
import { headers } from "next/headers";
import { Check, Sparkles } from "lucide-react";
import {
  TIERS,
  ANNUAL_DISCOUNT,
  monthlyEquivalent,
  priceForCycle,
  type BillingCycle,
  type TierId,
} from "@vk/billing";
import { resolveVatContext, applyVat } from "@/lib/vat";
import { SiteNav } from "@/components/SiteNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ cycle?: string }>;

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

const FAQ = [
  {
    q: "Why no $99 sandwich tier between Solo Pro and Agency Pro?",
    a: "Sandwich pricing forces buyers to over-buy. The buyer either runs ≤10 repos (Solo Pro $79 fits) or runs 5–30 customer repos (Agency Pro $299 fits). A $99 tier compresses the gap without adding capacity that anyone actually asked for.",
  },
  {
    q: "How are EU VAT prices computed?",
    a: "Vercel's edge tells us the request country. Stripe Tax handles the actual VAT collection at checkout; this page only displays the gross figure for transparency. B2B reverse-charge applies with a valid VAT-ID at checkout.",
  },
  {
    q: "Why is Agency-Scale-Plus annual-only?",
    a: "It's the M3-M9 LOI-conversion tier — sales-assisted, MSA-required, $1,499/mo. Annual-only because monthly-billed enterprise-feeling tiers churn 3× more than annual (Sentry's published data, 2024). If you want monthly flexibility, Agency Scale $799 is the answer.",
  },
  {
    q: "What does the free tier actually cover?",
    a: "1 customer-repo, 20 audits/month, 30-day retention. Full audit-rule set (5 deterministic + 1 LLM-opt-in). No card. No trial timer. The free tier is generous on capability and tight on capacity — we don't gate the load-bearing features behind a paywall.",
  },
  {
    q: "Stripe Live-Mode isn't on yet — is this real pricing?",
    a: "Code is shipped. Stripe activation is paperwork-bound (DACH KYC, EU VAT registration, PCI SAQ-A) — see /trust. Once those clear (Sprint 1.1–1.3), the buttons go live. Until then, every checkout returns a 'Stripe not configured' error. Honest non-vapor.",
  },
  {
    q: "Where's the LLM-augmented audit pricing?",
    a: "Free across all tiers when an ANTHROPIC_API_KEY (or OPENAI_API_KEY) is configured on the workspace. We don't mark up the model spend — that creates a perverse incentive to upsell longer prompts.",
  },
];

export default async function PublicPricingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const cycle = parseCycle(sp.cycle);

  const hdrs = await headers();
  const country =
    hdrs.get("x-vercel-ip-country") ?? hdrs.get("cf-ipcountry") ?? null;
  const vat = resolveVatContext(country);

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-5xl space-y-10 px-4 py-10 sm:px-6">
        <header className="space-y-3 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Cross-vendor agent-file audit — pricing
          </h1>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            Flat tiers. No per-repo metering. No usage surprises. The free
            tier covers 1 repo with the full audit-rule set — you feel the
            wedge before you pay.
          </p>
          <div className="flex justify-center pt-2">
            <CycleToggle cycle={cycle} />
          </div>
          {vat.inclusive ? (
            <p className="text-xs text-muted-foreground">
              Prices include {Math.round(vat.rate * 100)}% VAT (detected{" "}
              <code className="font-mono">{vat.country}</code>). Reverse-charge
              applies with a valid VAT-ID at checkout.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              USD prices, VAT excluded. EU visitors see VAT-inclusive prices
              automatically.
            </p>
          )}
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TIER_ORDER.map((id) => {
            const tier = TIERS[id];
            const effectiveCycle = tier.annualOnly ? "annual" : cycle;
            const monthlyDisplayNet =
              id === "free" ? 0 : monthlyEquivalent(tier, effectiveCycle);
            const monthlyDisplay = applyVat(monthlyDisplayNet, vat);
            const annualTotal =
              id === "free" ? 0 : applyVat(priceForCycle(tier, "annual"), vat);
            return (
              <Card
                key={id}
                className={
                  id === "agency_pro" ? "border-primary shadow-md" : undefined
                }
              >
                <CardHeader className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{tier.label}</CardTitle>
                    <div className="flex flex-wrap items-center gap-1">
                      {id === "agency_pro" ? (
                        <Badge>Most agencies</Badge>
                      ) : null}
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
                      : `$${monthlyDisplay.toLocaleString("en-US")} / mo`}
                  </div>
                  {tier.priceUsd > 0 && effectiveCycle === "annual" ? (
                    <p className="text-xs text-muted-foreground">
                      ${annualTotal.toLocaleString("en-US")} billed annually
                      {" · "}
                      <span className="text-primary">
                        {Math.round(ANNUAL_DISCOUNT * 100)}% off monthly
                      </span>
                    </p>
                  ) : null}
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground">{tier.description}</p>
                  <Separator />
                  <ul className="space-y-1.5 text-xs">
                    <FeatureRow text={`${tier.paidReposQuota} repos`} />
                    <FeatureRow text={`${tier.runsQuota} audits / month`} />
                    <FeatureRow
                      text={`${tier.seatsQuota} seat${tier.seatsQuota === 1 ? "" : "s"}`}
                    />
                    <FeatureRow text="5 deterministic + 1 LLM-opt-in audit rule" />
                    <FeatureRow text="Patch-download for 4 of 6 categories" />
                    {id !== "free" ? (
                      <FeatureRow text="Drift detection across repo pairs" />
                    ) : null}
                    {id === "agency_pro" || id === "agency_scale" || id === "agency_scale_plus" ? (
                      <FeatureRow text="Cross-customer cockpit" />
                    ) : null}
                    {id === "agency_scale" || id === "agency_scale_plus" ? (
                      <FeatureRow text="Audit-trail export (JSON + CSV)" />
                    ) : null}
                    {id === "agency_scale_plus" ? (
                      <FeatureRow text="Dedicated success contact + custom DPA" />
                    ) : null}
                  </ul>
                  <Button
                    asChild
                    variant={id === "agency_pro" ? "default" : "outline"}
                    size="sm"
                    className="w-full"
                  >
                    <Link href={id === "free" ? "/" : "/login"}>
                      {id === "free" ? (
                        "Try free — anonymous audit"
                      ) : tier.msaRequired ? (
                        "Contact sales (MSA)"
                      ) : (
                        <>
                          <Sparkles className="size-3.5" />
                          Sign in to upgrade
                        </>
                      )}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            FAQ
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {FAQ.map((item) => (
              <Card key={item.q}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{item.q}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 text-sm text-muted-foreground">
                  {item.a}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="py-6 space-y-2 text-sm">
              <p>
                <strong className="text-foreground">Concession:</strong>{" "}
                Stripe live-mode isn&apos;t flipped on yet. Buttons return
                a friendly &quot;Stripe not configured&quot; until the
                paperwork track clears (Sprint 1.1–1.3).
              </p>
              <p className="text-muted-foreground">
                <strong className="text-foreground">Critique:</strong>{" "}
                That makes <em>this</em> page honest about its state — most
                B2B dev-tool pricing pages would hide the gap. See{" "}
                <Link
                  href="/trust"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  /trust
                </Link>{" "}
                for the rest of the not-yet-shipped list.
              </p>
            </CardContent>
          </Card>
        </section>

        <footer className="border-t border-border pt-6 text-xs text-muted-foreground">
          ValidationKit v0.0.18 ·{" "}
          <Link href="/" className="hover:text-foreground">Audit</Link>{" "}
          ·{" "}
          <Link href="/trust" className="hover:text-foreground">Trust</Link>
          {" · "}
          <Link href="/status" className="hover:text-foreground">Status</Link>
          {" · "}
          <Link href="/login" className="hover:text-foreground">Sign in</Link>
        </footer>
      </main>
    </>
  );
}

function CycleToggle({ cycle }: { cycle: BillingCycle }) {
  return (
    <div className="inline-flex items-center rounded-md border bg-background p-0.5">
      <Link
        href="/pricing"
        className={cn(
          "rounded px-3 py-1.5 text-xs",
          cycle === "monthly"
            ? "bg-secondary text-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        Monthly
      </Link>
      <Link
        href="/pricing?cycle=annual"
        className={cn(
          "rounded px-3 py-1.5 text-xs",
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

function FeatureRow({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-2">
      <Check className="size-3 text-primary" />
      <span>{text}</span>
    </li>
  );
}
