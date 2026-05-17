import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

let _sql: ReturnType<typeof postgres> | null = null;
let _db: PostgresJsDatabase<typeof schema> | null = null;

export type Db = PostgresJsDatabase<typeof schema>;

/**
 * Returns `true` only when DATABASE_URL is set. Callers should branch on this
 * before reaching for `getDb()` so the app can degrade to anonymous/stateless
 * mode when the local stack isn't running (PRD §5: Hardcore-Local-Only).
 */
export function isDbEnabled(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getDb(): Db {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Run `pnpm stack:up` and copy `.env.example` → `.env.local`, " +
        "or call `isDbEnabled()` first and skip DB-backed code paths.",
    );
  }
  _sql = postgres(url, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 5,
    prepare: false,
  });
  _db = drizzle(_sql, { schema, casing: "snake_case" });
  return _db;
}

export async function closeDb(): Promise<void> {
  if (_sql) {
    await _sql.end();
    _sql = null;
    _db = null;
  }
}
