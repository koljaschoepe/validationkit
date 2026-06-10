import Link from "next/link";
import { CheckCircle2, FileWarning, ShieldCheck } from "lucide-react";
import { isAuthEnabled } from "@vk/auth";
import { SiteNav } from "@/components/SiteNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { getSessionUser } from "@/lib/session";
import {
  getDpaAcceptanceState,
  acceptDpaAction,
} from "@/lib/dpa-actions";
import { CURRENT_DPA_VERSION } from "@/lib/dpa-constants";

export const dynamic = "force-dynamic";

async function acceptForm(): Promise<void> {
  "use server";
  await acceptDpaAction();
}

export default async function DpaPage() {
  const authOn = isAuthEnabled();
  const user = authOn ? await getSessionUser() : null;
  const acceptance = authOn
    ? await getDpaAcceptanceState()
    : { accepted: false, acceptedAt: null, acceptedVersion: null };

  return (
    <>
      <SiteNav />
      <main
        id="main-content"
        className="mx-auto max-w-3xl space-y-6 px-6 py-10 sm:px-8 sm:py-16"
      >
        <header className="space-y-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" />
            <h1 className="type-h1 font-semibold tracking-tight">
              Data Processing Agreement
            </h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Article-28 GDPR Auftragsverarbeitungsvertrag. Accepting here writes
            an audit-log row (user-id + DPA version + accepted-at + IP +
            user-agent) per ADR-0020. Lawyer-review scheduled M8.
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="outline" className="font-mono">
              Version: {CURRENT_DPA_VERSION}
            </Badge>
            <Badge variant="outline">Status: DRAFT, pre-M8 lawyer-review</Badge>
          </div>
        </header>

        <Alert>
          <FileWarning className="size-4" />
          <AlertTitle>Concession-then-Critique</AlertTitle>
          <AlertDescription>
            On the upside, shipping a DPA before lawyer-review is more than most
            $19/mo competitors do at our stage. The honest caveat is that it is
            still a DRAFT. Don&apos;t adopt ValidationKit for production
            against PII workloads until the M8 lawyer-pass lands. The audit-log of
            your acceptance survives the M8 update, because the versioned column
            keeps old acceptances attached to the old text.
          </AlertDescription>
        </Alert>

        {authOn && user ? (
          acceptance.accepted ? (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="flex items-start gap-3 py-4 text-sm">
                <CheckCircle2 className="mt-0.5 size-5 text-primary shrink-0" />
                <div>
                  <p className="font-medium">DPA accepted.</p>
                  <p className="text-muted-foreground mt-1">
                    Version {acceptance.acceptedVersion} accepted{" "}
                    {acceptance.acceptedAt?.toISOString().slice(0, 16).replace("T", " ")}
                    {" UTC"}.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Accept the DPA</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  Clicking accept writes a one-row audit-log entry. You can
                  request deletion any time by emailing{" "}
                  <code className="font-mono">datenschutz@validationkit.app</code>{" "}
                  referencing your account email.
                </p>
                <form action={acceptForm}>
                  <Button type="submit" size="sm">
                    Accept DPA {CURRENT_DPA_VERSION}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )
        ) : (
          <Card>
            <CardContent className="py-4 text-sm text-muted-foreground">
              <Link
                href="/login"
                className="text-primary underline-offset-4 hover:underline"
              >
                Sign in
              </Link>{" "}
              to accept the DPA and write an audit-log row tied to your
              account.
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">DPA text</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              The full Article-28 Data Processing Agreement covers definitions,
              scope, sub-processors, security measures, deletion and audit
              rights. It is maintained as a versioned page.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href={"/legal/dpa" as never}>Read the full DPA →</Link>
            </Button>
          </CardContent>
        </Card>

        <Separator />
        <footer className="text-xs text-muted-foreground">
          ValidationKit v0.0.15 ·{" "}
          <Link href="/trust" className="hover:text-foreground">Trust Center</Link>
          {" · "}
          <Link href="/billing" className="hover:text-foreground">Billing</Link>
          {" · "}
          <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
        </footer>
      </main>
    </>
  );
}
