"use client";

import { useId, useState } from "react";
import { Layers, Lock, Zap } from "lucide-react";
import { type Intensity } from "@vk/billing";
import {
  estimateAuditCost,
  formatEurCents,
} from "@/lib/cost-estimator";
import { cn } from "@/lib/utils";

interface IntensitySelectorProps {
  /** Submitted as `intensity` form-field — auditAction picks it up. */
  name?: string;
  /** Initial selection. Falls back to "quick" (free-tier default). */
  defaultValue?: Intensity;
  /** When true, "deep" is rendered as a locked upsell pill. */
  deepLocked?: boolean;
  /** Optional credits-left hint shown below the pills. */
  creditsRemaining?: number;
  creditsQuota?: number;
}

const OPTIONS: ReadonlyArray<{
  value: Intensity;
  label: string;
  Icon: typeof Zap;
}> = [
  { value: "quick", label: "Quick", Icon: Zap },
  { value: "deep", label: "Deep", Icon: Layers },
];

export function IntensitySelector({
  name = "intensity",
  defaultValue = "quick",
  deepLocked = false,
  creditsRemaining,
  creditsQuota,
}: IntensitySelectorProps) {
  const groupId = useId();
  const [selected, setSelected] = useState<Intensity>(
    deepLocked ? "quick" : defaultValue,
  );
  const estimate = estimateAuditCost(selected);

  return (
    <div className="flex flex-col gap-2" role="radiogroup" aria-labelledby={`${groupId}-label`}>
      <span id={`${groupId}-label`} className="sr-only">
        Audit intensity
      </span>
      <input type="hidden" name={name} value={selected} />
      <div className="inline-flex rounded-md border bg-secondary/30 p-1">
        {OPTIONS.map(({ value, label, Icon }) => {
          const locked = value === "deep" && deepLocked;
          const active = selected === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={active}
              aria-disabled={locked}
              disabled={locked}
              onClick={() => !locked && setSelected(value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-sm transition-colors",
                active && !locked && "bg-background text-foreground shadow-sm",
                !active && "text-muted-foreground hover:text-foreground",
                locked && "cursor-not-allowed opacity-60",
              )}
              title={
                locked
                  ? "Deep audits require Pro or higher — upgrade your plan to unlock."
                  : `${label} audit`
              }
            >
              {locked ? (
                <Lock className="h-3.5 w-3.5" />
              ) : (
                <Icon className="h-3.5 w-3.5" />
              )}
              {label}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        This {selected} audit consumes{" "}
        <strong>
          {estimate.credits} credit{estimate.credits === 1 ? "" : "s"}
        </strong>
        {" "}
        (≈ {formatEurCents(estimate.approxAiCostEurCents)} of AI compute,{" "}
        {estimate.modelLabel}).
        {typeof creditsRemaining === "number" &&
          typeof creditsQuota === "number" && (
            <>
              {" "}
              You have <strong>{creditsRemaining}</strong> of {creditsQuota}{" "}
              credits left.
            </>
          )}
      </p>
    </div>
  );
}
