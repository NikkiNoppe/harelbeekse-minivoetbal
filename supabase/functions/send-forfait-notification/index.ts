// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { Resend } from "https://esm.sh/resend@2.0.0";

declare const Deno: { env: { get(key: string): string | undefined } };

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ForfaitNotificationRequest {
  recipients: string[];
  homeTeamName: string;
  awayTeamName: string;
  forfaitTeamName: string;
  matchDate?: string | null;
  matchTime?: string | null;
  location?: string | null;
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const formatDate = (d?: string | null) => {
  if (!d) return null;
  try {
    const dt = new Date(d + "T00:00:00");
    return dt.toLocaleDateString("nl-BE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  } catch {
    return d;
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: ForfaitNotificationRequest = await req.json();
    const { recipients, homeTeamName, awayTeamName, forfaitTeamName, matchDate, matchTime, location } = body;

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return new Response(JSON.stringify({ error: "Geen ontvangers opgegeven" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const validRecipients = recipients.filter((e) => typeof e === "string" && /\S+@\S+\.\S+/.test(e));
    if (validRecipients.length === 0) {
      return new Response(JSON.stringify({ error: "Geen geldige email adressen" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const dateStr = formatDate(matchDate);
    const matchLine = `${escapeHtml(homeTeamName)} - ${escapeHtml(awayTeamName)}`;
    const detailsLines: string[] = [];
    if (dateStr) detailsLines.push(`<strong>Datum:</strong> ${escapeHtml(dateStr)}${matchTime ? ` om ${escapeHtml(matchTime)}` : ""}`);
    if (location) detailsLines.push(`<strong>Locatie:</strong> ${escapeHtml(location)}`);

    const subject = `Forfait: ${homeTeamName} - ${awayTeamName}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
        <h2 style="color: #7c3aed; margin: 0 0 16px;">Forfait</h2>
        <p>Beste,</p>
        <p>
          Hierbij melden wij dat de onderstaande wedstrijd <strong>niet zal doorgaan</strong>.
          Het team <strong>${escapeHtml(forfaitTeamName)}</strong> heeft forfait gegeven.
        </p>
        <div style="background-color: #faf5ff; border: 1px solid #e9d5ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0 0 8px;"><strong>Wedstrijd:</strong> ${matchLine}</p>
          ${detailsLines.map((l) => `<p style="margin: 4px 0;">${l}</p>`).join("")}
        </div>
        <p>Gelieve hier rekening mee te houden in jullie planning.</p>
        <p style="margin-top: 24px;">Met vriendelijke groet,<br/>Harelbeekse Minivoetbal</p>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "Harelbeekse Minivoetbal <noreply@resend.dev>",
      to: validRecipients,
      subject,
      html,
    });

    console.log("Forfait notification sent:", emailResponse);

    return new Response(JSON.stringify({ success: true, sentTo: validRecipients }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error in send-forfait-notification:", error);
    const msg = error instanceof Error ? error.message : "Onbekende fout";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
