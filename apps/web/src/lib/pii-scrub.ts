import "server-only";

import { eq } from "drizzle-orm";
import { getDb, schema } from "@vk/db";

/**
 * GDPR Art. 17 PII-scrub (Bundle A Phase 4). NULLs the free-text PII
 * (ip_address + user_agent) on the append-only compliance rows that are
 * RETAINED after a user is deleted — install_decision, apply_action,
 * dpa_acceptance. Their user FK is ON DELETE SET NULL (the rows survive for
 * Art. 28 record-keeping), so this MUST run BEFORE the user row is removed:
 * once the FK is nulled we can no longer tell which rows were theirs.
 *
 * Session/account rows are ON DELETE CASCADE, so their PII goes with the user
 * automatically and needs no scrub here.
 */
export async function scrubUserPii(userId: string): Promise<void> {
  const db = getDb();
  await Promise.all([
    db
      .update(schema.installDecision)
      .set({ ipAddress: null, userAgent: null })
      .where(eq(schema.installDecision.deciderId, userId)),
    db
      .update(schema.applyAction)
      .set({ ipAddress: null, userAgent: null })
      .where(eq(schema.applyAction.decidedBy, userId)),
    db
      .update(schema.dpaAcceptance)
      .set({ ipAddress: null, userAgent: null })
      .where(eq(schema.dpaAcceptance.userId, userId)),
  ]);
}
