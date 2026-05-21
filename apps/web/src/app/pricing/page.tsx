import Link from "next/link";
import { headers } from "next/headers";
import { Check, Sparkles, Zap, Layers } from "lucide-react";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

const FEATURE_LABEL: Record<string, string> = {
  audit_export: "Audit-Report PDF/JSON-Export",
  white_label_pdf: "White-Label PDF",
  byok: "Bring-Your-Own AI key",
  sso_oidc: "SSO (OIDC / SAML)",
  priority_support: "Priority support",
  custom_dpa: "Custom DPA",
};

export default async function PricingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const cycle = parseCycle(params?.cycle);
  const hdrs = await headers();
  const country = hdrs.get("x-vercel-ip-country") ?? "DE";
  const vat = resolveVatContext(country);
  const annualSavings = Math.round(ANNUAL_DISCOUNT * 100);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-12 px-6 py-12">
      <SiteNav />

      <header className="flex flex-col items-start gap-4">
        <Badge variant="secondary" className="w-fit gap-1">
          <Sparkles className="h-3 w-3" /> Audit AI consultancies
        </Badge>
        <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
          Credit-based pricing. Pay for what you actually audit.
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          Four tiers, one credit unit. Quick audits cost 1 credit, Deep audits
          cost 5. AI-compute costs pass through with a small service margin
          so you never overpay for downtime.
        </p>
        <nav
          className="inline-flex items-center gap-1 rounded-md border bg-secondary/30 p-1"
          aria-label="Billing cycle"
        >
          <CycleLink current={cycle} target="monthly" label="Monthly" />
          <CycleLink
            current={cycle}
            target="annual"
            label={`Annual −${annualSavings}%`}
          />
        </nav>
      </header>

      <section
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        aria-label="Pricing tiers"
      >
        {TIER_ORDER.map((id) => {
          const tier = TIERS[id];
          const baseCents = priceForCycle(tier, cycle);
          const inclCents = vat.inclusive
            ? applyVat(baseCents, vat)
            : baseCents;
          const monthlyCents = monthlyEquivalent(tier, cycle);
          const monthlyIncl = vat.inclusive
            ? applyVat(monthlyCents, vat)
            : monthlyCents;
          const featured = id === "pro";
          return (
            <Card
              key={id}
              className={cn(
                "flex flex-col",
                featured && "border-foreground/30 shadow-md",
              )}
            >
              <CardHeader>
                <div className="flex items-baseline justify-between">
                  <CardTitle>{tier.label}</CardTitle>
                  {featured && (
                    <Badge variant="default" className="text-xs">
                      Popular
                    </Badge>
                  )}
                </div>
                <div className="mt-3 text-3xl font-semibold tracking-tight">
                  {eur(inclCents)}
                  <span className="text-base font-normal text-muted-foreground">
                    {cycle === "annual" ? "/yr" : "/mo"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {cycle === "annual"
                    ? `≈ ${eur(monthlyIncl)} / month, billed annually`
                    : vat.inclusive
                      ? `incl. ${Math.round(vat.rate * 100)}% VAT (${vat.country})`
                      : "Net price — VAT calculated at checkout"}
                </p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <p className="text-sm text-muted-foreground">
                  {tier.description}
                </p>
                <ul className="flex flex-col gap-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      <strong>{tier.creditsPerCycle}</strong> credits{" "}
                      {tier.isLifetimeCap ? "(lifetime)" : "/ month"}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      {tier.customerWorkspacesIncluded} customer workspace
                      {tier.customerWorkspacesIncluded === 1 ? "" : "s"}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      {tier.seatsIncluded} team seat
                      {tier.seatsIncluded === 1 ? "" : "s"}
                    </span>
                  </li>
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{FEATURE_LABEL[f] ?? f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto">
                  <Button
                    asChild
                    className="w-full"
                    variant={featured ? "default" : "outline"}
                  >
                    <Link
                      href={
                        id === "free"
                          ? "/login"
                          : { pathname: "/billing", query: { tier: id } }
                      }
                    >
                      {id === "free" ? "Start free" : "Upgrade"}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section
        id="quick-vs-deep"
        className="grid gap-4 rounded-lg border bg-secondary/20 p-6 md:grid-cols-2"
        aria-label="Quick vs Deep audits"
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Quick — 1 credit</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Fast deterministic + small-model pass. GPT-5-nano scores findings
            for 5 of the 6 audit rules. Ideal for nightly drift-checks and
            high-volume CI integrations. ≈ €0.05 of AI-compute per run.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Deep — 5 credits</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Claude Sonnet 4.6 with prompt-cached repo context and extended
            output budget. Better at subtle policy conflicts and large
            cross-vendor repos. Free tier is locked to Quick. ≈ €0.09 of
            AI-compute per run after cache warm-up.
          </p>
        </div>
      </section>

      <section
        id="faq"
        className="grid gap-6 md:grid-cols-2"
        aria-label="Frequently asked questions"
      >
        <h2 className="text-xl font-semibold md:col-span-2">FAQ</h2>
        <Faq
          q="What are credits exactly?"
          a="A credit is one Quick audit run. A Deep audit consumes 5 credits. Tier quotas reset on every paid-invoice cycle; the Free tier is a lifetime cap of 3 credits per workspace."
        />
        <Faq
          q="What happens when I'm out of credits?"
          a="By default the next audit blocks with an upgrade prompt. If you enable Auto-Overage in the workspace's AI settings, extra credits get billed via Stripe at €0.30 each at the end of the cycle — or pre-buy a 100 / 500 credit pack from your billing dashboard."
        />
        <Faq
          q="Can I bring my own Anthropic / OpenAI key?"
          a="Yes, from the Pro tier onwards. Your provider key is encrypted at rest (AES-256-GCM) and used for every audit on that workspace. AI-cost pass-through is disabled for BYOK workspaces — you still pay the subscription, but compute goes straight to your provider account."
        />
        <Faq
          q="How does VAT and EU reverse-charge work?"
          a="Stripe Tax detects your location automatically at checkout. EU B2B customers with a valid VAT ID get reverse-charge with the standard `Steuerschuldner: Leistungsempfänger` invoice note. Other EU customers see VAT-inclusive prices."
        />
      </section>

      <footer className="border-t pt-6 text-xs text-muted-foreground">
        <p>
          Audit prices = a fixed subscription + AI-compute pass-through. Your
          invoices show every line item separately. Overage credits are
          billed at €0.30 each (covers AI-cost + Stripe fees + service
          margin). Provider pricing can change — we'll send a 30-day notice
          before any rate adjustment.
        </p>
      </footer>
    </main>
  );
}

function CycleLink({
  current,
  target,
  label,
}: {
  current: BillingCycle;
  target: BillingCycle;
  label: string;
}) {
  return (
    <Link
      href={{ pathname: "/pricing", query: { cycle: target } }}
      className={cn(
        "rounded-sm px-3 py-1.5 text-sm transition-colors",
        current === target
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
      aria-current={current === target}
    >
      {label}
    </Link>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-sm font-semibold">{q}</h3>
      <p className="text-sm text-muted-foreground">{a}</p>
    </div>
  );
}
