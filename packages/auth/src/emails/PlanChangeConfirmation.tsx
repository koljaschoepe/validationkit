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
  const dateStr = effectiveAt.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const headline =
    kind === "upgrade"
      ? `Welcome to ${newTierLabel}`
      : kind === "downgrade"
        ? `Plan updated to ${newTierLabel}`
        : `Subscription canceled`;
  const preview =
    kind === "canceled"
      ? `Subscription canceled, effective ${dateStr}`
      : `Plan change: ${previousTierLabel} → ${newTierLabel}`;
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
            Workspace{" "}
            <strong style={{ color: STYLES.text }}>{workspaceName}</strong>{" "}
            {kind === "canceled" ? (
              <>
                will move to the free tier on{" "}
                <strong style={{ color: STYLES.text }}>{dateStr}</strong> when
                the current billing period ends. Your audit history stays —
                only the credit allotment + paid features deactivate.
              </>
            ) : (
              <>
                changed from{" "}
                <strong style={{ color: STYLES.text }}>
                  {previousTierLabel}
                </strong>{" "}
                to{" "}
                <strong style={{ color: STYLES.text }}>{newTierLabel}</strong>
                . The new quota of{" "}
                <strong style={{ color: STYLES.text }}>
                  {newCreditsPerCycle} credits / cycle
                </strong>{" "}
                is active immediately.
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
              Open billing
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
              ? "Change your mind? Reactivate the subscription in the Stripe portal anytime before the cancellation takes effect."
              : "Your next invoice reflects the new plan immediately. Pre-paid credit packs you bought earlier remain valid until their original expiry."}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
