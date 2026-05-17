import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";
import nodemailer from "nodemailer";
import { getDb, isDbEnabled, schema } from "@vk/db";

// The `betterAuth()` return type references zod's internal types which are
// non-portable across the project's TS configuration. Use a structural
// any-typed handle internally; consumers get precise typing through better-auth's
// own runtime methods rather than from this re-export.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AuthInstance = any;

let _auth: AuthInstance | null = null;

/**
 * `true` when both DATABASE_URL + AUTH_SECRET are present. Server actions
 * should branch on this so anonymous one-shot audits keep working when the
 * local stack isn't up (PRD §5: Hardcore-Local-Only graceful degradation).
 */
export function isAuthEnabled(): boolean {
  return isDbEnabled() && Boolean(process.env.AUTH_SECRET);
}

export function getAuth(): AuthInstance {
  if (_auth) return _auth;
  if (!isAuthEnabled()) {
    throw new Error(
      "Auth not configured. Set DATABASE_URL and AUTH_SECRET in .env.local, " +
        "or call `isAuthEnabled()` first and skip auth-backed code paths.",
    );
  }
  const created = createAuth();
  _auth = created;
  return created;
}

function createAuth(): AuthInstance {
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "127.0.0.1",
    port: Number(process.env.SMTP_PORT ?? 1025),
    secure: false,
  });

  return betterAuth({
    secret: process.env.AUTH_SECRET as string,
    baseURL: process.env.AUTH_BASE_URL ?? "http://localhost:3000",
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    emailAndPassword: { enabled: false },
    plugins: [
      magicLink({
        sendMagicLink: async ({ email, url }) => {
          await transport.sendMail({
            from: process.env.SMTP_FROM ?? "auth@validationkit.local",
            to: email,
            subject: "Sign in to ValidationKit",
            text:
              `Click to sign in: ${url}\n\n` +
              "Open Mailpit at http://localhost:8025 to read this in the local stack.",
            html: `
              <p>Click to sign in to ValidationKit.</p>
              <p><a href="${url}">${url}</a></p>
              <p style="color:#888;font-size:12px">
                Local dev: open <a href="http://localhost:8025">Mailpit</a> to find this email.
              </p>
            `,
          });
        },
      }),
    ],
  });
}
