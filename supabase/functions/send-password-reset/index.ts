
// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { Resend } from "https://esm.sh/resend@2.0.0";
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GENERIC_SUCCESS_MESSAGE =
  "Als dit email adres bestaat, zal je een reset link ontvangen.";

interface PasswordResetRequest {
  email: string;
}

interface User {
  user_id: number;
  username: string;
  email: string | null;
}

function getAppBaseUrl(): string | null {
  const base = Deno.env.get("APP_BASE_URL")?.trim().replace(/\/$/, "");
  return base || null;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const appBaseUrl = getAppBaseUrl();
    if (!appBaseUrl) {
      console.error("APP_BASE_URL is not configured");
      return new Response(
        JSON.stringify({ error: "Service configuration error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    const { email }: PasswordResetRequest = await req.json();

    if (!email?.trim()) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: rateLimitOk, error: rateLimitError } = await supabase.rpc(
      'check_email_rate_limit',
      { p_email: normalizedEmail, p_action: 'password_reset', p_max_attempts: 3, p_window_minutes: 60 },
    );

    if (rateLimitError) {
      console.error("Rate limit check failed:", rateLimitError);
    } else if (rateLimitOk === false) {
      return new Response(
        JSON.stringify({ message: GENERIC_SUCCESS_MESSAGE }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('user_id, username, email')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ message: GENERIC_SUCCESS_MESSAGE }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    if (!user.email || user.email.trim() === '') {
      await sendAdminNotification(supabase, user, normalizedEmail);
      return new Response(
        JSON.stringify({ message: GENERIC_SUCCESS_MESSAGE }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    const resetToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert({
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

    const resetUrl = `${appBaseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

    await resend.emails.send({
      from: "Harelbeekse Minivoetbal <noreply@resend.dev>",
      to: [user.email],
      subject: "Wachtwoord Reset",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7c3aed; margin: 0 0 8px;">Wachtwoord Reset</h2>
          <p style="color: #111827;">Hallo ${user.username || 'gebruiker'},</p>
          <p style="color: #374151;">Je hebt een wachtwoord reset aangevraagd voor je Harelbeekse Minivoetbal account.</p>
          <p style="color: #374151;">Klik op de onderstaande knop om je wachtwoord te resetten:</p>
          <a href="${resetUrl}" style="background-color: #7c3aed; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 16px 0; font-weight: 600;">
            Wachtwoord resetten
          </a>
          <p style="color: #6b7280; font-size: 14px;">
            Deze link is 1 uur geldig. Als je dit niet hebt aangevraagd, kun je deze e-mail negeren.
          </p>
          <p style="color: #6b7280; font-size: 14px;">
            Werkt de knop niet? Kopieer en plak deze link in je browser:<br>
            <span style="word-break: break-all; color: #6b21a8;">${resetUrl}</span>
          </p>
          <div style="background-color: #faf5ff; border: 1px solid #e9d5ff; padding: 12px; border-radius: 8px; margin-top: 16px;">
            <p style="color: #581c87; font-size: 12px; margin: 0;">
              <strong>Veiligheidstip:</strong> Deze link kan maar één keer gebruikt worden en wordt automatisch ongeldig na 1 uur.
            </p>
          </div>
        </div>
      `,
    });

    return new Response(
      JSON.stringify({ message: GENERIC_SUCCESS_MESSAGE }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  } catch (error: unknown) {
    console.error("Error in send-password-reset function:", error);
    return new Response(
      JSON.stringify({ error: "Er is een fout opgetreden bij het versturen van de email" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  }
};

async function sendAdminNotification(
  supabase: ReturnType<typeof createClient>,
  user: User,
  requestedEmail: string,
): Promise<void> {
  const adminEmail = Deno.env.get("ADMIN_EMAIL")?.trim();
  if (!adminEmail) {
    console.warn("ADMIN_EMAIL not configured; skipping admin notification");
    return;
  }

  try {
    const timestamp = new Date().toLocaleString('nl-NL');

    await resend.emails.send({
      from: "Harelbeekse Minivoetbal <noreply@resend.dev>",
      to: [adminEmail],
      subject: "Wachtwoord Reset Verzoek - Gebruiker zonder Email",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7c3aed; margin: 0 0 8px;">Wachtwoord Reset Verzoek</h2>
          <p style="color: #4b5563;"><strong>Belangrijk:</strong> Een gebruiker heeft een wachtwoord reset aangevraagd maar heeft geen e-mailadres gekoppeld aan zijn account.</p>
          <div style="background-color: #faf5ff; border: 1px solid #e9d5ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <h3 style="color: #6d28d9; margin-top: 0;">Gebruiker details</h3>
            <ul style="margin: 8px 0; padding-left: 20px; color: #374151;">
              <li><strong>Gebruikersnaam:</strong> ${user.username}</li>
              <li><strong>User ID:</strong> ${user.user_id}</li>
              <li><strong>Email in account:</strong> ${user.email || 'Geen email'}</li>
              <li><strong>Aangevraagde email:</strong> ${requestedEmail}</li>
              <li><strong>Tijdstip:</strong> ${timestamp}</li>
            </ul>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error("Error sending admin notification:", error);
  }
}

serve(handler);
