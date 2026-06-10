import Link from "next/link";
import { redirect } from "next/navigation";
import { and, eq, gt } from "drizzle-orm";
import { AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";
import { isAuthEnabled } from "@vk/auth";
import {
  TIERS,
  ensureSubscription,
  priceForCycle,
  type TierId,
} from "@vk/billing";
import { getDb, isDbEnabled, schema } from "@vk/db";
import { getSessionUser } from "@/lib/session";
import { resolveWorkspaceFromSlug } from "@/lib/workspace-context";
import {
  startCheckoutAction,
  openBillingPortalAction,
} from "@/lib/billing-actions";
import { BuyCreditPackModal } from "@/components/BuyCreditPackModal";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ workspace: string }>;
  searchParams: Promise<{ status?: string; reason?: string }>;
}

function eur(cents: number): string {
  if (cents === 0) return "€0";
  return `€${(cents / 100).toFixed(0)}`;
}

function formatDate(d: Date | null): string {
  if (!d) return "n/a";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const TIER_ORDER: TierId[] = ["free", "starter", "pro", "agency"];

export default async function WorkspaceBillingPage({
  params,
  searchParams,
}: PageProps) {
  if (!isAuthEnabled()) redirect("/login");
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { workspace: slug } = await params;
  const search = await searchParams;
  const ws = await resolveWorkspaceFromSlug(slug, user.id);
  if (!ws) redirect("/");

  if (!isDbEnabled()) {
    return (
      <Card>
        <CardContent className="pt-6">
          Database is not enabled on this deployment.
        </CardContent>
      </Card>
    );
  }

  const snap = await ensureSubscription(ws.id);
  const db = getDb();
  const grants = await db
    .select()
    .from(schema.prepaidCreditGrant)
    .where(
      and(
        eq(schema.prepaidCreditGrant.workspaceId, ws.id),
        gt(schema.prepaidCreditGrant.expiresAt, new Date()),
      ),
    )
    .orderBy(schema.prepaidCreditGrant.expiresAt);

  const usedPct =
    snap.creditsQuotaPerCycle === 0
      ? 0
      : Math.min(
          100,
          Math.round(
            (snap.creditsUsedThisPeriod / snap.creditsQuotaPerCycle) * 100,
          ),
        );
  const isPastDue = snap.status === "past_due";

  return (
    <>
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground">
          Current plan, credit balance, pre-paid packs, and Stripe portal for
          invoices + payment method updates.
        </p>
      </header>

      {search?.status === "success" && (
        <StatusBanner kind="success" message="Subscription updated." />
      )}
      {search?.status === "pack_success" && (
        <StatusBanner
          kind="success"
          message="Credit pack purchased. Credits will appear in a moment."
        />
      )}
      {search?.status === "error" && (
        <StatusBanner
          kind="error"
          message={search?.reason ?? "Something went wrong."}
        />
      )}
      {isPastDue && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div className="flex-1 text-sm">
              <p className="font-medium">Payment failed</p>
              <p className="text-muted-foreground">
                Update your payment method in the Stripe portal to restore
                full access.
              </p>
            </div>
            <form action={openBillingPortalAction}>
              <Button size="sm" variant="destructive">
                Update payment
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-baseline justify-between">
            <CardTitle>Current plan</CardTitle>
            <Badge variant={snap.tier === "free" ? "secondary" : "default"}>
              {snap.config.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-3">
          <Stat label="Status" value={statusLabel(snap.status)} />
          <Stat
            label="Next renewal"
            value={formatDate(snap.currentPeriodEnd)}
          />
          <Stat
            label="Monthly price"
            value={eur(priceForCycle(snap.config, "monthly"))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Credit balance</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-semibold tracking-tight">
              {snap.totalCreditsAvailable}
              <span className="text-base font-normal text-muted-foreground">
                {" "}
                / {snap.creditsQuotaPerCycle} this period
              </span>
            </span>
            {snap.prepaidRemaining > 0 && (
              <span className="text-xs text-muted-foreground">
                +{snap.prepaidRemaining} from prepaid packs
              </span>
            )}
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-secondary"
            role="progressbar"
            aria-valuenow={usedPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Credits used this period"
          >
            <div
              className={cn(
                "h-full transition-all",
                usedPct >= 95
                  ? "bg-destructive"
                  : usedPct >= 80
                    ? "bg-sev-mid"
                    : "bg-primary",
              )}
              style={{ width: `${usedPct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {snap.config.isLifetimeCap
              ? "Free tier credits don't reset. Upgrade to a paid plan for a monthly cycle."
              : `Resets on ${formatDate(snap.currentPeriodEnd)}. Need more? Buy a credit pack below or enable auto-overage in AI settings.`}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pre-paid credit packs</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          {grants.length === 0 ? (
            <p className="text-muted-foreground">
              No active packs. Buy one below to stash extra credits. Packs
              expire after 12 months.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {grants.map((g) => (
                <li
                  key={g.id}
                  className="flex items-center justify-between rounded-md border bg-secondary/30 px-3 py-2"
                >
                  <span>
                    <strong>{g.creditsRemaining}</strong> of {g.creditsGranted}{" "}
                    credits remaining
                  </span>
                  <span className="text-xs text-muted-foreground">
                    expires {formatDate(g.expiresAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="pt-2">
            {/* BuyCreditPackModal: single dialog with both pack sizes + value
                framing + VAT note — the designated surface over bare buttons. */}
            <BuyCreditPackModal />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change plan</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {TIER_ORDER.map((id) => {
            const tier = TIERS[id];
            const current = snap.tier === id;
            return (
              <div
                key={id}
                className={cn(
                  "flex flex-col gap-2 rounded-md border p-3",
                  current && "border-foreground bg-secondary/40",
                )}
              >
                <div className="flex items-center justify-between text-sm font-medium">
                  {tier.label}
                  {current && (
                    <Badge variant="default" className="text-[10px]">
                      Current
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {tier.creditsPerCycle} credits ·{" "}
                  {eur(priceForCycle(tier, "monthly"))}/mo
                </div>
                {id === "free" ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled
                    className="mt-auto"
                  >
                    {current ? "Current" : "Downgrade via portal"}
                  </Button>
                ) : (
                  <form action={startCheckoutAction} className="mt-auto">
                    <input type="hidden" name="tier" value={id} />
                    <input type="hidden" name="cycle" value="monthly" />
                    <Button
                      type="submit"
                      size="sm"
                      variant={current ? "secondary" : "default"}
                      className="w-full"
                      disabled={current}
                    >
                      {current ? "Current" : "Upgrade"}
                    </Button>
                  </form>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stripe customer portal</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <p className="text-muted-foreground">
            Update payment method, view invoices, cancel subscription, or
            change your VAT ID, all in Stripe&apos;s hosted portal.
          </p>
          <form action={openBillingPortalAction}>
            <Button type="submit" variant="outline" size="sm">
              Open Stripe portal
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground">
        <Link href="/pricing" className="underline-offset-4 hover:underline">
          See pricing details
        </Link>
        {" · "}
        <Link
          href={"/legal/agb" as never}
          className="underline-offset-4 hover:underline"
        >
          Terms & pricing clause
        </Link>
      </div>
    </>
  );
}

function statusLabel(status: string): string {
  return (
    {
      active: "Active",
      past_due: "Past due",
      canceled: "Canceled",
      trialing: "Trial",
      incomplete: "Incomplete",
    }[status] ?? status
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

function StatusBanner({
  kind,
  message,
}: {
  kind: "success" | "error";
  message: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
        kind === "success"
          ? "border-[var(--color-sev-strong)]/40 bg-[var(--color-sev-strong)]/5 text-[var(--color-sev-strong)]"
          : "border-destructive/40 bg-destructive/5 text-destructive",
      )}
      role="status"
    >
      {kind === "success" ? (
        <CheckCircle2 className="h-4 w-4 text-[var(--color-sev-strong)]" />
      ) : (
        <Sparkles className="h-4 w-4" />
      )}
      {message}
    </div>
  );
}
