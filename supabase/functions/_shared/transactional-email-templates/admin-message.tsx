import * as React from "npm:react@18.3.1";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Button,
} from "npm:@react-email/components@0.0.22";
import type { TemplateEntry } from "./registry.ts";

export interface TransactionalEmailBranding {
  displayName?: string;
  shortName?: string;
  siteUrl?: string;
  primaryColor?: string;
  primaryLight?: string;
  surfaceColor?: string;
  borderColor?: string;
  textColor?: string;
  mutedColor?: string;
}

const DEFAULT_BRANDING: Required<TransactionalEmailBranding> = {
  displayName: "Harelbeekse Minivoetbal Competitie",
  shortName: "Minivoetbal",
  siteUrl: "https://harelbekeminivoetbal.be",
  primaryColor: "#0072b9",
  primaryLight: "#4dbbff",
  surfaceColor: "#e3f3fc",
  borderColor: "#c5e7fc",
  textColor: "#111827",
  mutedColor: "#6b7280",
};

export function resolveTransactionalBranding(
  branding?: TransactionalEmailBranding,
): Required<TransactionalEmailBranding> {
  return {
    displayName: branding?.displayName?.trim() || DEFAULT_BRANDING.displayName,
    shortName: branding?.shortName?.trim() || DEFAULT_BRANDING.shortName,
    siteUrl: branding?.siteUrl?.trim() || DEFAULT_BRANDING.siteUrl,
    primaryColor: branding?.primaryColor || DEFAULT_BRANDING.primaryColor,
    primaryLight: branding?.primaryLight || DEFAULT_BRANDING.primaryLight,
    surfaceColor: branding?.surfaceColor || DEFAULT_BRANDING.surfaceColor,
    borderColor: branding?.borderColor || DEFAULT_BRANDING.borderColor,
    textColor: branding?.textColor || DEFAULT_BRANDING.textColor,
    mutedColor: branding?.mutedColor || DEFAULT_BRANDING.mutedColor,
  };
}

export const transactionalEmailStyles = {
  main: { backgroundColor: "#f8fafc", fontFamily: "Arial, Helvetica, sans-serif" } as const,
  container: {
    padding: "0",
    maxWidth: "600px",
    margin: "0 auto",
    backgroundColor: "#ffffff",
    border: "1px solid #c5e7fc",
    borderRadius: "16px",
    overflow: "hidden",
  } as const,
  header: (primaryColor: string, primaryLight: string) =>
    ({
      backgroundColor: primaryColor,
      padding: "24px 28px",
      borderBottom: `3px solid ${primaryLight}`,
    }) as const,
  headerEyebrow: { fontSize: "13px", fontWeight: 600, color: "#ffffff", margin: "0", opacity: 0.92 } as const,
  headerTitle: { fontSize: "24px", fontWeight: 700, color: "#ffffff", margin: "8px 0 0", lineHeight: "1.25" } as const,
  body: { padding: "28px" } as const,
  text: (textColor: string) =>
    ({ fontSize: "15px", color: textColor, lineHeight: "1.6", margin: "0 0 16px" }) as const,
  card: (surfaceColor: string, borderColor: string) =>
    ({
      backgroundColor: surfaceColor,
      border: `1px solid ${borderColor}`,
      borderRadius: "12px",
      padding: "18px 20px",
      margin: "0 0 20px",
    }) as const,
  footer: (mutedColor: string) =>
    ({ fontSize: "12px", color: mutedColor, margin: "0", lineHeight: "1.5" }) as const,
};

interface AdminMessageEmailProps {
  title?: string;
  message?: string;
  recipientName?: string;
  branding?: TransactionalEmailBranding;
}

export const AdminMessageEmail = ({
  title = "",
  message = "",
  recipientName,
  branding,
}: AdminMessageEmailProps) => {
  const resolved = resolveTransactionalBranding(branding);
  const heading = title.trim() || "Bericht van de competitie";
  const greeting = recipientName ? `Beste ${recipientName},` : "Beste,";

  return (
    <Html lang="nl" dir="ltr">
      <Head />
      <Preview>{message.slice(0, 140) || heading}</Preview>
      <Body style={transactionalEmailStyles.main}>
        <Container style={transactionalEmailStyles.container}>
          <Section style={transactionalEmailStyles.header(resolved.primaryColor, resolved.primaryLight)}>
            <Text style={transactionalEmailStyles.headerEyebrow}>{resolved.shortName}</Text>
            <Heading style={transactionalEmailStyles.headerTitle}>{heading}</Heading>
          </Section>
          <Section style={transactionalEmailStyles.body}>
            <Text style={transactionalEmailStyles.text(resolved.textColor)}>{greeting}</Text>
            <Section style={transactionalEmailStyles.card(resolved.surfaceColor, resolved.borderColor)}>
              <Text style={{ ...transactionalEmailStyles.text(resolved.textColor), margin: 0, whiteSpace: "pre-wrap" }}>
                {message || "—"}
              </Text>
            </Section>
            <Button
              href={resolved.siteUrl}
              style={{
                backgroundColor: resolved.primaryColor,
                color: "#ffffff",
                borderRadius: "10px",
                fontSize: "15px",
                fontWeight: 700,
                padding: "14px 24px",
              }}
            >
              Naar {resolved.shortName}
            </Button>
            <Text style={{ ...transactionalEmailStyles.text(resolved.mutedColor), fontSize: "13px", marginTop: "18px" }}>
              Dit bericht werd verstuurd door {resolved.displayName}.
            </Text>
          </Section>
          <Section style={{ padding: "0 28px 24px" }}>
            <Text style={transactionalEmailStyles.footer(resolved.mutedColor)}>
              {resolved.displayName}
              <br />
              <a href={resolved.siteUrl} style={{ color: resolved.primaryColor }}>
                {resolved.siteUrl}
              </a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export const adminMessageTemplate = {
  component: AdminMessageEmail,
  subject: (data: Record<string, unknown>) => {
    const title = typeof data.title === "string" ? data.title.trim() : "";
    const shortName =
      typeof data.branding === "object" &&
      data.branding &&
      typeof (data.branding as TransactionalEmailBranding).shortName === "string"
        ? (data.branding as TransactionalEmailBranding).shortName
        : DEFAULT_BRANDING.shortName;
    return title || `Bericht van ${shortName}`;
  },
  displayName: "Admin bericht",
  previewData: {
    title: "Belangrijke mededeling",
    message: "Gelieve jullie spelerslijst tijdig in te vullen vóór de komende speeldag.",
    recipientName: "Teamverantwoordelijke",
    branding: DEFAULT_BRANDING,
  },
} satisfies TemplateEntry;
