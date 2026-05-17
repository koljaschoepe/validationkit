import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://vk:vk_local@127.0.0.1:5432/validationkit",
  },
  casing: "snake_case",
  strict: true,
  verbose: true,
});
