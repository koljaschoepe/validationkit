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
  process.stdout.write(`Migrating with folder ${migrationsFolder}\n`);
  await migrate(getDb(), { migrationsFolder });
  await closeDb();
  process.stdout.write("Migrations applied.\n");
}

await main();
