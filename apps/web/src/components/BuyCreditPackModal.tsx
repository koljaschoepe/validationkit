"use client";

import { useState } from "react";
import { CheckCircle2, Sparkles } from "lucide-react";
import { buyPrepaidPackAction } from "@/lib/billing-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface PackOption {
  size: 100 | 500;
  priceEur: string;
  perCreditEur: string;
  highlight?: string;
}

const PACKS: ReadonlyArray<PackOption> = [
  { size: 100, priceEur: "€25", perCreditEur: "€0.25", highlight: "Starter top-up" },
  {
    size: 500,
    priceEur: "€99",
    perCreditEur: "€0.198",
    highlight: "Best value",
  },
];

interface BuyCreditPackModalProps {
  /** Renders the default "Buy credits" button trigger when omitted. */
  trigger?: React.ReactNode;
}

/**
 * V2 polish — modal alternative to the inline pack-buy forms on the billing
 * page. Better surface for the workspace-layout right-rail CreditMeter
 * CTA, since the page-redirect to billing settings would lose context.
 */
export function BuyCreditPackModal({ trigger }: BuyCreditPackModalProps) {
  const [selected, setSelected] = useState<100 | 500>(100);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline">
            Buy credits
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Buy a pre-paid credit pack</DialogTitle>
          <DialogDescription>
            Packs never expire within 12 months and stack on top of your
            subscription quota. They drain first when you audit.
          </DialogDescription>
        </DialogHeader>

        <fieldset className="flex flex-col gap-2">
          <legend className="sr-only">Pack size</legend>
          {PACKS.map((pack) => {
            const active = selected === pack.size;
            return (
              <label
                key={pack.size}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm transition-colors",
                  active && "border-foreground bg-secondary/40",
                )}
              >
                <input
                  type="radio"
                  name="pack-size"
                  value={pack.size}
                  checked={active}
                  onChange={() => setSelected(pack.size)}
                  className="h-4 w-4"
                />
                <div className="flex flex-1 flex-col">
                  <span className="font-medium">
                    {pack.size} credits — {pack.priceEur}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {pack.perCreditEur}/credit · {pack.highlight}
                  </span>
                </div>
                {active && (
                  <CheckCircle2 className="h-4 w-4 text-foreground" />
                )}
              </label>
            );
          })}
        </fieldset>

        <p className="rounded-md border border-dashed bg-secondary/30 p-3 text-xs text-muted-foreground">
          <Sparkles className="mr-1 inline h-3 w-3" />
          You&apos;ll be redirected to Stripe-hosted checkout. VAT applied at
          checkout based on your billing address.
        </p>

        <DialogFooter>
          <form action={buyPrepaidPackAction}>
            <input type="hidden" name="size" value={String(selected)} />
            <Button type="submit">
              Continue to Stripe checkout →
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
