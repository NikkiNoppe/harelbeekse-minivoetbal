// @ts-ignore
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

export type SessionAuthResult =
  | { ok: true; userId: number; role: string }
  | { ok: false; status: number; message: string };

export async function requireSession(
  req: Request,
  supabaseAdmin: SupabaseClient,
  options: { adminOnly?: boolean } = {},
): Promise<SessionAuthResult> {
  const token = req.headers.get("x-session-token");
  if (!token) {
    return { ok: false, status: 401, message: "Unauthorized" };
  }

  const { data, error } = await supabaseAdmin.rpc("validate_session", {
    p_session_token: token,
  });

  if (error || !Array.isArray(data) || data.length === 0 || !data[0]?.is_valid) {
    return { ok: false, status: 401, message: "Invalid session" };
  }

  const row = data[0] as { user_id: number; role: string };
  if (options.adminOnly && row.role !== "admin") {
    return { ok: false, status: 403, message: "Admin access required" };
  }

  return { ok: true, userId: row.user_id, role: row.role };
}
