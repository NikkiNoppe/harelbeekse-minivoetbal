import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders as baseCorsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { requireSession } from "../_shared/auth.ts";
import {
  buildAdminMessageEmailHtml,
  buildAdminMessageEmailText,
  loadAuthEmailBranding,
  resolveAdminMessageSubject,
  resolveAuthReplyTo,
  resolveTransactionalFromAddress,
} from "../_shared/auth-email-branding.ts";
import { sendTransactionalEmail } from "../_shared/resend-connector.ts";

const corsHeaders = {
  ...baseCorsHeaders,
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-session-token",
};

interface SendAdminMessageRequest {
  title?: string;
  message: string;
  target_roles?: string[];
  target_user_ids?: number[];
}

async function resolveOrganizationId(
  supabase: ReturnType<typeof createClient>,
  sessionToken: string,
  userId: number,
): Promise<number | null> {
  if (userId === -1) {
    const { data, error } = await supabase
      .from("user_sessions")
      .select("acting_organization_id")
      .eq("session_id", sessionToken)
      .maybeSingle();

    if (error || !data?.acting_organization_id) {
      return null;
    }

    return data.acting_organization_id as number;
  }

  const { data, error } = await supabase
    .from("users")
    .select("organization_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data?.organization_id) {
    return null;
  }

  return data.organization_id as number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: SendAdminMessageRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return new Response(JSON.stringify({ error: "Bericht is verplicht" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const targetRoles = Array.isArray(body.target_roles)
    ? body.target_roles.filter((role): role is string => typeof role === "string" && role.length > 0)
    : [];
  const targetUserIds = Array.isArray(body.target_user_ids)
    ? body.target_user_ids.filter((id): id is number => typeof id === "number" && id > 0)
    : [];

  if (targetRoles.length === 0 && targetUserIds.length === 0) {
    return new Response(JSON.stringify({ error: "Geen doelgroep geselecteerd" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const auth = await requireSession(req, supabase, { adminOnly: true });
  if (!auth.ok) {
    return new Response(JSON.stringify({ error: auth.message }), {
      status: auth.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const organizationId = await resolveOrganizationId(supabase, auth.sessionToken, auth.userId);
  if (!organizationId) {
    return new Response(JSON.stringify({ error: "Geen actieve organisatie in sessie" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let usersQuery = supabase
    .from("users")
    .select("user_id, username, email, role")
    .eq("organization_id", organizationId)
    .not("email", "is", null)
    .neq("email", "");

  if (targetUserIds.length > 0) {
    usersQuery = usersQuery.in("user_id", targetUserIds);
  } else {
    usersQuery = usersQuery.in("role", targetRoles);
  }

  const { data: recipients, error: recipientsError } = await usersQuery;
  if (recipientsError) {
    console.error("Recipient lookup failed:", recipientsError);
    return new Response(JSON.stringify({ error: "Kon ontvangers niet ophalen" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const uniqueRecipients = new Map<string, { email: string; username: string }>();
  for (const recipient of recipients ?? []) {
    const email = String(recipient.email ?? "").trim().toLowerCase();
    if (!email) continue;
    if (!uniqueRecipients.has(email)) {
      uniqueRecipients.set(email, {
        email,
        username: String(recipient.username ?? ""),
      });
    }
  }

  if (uniqueRecipients.size === 0) {
    return new Response(
      JSON.stringify({
        success: false,
        queued: 0,
        suppressed: 0,
        failed: 0,
        totalRecipients: 0,
        reason: "no_recipients_with_email",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const branding = await loadAuthEmailBranding(supabase, organizationId);
  const subject = resolveAdminMessageSubject(branding, body.title);
  const replyTo = resolveAuthReplyTo(branding);

  let queued = 0;
  let suppressed = 0;
  let failed = 0;
  const failureMessages: string[] = [];

  for (const recipient of uniqueRecipients.values()) {
    const { data: suppressedRow, error: suppressionError } = await supabase
      .from("suppressed_emails")
      .select("id")
      .eq("email", recipient.email)
      .maybeSingle();

    if (suppressionError) {
      console.warn("Suppression check failed — continuing send for admin message", {
        email: recipient.email,
        error: suppressionError,
      });
    } else if (suppressedRow) {
      suppressed += 1;
      continue;
    }

    const html = buildAdminMessageEmailHtml({
      branding,
      title: body.title,
      message,
      recipientName: recipient.username,
    });
    const text = buildAdminMessageEmailText({
      branding,
      title: body.title,
      message,
      recipientName: recipient.username,
    });

    const sendResult = await sendTransactionalEmail({
      from: resolveTransactionalFromAddress(branding),
      replyTo,
      to: [recipient.email],
      subject,
      html,
      text,
    });

    if (!sendResult.success) {
      failed += 1;
      failureMessages.push(
        `${recipient.email}: ${sendResult.error ?? "verzenden mislukt"}`,
      );
      continue;
    }

    queued += 1;
  }

  return new Response(
    JSON.stringify({
      success: queued > 0,
      queued,
      suppressed,
      failed,
      totalRecipients: uniqueRecipients.size,
      failureSample: failureMessages.slice(0, 3),
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
