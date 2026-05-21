"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  encryptApiKey,
  hasFeature,
  isByokConfigured,
  tierConfig,
  type Intensity,
} from "@vk/billing";
import { getDb, isDbEnabled, schema } from "@vk/db";
import { getSessionUser } from "./session";
import { resolveWorkspaceFromSlug } from "./workspace-context";

type ActionResult = { ok: true } | { ok: false; error: string };

type WorkspaceCtx =
  | { ok: true; workspaceId: string; slug: string }
  | { ok: false; error: string };

async function loadWorkspace(slug: string): Promise<WorkspaceCtx> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Sign in first." };
  if (!isDbEnabled()) return { ok: false, error: "Database not enabled." };
  const ws = await resolveWorkspaceFromSlug(slug, user.id);
  return { ok: true, workspaceId: ws.id, slug: ws.slug };
}

export async function updateByokSettings(
  workspaceSlug: string,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await loadWorkspace(workspaceSlug);
  if (!ctx.ok) return { ok: false, error: ctx.error };

  const enabled = formData.get("enabled") === "on";
  const provider = String(formData.get("provider") ?? "anthropic");
  const apiKey = String(formData.get("apiKey") ?? "").trim();

  const db = getDb();
  const subRow = await db
    .select({ tier: schema.subscription.tier })
    .from(schema.subscription)
    .where(eq(schema.subscription.workspaceId, ctx.workspaceId))
    .limit(1);
  const tier = subRow[0]?.tier ?? "free";
  if (!hasFeature(tierConfig(tier), "byok")) {
    return {
      ok: false,
      error: "BYOK is available on the Pro tier and above.",
    };
  }

  if (enabled) {
    if (!apiKey) {
      return { ok: false, error: "Provide a provider API key." };
    }
    if (provider !== "anthropic" && provider !== "openai") {
      return { ok: false, error: "Unsupported provider." };
    }
    if (!isByokConfigured()) {
      return {
        ok: false,
        error:
          "Server is missing BYOK_ENCRYPTION_KEY — contact support before enabling BYOK.",
      };
    }
    const encrypted = encryptApiKey(apiKey);
    await db
      .update(schema.subscription)
      .set({
        byokEnabled: true,
        byokProvider: provider,
        byokKeyCiphertext: encrypted.ciphertext,
        byokKeyIv: encrypted.iv,
        byokKeyAuthTag: encrypted.authTag,
        updatedAt: new Date(),
      })
      .where(eq(schema.subscription.workspaceId, ctx.workspaceId));
  } else {
    await db
      .update(schema.subscription)
      .set({
        byokEnabled: false,
        byokProvider: null,
        byokKeyCiphertext: null,
        byokKeyIv: null,
        byokKeyAuthTag: null,
        updatedAt: new Date(),
      })
      .where(eq(schema.subscription.workspaceId, ctx.workspaceId));
  }

  revalidatePath(`/${ctx.slug}/settings/ai`);
  return { ok: true };
}

export async function toggleAutoOverage(
  workspaceSlug: string,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await loadWorkspace(workspaceSlug);
  if (!ctx.ok) return { ok: false, error: ctx.error };

  const enabled = formData.get("enabled") === "on";
  const db = getDb();
  await db
    .update(schema.subscription)
    .set({ autoOverageEnabled: enabled, updatedAt: new Date() })
    .where(eq(schema.subscription.workspaceId, ctx.workspaceId));
  revalidatePath(`/${ctx.slug}/settings/ai`);
  return { ok: true };
}

export async function setSpendCap(
  workspaceSlug: string,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await loadWorkspace(workspaceSlug);
  if (!ctx.ok) return { ok: false, error: ctx.error };

  const eurStr = String(formData.get("spendCapEur") ?? "");
  const num = eurStr === "" ? null : Number(eurStr);
  const microcents =
    num === null || Number.isNaN(num) || num <= 0
      ? null
      : Math.round(num * 100 * 100 * 100);
  // EUR → microcents: 1 EUR = 100 cents = 10_000 microcents... wait.
  // Convention used in DB: 1 USD-cent = 1000 microcents (Sub-Plan-A).
  // So 1 EUR = 100 cents = 100_000 microcents. Redo the math.

  const db = getDb();
  const microcentsCorrected =
    num === null || Number.isNaN(num) || num <= 0
      ? null
      : Math.round(num * 100_000);
  await db
    .update(schema.subscription)
    .set({ spendCapMicrocents: microcentsCorrected, updatedAt: new Date() })
    .where(eq(schema.subscription.workspaceId, ctx.workspaceId));
  void microcents;
  revalidatePath(`/${ctx.slug}/settings/ai`);
  return { ok: true };
}

export async function setDefaultIntensity(
  workspaceSlug: string,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await loadWorkspace(workspaceSlug);
  if (!ctx.ok) return { ok: false, error: ctx.error };

  const raw = String(formData.get("intensity") ?? "");
  const intensity: Intensity | null =
    raw === "quick" || raw === "deep" ? (raw as Intensity) : null;

  const db = getDb();
  await db
    .update(schema.subscription)
    .set({ defaultIntensity: intensity, updatedAt: new Date() })
    .where(eq(schema.subscription.workspaceId, ctx.workspaceId));
  revalidatePath(`/${ctx.slug}/settings/ai`);
  return { ok: true };
}
