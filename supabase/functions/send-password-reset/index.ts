// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import {
  AUTH_PASSWORD_RESET_TTL_MS,
  buildAuthEmailHtml,
  buildAuthResetPasswordUrl,
  formatAuthLinkValidityNl,
  loadAuthEmailBranding,
  resolveAuthReplyTo,
} from "../_shared/auth-email-branding.ts";
import { sendTransactionalEmail } from "../_shared/resend-connector.ts";

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GENERIC_SUCCESS_MESSAGE =
  "Als dit e-mailadres bij ons bekend is, ontvang je binnen enkele minuten een link om je wachtwoord te wijzigen.";

interface PasswordResetRequest {
  email: string;
  organizationId?: number;
}

interface UserRow {
  user_id: number;
  username: string;
  email: string | null;
  organization_id: number | null;
}

async function findUserByEmail(
  supabase: ReturnType<typeof createClient>,
  normalizedEmail: string,
  organizationId?: number,
): Promise<UserRow | null> {
  let query = supabase
    .from("users")
    .select("user_id, username, email, organization_id")
    .eq("email", normalizedEmail);

  if (organizationId != null) {
    query = query.eq("organization_id", organizationId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("User lookup failed:", error);
    return null;
  }

  if (!data || data.length === 0) {
    return null;
  }

  if (data.length > 1 && organizationId == null) {
    console.warn(
      `Multiple users found for email ${normalizedEmail} without organization scope; using first match.`,
    );
  }

  return data[0] as UserRow;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, organizationId }: PasswordResetRequest = await req.json();

    if (!email?.trim()) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const parsedOrganizationId =
      typeof organizationId === "number" && Number.isFinite(organizationId)
        ? organizationId
        : undefined;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: rateLimitOk, error: rateLimitError } = await supabase.rpc(
      "check_email_rate_limit",
      {
        p_email: normalizedEmail,
        p_action: "password_reset",
        p_max_attempts: 3,
        p_window_minutes: 60,
      },
    );

    if (rateLimitError) {
      console.error("Rate limit check failed:", rateLimitError);
    } else if (rateLimitOk === false) {
      return new Response(JSON.stringify({ message: GENERIC_SUCCESS_MESSAGE }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const user = await findUserByEmail(supabase, normalizedEmail, parsedOrganizationId);

    if (!user) {
      return new Response(JSON.stringify({ message: GENERIC_SUCCESS_MESSAGE }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!user.email || user.email.trim() === "") {
      await sendAdminNotification(supabase, user, normalizedEmail);
      return new Response(JSON.stringify({ message: GENERIC_SUCCESS_MESSAGE }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const branding = await loadAuthEmailBranding(
      supabase,
      parsedOrganizationId ?? user.organization_id,
    );

    const resetToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + AUTH_PASSWORD_RESET_TTL_MS);
    const validityLabel = formatAuthLinkValidityNl(AUTH_PASSWORD_RESET_TTL_MS);

    const { error: tokenError } = await supabase.from("password_reset_tokens").insert({
      user_id: user.user_id,
      token: resetToken,
      expires_at: expiresAt.toISOString(),
      requested_email: normalizedEmail,
    });

    if (tokenError) {
      console.error("Error storing reset token:", tokenError);
      return new Response(
        JSON.stringify({ error: "Er is een fout opgetreden bij het aanmaken van de reset link" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    const resetUrl = buildAuthResetPasswordUrl(branding, {
      token: resetToken,
      email: user.email,
      mode: "reset",
    });

    const html = buildAuthEmailHtml({
      branding,
      previewText: `Wachtwoord resetten voor ${branding.displayName}.`,
      heading: "Wachtwoord resetten",
      greeting: `Hallo ${user.username || "gebruiker"},`,
      paragraphs: [
        `Je hebt een verzoek ingediend om je wachtwoord te wijzigen voor <strong>${branding.displayName}</strong>.`,
        "Klik op de knop hieronder om een nieuw wachtwoord in te stellen.",
      ],
      ctaLabel: "Nieuw wachtwoord instellen",
      ctaUrl: resetUrl,
      note: `Deze link is ${validityLabel} geldig. Heb je dit niet aangevraagd? Dan mag je deze e-mail negeren.`,
      securityTip:
        `Deze link kan maar één keer gebruikt worden en verloopt automatisch na ${validityLabel}.`,
    });

    const sendResult = await sendTransactionalEmail({
      from: branding.fromAddress,
      replyTo: resolveAuthReplyTo(branding),
      to: [user.email],
      subject: `${branding.shortName} — wachtwoord resetten`,
      html,
    });

    if (!sendResult.success) {
      console.error("Password reset email send failed:", sendResult);
      return new Response(
        JSON.stringify({ error: "Er is een fout opgetreden bij het versturen van de e-mail" }),
        {
          status: 502,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    return new Response(JSON.stringify({ message: GENERIC_SUCCESS_MESSAGE }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error in send-password-reset function:", error);
    return new Response(
      JSON.stringify({ error: "Er is een fout opgetreden bij het versturen van de e-mail" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  }
};

async function sendAdminNotification(
  supabase: ReturnType<typeof createClient>,
  user: UserRow,
  requestedEmail: string,
): Promise<void> {
  const adminEmail = Deno.env.get("ADMIN_EMAIL")?.trim();
  if (!adminEmail) {
    console.warn("ADMIN_EMAIL not configured; skipping admin notification");
    return;
  }

  const branding = await loadAuthEmailBranding(supabase, user.organization_id);
  const timestamp = new Date().toLocaleString("nl-NL");

  try {
    const sendResult = await sendTransactionalEmail({
      from: branding.fromAddress,
      replyTo: resolveAuthReplyTo(branding),
      to: [adminEmail],
      subject: `${branding.shortName} — wachtwoordreset zonder e-mailadres`,
      html: buildAuthEmailHtml({
        branding,
        previewText: "Wachtwoordreset aangevraagd zonder gekoppeld e-mailadres.",
        heading: "Wachtwoordreset zonder e-mail",
        greeting: "Beste beheerder,",
        paragraphs: [
          "Een gebruiker heeft een wachtwoordreset aangevraagd, maar er is geen e-mailadres gekoppeld aan het account.",
          `<strong>Gebruikersnaam:</strong> ${user.username}<br /><strong>User ID:</strong> ${user.user_id}<br /><strong>Aangevraagde e-mail:</strong> ${requestedEmail}<br /><strong>Tijdstip:</strong> ${timestamp}`,
        ],
        ctaLabel: "Naar beheer",
        ctaUrl: branding.siteUrl,
        note: "Neem contact op met de gebruiker om het wachtwoord handmatig te resetten.",
      }),
    });

    if (!sendResult.success) {
      console.error("Admin notification email failed:", sendResult);
    }
  } catch (error) {
    console.error("Error sending admin notification:", error);
  }
}

serve(handler);
