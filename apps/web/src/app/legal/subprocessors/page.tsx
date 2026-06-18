import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SUB_PROCESSORS, type SubProcessor } from "@/lib/sub-processors";

export const metadata = {
  title: "Sub-processors · ValidationKit",
  description:
    "List of sub-processors used by ValidationKit per GDPR Art. 28.",
};

// Single source of truth: this page renders directly from
// `@/lib/sub-processors`, the same manifest that backs
// `/trust/sub-processors.json` + `.xml`. The 30-day notification commitment
// lives in the AGB clause `/legal/agb`. Deprecated entries are hidden from the
// active list but kept in the manifest for the historical record (DPA §5).
const VISIBLE_SUB_PROCESSORS: ReadonlyArray<SubProcessor> = SUB_PROCESSORS.filter(
  (s) => s.status !== "deprecated",
);

function isEuScc(s: SubProcessor): boolean {
  return s.regions.some((r) => r.toUpperCase().includes("EU"));
}

export default function SubprocessorsPage() {
  return (
    <main id="main-content" className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-12">
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
            {VISIBLE_SUB_PROCESSORS.map((s) => (
              <li key={s.id} className="flex flex-col gap-1 py-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{s.name}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {isEuScc(s) ? "EU SCC + TIA" : "Multi-region"}
                  </Badge>
                  {s.status === "planned" ? (
                    <Badge variant="outline" className="text-[10px]">
                      planned
                    </Badge>
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground">{s.purpose}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {s.regions.join(" · ")}
                  </span>
                  {s.dpaUrl ? (
                    <Link
                      href={s.dpaUrl as never}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground underline-offset-4 hover:underline"
                    >
                      DPA →
                    </Link>
                  ) : null}
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
            within 14 days. We&apos;ll work with you on a path forward, including
            termination with a pro-rata refund if no acceptable alternative
            exists.
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
