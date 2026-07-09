// @ts-ignore
import { Resend } from "https://esm.sh/resend@2.0.0";

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

export interface SendEmailParams {
  from: string;
  replyTo?: string;
  to: string[];
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider?: "connector" | "resend-direct";
}

async function sendViaConnector(params: SendEmailParams): Promise<SendEmailResult> {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const resendKey = Deno.env.get("RESEND_API_KEY");

  if (!lovableKey) {
    return { success: false, error: "LOVABLE_API_KEY is not configured", provider: "connector" };
  }
  if (!resendKey) {
    return { success: false, error: "RESEND_API_KEY is not configured", provider: "connector" };
  }

  const response = await fetch(`${GATEWAY_URL}/emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": resendKey,
    },
    body: JSON.stringify({
      from: params.from,
      reply_to: params.replyTo,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      success: false,
      error: `[connector ${response.status}] ${JSON.stringify(data)}`,
      provider: "connector",
    };
  }

  const messageId =
    (data as { id?: string })?.id ||
    (data as { data?: { id?: string } })?.data?.id;

  return { success: true, messageId, provider: "connector" };
}

async function sendViaResendSdk(params: SendEmailParams): Promise<SendEmailResult> {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    return { success: false, error: "RESEND_API_KEY is not configured", provider: "resend-direct" };
  }

  const resend = new Resend(resendKey);
  const { data, error } = await resend.emails.send({
    from: params.from,
    reply_to: params.replyTo,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
  });

  if (error) {
    return {
      success: false,
      error: error.message || JSON.stringify(error),
      provider: "resend-direct",
    };
  }

  return { success: true, messageId: data?.id, provider: "resend-direct" };
}

/** Verstuur via Lovable Resend-connector (productie); fallback naar directe Resend SDK. */
export async function sendTransactionalEmail(
  params: SendEmailParams,
): Promise<SendEmailResult> {
  try {
    const connectorResult = await sendViaConnector(params);
    if (connectorResult.success) {
      return connectorResult;
    }

    console.warn("Resend connector failed, trying direct SDK:", connectorResult.error);
    return await sendViaResendSdk(params);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown email send error";
    try {
      const fallback = await sendViaResendSdk(params);
      if (fallback.success) return fallback;
      return { success: false, error: fallback.error || message };
    } catch (fallbackError) {
      return {
        success: false,
        error: fallbackError instanceof Error ? fallbackError.message : message,
      };
    }
  }
}
