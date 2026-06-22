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

/**
 * Sub-Plan-C V2 — sent on `invoice.payment_failed` webhook. The Stripe
 * customer portal handles the actual payment-method update; this email is
 * the friendly nudge that says "please go fix it before access lapses."
 */
export interface SubscriptionPastDueProps {
  workspaceName: string;
  tierLabel: string;
  amountDueEur: string;
  attemptCount: number;
  billingUrl: string;
}

export function SubscriptionPastDue({
  workspaceName,
  tierLabel,
  amountDueEur,
  attemptCount,
  billingUrl,
}: SubscriptionPastDueProps) {
  return (
    <Html>
      <Head />
      <Preview>{`Zahlung für ${workspaceName} fehlgeschlagen — Aktion erforderlich`}</Preview>
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
              color: STYLES.danger,
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              margin: "0 0 12px",
            }}
          >
            Zahlung für {workspaceName} fehlgeschlagen
          </Text>

          <Text
            style={{
              color: STYLES.muted,
              fontSize: 14,
              lineHeight: 1.6,
              margin: "0 0 16px",
            }}
          >
            Wir konnten deine Karte für das{" "}
            <strong style={{ color: STYLES.text }}>{tierLabel}</strong>-Abo
            nicht belasten
            {attemptCount > 1 ? (
              <>
                {" "}(Versuch{" "}
                <strong style={{ color: STYLES.text }}>{attemptCount}</strong>)
              </>
            ) : null}
            . Offener Betrag:{" "}
            <strong style={{ color: STYLES.text }}>{amountDueEur}</strong>.
          </Text>

          <Text
            style={{
              color: STYLES.muted,
              fontSize: 14,
              lineHeight: 1.6,
              margin: "0 0 24px",
            }}
          >
            Stripe versucht es in den nächsten Tagen erneut. Um eine
            Unterbrechung zu vermeiden, aktualisiere jetzt deine
            Zahlungsmethode im Kundenportal — die Änderung gilt automatisch für
            den nächsten Versuch.
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
              Zahlungsmethode aktualisieren
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
            Deine Audit-Historie und dein Credit-Stand bleiben erhalten,
            solange die Rechnung überfällig ist. Wir stufen dich erst herab,
            wenn Stripe die Zahlung endgültig nicht einziehen kann — in der
            Regel 21 Tage nach dem ersten Versuch.
          </Text>

          <EmailFooter />
        </Container>
      </Body>
    </Html>
  );
}
