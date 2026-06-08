// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { requireSession } from "../_shared/auth.ts";

declare const Deno: { env: { get(key: string): string | undefined } };

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const FROM_ADDRESS = "Harelbeekse Minivoetbal <info@harelbekeminivoetbal.be>";
const REPLY_TO_ADDRESS = "info@harelbekeminivoetbal.be";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-session-token",
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

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
  const auth = await requireSession(req, supabase);
  if (!auth.ok) {
    return new Response(JSON.stringify({ error: auth.message }), {
      status: auth.status,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

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

    const results = await Promise.all(
      validRecipients.map(async (to) => {
        try {
          const response = await fetch(`${GATEWAY_URL}/emails`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "X-Connection-Api-Key": RESEND_API_KEY,
            },
            body: JSON.stringify({
              from: FROM_ADDRESS,
              reply_to: REPLY_TO_ADDRESS,
              to: [to],
              subject,
              html,
            }),
          });
          const data = await response.json().catch(() => ({}));
          if (!response.ok) {
            return { recipient: to, ok: false, error: `[${response.status}] ${JSON.stringify(data)}` };
          }
          return { recipient: to, ok: true };
        } catch (e) {
          return { recipient: to, ok: false, error: e instanceof Error ? e.message : "Onbekende fout" };
        }
      })
    );

    const okCount = results.filter((r) => r.ok).length;
    console.log("Forfait notification results:", { okCount, total: results.length, results });

    return new Response(JSON.stringify({ success: okCount > 0, results }), {
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
