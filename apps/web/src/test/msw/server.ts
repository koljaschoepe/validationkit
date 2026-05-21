// Node-side msw server. Bound to the unit-test lifecycle in setup.ts.
//
// Use `server.use(http.post(url, handler))` inside a test to override the
// default handler from handlers.ts for that test only — afterEach resets
// to the defaults.

import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);
