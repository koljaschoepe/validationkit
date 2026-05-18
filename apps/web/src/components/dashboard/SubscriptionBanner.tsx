import Link from "next/link";
import { AlertTriangle, CreditCard } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Status = "active" | "past_due" | "canceled" | "trialing" | "incomplete";

export function SubscriptionBanner({
  status,
  tierLabel,
}: {
  status: string;
  tierLabel: string;
}) {
  const s = status as Status;
  if (s === "active" || s === "trialing") return null;

  if (s === "past_due") {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="size-4" />
        <AlertTitle>Payment failed on {tierLabel}.</AlertTitle>
        <AlertDescription className="space-y-1">
          <p>
            <strong>Concession:</strong> Stripe retries automatically for
            three weeks. <strong>Critique:</strong> if you ignore this, the
            subscription cancels and the tier drops back to Free — your repos
            stay readable but new audits stop.
          </p>
          <p>
            <Link
              href="/billing"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              <CreditCard className="size-3.5" />
              Update payment method
            </Link>
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  if (s === "canceled") {
    return (
      <Alert>
        <CreditCard className="size-4" />
        <AlertTitle>Your {tierLabel} plan was cancelled.</AlertTitle>
        <AlertDescription>
          You&apos;re on Solo Free now — 1 repo, 20 audits/mo.{" "}
          <Link
            href="/billing"
            className="text-primary underline-offset-4 hover:underline"
          >
            Resubscribe
          </Link>{" "}
          any time.
        </AlertDescription>
      </Alert>
    );
  }

  if (s === "incomplete") {
    return (
      <Alert>
        <AlertTriangle className="size-4" />
        <AlertTitle>Checkout incomplete.</AlertTitle>
        <AlertDescription>
          Finish the {tierLabel} setup on{" "}
          <Link
            href="/billing"
            className="text-primary underline-offset-4 hover:underline"
          >
            /billing
          </Link>{" "}
          — your card was authorised but not fully charged yet.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
