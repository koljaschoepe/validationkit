import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { SeverityBand } from "@vk/core";

/**
 * Canonical severity-band badge — PRD §2 Constraint #5.
 *
 * The 5 bands {Kill, Weak, Mid, Strong, Exceptional} are the only allowed
 * severity language across ValidationKit. Numeric scores (87/100 style) are
 * an anti-pattern (PRD constraint #5 + Track-D2). This component is the only
 * way to render a severity in the UI.
 */
const severityBadgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-[0.7rem] font-bold tracking-wide uppercase font-mono",
  {
    variants: {
      severity: {
        Kill: "bg-[color-mix(in_oklch,var(--color-sev-kill)_18%,transparent)] text-[var(--color-sev-kill)]",
        Weak: "bg-[color-mix(in_oklch,var(--color-sev-weak)_18%,transparent)] text-[var(--color-sev-weak)]",
        Mid: "bg-[color-mix(in_oklch,var(--color-sev-mid)_18%,transparent)] text-[var(--color-sev-mid)]",
        Strong: "bg-[color-mix(in_oklch,var(--color-sev-strong)_18%,transparent)] text-[var(--color-sev-strong)]",
        Exceptional: "bg-[color-mix(in_oklch,var(--color-sev-exceptional)_18%,transparent)] text-[var(--color-sev-exceptional)]",
      },
    },
    defaultVariants: {
      severity: "Mid",
    },
  },
);

export interface SeverityBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    Omit<VariantProps<typeof severityBadgeVariants>, "severity"> {
  severity: SeverityBand;
}

export function SeverityBadge({
  severity,
  className,
  ...props
}: SeverityBadgeProps) {
  return (
    <span
      className={cn(severityBadgeVariants({ severity }), className)}
      data-sev={severity}
      {...props}
    >
      {severity}
    </span>
  );
}
