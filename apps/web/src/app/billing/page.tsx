import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Sub-Plan-A interim stub. The full workspace-level billing dashboard
 * (current plan + credit meter + pre-paid packs + AI settings) lives in
 * Sub-Plan-C (saas-pricing-sub-c-ui-compliance). Until that ships, this
 * page links users to /[workspace]/settings/billing for in-app management
 * and surfaces the new pricing on /pricing.
 */

export const metadata = {
  title: "Billing — ValidationKit",
};

export default function BillingPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <SiteNav />
      <Card>
        <CardHeader>
          <CardTitle>Billing dashboard moving to your workspace</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            We&apos;re rebuilding the billing experience per Sub-Plan-C of the
            SaaS-Pricing-Redesign. The new dashboard lives inside each
            workspace at <code>/[workspace]/settings/billing</code> with a
            credit meter, pre-paid pack purchases, BYOK toggle, and Stripe
            self-service portal.
          </p>
          <p className="text-sm text-muted-foreground">
            In the meantime, you can still browse plan details on the public
            pricing page. Existing checkouts and Stripe-portal links continue
            to function via the backend.
          </p>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/pricing">See pricing</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Back to dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
