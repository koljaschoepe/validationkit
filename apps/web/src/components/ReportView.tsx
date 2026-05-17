import type {
  AuditReport,
  ParserResult,
  SeverityBand,
  AuditFinding,
} from "@vk/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SeverityBadge } from "@/components/ui/severity-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const SEV_RANK: Record<SeverityBand, number> = {
  Kill: 0,
  Weak: 1,
  Mid: 2,
  Strong: 3,
  Exceptional: 4,
};

export function ReportView({
  scan,
  report,
}: {
  scan: ParserResult;
  report: AuditReport;
}) {
  const sortedFindings = [...report.findings].sort(
    (a, b) => SEV_RANK[a.severity] - SEV_RANK[b.severity],
  );

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Files scanned" value={String(report.fileCount)} />
        <Stat label="Findings" value={String(report.findings.length)} />
        <Stat
          label="Overall"
          value={<SeverityBadge severity={report.summary.overallSeverity} />}
        />
        <Stat label="Warnings" value={String(scan.warnings.length)} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Findings
        </h2>
        {sortedFindings.length === 0 ? (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="py-4 text-sm space-y-2">
              <p>
                <strong className="text-foreground">Concession:</strong>{" "}
                Audit passed cleanly. None of the 6 finding rules fired.
              </p>
              <p className="text-muted-foreground">
                <strong className="text-foreground">Critique:</strong> the
                deterministic-set is intentionally narrow. Don&apos;t take a
                green report as proof of quality — it means none of the
                load-bearing red flags showed up.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sortedFindings.map((f) => (
              <FindingCard key={f.id} f={f} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Inventory <span className="text-foreground/60">({scan.files.length})</span>
        </h2>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Kind</TableHead>
                  <TableHead>Path</TableHead>
                  <TableHead className="text-right w-20">Tokens</TableHead>
                  <TableHead className="text-right w-16">Lines</TableHead>
                  <TableHead className="text-right w-28">Modified</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scan.files.map((f) => (
                  <TableRow key={f.absolutePath}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {f.kind}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {f.relativePath}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {f.tokenCount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {f.lineCount}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                      {f.lastModified
                        ? f.lastModified.toISOString().slice(0, 10)
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {scan.warnings.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Parser Warnings
          </h2>
          <div className="space-y-2">
            {scan.warnings.map((w, i) => (
              <Card key={`${w.path}-${i}`} className="border-[color-mix(in_oklch,var(--color-sev-mid)_30%,transparent)]">
                <CardContent className="py-3 text-sm">
                  <div className="font-mono text-xs text-muted-foreground">
                    {w.path}
                  </div>
                  <div className="mt-1">{w.message}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string | React.ReactNode;
}) {
  return (
    <Card className="bg-card/50">
      <CardContent className="py-3 px-4">
        <div className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-medium">
          {label}
        </div>
        <div className="mt-1 text-xl font-semibold tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}

function FindingCard({ f }: { f: AuditFinding }) {
  return (
    <Card>
      <CardHeader className="space-y-2 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge severity={f.severity} />
          <CardTitle className="text-base flex-1">{f.title}</CardTitle>
          <Badge variant={f.deterministic ? "secondary" : "outline"} className="font-mono text-[0.65rem]">
            {f.category}
            {f.deterministic ? "" : " · LLM"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <p className="text-sm text-muted-foreground">{f.detail}</p>
        {f.citations.length > 0 ? (
          <>
            <Separator />
            <div className="flex flex-wrap gap-1.5">
              {f.citations.map((c, i) => (
                <code
                  key={`${c.path}-${i}`}
                  className="rounded bg-muted px-1.5 py-0.5 text-[0.7rem] font-mono"
                >
                  {c.path}
                  {c.line ? `:${c.line}` : ""}
                </code>
              ))}
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
