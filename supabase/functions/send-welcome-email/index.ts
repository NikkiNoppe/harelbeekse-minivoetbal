// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { Resend } from "npm:resend@2.0.0";

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
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, username, loginUrl }: WelcomeEmailRequest = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const origin = req.headers.get("origin") || Deno.env.get("APP_BASE_URL") || "http://localhost:8080";
    const targetLoginUrl = loginUrl || `${origin}`;

    const emailResponse = await resend.emails.send({
      from: "Harelbeekse Minivoetbal <noreply@resend.dev>",
      to: [email],
      subject: "Inloggegevens Harelbeekse Minivoetbal",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7c3aed; margin: 0 0 8px;">Welkom bij Harelbeekse Minivoetbal</h2>
          <p style="color: #111827;">Hallo ${username || 'gebruiker'},</p>
          <p style="color: #374151;">Je account voor <strong>Harelbeekse Minivoetbal</strong> werd succesvol aangemaakt. Hieronder vind je je inloggegevens:</p>
          <p style="color: #374151;">
            <strong>Gebruikersnaam:</strong> ${username || 'Team123'}<br>
            <strong>Wachtwoord:</strong> (dit werd je apart bezorgd)
          </p>
          <p style="color: #374151;">Je kan steeds je wachtwoord wijzigen via de optie <em>"Wachtwoord vergeten"</em> op de loginpagina.</p>
          <a href="${targetLoginUrl}"
             style="background-color: #7c3aed; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 16px 0; font-weight: 600;">
             Inloggen
          </a>
          <p style="color: #374151; margin-top: 16px;">
            Bij het inloggen kan je alvast de voorziene spelers aansluiten.<br>
            We voorzien tegen het einde van deze week dat het speelschema online komt, waarbij je je spelersselecties kan invullen.
          </p>
          <div style="background-color: #faf5ff; border: 1px solid #e9d5ff; padding: 12px; border-radius: 8px; margin-top: 16px;">
            <p style="color: #581c87; font-size: 12px; margin: 0;">
            </p>
          </div>
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


