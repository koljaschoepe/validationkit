import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Sub-processors — ValidationKit",
  description:
    "List of sub-processors used by ValidationKit per GDPR Art. 28.",
};

interface Subprocessor {
  name: string;
  purpose: string;
  region: string;
  dpaUrl: string;
}

// Sub-Plan-C — keep this list in sync with `docs/operations/transfer-impact-assessment.md`
// and the audit row in DB schema for `dpa_acceptance`. 30-day notification
// commitment lives in the AGB clause `/legal/agb`.
const SUBPROCESSORS: ReadonlyArray<Subprocessor> = [
  {
    name: "Anthropic, PBC",
    purpose: "LLM API for Deep audits + LLM-rule findings",
    region: "USA (AWS us-east-1) — EU SCC + TIA in place",
    dpaUrl: "https://trust.anthropic.com",
  },
  {
    name: "OpenAI Ireland Ltd",
    purpose: "LLM API for Quick audits (GPT-5-nano default)",
    region: "USA (Azure) — EU SCC + TIA in place",
    dpaUrl: "https://openai.com/policies/data-processing-addendum",
  },
  {
    name: "Stripe Payments Europe Ltd",
    purpose: "Subscription billing, invoicing, customer portal, tax",
    region: "Ireland (EU) + USA",
    dpaUrl: "https://stripe.com/legal/dpa",
  },
  {
    name: "Vercel Inc.",
    purpose: "Application hosting, edge network, env-var storage",
    region: "USA + EU (deployment region pinning available)",
    dpaUrl: "https://vercel.com/legal/dpa",
  },
  {
    name: "Neon Inc.",
    purpose: "Postgres database (workspaces, audits, billing state)",
    region: "EU (Frankfurt) primary; USA replica",
    dpaUrl: "https://neon.tech/dpa",
  },
  {
    name: "Resend Inc.",
    purpose: "Transactional email (magic-link sign-in, billing notices)",
    region: "USA — EU SCC in place",
    dpaUrl: "https://resend.com/legal/dpa",
  },
  {
    name: "Inngest Inc.",
    purpose: "Background job execution (audit runs, Stripe reconcile)",
    region: "USA — EU SCC in place",
    dpaUrl: "https://www.inngest.com/legal/dpa",
  },
];

export default function SubprocessorsPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <SiteNav />
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Sub-processors
        </h1>
        <p className="text-sm text-muted-foreground">
          ValidationKit relies on the following third-party data processors
          (GDPR Art. 28). We notify customers at least 30 days before adding
          a new sub-processor, giving you the option to terminate before the
          change takes effect.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Active sub-processors</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col divide-y">
            {SUBPROCESSORS.map((s) => (
              <li key={s.name} className="flex flex-col gap-1 py-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{s.name}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {s.region.includes("EU") ? "EU SCC + TIA" : "EU-only"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{s.purpose}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{s.region}</span>
                  <Link
                    href={s.dpaUrl as never}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground underline-offset-4 hover:underline"
                  >
                    DPA →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How we notify you of changes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            We update this page every time a sub-processor is added, replaced,
            or retired. Email notifications go to the workspace owner at least
            30 days before the change is effective.
          </p>
          <p>
            Object to a sub-processor change? Reply to the notification email
            within 14 days. We&apos;ll work with you on a path forward —
            including termination with pro-rata refund if no acceptable
            alternative exists.
          </p>
        </CardContent>
      </Card>

      <footer className="text-xs text-muted-foreground">
        Last reviewed 2026-05-21. See also{" "}
        <Link
          href={"/legal/dpa" as never}
          className="underline-offset-4 hover:underline"
        >
          our DPA template
        </Link>
        {" · "}
        <Link
          href={"/legal/agb" as never}
          className="underline-offset-4 hover:underline"
        >
          terms & pricing
        </Link>
        .
      </footer>
    </main>
  );
}
