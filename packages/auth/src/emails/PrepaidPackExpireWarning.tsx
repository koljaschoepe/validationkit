import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { STYLES, FONT_SANS, FONT_MONO } from "./styles.js";
import { EmailFooter } from "./EmailFooter.js";
import { formatDateDe } from "./format.js";

/**
 * Sub-Plan-C V2 — pre-paid credit pack expiry reminder.
 *
 * Sent three times by the prepaid-credit-expirer Inngest cron: 30, 7, and 1
 * day(s) before a grant expires. The remaining-credits number changes
 * between sends as the workspace burns through the pack, so callers pass
 * the live value.
 */
export interface PrepaidPackExpireWarningProps {
  workspaceName: string;
  creditsRemaining: number;
  expiresAt: Date;
  daysUntilExpiry: 30 | 7 | 1;
  billingUrl: string;
}

export function PrepaidPackExpireWarning({
  workspaceName,
  creditsRemaining,
  expiresAt,
  daysUntilExpiry,
  billingUrl,
}: PrepaidPackExpireWarningProps) {
  const dateStr = formatDateDe(expiresAt);
  const urgency =
    daysUntilExpiry === 1
      ? "morgen"
      : daysUntilExpiry === 7
        ? "in 7 Tagen"
        : "in 30 Tagen";
  const previewText = `${creditsRemaining} Credits verfallen ${urgency}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body
        style={{
          backgroundColor: STYLES.bg,
          fontFamily: FONT_SANS,
          margin: 0,
          padding: "32px 0",
        }}
      >
        <Container
          style={{
            backgroundColor: STYLES.surface,
            border: `1px solid ${STYLES.border}`,
            borderRadius: 6,
            maxWidth: 480,
            padding: "32px 28px",
          }}
        >
          <Text
            style={{
              color: STYLES.text,
              fontSize: 14,
              fontFamily: FONT_MONO,
              letterSpacing: "0.04em",
              margin: "0 0 24px",
            }}
          >
            ▸ ValidationKit
          </Text>

          <Text
            style={{
              color: STYLES.text,
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              margin: "0 0 12px",
            }}
          >
            {creditsRemaining} Prepaid-Credits verfallen {urgency}
          </Text>

          <Text
            style={{
              color: STYLES.muted,
              fontSize: 14,
              lineHeight: 1.6,
              margin: "0 0 24px",
            }}
          >
            Der Workspace{" "}
            <strong style={{ color: STYLES.text }}>{workspaceName}</strong> hat
            noch{" "}
            <strong style={{ color: STYLES.text }}>{creditsRemaining}</strong>{" "}
            Credits in einem Prepaid-Paket, das am{" "}
            <strong style={{ color: STYLES.text }}>{dateStr}</strong> verfällt.
            Nutze sie vorher auf, sonst werden sie automatisch entfernt.
          </Text>

          <Section style={{ margin: "0 0 24px" }}>
            <Button
              href={billingUrl}
              style={{
                backgroundColor: STYLES.text,
                color: STYLES.bg,
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 500,
                padding: "10px 20px",
                textDecoration: "none",
              }}
            >
              Zur Abrechnung
            </Button>
          </Section>

          <Hr style={{ borderColor: STYLES.border, margin: "24px 0" }} />

          <Text
            style={{
              color: STYLES.muted,
              fontSize: 12,
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Credits aus deinem monatlichen Abo-Zyklus sind von diesem Hinweis
            nicht betroffen. Prepaid-Pakete werden immer vor den Abo-Credits
            verbraucht — das hier ist also nur relevant, wenn du Pakete für
            später angelegt hast. Antworte einfach auf diese E-Mail, wenn du
            Fragen hast.
          </Text>

          <EmailFooter />
        </Container>
      </Body>
    </Html>
  );
}
