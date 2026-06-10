import * as React from "react";
import { Hr, Link, Section, Text } from "@react-email/components";

/**
 * EmailFooter — Bundle G (K-LEG3). Provider identification on every
 * transactional email (§ 5 DDG / commercial-email duty). The full address +
 * VAT-ID live in the linked Impressum (one place to maintain — see the
 * Impressum OPERATOR object), which is the accepted practice for transactional
 * mail rather than repeating a placeholder address in every message.
 */

const BORDER = "#222226";
const MUTED = "#888892";

const BASE =
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.AUTH_BASE_URL ??
  "https://validationkit.app";

const linkStyle = { color: MUTED, textDecoration: "underline" } as const;

export function EmailFooter() {
  return (
    <Section style={{ marginTop: 8 }}>
      <Hr style={{ borderColor: BORDER, margin: "24px 0 12px" }} />
      <Text style={{ color: MUTED, fontSize: 11, lineHeight: 1.6, margin: 0 }}>
        ValidationKit · Kolja Schöpe (Einzelunternehmen, Deutschland)
      </Text>
      <Text
        style={{ color: MUTED, fontSize: 11, lineHeight: 1.6, margin: "4px 0 0" }}
      >
        <Link href={`${BASE}/legal/impressum`} style={linkStyle}>
          Impressum
        </Link>
        {" · "}
        <Link href={`${BASE}/legal/datenschutz`} style={linkStyle}>
          Datenschutz
        </Link>
      </Text>
    </Section>
  );
}
