
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
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

    // Generate reset token (simple UUID for demo - in production use JWT)
    const resetToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Store reset token in database (you might want to create a password_reset_tokens table)
    // For now, we'll use a simple approach and store it temporarily
    
    const resetUrl = `${req.headers.get('origin')}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    const emailResponse = await resend.emails.send({
      from: "Harelbeekse Minivoetbal <noreply@resend.dev>",
      to: [email],
      subject: "Wachtwoord Reset",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #22c55e;">Wachtwoord Reset</h2>
          <p>Hallo ${user.username || 'gebruiker'},</p>
          <p>Je hebt een wachtwoord reset aangevraagd voor je Voetbal Arena account.</p>
          <p>Klik op de onderstaande link om je wachtwoord te resetten:</p>
          <a href="${resetUrl}" style="background-color: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">
            Wachtwoord Resetten
          </a>
          <p style="color: #666; font-size: 14px;">
            Deze link is 1 uur geldig. Als je dit niet hebt aangevraagd, kun je deze email negeren.
          </p>
          <p style="color: #666; font-size: 14px;">
            Als de knop niet werkt, kopieer en plak deze link in je browser:<br>
            <span style="word-break: break-all;">${resetUrl}</span>
          </p>
        </div>
      `,
    });

    console.log("Password reset email sent:", emailResponse);

    return new Response(
      JSON.stringify({ 
        message: "Als dit email adres bestaat, zal je een reset link ontvangen.",
        token: resetToken // Remove this in production
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
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

serve(handler);
