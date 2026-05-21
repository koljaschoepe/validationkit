// Vitest setup for the integration pool — runs in a separate fork per
// test file. Loads .env.test and lets the test hit a real Postgres.
//
// Migrations are expected to have run beforehand:
//   - CI: services.postgres + a workflow step `pnpm db:migrate`
//   - local: `pnpm stack:up` plus
//     `docker exec vk-postgres psql -U vk -d postgres -c 'CREATE DATABASE validationkit_test;'`
//     plus `DATABASE_URL=postgres://vk:vk_local@127.0.0.1:5432/validationkit_test pnpm db:migrate`
//
// MSW is NOT mounted here — integration tests can choose to mount it
// per-file with `import { server } from '../test/msw/server'` if they
// stub upstream HTTP calls.

import { config as loadEnv } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(here, "../../../../.env.test"), quiet: true });
