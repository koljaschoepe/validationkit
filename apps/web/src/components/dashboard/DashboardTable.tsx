import Link from "next/link";
import { ChevronRight, FileText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SeverityBadge } from "@/components/ui/severity-badge";
import type { SeverityBand } from "@vk/core";

export interface DashboardScanRow {
  id: string;
  rootPath: string;
  fileCount: number;
  overallSeverity: SeverityBand;
  findingsCount: number;
  createdAt: Date;
}

function relativeTime(d: Date): string {
  const ms = Date.now() - d.getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  return d.toISOString().slice(0, 10);
}

const STALE_THRESHOLD_MS = 7 * 24 * 3_600_000;
function isStale(d: Date): boolean {
  return Date.now() - d.getTime() > STALE_THRESHOLD_MS;
}

export function DashboardTable({ rows }: { rows: DashboardScanRow[] }) {
  if (rows.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <FileText className="size-8 text-muted-foreground" />
          <div className="space-y-1">
            <p className="font-medium">No customer-repos yet.</p>
            <p className="text-sm text-muted-foreground max-w-md">
              Audits live here. Your free tier covers 1 repo — add yours below.
            </p>
          </div>
          <div className="flex flex-col items-center gap-2 pt-2">
            <Button asChild size="sm">
              <Link href="/">Add your first customer-repo</Link>
            </Button>
            <span className="text-xs text-muted-foreground">
              Or try the demo:{" "}
              <Link
                href="/?demo=anthropic"
                className="text-primary underline-offset-4 hover:underline"
              >
                anthropic/anthropic-cookbook
              </Link>
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Repo</TableHead>
              <TableHead className="w-28">Severity</TableHead>
              <TableHead className="w-20 text-right">Files</TableHead>
              <TableHead className="w-24 text-right">Findings</TableHead>
              <TableHead className="w-32">Last activity</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id} className="group">
                <TableCell className="font-mono text-xs">
                  <Link
                    href={`/scans/${r.id}`}
                    className="hover:text-primary underline-offset-4 hover:underline"
                  >
                    {r.rootPath}
                  </Link>
                </TableCell>
                <TableCell>
                  <SeverityBadge severity={r.overallSeverity} />
                </TableCell>
                <TableCell className="text-right font-mono text-xs tabular-nums">
                  {r.fileCount}
                </TableCell>
                <TableCell className="text-right font-mono text-xs tabular-nums">
                  {r.findingsCount}
                </TableCell>
                <TableCell className="text-xs">
                  <span className="text-muted-foreground">{relativeTime(r.createdAt)}</span>
                  {isStale(r.createdAt) ? (
                    <span className="ml-1 text-[var(--color-sev-weak)] font-medium">
                      · possible drift
                    </span>
                  ) : null}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/scans/${r.id}`}
                    className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <ChevronRight className="size-4" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
