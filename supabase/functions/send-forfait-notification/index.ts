// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { requireAdminOrTeamManagerForTeams } from "../_shared/auth.ts";
import {
  buildAuthEmailHtml,
  loadAuthEmailBranding,
  resolveAuthReplyTo,
  resolveTransactionalFromAddress,
} from "../_shared/auth-email-branding.ts";
import { sendTransactionalEmail } from "../_shared/resend-connector.ts";

declare const Deno: { env: { get(key: string): string | undefined } };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-session-token",
};

interface ForfaitNotificationRequest {
  recipients: string[];
  homeTeamId?: number | null;
  awayTeamId?: number | null;
  homeTeamName: string;
  awayTeamName: string;
  forfaitTeamName: string;
  matchDate?: string | null;
  matchTime?: string | null;
  location?: string | null;
}

const GLOBAL_EXTRA_RECIPIENTS = [
  "noppe.nikki@icloud.com",
  "sandrine.vergote@harelbeke.be",
];

const formatDate = (d?: string | null) => {
  if (!d) return null;
  try {
    const dt = new Date(d + "T00:00:00");
    return dt.toLocaleDateString("nl-BE", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return d;
  }
};

async function resolveOrganizationId(
  supabase: ReturnType<typeof createClient>,
  homeTeamId?: number | null,
  awayTeamId?: number | null,
): Promise<number> {
  const teamId =
    (typeof homeTeamId === "number" && homeTeamId > 0 ? homeTeamId : null) ??
    (typeof awayTeamId === "number" && awayTeamId > 0 ? awayTeamId : null);

  if (!teamId) return 1;

  const { data } = await supabase
    .from("teams")
    .select("organization_id")
    .eq("team_id", teamId)
    .maybeSingle();

  return typeof data?.organization_id === "number" ? data.organization_id : 1;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    const body: ForfaitNotificationRequest = await req.json();
    const {
      recipients,
      homeTeamId,
      awayTeamId,
      homeTeamName,
      awayTeamName,
      forfaitTeamName,
      matchDate,
      matchTime,
      location,
    } = body;

    const auth = await requireAdminOrTeamManagerForTeams(
      req,
      supabase,
      homeTeamId,
      awayTeamId,
    );
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: auth.message }), {
        status: auth.status,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return new Response(JSON.stringify({ error: "Geen ontvangers opgegeven" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const validRecipients = recipients.filter(
      (e) => typeof e === "string" && /\S+@\S+\.\S+/.test(e),
    );
    if (validRecipients.length === 0) {
      return new Response(JSON.stringify({ error: "Geen geldige email adressen" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const organizationId = await resolveOrganizationId(supabase, homeTeamId, awayTeamId);
    const branding = await loadAuthEmailBranding(supabase, organizationId);
    const replyTo = resolveAuthReplyTo(branding);

    const teamIds = [homeTeamId, awayTeamId].filter(
      (id): id is number => typeof id === "number" && id > 0,
    );
    const allowedEmails = new Set(
      [
        ...GLOBAL_EXTRA_RECIPIENTS,
        branding.fromEmail,
        branding.replyToEmail,
      ].map((e) => e.toLowerCase()),
    );

    if (teamIds.length > 0) {
      const { data: teamRecipients, error: recipErr } = await supabase.rpc("get_team_recipients", {
        p_team_ids: teamIds,
      });
      if (recipErr) {
        console.error("get_team_recipients failed:", recipErr.message);
        return new Response(JSON.stringify({ error: "Kon ontvangers niet valideren" }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      for (const row of teamRecipients ?? []) {
        const email = (row as { email?: string }).email?.trim().toLowerCase();
        if (email) allowedEmails.add(email);
      }
    }

    const rejected = validRecipients.filter((e) => !allowedEmails.has(e.toLowerCase()));
    if (rejected.length > 0) {
      return new Response(
        JSON.stringify({ error: "Ontvangers niet toegestaan", rejected }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const dateStr = formatDate(matchDate);
    const subject = `Forfait: ${homeTeamName} - ${awayTeamName}`;
    const detailParts = [
      `Wedstrijd: ${homeTeamName} - ${awayTeamName}`,
      dateStr
        ? `Datum: ${dateStr}${matchTime ? ` om ${matchTime}` : ""}`
        : null,
      location ? `Locatie: ${location}` : null,
    ].filter((part): part is string => !!part);

    const html = buildAuthEmailHtml({
      branding,
      previewText: subject,
      heading: "Forfait",
      greeting: "Beste,",
      paragraphs: [
        `Hierbij melden wij dat de onderstaande wedstrijd niet zal doorgaan. Het team ${forfaitTeamName} heeft forfait gegeven.`,
        ...detailParts,
        "Gelieve hier rekening mee te houden in jullie planning.",
      ],
      ctaLabel: `Naar ${branding.shortName}`,
      ctaUrl: branding.siteUrl,
    });

    const text = [
      "Forfait",
      "",
      "Beste,",
      "",
      `Hierbij melden wij dat de wedstrijd ${homeTeamName} - ${awayTeamName} niet zal doorgaan. Het team ${forfaitTeamName} heeft forfait gegeven.`,
      ...detailParts,
      "",
      "Gelieve hier rekening mee te houden in jullie planning.",
      "",
      branding.displayName,
    ].join("\n");

    const results = await Promise.all(
      validRecipients.map(async (to) => {
        const sendResult = await sendTransactionalEmail({
          from: resolveTransactionalFromAddress(branding),
          replyTo,
          to: [to],
          subject,
          html,
          text,
        });
        if (!sendResult.success) {
          return {
            recipient: to,
            ok: false,
            error: sendResult.error ?? "Verzenden mislukt",
          };
        }
        return { recipient: to, ok: true };
      }),
    );

    const okCount = results.filter((r) => r.ok).length;
    console.log("Forfait notification results:", {
      organizationId,
      okCount,
      total: results.length,
    });

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
