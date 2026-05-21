import { render } from "@react-email/render";
import { MagicLinkEmail, type MagicLinkEmailProps } from "./MagicLinkEmail.js";
import * as React from "react";

/**
 * Server-side renderer for the MagicLinkEmail. Returns both an HTML and a
 * plain-text variant so the SMTP `sendMail` can attach both — most clients
 * use HTML, but text/plain is required for spam-filter friendliness and is
 * the only thing accessible to screen-reader-only email clients.
 */
export async function renderMagicLinkEmail(
  props: MagicLinkEmailProps,
): Promise<{ html: string; text: string }> {
  const el = React.createElement(MagicLinkEmail, props);
  const [html, text] = await Promise.all([
    render(el),
    render(el, { plainText: true }),
  ]);
  return { html, text };
}
