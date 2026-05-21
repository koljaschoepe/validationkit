import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";
import nodemailer from "nodemailer";
import { getDb, isDbEnabled, schema } from "@vk/db";
import { renderMagicLinkEmail } from "./emails/render.js";

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
  // Three transport modes:
  //   1. RESEND_API_KEY set    → smtp.resend.com:465 TLS with API key as password
  //   2. SMTP_HOST set         → generic SMTP relay (Mailpit local-stack default)
  //   3. neither               → throws on first send
  const useResend = Boolean(process.env.RESEND_API_KEY);
  const transport = useResend
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST ?? "smtp.resend.com",
        port: Number(process.env.SMTP_PORT ?? 465),
        secure: true,
        auth: {
          user: "resend",
          pass: process.env.RESEND_API_KEY as string,
        },
      })
    : nodemailer.createTransport({
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
    // Session-cookie cache: skip the DB round-trip on every request. Server
    // re-validates against `verification` table after maxAge expires. 300 s
    // matches Linear / Vercel patterns — short enough that logout propagates
    // quickly, long enough to drop ~95 % of session lookups on hot paths.
    session: {
      cookieCache: { enabled: true, maxAge: 300 },
    },
    plugins: [
      magicLink({
        // 10-minute window — comfortable for users who context-switch to
        // their email tab, tight enough to limit replay risk. Matches the
        // expiry notice we put in the email body.
        expiresIn: 600,
        // Store SHA-256(token) instead of the raw token in `verification`,
        // so a DB leak doesn't hand out sign-in capability. The plaintext
        // token is only ever in the email + the click-target URL.
        storeToken: "hashed",
        sendMagicLink: async ({ email, url }, request) => {
          // Pull request metadata for in-email transparency. Better-Auth passes
          // the underlying Request as the 2nd arg of sendMagicLink callbacks.
          const headers = request?.headers;
          const requestIp =
            headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ??
            headers?.get("x-real-ip") ??
            undefined;
          const userAgent = headers?.get("user-agent") ?? undefined;

          const { html, text } = await renderMagicLinkEmail({
            url,
            expiresInMinutes: 10,
            requestIp,
            userAgent,
          });

          await transport.sendMail({
            from:
              process.env.SMTP_FROM ??
              (useResend ? "onboarding@resend.dev" : "auth@validationkit.local"),
            to: email,
            subject: "Sign in to ValidationKit",
            text,
            html,
          });
        },
      }),
    ],
  });
}
