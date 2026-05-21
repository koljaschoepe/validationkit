/**
 * Pre-migration safety check for the Sub-Plan-A schema rewrite
 * (saas-pricing-sub-a-db-metering).
 *
 * The migration is destructive on `subscription`: it pivots from
 * `userId` to `workspaceId` and drops the legacy quota fields. That is
 * only safe while no live Stripe subscription rows exist.
 *
 * This script asserts the safe-to-wipe invariant. Run it before
 * `pnpm db:migrate` on any environment that may have customer data.
 *
 * Usage:
 *   pnpm tsx scripts/check-billing-migration-safety.ts
 *   pnpm tsx scripts/check-billing-migration-safety.ts --force  (override; emits warning)
 *
 * Exit code 0 = safe to migrate. Non-zero = abort.
 */
import { closeDb, getDb, isDbEnabled } from "@vk/db";
import { sql } from "drizzle-orm";

const force = process.argv.includes("--force");

async function main() {
  if (!isDbEnabled()) {
    process.stderr.write(
      "DATABASE_URL not set. Either `pnpm stack:up` or define DATABASE_URL.\n",
    );
    process.exit(2);
  }

  const db = getDb();

  const liveSubs = await db.execute<{ count: number }>(
    sql`SELECT count(*)::int AS count FROM subscription WHERE stripe_subscription_id IS NOT NULL`,
  );
  const subRows = await db.execute<{ count: number }>(
    sql`SELECT count(*)::int AS count FROM subscription`,
  );
  const workspaces = await db.execute<{ count: number }>(
    sql`SELECT count(*)::int AS count FROM workspace`,
  );
  const scans = await db.execute<{ count: number }>(
    sql`SELECT count(*)::int AS count FROM scan`,
  );

  const liveCount = liveSubs[0]?.count ?? 0;
  const totalSubCount = subRows[0]?.count ?? 0;
  const wsCount = workspaces[0]?.count ?? 0;
  const scanCount = scans[0]?.count ?? 0;

  process.stdout.write(`\nPre-migration snapshot:\n`);
  process.stdout.write(`  subscription rows:           ${totalSubCount}\n`);
  process.stdout.write(`  subscription with stripe_id: ${liveCount}\n`);
  process.stdout.write(`  workspace rows:              ${wsCount}\n`);
  process.stdout.write(`  scan rows:                   ${scanCount}\n\n`);

  if (liveCount > 0 && !force) {
    process.stderr.write(
      `BLOCK: ${liveCount} subscription row(s) carry a stripe_subscription_id.\n` +
        `Sub-Plan-A wipes that table. Re-run with --force only if you have\n` +
        `explicitly migrated or canceled those Stripe subscriptions out-of-band.\n`,
    );
    await closeDb();
    process.exit(1);
  }

  if (liveCount > 0) {
    process.stderr.write(
      `WARN: --force overrides ${liveCount} live-stripe row(s). Continue at own risk.\n`,
    );
  }

  process.stdout.write(`OK: safe to run \`pnpm db:migrate\` for Sub-Plan-A.\n`);
  await closeDb();
}

await main();
