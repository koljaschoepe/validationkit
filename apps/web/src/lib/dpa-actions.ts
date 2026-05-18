"use server";

import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getDb, isDbEnabled, schema } from "@vk/db";
import { getSessionUser } from "./session";
import { CURRENT_DPA_VERSION, type DpaAcceptanceState } from "./dpa-constants";

/**
 * Sprint 1.0 — DPA acceptance audit-log. Per ADR-0020 + A1 ref-impl (Vercel
 * pattern). Idempotent via UNIQUE(user_id, dpa_version) — second call by
 * same user against same version returns ok=true, already=true.
 */

export async function getDpaAcceptanceState(): Promise<DpaAcceptanceState> {
  if (!isDbEnabled()) {
    return { accepted: false, acceptedAt: null, acceptedVersion: null };
  }
  const user = await getSessionUser();
  if (!user) {
    return { accepted: false, acceptedAt: null, acceptedVersion: null };
  }
  const db = getDb();
  const rows = await db
    .select({
      acceptedAt: schema.dpaAcceptance.acceptedAt,
      dpaVersion: schema.dpaAcceptance.dpaVersion,
    })
    .from(schema.dpaAcceptance)
    .where(
      and(
        eq(schema.dpaAcceptance.userId, user.id),
        eq(schema.dpaAcceptance.dpaVersion, CURRENT_DPA_VERSION),
      ),
    )
    .limit(1);
  const row = rows[0];
  if (!row) {
    return { accepted: false, acceptedAt: null, acceptedVersion: null };
  }
  return {
    accepted: true,
    acceptedAt: row.acceptedAt,
    acceptedVersion: row.dpaVersion,
  };
}

export type AcceptDpaResult =
  | { ok: true; alreadyAccepted: boolean }
  | { ok: false; error: string };

export async function acceptDpaAction(): Promise<AcceptDpaResult> {
  if (!isDbEnabled()) {
    return { ok: false, error: "Database is not enabled on this deployment." };
  }
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, error: "Sign in before accepting the DPA." };
  }

  const db = getDb();
  const hdrs = await headers();
  const ipAddress =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    hdrs.get("x-real-ip") ??
    null;
  const userAgent = hdrs.get("user-agent") ?? null;

  const inserted = await db
    .insert(schema.dpaAcceptance)
    .values({
      userId: user.id,
      dpaVersion: CURRENT_DPA_VERSION,
      ipAddress,
      userAgent,
    })
    .onConflictDoNothing({
      target: [
        schema.dpaAcceptance.userId,
        schema.dpaAcceptance.dpaVersion,
      ],
    })
    .returning({ id: schema.dpaAcceptance.id });

  revalidatePath("/trust/dpa");
  revalidatePath("/trust");

  return { ok: true, alreadyAccepted: inserted.length === 0 };
}
