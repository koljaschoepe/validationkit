# Third-Party Notices

ValidationKit is built on open-source software. This file summarizes the
license families of the production dependencies bundled with the application.
It is generated as a grouped summary (not a full per-package dump) via
`pnpm licenses list --prod`. The canonical, machine-readable record remains the
`pnpm-lock.yaml` lockfile and each dependency's own `LICENSE` file under
`node_modules/`.

Last regenerated: 2026-06-18

## License family summary (production dependencies)

| License | Approx. packages | Notes |
|---------|------------------|-------|
| MIT | ~446 | Permissive. Next.js, React, react-dom, Drizzle ORM client, better-auth, nodemailer, react-email + @react-email/*, zod, lucide-react, motion, the Radix UI / shadcn primitives, Tailwind tooling, and most of the JS ecosystem. |
| Apache-2.0 | ~107 | Permissive (incl. patent grant). Stripe Node SDK, @ai-sdk/* (anthropic, openai, provider, gateway), Drizzle Kit / @drizzle-team/brocli, the @opentelemetry/* tracing stack, @grpc/*, @img/sharp-*. |
| ISC | ~28 | Permissive (functionally equivalent to MIT). Common low-level utilities (e.g. semver, glob-family helpers). |
| BSD-3-Clause | ~17 | Permissive with non-endorsement clause. |
| BSD-2-Clause | ~6 | Permissive. |
| MPL-2.0 | 2 | Weak copyleft, file-level. Used as-is without modification of the licensed files. |
| MIT-0 | 2 | Permissive, no attribution required. |
| 0BSD | 1 | Permissive, no attribution required (e.g. tslib). |
| Unlicense | 1 | Public-domain dedication. |
| (MIT OR CC0-1.0) | 1 | Dual-licensed; used under MIT (e.g. type-fest). |
| (Apache-2.0 AND BSD-3-Clause) | 1 | Combined permissive terms (e.g. @bufbuild/protobuf). |
| (AFL-2.1 OR BSD-3-Clause) | 1 | Dual-licensed; used under BSD-3-Clause (e.g. json-schema). |

All bundled production dependencies are distributed under permissive or
weak-copyleft (file-level MPL-2.0) licenses. No strong-copyleft (GPL/AGPL/LGPL)
license is present in the production dependency tree.

## Representative key dependencies

| Package | License | Role |
|---------|---------|------|
| next | MIT | Web framework (App Router) |
| react / react-dom | MIT | UI runtime |
| drizzle-orm | Apache-2.0 | Type-safe SQL / Postgres ORM |
| drizzle-kit | Apache-2.0 | Migrations / schema tooling |
| better-auth | MIT | Authentication (magic-link) |
| stripe | Apache-2.0 (MIT for some sub-packages) | Billing SDK |
| @ai-sdk/anthropic, @ai-sdk/openai | Apache-2.0 | LLM provider SDKs |
| nodemailer | MIT | SMTP email transport (Resend in prod) |
| react-email, @react-email/* | MIT | Transactional email templates |
| zod | MIT | Runtime schema validation |
| lucide-react | ISC | Icon set |
| @opentelemetry/* | Apache-2.0 | Tracing / observability |
| tailwindcss | MIT | CSS framework |

## Reproducing this summary

```bash
pnpm licenses list --prod
```

Per-package license texts are available in each dependency's `LICENSE` file
inside `node_modules/<package>/`. For a full SBOM, run
`pnpm licenses list --prod --json`.
