import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { EmailFooter } from "./EmailFooter.js";

/**
 * MemberInviteEmail — Bundle G (K-EM1). Sent when an owner/admin invites someone
 * to a workspace. Before this, inviteAdmin() created the membership row silently
 * and the invitee never learned they'd been added.
 */
export interface MemberInviteEmailProps {
  workspaceName: string;
  inviterName: string;
  /** Link into the workspace (auth gate redirects to sign-in if needed). */
  acceptUrl: string;
  /** True when the invitee already has an account (immediate access). */
  alreadyHadAccount: boolean;
}

const BG = "#0a0a0c";
const SURFACE = "#111114";
const BORDER = "#222226";
const TEXT = "#fafafa";
const MUTED = "#888892";

export function MemberInviteEmail({
  workspaceName,
  inviterName,
  acceptUrl,
  alreadyHadAccount,
}: MemberInviteEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{`${inviterName} hat dich zu ${workspaceName} auf ValidationKit eingeladen`}</Preview>
      <Body
        style={{
          backgroundColor: BG,
          fontFamily:
            'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
          margin: 0,
          padding: "32px 0",
        }}
      >
        <Container
          style={{
            backgroundColor: SURFACE,
            border: `1px solid ${BORDER}`,
            borderRadius: 6,
            maxWidth: 480,
            padding: "32px 28px",
          }}
        >
          <Text
            style={{
              color: TEXT,
              fontSize: 14,
              fontFamily:
                'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
              letterSpacing: "0.04em",
              margin: "0 0 24px",
            }}
          >
            ▸ ValidationKit
          </Text>

          <Text
            style={{
              color: TEXT,
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              margin: "0 0 12px",
            }}
          >
            Du wurdest zu {workspaceName} eingeladen
          </Text>

          <Text
            style={{ color: MUTED, fontSize: 14, lineHeight: 1.6, margin: "0 0 24px" }}
          >
            {inviterName} hat dich als Admin zum Workspace{" "}
            <span style={{ color: TEXT }}>{workspaceName}</span> auf
            ValidationKit hinzugefügt.
            {alreadyHadAccount
              ? " Er ist bereits mit deinem Konto verknüpft — öffne ihn unten."
              : " Melde dich mit dieser E-Mail-Adresse an, um anzunehmen; deine Einladung wird bei der ersten Anmeldung automatisch zugeordnet."}
          </Text>

          <Section style={{ margin: "0 0 24px" }}>
            <Button
              href={acceptUrl}
              style={{
                backgroundColor: TEXT,
                color: BG,
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 500,
                padding: "10px 20px",
                textDecoration: "none",
              }}
            >
              {alreadyHadAccount ? "Workspace öffnen" : "Einladung annehmen"}
            </Button>
          </Section>

          <Text
            style={{ color: MUTED, fontSize: 12, lineHeight: 1.6, margin: "0 0 8px" }}
          >
            Oder füge diese URL in deinen Browser ein.
          </Text>
          <Text
            style={{
              color: TEXT,
              fontSize: 11,
              fontFamily:
                'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
              wordBreak: "break-all",
              margin: "0 0 24px",
            }}
          >
            <Link
              href={acceptUrl}
              style={{ color: TEXT, textDecoration: "underline" }}
            >
              {acceptUrl}
            </Link>
          </Text>

          <Hr style={{ borderColor: BORDER, margin: "24px 0" }} />

          <Text style={{ color: MUTED, fontSize: 11, lineHeight: 1.6, margin: 0 }}>
            Falls du diese Einladung nicht erwartet hast, kannst du diese
            E-Mail ignorieren. Es wird kein Konto erstellt, bis du dich selbst
            anmeldest.
          </Text>

          <EmailFooter />
        </Container>
      </Body>
    </Html>
  );
}
