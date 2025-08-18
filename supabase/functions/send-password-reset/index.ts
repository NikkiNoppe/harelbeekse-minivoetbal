
// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { Resend } from "npm:resend@2.0.0";
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

// Declare Deno namespace for TypeScript
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const ADMIN_EMAIL = "noppe.nikki@icloud.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
}

interface User {
  user_id: number;
  username: string;
  email: string | null;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: PasswordResetRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if user exists with this email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('user_id, username, email')
      .eq('email', email)
      .single();

    if (userError || !user) {
      // For security, don't reveal if email exists or not
      return new Response(
        JSON.stringify({ message: "Als dit email adres bestaat, zal je een reset link ontvangen." }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if user has an email address
    if (!user.email || user.email.trim() === '') {
      // User exists but has no email - notify admin
      await sendAdminNotification(user, email);
      
      return new Response(
        JSON.stringify({ 
          message: "Je account heeft geen email adres gekoppeld. De beheerder is op de hoogte gesteld van je wachtwoord reset verzoek." 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // User has email - proceed with secure password reset
    const resetToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Store reset token in database
    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: user.user_id,
        token: resetToken,
        expires_at: expiresAt.toISOString(),
        requested_email: email
      });

    if (tokenError) {
      console.error("Error storing reset token:", tokenError);
      return new Response(
        JSON.stringify({ error: "Er is een fout opgetreden bij het aanmaken van de reset link" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    
    const resetUrl = `${req.headers.get('origin')}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    const emailResponse = await resend.emails.send({
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

    console.log("Password reset email sent:", emailResponse);

    return new Response(
      JSON.stringify({ 
        message: "Als dit email adres bestaat, zal je een reset link ontvangen."
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    console.error("Error in send-password-reset function:", error);
    return new Response(
      JSON.stringify({ error: "Er is een fout opgetreden bij het versturen van de email" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

// Function to send admin notification when user has no email
async function sendAdminNotification(user: User, requestedEmail: string): Promise<void> {
  try {
    const timestamp = new Date().toLocaleString('nl-NL');
    
    await resend.emails.send({
      from: "Harelbeekse Minivoetbal <noreply@resend.dev>",
      to: [ADMIN_EMAIL],
      subject: "Wachtwoord Reset Verzoek - Gebruiker zonder Email",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7c3aed; margin: 0 0 8px;">Wachtwoord Reset Verzoek</h2>
          <p style="color: #4b5563;"><strong>⚠️ Belangrijk:</strong> Een gebruiker heeft een wachtwoord reset aangevraagd maar heeft geen e-mailadres gekoppeld aan zijn account.</p>
          
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
          
          <p style="color: #374151;"><strong>Actie vereist:</strong></p>
          <ol style="margin: 8px 0; padding-left: 20px; color: #374151;">
            <li>Controleer of de gebruiker legitiem is</li>
            <li>Voeg een e-mailadres toe aan het account indien nodig</li>
            <li>Reset het wachtwoord handmatig of stuur een nieuwe resetlink</li>
          </ol>
          
          <p style="color: #6b7280; font-size: 14px;">
            Dit is een automatische melding van het wachtwoordresetsysteem.
          </p>
        </div>
      `,
    });

    console.log("Admin notification sent for user without email:", user.username);
  } catch (error) {
    console.error("Error sending admin notification:", error);
  }
}

serve(handler);
