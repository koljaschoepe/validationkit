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
  if (cents === 0) return "0 €";
  return `${(cents / 100).toFixed(0)} €`;
}

function formatDate(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleDateString("de-DE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const TIER_ORDER: TierId[] = ["free", "starter", "pro", "agency"];

/**
 * Usage heat: maps the consumed-percentage of the period quota onto the
 * 3-colour severity system (calm → orange → red). Used for the headline
 * balance number and the meter so a near-empty balance reads as "hot".
 */
function usageHeatClass(usedPct: number): string {
  if (usedPct >= 95) return "text-destructive";
  if (usedPct >= 80) return "text-[var(--color-sev-mid)]";
  return "text-foreground";
}

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
          Die Datenbank ist auf diesem Deployment nicht aktiviert.
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
  // Transparent breakdown: quota-Credits that are still unspent this period,
  // independent of the prepaid stash on top.
  const quotaRemaining = Math.max(
    0,
    snap.creditsQuotaPerCycle - snap.creditsUsedThisPeriod,
  );
  const isPastDue = snap.status === "past_due";
  const isPaid = snap.tier !== "free";

  return (
    <>
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Abrechnung</h1>
        <p className="text-sm text-muted-foreground">
          Aktueller Plan, Credit-Stand, Prepaid-Pakete und das Stripe-Portal für
          Rechnungen und Zahlungsdaten.
        </p>
      </header>

      {search?.status === "success" && (
        <StatusBanner kind="success" message="Abonnement aktualisiert." />
      )}
      {search?.status === "pack_success" && (
        <StatusBanner
          kind="success"
          message="Credit-Paket gekauft. Die Credits erscheinen in wenigen Augenblicken."
        />
      )}
      {search?.status === "error" && (
        <StatusBanner
          kind="error"
          message={search?.reason ?? "Etwas ist schiefgelaufen."}
        />
      )}
      {isPastDue && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div className="flex-1 text-sm">
              <p className="font-medium">Zahlung fehlgeschlagen</p>
              <p className="text-muted-foreground">
                Aktualisiere deine Zahlungsdaten im Stripe-Portal, um den vollen
                Zugriff wiederherzustellen.
              </p>
            </div>
            <form action={openBillingPortalAction}>
              <Button size="sm" variant="destructive">
                Zahlung aktualisieren
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Premium plan-status header: tier is the headline, status + renewal +
          price as supporting metadata so the "what am I paying for" answer is
          legible at a glance. */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="type-mono-sm uppercase tracking-wider text-muted-foreground">
                Aktueller Plan
              </p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-semibold tracking-tight">
                  {snap.config.label}
                </span>
                <StatusPill status={snap.status} />
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold tracking-tight">
                {eur(priceForCycle(snap.config, "monthly"))}
                <span className="text-sm font-normal text-muted-foreground">
                  {" "}
                  / Monat
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                {isPaid
                  ? `Nächste Verlängerung: ${formatDate(snap.currentPeriodEnd)}`
                  : "Kostenloser Plan"}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Credit-Stand</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          <div className="flex items-baseline justify-between gap-3">
            <span
              className={cn(
                "text-4xl font-semibold tracking-tight tabular-nums",
                usageHeatClass(usedPct),
              )}
            >
              {snap.totalCreditsAvailable}
              <span className="text-base font-normal text-muted-foreground">
                {" "}
                verfügbar
              </span>
            </span>
            <span className="text-right text-xs text-muted-foreground">
              {usedPct}% des Zeitraum-Kontingents genutzt
            </span>
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-secondary"
            role="progressbar"
            aria-valuenow={usedPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Verbrauchte Credits in diesem Zeitraum"
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

          {/* Transparent breakdown — where the available balance comes from and
              what's already been spent this period. */}
          <dl className="grid grid-cols-3 gap-3 rounded-md border bg-secondary/30 px-3 py-2.5 text-center">
            <Breakdown
              label="Verbraucht"
              value={snap.creditsUsedThisPeriod}
            />
            <Breakdown
              label="Kontingent übrig"
              value={quotaRemaining}
            />
            <Breakdown
              label="Aus Prepaid"
              value={snap.prepaidRemaining}
            />
          </dl>

          <p className="text-xs text-muted-foreground">
            {snap.config.isLifetimeCap
              ? "Die Credits des kostenlosen Plans werden nicht zurückgesetzt. Wechsle auf einen bezahlten Plan für einen monatlichen Zyklus."
              : `Wird am ${formatDate(snap.currentPeriodEnd)} zurückgesetzt. Mehr nötig? Kaufe unten ein Credit-Paket oder aktiviere die Auto-Overage in den AI-Einstellungen.`}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prepaid-Credit-Pakete</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          {grants.length === 0 ? (
            <p className="text-muted-foreground">
              Keine aktiven Pakete. Kaufe unten eins, um Extra-Credits anzulegen.
              Pakete verfallen nach 12 Monaten.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {grants.map((g) => (
                <li
                  key={g.id}
                  className="flex items-center justify-between rounded-md border bg-secondary/30 px-3 py-2"
                >
                  <span>
                    <strong>{g.creditsRemaining}</strong> von {g.creditsGranted}{" "}
                    Credits übrig
                  </span>
                  <span className="text-xs text-muted-foreground">
                    verfällt {formatDate(g.expiresAt)}
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
          <CardTitle>Plan wechseln</CardTitle>
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
                      Aktuell
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {tier.creditsPerCycle} Credits ·{" "}
                  {eur(priceForCycle(tier, "monthly"))}/Mon.
                </div>
                {id === "free" ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled
                    className="mt-auto"
                  >
                    {current ? "Aktuell" : "Downgrade über Portal"}
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
                      {current ? "Aktuell" : "Upgrade"}
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
          <CardTitle>Stripe-Kundenportal</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <p className="text-muted-foreground">
            Zahlungsmethode ändern, Rechnungen einsehen, Abo kündigen oder deine
            USt-IdNr. anpassen — alles im gehosteten Stripe-Portal.
          </p>
          <form action={openBillingPortalAction}>
            <Button type="submit" variant="outline" size="sm">
              Stripe-Portal öffnen
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground">
        <Link href="/pricing" className="underline-offset-4 hover:underline">
          Preisdetails ansehen
        </Link>
        {" · "}
        <Link
          href={"/legal/agb" as never}
          className="underline-offset-4 hover:underline"
        >
          AGB & Preisklausel
        </Link>
      </div>
    </>
  );
}

function statusLabel(status: string): string {
  return (
    {
      active: "Aktiv",
      past_due: "Zahlung überfällig",
      canceled: "Gekündigt",
      trialing: "Testphase",
      incomplete: "Unvollständig",
    }[status] ?? status
  );
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "active"
      ? "border-[var(--color-sev-strong)]/40 bg-[var(--color-sev-strong)]/10 text-[var(--color-sev-strong)]"
      : status === "past_due"
        ? "border-destructive/40 bg-destructive/10 text-destructive"
        : "border-border bg-secondary text-muted-foreground";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 type-mono-sm",
        tone,
      )}
    >
      {statusLabel(status)}
    </span>
  );
}

function Breakdown({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dd className="text-lg font-semibold tabular-nums">{value}</dd>
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
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
