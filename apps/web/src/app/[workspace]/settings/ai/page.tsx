import { redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { BrainIcon, KeyIcon, LockIcon } from "lucide-react";
import { isAuthEnabled } from "@vk/auth";
import { ensureSubscription, hasFeature, isPaidTier } from "@vk/billing";
import { getDb, isDbEnabled, schema } from "@vk/db";
import { getSessionUser } from "@/lib/session";
import { resolveWorkspaceFromSlug } from "@/lib/workspace-context";
import {
  updateByokSettings,
  toggleAutoOverage,
  setSpendCap,
  setDefaultIntensity,
} from "@/lib/workspace-ai-actions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ workspace: string }>;
}

async function bindAction<
  T extends (slug: string, fd: FormData) => Promise<unknown>,
>(fn: T, slug: string): Promise<(fd: FormData) => Promise<void>> {
  return async (fd: FormData): Promise<void> => {
    "use server";
    await fn(slug, fd);
  };
}

export default async function AiSettingsPage({ params }: PageProps) {
  if (!isAuthEnabled()) redirect("/login");
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!isDbEnabled()) {
    return <p>Database not enabled.</p>;
  }

  const { workspace: slug } = await params;
  const ws = await resolveWorkspaceFromSlug(slug, user.id);
  const snap = await ensureSubscription(ws.id);

  const db = getDb();
  const subRow = (
    await db
      .select({
        byokEnabled: schema.subscription.byokEnabled,
        byokProvider: schema.subscription.byokProvider,
        autoOverageEnabled: schema.subscription.autoOverageEnabled,
        spendCapMicrocents: schema.subscription.spendCapMicrocents,
        defaultIntensity: schema.subscription.defaultIntensity,
      })
      .from(schema.subscription)
      .where(eq(schema.subscription.workspaceId, ws.id))
      .limit(1)
  )[0];

  const byokAllowed = hasFeature(snap.config, "byok");
  const spendCapEur =
    subRow?.spendCapMicrocents != null
      ? Math.round(subRow.spendCapMicrocents / 100_000)
      : null;
  const defaultIntensity = subRow?.defaultIntensity ?? "quick";

  // Bound server-actions — Next.js Server-Actions can't take extra args
  // from client forms, so we close over the workspace slug here.
  const byokAction = await bindAction(updateByokSettings, slug);
  const overageAction = await bindAction(toggleAutoOverage, slug);
  const spendCapAction = await bindAction(setSpendCap, slug);
  const intensityAction = await bindAction(setDefaultIntensity, slug);

  return (
    <>
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">AI settings</h1>
        <p className="text-sm text-muted-foreground">
          Bring-your-own provider keys, default audit intensity, and budget
          controls for this workspace.
        </p>
      </header>

      {/* BYOK */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <KeyIcon className="h-4 w-4" />
            <CardTitle>Bring your own AI key (BYOK)</CardTitle>
            {!byokAllowed && (
              <Badge variant="secondary" className="ml-auto gap-1">
                <LockIcon className="h-3 w-3" /> Pro+
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          <p className="text-muted-foreground">
            With BYOK enabled, every audit runs against your provider account.
            We still bill the subscription, but AI compute goes straight to
            you with no markup. Your key is encrypted at rest (AES-256-GCM) and
            never returned to the browser.
          </p>
          {!byokAllowed ? (
            <p className="rounded-md border border-dashed bg-secondary/30 p-3 text-xs">
              Available on Pro and Agency.{" "}
              <Link
                href={`/${slug}/settings/billing`}
                className="underline-offset-4 hover:underline"
              >
                Upgrade your plan
              </Link>{" "}
              to enable.
            </p>
          ) : (
            <form
              action={byokAction}
              className="flex flex-col gap-3"
              aria-label="BYOK settings"
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="enabled"
                  id="byok-enabled"
                  defaultChecked={subRow?.byokEnabled ?? false}
                  className="h-4 w-4"
                />
                <Label htmlFor="byok-enabled">Enable BYOK</Label>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="byok-provider">Provider</Label>
                  <select
                    id="byok-provider"
                    name="provider"
                    defaultValue={subRow?.byokProvider ?? "anthropic"}
                    className="rounded-md border bg-background px-2 py-1.5 text-sm"
                  >
                    <option value="anthropic">Anthropic</option>
                    <option value="openai">OpenAI</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="byok-api-key">API key</Label>
                  <Input
                    id="byok-api-key"
                    name="apiKey"
                    type="password"
                    placeholder={
                      subRow?.byokEnabled
                        ? "•••••••• (already saved, paste a new key to rotate)"
                        : "sk-…"
                    }
                    autoComplete="off"
                  />
                </div>
              </div>
              <div>
                <Button type="submit" size="sm">
                  Save BYOK
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Auto-Overage */}
      <Card>
        <CardHeader>
          <CardTitle>Auto-overage</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <p className="text-muted-foreground">
            When enabled, audits keep running after your monthly quota is
            exhausted. Extra credits are billed at €0.30 each on the next
            invoice. It is off by default, which keeps your spend predictable.
          </p>
          <form action={overageAction} className="flex items-center gap-3">
            <input
              type="checkbox"
              name="enabled"
              id="auto-overage"
              defaultChecked={subRow?.autoOverageEnabled ?? false}
              className="h-4 w-4"
              disabled={!isPaidTier(snap.tier)}
            />
            <Label htmlFor="auto-overage">Allow auto-overage</Label>
            <Button type="submit" size="sm" variant="outline" className="ml-auto">
              Save
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Spend cap */}
      <Card>
        <CardHeader>
          <CardTitle>Spend cap</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <p className="text-muted-foreground">
            Hard cap on overage spend per month (in €). Audits block once the
            cap is reached. Leave empty for no cap.
          </p>
          <form action={spendCapAction} className="flex items-center gap-2">
            <span aria-hidden className="text-muted-foreground">€</span>
            <Input
              type="number"
              name="spendCapEur"
              min={0}
              step={5}
              defaultValue={spendCapEur ?? ""}
              placeholder="Unlimited"
              className="w-32"
            />
            <Button type="submit" size="sm" variant="outline">
              Save cap
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Default intensity */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BrainIcon className="h-4 w-4" />
            <CardTitle>Default audit intensity</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <p className="text-muted-foreground">
            Pre-fills the Quick / Deep toggle when starting a new audit. You
            can still pick either option per-audit.
          </p>
          <form action={intensityAction} className="flex flex-col gap-3">
            <fieldset className="flex flex-col gap-2">
              <legend className="sr-only">Default intensity</legend>
              {(["quick", "deep"] as const).map((i) => (
                <label
                  key={i}
                  className="flex items-center gap-2 rounded-md border bg-secondary/20 px-3 py-2"
                >
                  <input
                    type="radio"
                    name="intensity"
                    value={i}
                    defaultChecked={defaultIntensity === i}
                  />
                  <span className="capitalize">{i}</span>
                  <span className="text-xs text-muted-foreground">
                    {i === "quick" ? "1 credit · gpt-5-nano" : "5 credits · Claude Sonnet 4.6"}
                  </span>
                </label>
              ))}
            </fieldset>
            <div>
              <Button type="submit" size="sm" variant="outline">
                Save default
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
