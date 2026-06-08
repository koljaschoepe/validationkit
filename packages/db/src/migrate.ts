import path from "node:path";
import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { getDb, closeDb, isDbEnabled } from "./client.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.resolve(here, "../drizzle");

async function main() {
  if (!isDbEnabled()) {
    process.stderr.write(
      "DATABASE_URL not set. Either `pnpm stack:up` or define DATABASE_URL.\n",
    );
    process.exit(1);
  }
  // K-DB1 (Launch-Verify): NEVER migrate from a Vercel preview build. Preview
  // deploys may point at (or share) the production DATABASE_URL, and a build-time
  // migration there races other builds and can't be rolled back with the deploy.
  // Production deploys + local runs (VERCEL_ENV unset) still migrate. The full
  // fix — a dedicated CI release step with its own prod DATABASE_URL — needs a
  // GitHub secret and is tracked in Bundle C (production-infra-bootstrap.md).
  if (process.env.VERCEL_ENV === "preview") {
    process.stdout.write("VERCEL_ENV=preview — skipping migration.\n");
    return;
  }
  process.stdout.write(`Migrating with folder ${migrationsFolder}\n`);
  await migrate(getDb(), { migrationsFolder });
  await closeDb();
  process.stdout.write("Migrations applied.\n");
}

await main();
