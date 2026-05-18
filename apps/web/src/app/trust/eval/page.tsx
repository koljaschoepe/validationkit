import Link from "next/link";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { Activity, Beaker } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

interface BandStat {
  passes: number;
  falsePositives: number;
  falseNegatives: number;
  fpr: number;
  fnr: number;
}

interface ResultFile {
  date: string;
  runAt: string;
  runsPerPair: number;
  fprTarget: number;
  bands: Partial<Record<"low" | "mid" | "high", BandStat>>;
  unstable: Array<{ id: string; flips: number }>;
  pairCount: number;
}

async function loadResults(): Promise<ResultFile[]> {
  const repoRoot = process.cwd().replace(/\/apps\/web$/, "");
  const dir = path.join(repoRoot, "eval/conflicts/results");
  let entries: string[] = [];
  try {
    entries = await readdir(dir);
  } catch {
    return [];
  }
  const files = entries
    .filter((n) => n.match(/^\d{4}-\d{2}-\d{2}\.json$/))
    .sort((a, b) => b.localeCompare(a));
  const out: ResultFile[] = [];
  for (const f of files) {
    try {
      const raw = await readFile(path.join(dir, f), "utf8");
      const data = JSON.parse(raw);
      out.push({ date: f.replace(/\.json$/, ""), ...data });
    } catch {
      continue;
    }
  }
  return out;
}

function pct(n: number): string {
  return `${(n * 100).toFixed(0)}%`;
}

function bandTone(fpr: number, target: number): string {
  if (fpr > target) return "var(--color-sev-kill)";
  if (fpr > target * 0.66) return "var(--color-sev-mid)";
  return "var(--color-sev-exceptional)";
}

export default async function EvalPage() {
  const results = await loadResults();
  const latest = results[0];
  const target = latest?.fprTarget ?? 0.15;

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
        <header className="space-y-2">
          <div className="flex items-center gap-2">
            <Beaker className="size-5 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">
              LLM-eval results
            </h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Per-band FPR/FNR history for the <code className="font-mono text-xs">conflicting-rules</code>{" "}
            LLM-augmented audit rule. Constraint #14 says FPR &gt; 15% at{" "}
            <code className="font-mono text-xs">mid</code> confidence kills
            the deterministic-first marketing claim. This page publishes the
            check so customers can audit us.
          </p>
        </header>

        {results.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-sm space-y-3">
              <p>
                <strong className="text-foreground">No eval runs yet.</strong>{" "}
                The harness is shipped (Sprint 1.0 —{" "}
                <code className="font-mono text-xs">eval/conflicts/run.ts</code>
                ); the runs themselves are gated on{" "}
                <code className="font-mono text-xs">ANTHROPIC_API_KEY</code>{" "}
                being set on the founder&apos;s machine. Until that key is
                flipped, this page shows the empty state.
              </p>
              <p className="text-muted-foreground">
                <strong className="text-foreground">Concession:</strong> most
                competitors hide the not-yet-evaluated state behind a green
                checkmark. <strong className="text-foreground">Critique:</strong>{" "}
                that&apos;s exactly the Vibe-Score anti-pattern ValidationKit
                exists to refuse. The empty state is the honest state.
              </p>
              <Separator />
              <div className="space-y-1 text-xs font-mono">
                <p className="text-muted-foreground">
                  When data lands, each run records:
                </p>
                <ul className="space-y-0.5 text-muted-foreground pl-3">
                  <li>· per-confidence-band FPR / FNR (low / mid / high)</li>
                  <li>· N=3 majority-vote variance per pair</li>
                  <li>· unstable-pair list (flips &gt; 0)</li>
                  <li>· target FPR ≤ 15% at mid band (Constraint #14)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card
              className={
                (latest?.bands.mid?.fpr ?? 0) > target
                  ? "border-destructive/40 bg-destructive/5"
                  : "border-primary/30 bg-primary/5"
              }
            >
              <CardContent className="flex items-center justify-between gap-3 py-4 text-sm">
                <div className="space-y-0.5">
                  <p className="font-medium">
                    Latest run · {latest?.date} · {latest?.pairCount} pairs · N={latest?.runsPerPair}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Mid-band FPR target ≤ {pct(target)}. CI gate fails the
                    build on breach.
                  </p>
                </div>
                <Badge
                  variant={
                    (latest?.bands.mid?.fpr ?? 0) > target
                      ? "destructive"
                      : "default"
                  }
                >
                  {(latest?.bands.mid?.fpr ?? 0) > target
                    ? "Breach"
                    : "Within target"}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="size-4" />
                  History (most recent first)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs font-mono">
                <div className="grid grid-cols-5 gap-2 px-2 py-1 text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                  <span>Date</span>
                  <span className="text-right">Pairs</span>
                  <span className="text-right">FPR low</span>
                  <span className="text-right">FPR mid</span>
                  <span className="text-right">FPR high</span>
                </div>
                {results.map((r) => (
                  <div
                    key={r.date}
                    className="grid grid-cols-5 gap-2 rounded-md border bg-card/40 px-2 py-1.5"
                  >
                    <span>{r.date}</span>
                    <span className="text-right text-muted-foreground">
                      {r.pairCount}
                    </span>
                    <span
                      className="text-right"
                      style={{ color: bandTone(r.bands.low?.fpr ?? 0, target) }}
                    >
                      {r.bands.low ? pct(r.bands.low.fpr) : "—"}
                    </span>
                    <span
                      className="text-right"
                      style={{ color: bandTone(r.bands.mid?.fpr ?? 0, target) }}
                    >
                      {r.bands.mid ? pct(r.bands.mid.fpr) : "—"}
                    </span>
                    <span
                      className="text-right"
                      style={{ color: bandTone(r.bands.high?.fpr ?? 0, target) }}
                    >
                      {r.bands.high ? pct(r.bands.high.fpr) : "—"}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {latest?.unstable && latest.unstable.length > 0 ? (
              <Card className="border-[color-mix(in_oklch,var(--color-sev-mid)_30%,transparent)]">
                <CardHeader>
                  <CardTitle className="text-base">
                    Unstable pairs (latest run)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-xs font-mono">
                  {latest.unstable.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between rounded-md border bg-card/40 px-2 py-1"
                    >
                      <span>{u.id}</span>
                      <Badge variant="outline" className="text-[0.6rem]">
                        {u.flips}/{latest.runsPerPair} flips
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}
          </>
        )}

        <footer className="border-t border-border pt-6 text-xs text-muted-foreground">
          ValidationKit v0.0.20 ·{" "}
          <Link href="/trust" className="hover:text-foreground">
            Trust
          </Link>{" "}
          ·{" "}
          <Link href="/trust/dpa" className="hover:text-foreground">
            DPA
          </Link>{" "}
          ·{" "}
          <Link href="/status" className="hover:text-foreground">
            Status
          </Link>{" "}
          ·{" "}
          <Link href="/pricing" className="hover:text-foreground">
            Pricing
          </Link>
        </footer>
      </main>
    </>
  );
}
