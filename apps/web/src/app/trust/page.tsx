import Link from "next/link";
import { ShieldCheck, FileDown, ScrollText } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import type { SeverityBand } from "@vk/core";

export const metadata = {
  title: "Trust · ValidationKit",
  description:
    "What ValidationKit reads, what it writes, what it doesn't yet do, and what's planned.",
};

const DEFAULT_SCOPES: Array<{ surface: string; default: string; sev: SeverityBand; optIn: string }> = [
  {
    surface: "Local filesystem",
    default: "Read",
    sev: "Strong",
    optIn: "None",
  },
  {
    surface: "GitHub App (planned)",
    default: "contents:read + pull_requests:read",
    sev: "Strong",
    optIn: "Per-repo write requires Requester→Approver flow",
  },
  {
    surface: "Anthropic / OpenAI API",
    default: "Opt-in via env",
    sev: "Strong",
    optIn: "Skipped when ANTHROPIC_API_KEY / OPENAI_API_KEY unset",
  },
  {
    surface: "Stripe (test-mode)",
    default: "Opt-in via env",
    sev: "Strong",
    optIn: "Webhook + checkout only when STRIPE_SECRET_KEY is set",
  },
];

const ROADMAP: Array<{ milestone: string; item: string; sev: SeverityBand; status: string }> = [
  {
    milestone: "M3",
    item: "4 GitHub-App-Day-1-Mitigations land (PRD §6.4)",
    sev: "Mid",
    status: "In progress",
  },
  {
    milestone: "M3",
    item: "DPA-Template ready for lawyer review",
    sev: "Mid",
    status: "Drafted",
  },
  {
    milestone: "M6",
    item: "First external security review",
    sev: "Weak",
    status: "Planned",
  },
  {
    milestone: "M8",
    item: "Lawyer-reviewed DPA (DACH + EU + US)",
    sev: "Weak",
    status: "Planned",
  },
  {
    milestone: "M9",
    item: "EU hosting option (Neon Frankfurt)",
    sev: "Weak",
    status: "Planned",
  },
  {
    milestone: "Phase 2",
    item: "SOC-2 Type-I → Type-II",
    sev: "Weak",
    status: "Roadmap",
  },
];

type CcaStatus = "pending" | "in-progress" | "certified";

const CCA_COPY: Record<CcaStatus, { label: string; variant: "outline" | "secondary" | "default" }> = {
  pending: {
    label: "Claude Certified Architect · pending",
    variant: "outline",
  },
  "in-progress": {
    label: "Claude Certified Architect · in progress",
    variant: "secondary",
  },
  certified: {
    label: "Claude Certified Architect · certified",
    variant: "default",
  },
};

function resolveCcaStatus(): CcaStatus {
  const raw = (process.env.CCA_STATUS ?? "pending").toLowerCase();
  if (raw === "certified") return "certified";
  if (raw === "in-progress") return "in-progress";
  return "pending";
}

export default function TrustPage() {
  const cca = resolveCcaStatus();
  const ccaCopy = CCA_COPY[cca];
  return (
    <>
      <SiteNav />
      <main
        id="main-content"
        className="mx-auto max-w-5xl space-y-8 px-6 py-10 sm:px-8 sm:py-16"
      >
        <header className="space-y-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" />
            <h1 className="type-h1 font-semibold tracking-tight">Trust Center</h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-3xl">
            What ValidationKit reads, what it writes, what it doesn&apos;t yet do,
            and what&apos;s on the compliance roadmap. Pre-release.
            M3 pulls a lawyer through this; M8 pulls a second lawyer through the DPA.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant={ccaCopy.variant}>{ccaCopy.label}</Badge>
          </div>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Default scopes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Surface</TableHead>
                  <TableHead className="w-32">Severity</TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead>Opt-in</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {DEFAULT_SCOPES.map((s) => (
                  <TableRow key={s.surface}>
                    <TableCell className="font-mono text-xs">{s.surface}</TableCell>
                    <TableCell>
                      <SeverityBadge severity={s.sev} />
                    </TableCell>
                    <TableCell className="text-xs">{s.default}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {s.optIn}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">What we do</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              We deliberately ship boring fundamentals before any growth lever.
            </p>
            <ul className="space-y-1.5 text-muted-foreground list-disc pl-5">
              <li>Read-only by default everywhere a write is plausible.</li>
              <li>
                5 of 6 audit categories are deterministic, so every finding has
                a file:line citation. No vibe-scores.
              </li>
              <li>
                LLM-augmented findings carry a confidence band (low / mid /
                high) and only emit at mid+ by default.
              </li>
              <li>
                Anonymous mode is a first-class path. The app degrades
                gracefully when DATABASE_URL is unset.
              </li>
              <li>
                Direct Anthropic provider (no Gateway middleman). Local
                Postgres-cache for repeated calls (Phase 1).
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-[color-mix(in_oklch,var(--color-sev-weak)_30%,transparent)]">
          <CardHeader>
            <CardTitle className="text-base">
              What we don&apos;t yet do (the honest part)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              These are real gaps, stated plainly. Don&apos;t adopt
              ValidationKit for production yet if any of these are dealbreakers.
            </p>
            <ul className="space-y-1.5 text-muted-foreground list-disc pl-5">
              <li>
                <strong className="text-foreground">No SOC-2 / ISO-27001.</strong>{" "}
                Targeted for Phase 2 (M9 to M18) with the Agency-Scale tier ($799/mo).
              </li>
              <li>
                <strong className="text-foreground">No third-party pentest.</strong>{" "}
                First external security review at M6.
              </li>
              <li>
                <strong className="text-foreground">No GitHub App live.</strong>{" "}
                Currently the PR workflow only ships a LocalGitClient writing
                patch files. App registration waits for the 4 Day-1-Mitigations.
              </li>
              <li>
                <strong className="text-foreground">No EU-only hosting.</strong>{" "}
                Phase 2 offers a Neon EU-Frankfurt option.
              </li>
              <li>
                <strong className="text-foreground">Single-author single-region single-vendor.</strong>{" "}
                Solo until M18 (PRD constraint #9). Bus-factor of one. Plan
                accordingly.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Compliance roadmap</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Milestone</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="w-32">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ROADMAP.map((r) => (
                  <TableRow key={`${r.milestone}-${r.item}`}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {r.milestone}
                    </TableCell>
                    <TableCell className="text-sm">{r.item}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {r.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ScrollText className="size-4" />
              Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <ul className="space-y-1 text-muted-foreground">
              <li>
                Imprint:{" "}
                <Link href={"/legal/impressum" as never} className="text-primary hover:underline underline-offset-4">/legal/impressum</Link>
              </li>
              <li>
                Privacy policy:{" "}
                <Link href={"/legal/datenschutz" as never} className="text-primary hover:underline underline-offset-4">/legal/datenschutz</Link>
              </li>
              <li>
                Terms:{" "}
                <Link href={"/legal/agb" as never} className="text-primary hover:underline underline-offset-4">/legal/agb</Link>
              </li>
              <li>
                DPA (Art. 28 GDPR):{" "}
                <Link href={"/legal/dpa" as never} className="text-primary hover:underline underline-offset-4">/legal/dpa</Link>{" "}
                · accept (audit-log) at{" "}
                <Link href="/trust/dpa" className="text-primary hover:underline underline-offset-4">/trust/dpa</Link>
              </li>
              <li>
                Sub-processors:{" "}
                <Link href={"/legal/subprocessors" as never} className="text-primary hover:underline underline-offset-4">/legal/subprocessors</Link>
                {" · "}
                <a href="/trust/sub-processors.json" className="text-primary hover:underline underline-offset-4">JSON</a>
                {" · "}
                <a href="/trust/sub-processors.xml" className="text-primary hover:underline underline-offset-4">RSS</a>
              </li>
              <li>
                LLM-eval history:{" "}
                <Link href="/trust/eval" className="text-primary hover:underline underline-offset-4">/trust/eval</Link>{" "}
                (per-band FPR over time)
              </li>
              <li>
                TOMs register, incident-response &amp; scope policy are available
                on request via datenschutz@validationkit.app
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileDown className="size-4" />
              Audit-Trail Export
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Compliance-Frame Customers (Pharma / Finance / Marketing-with-PII)
              can export the workspace audit-trail at any time, covering scans,
              install_requests, repo write-grants, and webhook events.{" "}
              <strong className="text-foreground">Retention: 12 months.</strong>
            </p>
            <Separator />
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <a href="/api/audit-trail?format=json">↓ JSON</a>
              </Button>
              <Button asChild size="sm" variant="outline">
                <a href="/api/audit-trail?format=csv">↓ CSV</a>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Signed-in only. Anonymous mode returns 404 (no side-channel).
              Mechanism in <code className="font-mono text-xs">docs/playbook/03-compliance-frame.md</code> §5 Q4.
            </p>
          </CardContent>
        </Card>

        <footer className="border-t border-border pt-6 text-xs text-muted-foreground">
          ValidationKit v0.0.14 ·{" "}
          <Link href="/" className="hover:text-foreground">Audit</Link> ·{" "}
          <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link> ·{" "}
          <Link href="/billing" className="hover:text-foreground">Billing</Link>
        </footer>
      </main>
    </>
  );
}
