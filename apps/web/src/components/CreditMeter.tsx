import Link from "next/link";
import { cn } from "@/lib/utils";

export interface CreditMeterProps {
  workspaceSlug: string;
  creditsRemaining: number;
  creditsQuota: number;
  prepaidRemaining: number;
  isLifetimeCap: boolean;
  resetAt: Date | null;
}

function formatDate(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Sub-Plan-C — Right-rail credit counter. Server-rendered (snapshot lives in
 * the workspace layout's data load); revalidates on every audit completion
 * via the Galaxie cache-tag flush in audit-action.ts.
 */
export function CreditMeter({
  workspaceSlug,
  creditsRemaining,
  creditsQuota,
  prepaidRemaining,
  isLifetimeCap,
  resetAt,
}: CreditMeterProps) {
  const pct =
    creditsQuota === 0
      ? 0
      : Math.max(
          0,
          Math.min(100, Math.round((creditsRemaining / creditsQuota) * 100)),
        );

  return (
    <aside
      className="flex w-60 flex-col gap-3 rounded-lg border bg-card p-4 text-sm"
      aria-label="Credit balance"
    >
      <div className="flex items-baseline justify-between">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          Credits
        </span>
        <span className="text-xs text-muted-foreground">
          {creditsRemaining} / {creditsQuota}
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-secondary"
        role="progressbar"
        aria-valuenow={creditsRemaining}
        aria-valuemin={0}
        aria-valuemax={creditsQuota}
      >
        <div
          className={cn(
            "h-full transition-all",
            pct <= 5
              ? "bg-destructive"
              : pct <= 20
                ? "bg-sev-mid"
                : "bg-primary",
          )}
          style={{ width: `${100 - pct}%` }}
        />
      </div>
      {prepaidRemaining > 0 && (
        <p className="text-xs text-muted-foreground">
          +{prepaidRemaining} prepaid credits available
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        {isLifetimeCap
          ? "Free tier — upgrade for a monthly cycle."
          : `Resets ${formatDate(resetAt)}.`}
      </p>
      <Link
        href={`/${workspaceSlug}/settings/billing`}
        className="text-xs font-medium text-foreground underline-offset-4 hover:underline"
      >
        Buy credits / upgrade →
      </Link>
    </aside>
  );
}
