// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { Resend } from "https://esm.sh/resend@2.0.0";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

// Declare Deno namespace for TypeScript
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  username?: string | null;
  loginUrl?: string | null;
  userId: number; // Required: user ID to generate reset token
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, username, loginUrl, userId }: WelcomeEmailRequest = await req.json();

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

    const origin = req.headers.get("origin") || loginUrl || Deno.env.get("APP_BASE_URL") || "http://localhost:8080";
    
    // Generate a secure password reset token
    const resetToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days for new users
    
    // Create Supabase client with service role to insert token
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Insert password reset token
    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: userId,
        token: resetToken,
        requested_email: email,
        expires_at: expiresAt.toISOString()
      });
    
    if (tokenError) {
      console.error("Error creating reset token:", tokenError);
      return new Response(JSON.stringify({ error: "Failed to create password reset token" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    
    // Generate secure password setup URL
    const setupPasswordUrl = `${origin}/reset-password?token=${resetToken}`;

    const emailResponse = await resend.emails.send({
      from: "Harelbeekse Minivoetbal <noreply@resend.dev>",
      to: [email],
      subject: "Welkom bij Harelbeekse Minivoetbal - Activeer je account",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7c3aed; margin: 0 0 8px;">Welkom bij Harelbeekse Minivoetbal</h2>
          <p style="color: #111827;">Hallo ${username || 'gebruiker'},</p>
          <p style="color: #374151;">Je account voor <strong>Harelbeekse Minivoetbal</strong> werd succesvol aangemaakt.</p>
          <p style="color: #374151;">
            <strong>Gebruikersnaam:</strong> ${username || 'Team123'}
          </p>
          <p style="color: #374151;">Klik op onderstaande knop om je wachtwoord in te stellen en je account te activeren:</p>
          <a href="${setupPasswordUrl}"
             style="background-color: #7c3aed; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 16px 0; font-weight: 600;">
             Wachtwoord instellen
          </a>
          <p style="color: #6b7280; font-size: 14px;">Deze link is 7 dagen geldig.</p>
          <div style="background-color: #faf5ff; border: 1px solid #e9d5ff; padding: 12px; border-radius: 8px; margin-top: 16px;">
            <p style="color: #374151; margin: 0;">
              Na het instellen van je wachtwoord kan je inloggen en je spelers beheren.<br>
              We voorzien tegen het einde van deze week dat het speelschema online komt.
            </p>
          </div>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
            Als je deze email niet hebt aangevraagd, kan je deze veilig negeren.
          </p>
        </div>
      `,
    });

    console.log("Welcome email sent:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(JSON.stringify({ error: "Failed to send welcome email" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);


