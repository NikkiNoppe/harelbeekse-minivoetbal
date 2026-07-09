// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { requireSession } from "../_shared/auth.ts";
import {
  AUTH_INVITE_LINK_TTL_MS,
  buildAuthEmailHtml,
  formatAuthLinkValidityNl,
  loadAuthEmailBranding,
  resolveAuthBaseUrl,
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
    "authorization, x-client-info, apikey, content-type, x-session-token",
};

interface WelcomeEmailRequest {
  email: string;
  username?: string | null;
  userId: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const auth = await requireSession(req, supabase, { adminOnly: true });
  if (!auth.ok) {
    return new Response(JSON.stringify({ error: auth.message }), {
      status: auth.status,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const { email, username, userId }: WelcomeEmailRequest = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { data: userRow, error: userLookupError } = await supabase
      .from("users")
      .select("user_id, email, username, organization_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (userLookupError || !userRow) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (userRow.email?.toLowerCase() !== email.toLowerCase()) {
      return new Response(JSON.stringify({ error: "Email does not match user" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const branding = await loadAuthEmailBranding(supabase, userRow.organization_id);
    const appBaseUrl = resolveAuthBaseUrl(branding);

    const resetToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + AUTH_INVITE_LINK_TTL_MS);
    const validityLabel = formatAuthLinkValidityNl(AUTH_INVITE_LINK_TTL_MS);

    const { error: tokenError } = await supabase
      .from("password_reset_tokens")
      .insert({
        user_id: userId,
        token: resetToken,
        requested_email: email,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      console.error("Error creating reset token:", tokenError);
      return new Response(JSON.stringify({ error: "Failed to create password reset token" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const setupPasswordUrl =
      `${appBaseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}&mode=setup`;
    const displayUsername = username || userRow.username || "gebruiker";

    const html = buildAuthEmailHtml({
      branding,
      previewText: `Je account bij ${branding.displayName} is aangemaakt.`,
      heading: "Welkom — stel je wachtwoord in",
      greeting: `Hallo ${displayUsername},`,
      paragraphs: [
        `Er werd een account voor je aangemaakt bij <strong>${branding.displayName}</strong>.`,
        `<strong>Gebruikersnaam:</strong> ${displayUsername}`,
        "Klik op de knop hieronder om een persoonlijk wachtwoord in te stellen en je account te activeren.",
      ],
      ctaLabel: "Wachtwoord instellen",
      ctaUrl: setupPasswordUrl,
      note: `Deze link is ${validityLabel} geldig. Heb je deze uitnodiging niet verwacht? Dan mag je deze e-mail negeren.`,
      securityTip:
        `Deze link kan maar één keer gebruikt worden en verloopt automatisch na ${validityLabel}.`,
    });

    const sendResult = await sendTransactionalEmail({
      from: branding.fromAddress,
      replyTo: resolveAuthReplyTo(branding),
      to: [email],
      subject: `Welkom bij ${branding.shortName} — stel je wachtwoord in`,
      html,
    });

    if (!sendResult.success) {
      console.error("Welcome email send failed:", sendResult);
      return new Response(
        JSON.stringify({
          error: sendResult.error || "Failed to send welcome email",
          provider: sendResult.provider,
        }),
        {
          status: 502,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    console.log("Welcome email sent:", {
      recipient: email,
      userId,
      provider: sendResult.provider,
      messageId: sendResult.messageId,
    });

    return new Response(
      JSON.stringify({
        success: true,
        messageId: sendResult.messageId,
        provider: sendResult.provider,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  } catch (error: unknown) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(JSON.stringify({ error: "Failed to send welcome email" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
