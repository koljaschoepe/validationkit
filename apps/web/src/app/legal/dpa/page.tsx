import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  title: "Data Processing Addendum — ValidationKit",
  description: "GDPR Art. 28 DPA template for ValidationKit customers.",
};

export default function DpaPage() {
  return (
    <main id="main-content" className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <SiteNav />
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Data Processing Addendum
        </h1>
        <p className="text-sm text-muted-foreground">
          ValidationKit acts as a Data Processor on behalf of its customers
          (Data Controllers) when processing repository content for audits.
          The following DPA applies in addition to our terms.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>1. Scope of processing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>Processor:</strong> ValidationKit (operator, Germany).
          </p>
          <p>
            <strong>Subject matter:</strong> Automated audit of AI-agent
            configuration files (AGENTS.md, CLAUDE.md, SKILL.md, etc.) in
            repositories the Controller authorizes ValidationKit to scan.
          </p>
          <p>
            <strong>Duration:</strong> For the term of the subscription
            agreement, plus a 30-day retention window for audit-trail
            integrity.
          </p>
          <p>
            <strong>Categories of personal data:</strong> Email addresses
            (workspace owner + invited members), GitHub usernames where
            included in repository commits or AGENTS.md citations.
          </p>
          <p>
            <strong>Categories of data subjects:</strong> Customer employees,
            collaborators, and end-users whose names appear in repository
            content scanned by audits.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Sub-processors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            ValidationKit uses the sub-processors listed at{" "}
            <Link
              href={"/legal/subprocessors" as never}
              className="underline-offset-4 hover:underline"
            >
              /legal/subprocessors
            </Link>
            . The Controller hereby grants general authorization to engage
            those sub-processors; ValidationKit will notify the Controller of
            additions or replacements at least 30 days in advance, giving the
            Controller the right to object and terminate.
          </p>
          <p>
            International transfers to US sub-processors (Anthropic, OpenAI,
            Stripe, Vercel, Resend, Inngest) rely on the EU Standard
            Contractual Clauses (Module 2 — Controller-to-Processor) plus a
            Transfer Impact Assessment available at{" "}
            <code>docs/operations/transfer-impact-assessment.md</code> in our
            public repo.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Security measures</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>Encryption in transit:</strong> TLS 1.2+ on all customer
            traffic, sub-processor traffic, and webhook delivery.
          </p>
          <p>
            <strong>Encryption at rest:</strong> Provider-managed for Postgres
            (Neon), object storage (Vercel Blob), and provider API keys
            (column-level AES-256-GCM via ADR-0008).
          </p>
          <p>
            <strong>Access control:</strong> Workspace-scoped RBAC enforces
            customer-controller boundaries. Sub-processor access is
            least-privilege per role.
          </p>
          <p>
            <strong>Logging + monitoring:</strong> Audit-trail rows for every
            apply / dismiss / snooze decision; immutable Stripe-webhook
            replay log; 7-day workspace event log.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Data subject rights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            ValidationKit will assist the Controller (taking into account the
            nature of processing) in fulfilling its obligations to respond to
            data subject requests under Articles 15-22 GDPR. Requests should
            reach us at{" "}
            <a
              href="mailto:legal@validationkit.app"
              className="underline-offset-4 hover:underline"
            >
              legal@validationkit.app
            </a>{" "}
            and will be acknowledged within 5 business days.
          </p>
          <p>
            Export of all workspace data + audit reports is available
            self-service from the workspace settings. Deletion requests are
            processed within 30 days, with billing-trail records kept for the
            statutory tax-retention window (10 years, DE).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Breach notification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            ValidationKit will notify the Controller of any personal data
            breach without undue delay and within 72 hours after becoming
            aware, including the nature of the breach, affected data subjects,
            likely consequences, and mitigation steps.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>6. Audits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            On reasonable notice and at the Controller&apos;s expense,
            ValidationKit will provide information necessary to demonstrate
            compliance with this DPA, including documentation of security
            controls and sub-processor compliance.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>7. Return / deletion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            On termination of the underlying agreement, ValidationKit will
            delete or return all personal data within 30 days, except where
            retention is required by Union or Member State law (e.g. invoices
            for German tax purposes).
          </p>
        </CardContent>
      </Card>

      <footer className="text-xs text-muted-foreground">
        Version 1.0 — 2026-05-21. This DPA is offered as a template; for
        custom legal review or signed copies, contact{" "}
        <a
          href="mailto:legal@validationkit.app"
          className="underline-offset-4 hover:underline"
        >
          legal@validationkit.app
        </a>
        . Anwaltliche Review steht aus (Sub-Plan-C deferred).
      </footer>
    </main>
  );
}
