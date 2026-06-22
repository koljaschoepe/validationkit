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
 * Sub-Plan-C V2 — sent on `customer.subscription.updated` webhook when the
 * tier or cycle changes. Confirms the new plan + the credit quota change so
 * the customer has a paper trail. Cancellations get this email too with
 * `kind="canceled"`.
 */
export interface PlanChangeConfirmationProps {
  workspaceName: string;
  previousTierLabel: string;
  newTierLabel: string;
  newCreditsPerCycle: number;
  /**
   * 'upgrade' / 'downgrade' / 'canceled' — drives the headline + tone.
   */
  kind: "upgrade" | "downgrade" | "canceled";
  effectiveAt: Date;
  billingUrl: string;
}

export function PlanChangeConfirmation({
  workspaceName,
  previousTierLabel,
  newTierLabel,
  newCreditsPerCycle,
  kind,
  effectiveAt,
  billingUrl,
}: PlanChangeConfirmationProps) {
  const dateStr = formatDateDe(effectiveAt);
  const headline =
    kind === "upgrade"
      ? `Willkommen bei ${newTierLabel}`
      : kind === "downgrade"
        ? `Plan geändert auf ${newTierLabel}`
        : `Abonnement gekündigt`;
  const preview =
    kind === "canceled"
      ? `Abonnement gekündigt, wirksam zum ${dateStr}`
      : `Planwechsel: ${previousTierLabel} → ${newTierLabel}`;
  const headlineColor =
    kind === "canceled" ? STYLES.warning : STYLES.success;

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
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
              color: headlineColor,
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              margin: "0 0 12px",
            }}
          >
            {headline}
          </Text>

          <Text
            style={{
              color: STYLES.muted,
              fontSize: 14,
              lineHeight: 1.6,
              margin: "0 0 16px",
            }}
          >
            Der Workspace{" "}
            <strong style={{ color: STYLES.text }}>{workspaceName}</strong>{" "}
            {kind === "canceled" ? (
              <>
                wechselt am{" "}
                <strong style={{ color: STYLES.text }}>{dateStr}</strong> in den
                kostenlosen Tarif, sobald der aktuelle Abrechnungszeitraum
                endet. Deine Audit-Historie bleibt erhalten — nur das
                Credit-Kontingent und die kostenpflichtigen Funktionen werden
                deaktiviert.
              </>
            ) : (
              <>
                wurde von{" "}
                <strong style={{ color: STYLES.text }}>
                  {previousTierLabel}
                </strong>{" "}
                auf{" "}
                <strong style={{ color: STYLES.text }}>{newTierLabel}</strong>{" "}
                geändert. Das neue Kontingent von{" "}
                <strong style={{ color: STYLES.text }}>
                  {newCreditsPerCycle} Credits / Zyklus
                </strong>{" "}
                ist ab sofort aktiv.
              </>
            )}
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
            {kind === "canceled"
              ? "Anders überlegt? Reaktiviere das Abonnement jederzeit im Stripe-Portal, bevor die Kündigung wirksam wird."
              : "Deine nächste Rechnung berücksichtigt den neuen Plan sofort. Zuvor gekaufte Prepaid-Credit-Pakete bleiben bis zu ihrem ursprünglichen Ablaufdatum gültig."}
          </Text>

          <EmailFooter />
        </Container>
      </Body>
    </Html>
  );
}
