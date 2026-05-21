import Link from "next/link";
import { Sparkles } from "lucide-react";
import {
  TIERS,
  ANNUAL_DISCOUNT,
  monthlyEquivalent,
  priceForCycle,
  type BillingCycle,
  type TierId,
} from "@vk/billing";
import { SiteNav } from "@/components/SiteNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Sub-Plan-A interim pricing page. Shows the new 4-tier ladder
 * (Free/Starter/Pro/Agency) using the TIERS catalog directly. The full
 * marketing page rewrite (Quick/Deep explainer, markup disclosure footnote,
 * FAQ, VAT-by-IP, cycle toggle, EU reverse-charge copy) ships in
 * Sub-Plan-C.
 */

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ cycle?: string }>;

const TIER_ORDER: TierId[] = ["free", "starter", "pro", "agency"];

function parseCycle(input: string | undefined): BillingCycle {
  return input === "annual" ? "annual" : "monthly";
}

function eur(cents: number): string {
  if (cents === 0) return "€0";
  return `€${(cents / 100).toFixed(0)}`;
}

export default async function PricingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const cycle = parseCycle(params?.cycle);
  const annualSavings = Math.round(ANNUAL_DISCOUNT * 100);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-12">
      <SiteNav />
      <header className="flex flex-col gap-3">
        <Badge variant="secondary" className="w-fit">
          <Sparkles className="mr-1 h-3 w-3" /> Pricing in re-launch
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight">
          Audit AI consultancies — pay for what you scan.
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Four tiers, credit-based audits. Quick audits cost 1 credit, Deep
          audits cost 5 credits. The full Quick/Deep explainer plus the
          markup-disclosure footnote ship in the next iteration.
        </p>
        <nav className="flex gap-2 text-sm">
          <Link
            href={{ pathname: "/pricing", query: { cycle: "monthly" } }}
            className={cn(
              "rounded-md border px-3 py-1",
              cycle === "monthly" && "bg-secondary",
            )}
          >
            Monthly
          </Link>
          <Link
            href={{ pathname: "/pricing", query: { cycle: "annual" } }}
            className={cn(
              "rounded-md border px-3 py-1",
              cycle === "annual" && "bg-secondary",
            )}
          >
            Annual −{annualSavings}%
          </Link>
        </nav>
      </header>
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {TIER_ORDER.map((id) => {
          const tier = TIERS[id];
          const price = priceForCycle(tier, cycle);
          const monthlyPriceCents = monthlyEquivalent(tier, cycle);
          return (
            <Card key={id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{tier.label}</CardTitle>
                <div className="mt-2 text-3xl font-semibold tracking-tight">
                  {eur(price)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {cycle === "annual"
                    ? `${eur(monthlyPriceCents)}/mo billed annually`
                    : "billed monthly"}
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3 text-sm">
                <p className="text-muted-foreground">{tier.description}</p>
                <ul className="flex flex-col gap-1">
                  <li>
                    {tier.creditsPerCycle} credits
                    {tier.isLifetimeCap ? " (lifetime)" : " / month"}
                  </li>
                  <li>
                    {tier.customerWorkspacesIncluded} customer workspace
                    {tier.customerWorkspacesIncluded === 1 ? "" : "s"}
                  </li>
                  <li>
                    {tier.seatsIncluded} seat
                    {tier.seatsIncluded === 1 ? "" : "s"}
                  </li>
                  {tier.byokAllowed && <li>BYOK provider keys</li>}
                  {tier.features.includes("white_label_pdf") && (
                    <li>White-label PDF export</li>
                  )}
                  {tier.features.includes("sso_oidc") && <li>SSO (OIDC)</li>}
                  {tier.features.includes("priority_support") && (
                    <li>Priority support</li>
                  )}
                </ul>
                <div className="mt-auto">
                  <Button asChild className="w-full" variant="outline">
                    <Link href="/login">Get started</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>
      <footer className="text-xs text-muted-foreground">
        Audit costs pass through Anthropic + OpenAI usage with a small
        service margin (full disclosure in our terms). The complete pricing
        page — with cost-preview before each audit, EU reverse-charge handling,
        and FAQ — is rebuilt in Sub-Plan-C.
      </footer>
    </main>
  );
}
