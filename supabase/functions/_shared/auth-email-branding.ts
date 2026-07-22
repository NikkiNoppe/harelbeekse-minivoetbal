// @ts-ignore
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

export interface AuthEmailBranding {
  organizationId: number;
  organizationSlug: string;
  hostnames: string[];
  displayName: string;
  shortName: string;
  siteUrl: string;
  /** Expliciete basis-URL voor auth-links; leeg = APP_BASE_URL of siteUrl. */
  authBaseUrl: string;
  primaryColor: string;
  primaryLight: string;
  surfaceColor: string;
  borderColor: string;
  textColor: string;
  mutedColor: string;
  fromAddress: string;
  fromEmail: string;
  replyToEmail: string;
}

/** Uitnodigingslink na nieuwe gebruiker (setup). */
export const AUTH_INVITE_LINK_TTL_MS = 3 * 24 * 60 * 60 * 1000;

/** Wachtwoord-reset via "wachtwoord vergeten". */
export const AUTH_PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

const DEFAULT_BRANDING: AuthEmailBranding = {
  organizationId: 1,
  organizationSlug: "harelbeke",
  hostnames: ["harelbekeminivoetbal.be", "www.harelbekeminivoetbal.be", "harelbekeminivoetbal.nikkinoppe.be"],
  displayName: "Harelbeekse Minivoetbal Competitie",
  shortName: "Minivoetbal",
  siteUrl: "https://harelbekeminivoetbal.be",
  authBaseUrl: "https://harelbekeminivoetbal.be",
  primaryColor: "#0072b9",
  primaryLight: "#4dbbff",
  surfaceColor: "#e3f3fc",
  borderColor: "#c5e7fc",
  textColor: "#111827",
  mutedColor: "#6b7280",
  fromAddress: "Harelbeekse Minivoetbal <info@harelbekeminivoetbal.be>",
  fromEmail: "info@harelbekeminivoetbal.be",
  replyToEmail: "info@harelbekeminivoetbal.be",
};

function readString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function readColor(scale: Record<string, unknown> | undefined, key: string, fallback: string): string {
  const value = scale?.[key];
  return typeof value === "string" ? value : fallback;
}

function normalizeUrl(value: string): string {
  return value.trim().replace(/\/$/, "");
}

function hexToLuminance(hex: string): number {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return 0.5;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function isDarkColor(hex: string): boolean {
  return hexToLuminance(hex) < 0.45;
}

/** Header: effen kleur, geen gradient. Tekst altijd leesbaar op primary. */
function resolveEmailHeaderColors(branding: AuthEmailBranding): { bg: string; text: string } {
  return {
    bg: branding.primaryColor,
    text: isDarkColor(branding.primaryColor) ? "#ffffff" : "#ffffff",
  };
}

/** CTA-knop: accent op donkere merken, primary + witte tekst op lichte merken. */
function resolveEmailButtonColors(branding: AuthEmailBranding): { bg: string; text: string } {
  if (isDarkColor(branding.primaryColor)) {
    const accentBg = branding.primaryLight;
    return {
      bg: accentBg,
      text: isDarkColor(accentBg) ? "#ffffff" : "#1a1a1a",
    };
  }
  return { bg: branding.primaryColor, text: "#ffffff" };
}

export function formatAuthLinkValidityNl(durationMs: number): string {
  if (durationMs >= 24 * 60 * 60 * 1000 && durationMs % (24 * 60 * 60 * 1000) === 0) {
    const days = durationMs / (24 * 60 * 60 * 1000);
    return days === 1 ? "1 dag" : `${days} dagen`;
  }
  if (durationMs >= 60 * 60 * 1000 && durationMs % (60 * 60 * 1000) === 0) {
    const hours = durationMs / (60 * 60 * 1000);
    return hours === 1 ? "1 uur" : `${hours} uur`;
  }
  return "beperkte tijd";
}

function deriveDefaultInfoEmail(siteUrl: string, organizationSlug?: string): string {
  if (organizationSlug === "harelbeke") {
    return DEFAULT_BRANDING.fromEmail;
  }
  try {
    const hostname = new URL(siteUrl.trim()).hostname.replace(/^www\./, "");
    return hostname ? `info@${hostname}` : DEFAULT_BRANDING.fromEmail;
  } catch {
    return DEFAULT_BRANDING.fromEmail;
  }
}

function parseOrganizationEmailSettings(
  raw: Record<string, unknown> | undefined,
  options: { siteUrl: string; organizationSlug: string; displayName: string },
): { fromEmail: string; replyToEmail: string; fromAddress: string } {
  const emailRaw = raw?.email;
  const emailObj =
    emailRaw && typeof emailRaw === "object" && !Array.isArray(emailRaw)
      ? (emailRaw as Record<string, unknown>)
      : {};

  const fallbackFrom = deriveDefaultInfoEmail(options.siteUrl, options.organizationSlug);
  const fromEmail = readString(emailObj.fromEmail, fallbackFrom).toLowerCase();
  const replyToEmail = readString(emailObj.replyToEmail, fromEmail).toLowerCase();
  const fromAddress = `${options.displayName} <${fromEmail}>`;

  return { fromEmail, replyToEmail, fromAddress };
}

export function parseAuthEmailBranding(
  organizationId: number,
  organizationSlug: string,
  raw: Record<string, unknown> | null | undefined,
): AuthEmailBranding {
  if (!raw || Object.keys(raw).length === 0) {
    return { ...DEFAULT_BRANDING, organizationId, organizationSlug };
  }

  const themeColors = (raw.themeColors ?? {}) as Record<string, unknown>;
  const scale = (themeColors.scale ?? {}) as Record<string, unknown>;
  const displayName = readString(raw.displayName, DEFAULT_BRANDING.displayName);
  const shortName = readString(raw.shortName, DEFAULT_BRANDING.shortName);
  const siteUrl = normalizeUrl(readString(raw.siteUrl, DEFAULT_BRANDING.siteUrl));
  const authBaseUrl = normalizeUrl(
    readString(raw.authBaseUrl, "") || readString(raw.appBaseUrl, ""),
  );
  const hostnames = Array.isArray(raw.hostnames)
    ? raw.hostnames.filter((hostname): hostname is string => typeof hostname === "string")
    : [];
  const primaryColor = readString(themeColors.primaryBase, DEFAULT_BRANDING.primaryColor);
  const primaryLight = readString(themeColors.primaryLight, DEFAULT_BRANDING.primaryLight);
  const surfaceColor = readColor(scale, "100", DEFAULT_BRANDING.surfaceColor);
  const borderColor = readColor(scale, "200", DEFAULT_BRANDING.borderColor);

  const emailSettings = parseOrganizationEmailSettings(raw, {
    siteUrl,
    organizationSlug,
    displayName,
  });

  return {
    organizationId,
    organizationSlug,
    hostnames,
    displayName,
    shortName,
    siteUrl,
    authBaseUrl,
    primaryColor,
    primaryLight,
    surfaceColor,
    borderColor,
    textColor: DEFAULT_BRANDING.textColor,
    mutedColor: DEFAULT_BRANDING.mutedColor,
    fromAddress: emailSettings.fromAddress,
    fromEmail: emailSettings.fromEmail,
    replyToEmail: emailSettings.replyToEmail,
  };
}

export async function loadAuthEmailBranding(
  supabase: SupabaseClient,
  organizationId: number | null | undefined,
): Promise<AuthEmailBranding> {
  const orgId = organizationId ?? 1;

  const { data, error } = await supabase
    .from("organizations")
    .select("id, slug, branding_settings")
    .eq("id", orgId)
    .maybeSingle();

  if (error || !data) {
    console.warn("Could not load organization branding, using defaults:", error?.message);
    return { ...DEFAULT_BRANDING, organizationId: orgId };
  }

  return parseAuthEmailBranding(
    data.id as number,
    typeof data.slug === "string" ? data.slug : DEFAULT_BRANDING.organizationSlug,
    data.branding_settings as Record<string, unknown>,
  );
}

export interface AuthEmailContent {
  branding: AuthEmailBranding;
  previewText: string;
  heading: string;
  greeting: string;
  paragraphs: string[];
  ctaLabel: string;
  ctaUrl: string;
  note?: string;
  securityTip?: string;
}

export function buildAuthEmailHtml(content: AuthEmailContent): string {
  const { branding } = content;
  const headerColors = resolveEmailHeaderColors(branding);
  const buttonColors = resolveEmailButtonColors(branding);
  const paragraphs = content.paragraphs
    .map(
      (paragraph) =>
        `<p style="color:${branding.textColor};font-size:15px;line-height:1.6;margin:0 0 16px;">${paragraph}</p>`,
    )
    .join("");

  const noteBlock = content.note
    ? `<p style="color:${branding.mutedColor};font-size:14px;line-height:1.5;margin:16px 0 0;">${content.note}</p>`
    : "";

  const securityBlock = content.securityTip
    ? `<div style="background-color:${branding.surfaceColor};border:1px solid ${branding.borderColor};padding:14px 16px;border-radius:10px;margin-top:20px;">
        <p style="color:${branding.textColor};font-size:13px;line-height:1.5;margin:0;"><strong>Veiligheidstip:</strong> ${content.securityTip}</p>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="nl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${content.heading}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${content.previewText}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid ${branding.borderColor};border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background-color:${headerColors.bg};padding:24px 28px;border-bottom:3px solid ${branding.primaryLight};">
                <p style="margin:0;color:${headerColors.text};font-size:13px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;opacity:0.92;">${branding.shortName}</p>
                <h1 style="margin:8px 0 0;color:${headerColors.text};font-size:24px;line-height:1.25;font-weight:700;">${content.heading}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="color:${branding.textColor};font-size:16px;line-height:1.5;margin:0 0 16px;">${content.greeting}</p>
                ${paragraphs}
                <table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0 8px;">
                  <tr>
                    <td style="border-radius:10px;background-color:${buttonColors.bg};">
                      <a href="${content.ctaUrl}" style="display:inline-block;padding:14px 24px;color:${buttonColors.text};font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;">
                        ${content.ctaLabel}
                      </a>
                    </td>
                  </tr>
                </table>
                ${noteBlock}
                <p style="color:${branding.mutedColor};font-size:13px;line-height:1.5;margin:18px 0 0;word-break:break-all;">
                  Werkt de knop niet? Kopieer en plak deze link in je browser:<br />
                  <span style="color:${branding.primaryColor};">${content.ctaUrl}</span>
                </p>
                ${securityBlock}
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 24px;">
                <p style="margin:0;color:${branding.mutedColor};font-size:12px;line-height:1.5;">
                  ${branding.displayName}<br />
                  <a href="${branding.siteUrl}" style="color:${branding.primaryColor};text-decoration:none;">${branding.siteUrl}</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function resolveAuthReplyTo(branding: AuthEmailBranding): string {
  if (branding.replyToEmail?.trim()) {
    return branding.replyToEmail.trim();
  }

  try {
    const domain = new URL(branding.siteUrl).hostname.replace(/^www\./, "");
    return `info@${domain}`;
  } catch {
    return DEFAULT_BRANDING.replyToEmail;
  }
}

function readHostname(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function resolveAuthBaseUrl(branding: AuthEmailBranding): string {
  const explicit = branding.authBaseUrl?.trim();
  if (explicit) return normalizeUrl(explicit);

  const envBase = Deno.env.get("APP_BASE_URL")?.trim().replace(/\/$/, "");
  if (envBase) return envBase;

  if (branding.siteUrl?.trim()) return normalizeUrl(branding.siteUrl);

  return DEFAULT_BRANDING.authBaseUrl;
}

export function buildAuthResetPasswordUrl(
  branding: AuthEmailBranding,
  params: { token: string; email: string; mode: "setup" | "reset" },
): string {
  const base = resolveAuthBaseUrl(branding);
  const url = new URL("/reset-password", `${base}/`);

  url.searchParams.set("token", params.token);
  url.searchParams.set("email", params.email);
  url.searchParams.set("mode", params.mode);

  const baseHost = readHostname(base);
  const siteHost = branding.siteUrl ? readHostname(branding.siteUrl) : null;

  if (
    branding.organizationSlug &&
    siteHost &&
    baseHost &&
    siteHost !== baseHost
  ) {
    url.searchParams.set("org", branding.organizationSlug);
  }

  return url.toString();
}

export interface AdminMessageEmailContent {
  branding: AuthEmailBranding;
  title?: string;
  message: string;
  recipientName?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatMessageHtml(message: string): string {
  return escapeHtml(message).replace(/\n/g, "<br />");
}

/** Uniforme transactionele layout voor admin-berichten (zelfde huisstijl als auth-mails). */
export function buildAdminMessageEmailHtml(content: AdminMessageEmailContent): string {
  const { branding } = content;
  const headerColors = resolveEmailHeaderColors(branding);
  const buttonColors = resolveEmailButtonColors(branding);
  const heading = content.title?.trim() || "Bericht van de competitie";
  const greeting = content.recipientName
    ? `Beste ${escapeHtml(content.recipientName)},`
    : "Beste,";
  const previewText = content.message.slice(0, 140);

  return `<!DOCTYPE html>
<html lang="nl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(heading)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(previewText)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid ${branding.borderColor};border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background-color:${headerColors.bg};padding:24px 28px;border-bottom:3px solid ${branding.primaryLight};">
                <p style="margin:0;color:${headerColors.text};font-size:13px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;opacity:0.92;">${escapeHtml(branding.shortName)}</p>
                <h1 style="margin:8px 0 0;color:${headerColors.text};font-size:24px;line-height:1.25;font-weight:700;">${escapeHtml(heading)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="color:${branding.textColor};font-size:16px;line-height:1.5;margin:0 0 16px;">${greeting}</p>
                <div style="background-color:${branding.surfaceColor};border:1px solid ${branding.borderColor};padding:18px 20px;border-radius:12px;margin:0 0 20px;">
                  <p style="color:${branding.textColor};font-size:15px;line-height:1.6;margin:0;">${formatMessageHtml(content.message)}</p>
                </div>
                <table role="presentation" cellspacing="0" cellpadding="0" style="margin:8px 0 0;">
                  <tr>
                    <td style="border-radius:10px;background-color:${buttonColors.bg};">
                      <a href="${branding.siteUrl}" style="display:inline-block;padding:14px 24px;color:${buttonColors.text};font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;">
                        Naar ${escapeHtml(branding.shortName)}
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="color:${branding.mutedColor};font-size:13px;line-height:1.5;margin:18px 0 0;">
                  Dit bericht werd verstuurd door ${escapeHtml(branding.displayName)}.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 24px;">
                <p style="margin:0;color:${branding.mutedColor};font-size:12px;line-height:1.5;">
                  ${escapeHtml(branding.displayName)}<br />
                  <a href="${branding.siteUrl}" style="color:${branding.primaryColor};text-decoration:none;">${branding.siteUrl}</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function buildAdminMessageEmailText(content: AdminMessageEmailContent): string {
  const heading = content.title?.trim() || "Bericht van de competitie";
  const greeting = content.recipientName ? `Beste ${content.recipientName},` : "Beste,";
  return [
    heading,
    "",
    greeting,
    "",
    content.message,
    "",
    `Naar de website: ${content.branding.siteUrl}`,
    "",
    content.branding.displayName,
  ].join("\n");
}

export function resolveAdminMessageSubject(
  branding: AuthEmailBranding,
  title?: string,
): string {
  const subject = title?.trim();
  if (subject) return subject;
  return `Bericht van ${branding.shortName}`;
}
