import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  title: "Terms & Pricing · ValidationKit",
  description:
    "ValidationKit AGB / Terms with pricing pass-through clause and cost volatility notice.",
};

export default function AgbPage() {
  return (
    <main id="main-content" className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <SiteNav />
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Terms of Service
        </h1>
        <p className="text-sm text-muted-foreground">
          These terms govern your use of ValidationKit. They apply alongside
          our{" "}
          <Link
            href={"/legal/dpa" as never}
            className="underline-offset-4 hover:underline"
          >
            Data Processing Addendum
          </Link>{" "}
          and{" "}
          <Link
            href={"/legal/subprocessors" as never}
            className="underline-offset-4 hover:underline"
          >
            Sub-processors list
          </Link>
          .
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>1. The service</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            ValidationKit is a SaaS platform for auditing AI-agent
            configuration files in source repositories. Audits run against
            third-party LLM providers (Anthropic, OpenAI) and produce
            findings + suggested fixes.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Subscription &amp; credit pricing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            ValidationKit uses a hybrid subscription + credit pricing model:
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>
              A monthly or annual subscription includes a credit allotment
              per cycle.
            </li>
            <li>
              Each audit consumes credits, 1 for a Quick audit and 5 for a Deep
              audit.
            </li>
            <li>
              <strong>Overage credits are billed at €0.30 each.</strong> This
              rate is set to approximate the underlying AI-compute cost (with
              Sub-Plan-A real-cost telemetry) plus Stripe payment-processing
              fees plus a small service margin.
            </li>
            <li>
              Pre-paid credit packs (€25 for 100 credits, €99 for 500 credits)
              are available; packs expire 12 months from purchase.
            </li>
          </ul>
          <p>
            Every invoice itemizes the subscription line, overage credits, and
            VAT separately. There is no hidden markup, so you can verify the
            AI-compute portion in your workspace AI usage log.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Provider-cost volatility</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            ValidationKit pays Anthropic and OpenAI per-token for the AI
            compute behind every audit. Provider prices can change without
            notice. ValidationKit reserves the right to adjust the credit
            overage rate (currently €0.30 / credit) in response to material
            provider-pricing changes.
          </p>
          <p>
            <strong>30-day notice:</strong> Any rate change is announced via
            email to the workspace owner at least 30 days before it takes
            effect. Existing subscription cycles are not retroactively
            re-priced; the new rate applies from the next renewal.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. BYOK option</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Pro and Agency workspaces may enable Bring-Your-Own-Key (BYOK) in
            workspace AI settings. When BYOK is on, all audits run against
            the customer&apos;s own Anthropic or OpenAI account; ValidationKit
            no longer passes AI compute through invoicing for that workspace
            (subscription fees remain due in full).
          </p>
          <p>
            Customer-supplied API keys are stored encrypted at rest
            (AES-256-GCM, ADR-0008) and are not retrievable via the customer
            portal once saved. They may only be rotated or removed.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Fair use &amp; rate limits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Per-workspace audit-trigger rate limits scale with tier
            (Free 60/hour, Starter 200/hour, Pro 1 000/hour, Agency 5 000/hour).
            Limits are soft caps designed to prevent runaway automation. Sustained
            abuse may result in temporary suspension after written notice.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>6. Refunds &amp; cancellation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Subscriptions can be canceled at any time via the Stripe customer
            portal, and access continues until the end of the paid period. We
            don&apos;t offer pro-rata refunds for partial periods.
          </p>
          <p>
            Pre-paid credit packs are non-refundable once purchased. Unused
            credits within an active subscription cycle do not roll over to
            the next cycle.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>7. EU VAT &amp; reverse-charge</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            ValidationKit collects VAT via Stripe Tax. EU B2B customers with
            a valid VAT ID benefit from reverse-charge; the invoice includes
            the standard note &quot;Steuerschuldner: Leistungsempfänger / Reverse
            Charge&quot;. EU consumers (no VAT ID) are charged the destination
            VAT rate.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>8. Liability</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            ValidationKit is provided &quot;as is&quot;. Aggregate liability for any
            cause of action is limited to the fees paid in the 12 months
            preceding the claim. Statutory liability for intent and gross
            negligence is unaffected.
          </p>
        </CardContent>
      </Card>

      <footer className="text-xs text-muted-foreground">
        Version 1.0, dated 2026-05-21. Anwaltliche Review von AGB + DPA steht aus
        (Master-Plan §11 out-of-scope). For questions, write to{" "}
        <a
          href="mailto:legal@validationkit.app"
          className="underline-offset-4 hover:underline"
        >
          legal@validationkit.app
        </a>
        .
      </footer>
    </main>
  );
}
