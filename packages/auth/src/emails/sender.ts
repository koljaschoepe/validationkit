// Sub-Plan-C V2 — reusable transactional-email sender.
//
// Mirrors the nodemailer setup used by Better-Auth for magic-link delivery
// (packages/auth/src/server.ts) so prod uses Resend's SMTP relay and dev
// uses Mailpit on 127.0.0.1:1025. Same convention — no Resend-Node-SDK
// (per CLAUDE.md "Email" line).
import * as React from "react";
import nodemailer from "nodemailer";
import { render } from "@react-email/render";

let cachedTransport: nodemailer.Transporter | null = null;

function getTransport(): nodemailer.Transporter {
  if (cachedTransport) return cachedTransport;
  const isProd =
    process.env.NODE_ENV === "production" || Boolean(process.env.RESEND_API_KEY);
  cachedTransport = isProd
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
  return cachedTransport;
}

export interface SendTransactionalEmailArgs {
  to: string;
  subject: string;
  /** Any React-Email component element. */
  react: React.ReactElement;
  /** Defaults to `notifications@validationkit.app`; override per-template if needed. */
  from?: string;
  /** Optional plain-text Reply-To. */
  replyTo?: string;
}

export interface SendTransactionalEmailResult {
  ok: boolean;
  /** Mailpit / Resend message-id when available. */
  messageId?: string;
  error?: string;
}

export async function sendTransactionalEmail(
  args: SendTransactionalEmailArgs,
): Promise<SendTransactionalEmailResult> {
  if (!process.env.SMTP_HOST && !process.env.RESEND_API_KEY) {
    // No mail transport configured — common in tests + ephemeral previews.
    // Log + soft-fail so the caller (cron / webhook) keeps running.
    process.stdout.write(
      `[email] skipped (no transport): ${args.subject} → ${args.to}\n`,
    );
    return { ok: false, error: "No mail transport configured." };
  }

  const [html, text] = await Promise.all([
    render(args.react),
    render(args.react, { plainText: true }),
  ]);

  try {
    const transport = getTransport();
    const info = await transport.sendMail({
      from: args.from ?? "notifications@validationkit.app",
      to: args.to,
      subject: args.subject,
      html,
      text,
      replyTo: args.replyTo,
    });
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(
      `[email] send failed: ${args.subject} → ${args.to}: ${message}\n`,
    );
    return { ok: false, error: message };
  }
}
