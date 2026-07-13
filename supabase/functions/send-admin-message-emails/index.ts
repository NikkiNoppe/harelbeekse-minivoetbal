import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders as baseCorsHeaders } from "npm:@supabase/supabase-js@2/cors";
import {
  buildAdminMessageEmailHtml,
  buildAdminMessageEmailText,
  loadAuthEmailBranding,
  resolveAdminMessageSubject,
  resolveAuthReplyTo,
} from "../_shared/auth-email-branding.ts";

const corsHeaders = {
  ...baseCorsHeaders,
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-session-token",
};

const SENDER_DOMAIN = "notify.harelbekeminivoetbal.be";
const FROM_DOMAIN = "harelbekeminivoetbal.be";

interface SendAdminMessageRequest {
  title?: string;
  message: string;
  target_roles?: string[];
  target_user_ids?: number[];
}

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function resolveSessionContext(
  supabase: ReturnType<typeof createClient>,
  sessionToken: string,
): Promise<
  | { ok: true; organizationId: number }
  | { ok: false; status: number; message: string }
> {
  const { data: session, error } = await supabase
    .from("user_sessions")
    .select("user_id, acting_organization_id, expires_at")
    .eq("session_id", sessionToken)
    .maybeSingle();

  if (error || !session) {
    return { ok: false, status: 401, message: "Ongeldige sessie" };
  }

  if (new Date(session.expires_at as string) <= new Date()) {
    return { ok: false, status: 401, message: "Sessie verlopen" };
  }

  if (session.user_id === -1) {
    return {
      ok: true,
      organizationId: (session.acting_organization_id as number | null) ?? 1,
    };
  }

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("role, organization_id")
    .eq("user_id", session.user_id)
    .maybeSingle();

  if (userError || !user) {
    return { ok: false, status: 401, message: "Gebruiker niet gevonden" };
  }

  if (user.role !== "admin") {
    return { ok: false, status: 403, message: "Alleen admins" };
  }

  if (!user.organization_id) {
    return { ok: false, status: 400, message: "Geen actieve organisatie" };
  }

  return { ok: true, organizationId: user.organization_id as number };
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

  const sessionToken = req.headers.get("x-session-token");
  if (!sessionToken) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
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
  const sessionContext = await resolveSessionContext(supabase, sessionToken);
  if (!sessionContext.ok) {
    return new Response(JSON.stringify({ error: sessionContext.message }), {
      status: sessionContext.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let usersQuery = supabase
    .from("users")
    .select("user_id, username, email, role")
    .eq("organization_id", sessionContext.organizationId)
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
        skipped: 0,
        reason: "no_recipients_with_email",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const branding = await loadAuthEmailBranding(supabase, sessionContext.organizationId);
  const subject = resolveAdminMessageSubject(branding, body.title);
  const fromAddress = `${branding.displayName} <noreply@${FROM_DOMAIN}>`;
  const replyTo = resolveAuthReplyTo(branding);

  let queued = 0;
  let suppressed = 0;
  let failed = 0;

  for (const recipient of uniqueRecipients.values()) {
    const messageId = crypto.randomUUID();
    const idempotencyKey = `${messageId}:${recipient.email}`;

    const { data: suppressedRow, error: suppressionError } = await supabase
      .from("suppressed_emails")
      .select("id")
      .eq("email", recipient.email)
      .maybeSingle();

    if (suppressionError) {
      failed += 1;
      continue;
    }

    if (suppressedRow) {
      suppressed += 1;
      await supabase.from("email_send_log").insert({
        message_id: messageId,
        template_name: "admin-message",
        recipient_email: recipient.email,
        status: "suppressed",
      });
      continue;
    }

    let unsubscribeToken: string;
    const { data: existingToken } = await supabase
      .from("email_unsubscribe_tokens")
      .select("token, used_at")
      .eq("email", recipient.email)
      .maybeSingle();

    if (existingToken && !existingToken.used_at) {
      unsubscribeToken = existingToken.token as string;
    } else if (!existingToken) {
      unsubscribeToken = generateToken();
      await supabase.from("email_unsubscribe_tokens").upsert(
        { token: unsubscribeToken, email: recipient.email },
        { onConflict: "email", ignoreDuplicates: true },
      );
      const { data: storedToken } = await supabase
        .from("email_unsubscribe_tokens")
        .select("token")
        .eq("email", recipient.email)
        .maybeSingle();
      unsubscribeToken = (storedToken?.token as string) ?? unsubscribeToken;
    } else {
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

    await supabase.from("email_send_log").insert({
      message_id: messageId,
      template_name: "admin-message",
      recipient_email: recipient.email,
      status: "pending",
    });

    const { error: enqueueError } = await supabase.rpc("enqueue_email", {
      queue_name: "transactional_emails",
      payload: {
        message_id: messageId,
        to: recipient.email,
        from: fromAddress,
        reply_to: replyTo,
        sender_domain: SENDER_DOMAIN,
        subject,
        html,
        text,
        purpose: "transactional",
        label: "admin-message",
        idempotency_key: idempotencyKey,
        unsubscribe_token: unsubscribeToken,
        queued_at: new Date().toISOString(),
      },
    });

    if (enqueueError) {
      failed += 1;
      await supabase.from("email_send_log").insert({
        message_id: messageId,
        template_name: "admin-message",
        recipient_email: recipient.email,
        status: "failed",
        error_message: "Failed to enqueue email",
      });
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
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
