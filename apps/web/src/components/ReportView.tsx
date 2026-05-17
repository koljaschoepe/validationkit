import type { AuditReport, ParserResult } from "@vk/core";
import { Card, CardContent } from "@/components/ui/card";
import { SeverityBadge } from "@/components/ui/severity-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FindingsList } from "./FindingsList";

export function ReportView({
  scan,
  report,
  scanId,
}: {
  scan: ParserResult;
  report: AuditReport;
  /** When provided, deterministic fix-generators light up. */
  scanId?: string | null;
}) {
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
        <FindingsList scanId={scanId ?? null} findings={report.findings} />
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

