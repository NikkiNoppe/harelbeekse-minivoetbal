// @ts-ignore
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

export type SessionAuthResult =
  | { ok: true; userId: number; role: string; sessionToken: string }
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

  return { ok: true, userId: row.user_id, role: row.role, sessionToken: token };
}

async function getSessionTeamIds(
  supabaseAdmin: SupabaseClient,
  sessionToken: string,
): Promise<number[]> {
  const { data, error } = await supabaseAdmin.rpc("get_user_team_ids_secure", {
    p_session_token: sessionToken,
  });
  if (error) {
    console.error("get_user_team_ids_secure failed:", error.message);
    return [];
  }
  return Array.isArray(data) ? (data as number[]) : [];
}

/** Admin, referee, or team manager with access to at least one involved team. */
export async function requireMatchMutationAccess(
  req: Request,
  supabaseAdmin: SupabaseClient,
  homeTeamId?: number | null,
  awayTeamId?: number | null,
): Promise<SessionAuthResult> {
  const auth = await requireSession(req, supabaseAdmin);
  if (!auth.ok) return auth;

  if (auth.role === "admin" || auth.role === "referee") {
    return auth;
  }

  if (auth.role === "player_manager") {
    const teamIds = [homeTeamId, awayTeamId].filter(
      (id): id is number => typeof id === "number" && id > 0,
    );
    if (teamIds.length === 0) {
      return { ok: false, status: 400, message: "Team IDs required" };
    }

    const allowed = await getSessionTeamIds(supabaseAdmin, auth.sessionToken);
    const allowedSet = new Set(allowed);
    if (!teamIds.some((id) => allowedSet.has(id))) {
      return { ok: false, status: 403, message: "No access to this match" };
    }
    return auth;
  }

  return { ok: false, status: 403, message: "Forbidden" };
}

/** Admin or team manager with access to at least one involved team. */
export async function requireAdminOrTeamManagerForTeams(
  req: Request,
  supabaseAdmin: SupabaseClient,
  homeTeamId?: number | null,
  awayTeamId?: number | null,
): Promise<SessionAuthResult> {
  const auth = await requireSession(req, supabaseAdmin);
  if (!auth.ok) return auth;

  if (auth.role === "admin") {
    return auth;
  }

  if (auth.role !== "player_manager") {
    return { ok: false, status: 403, message: "Forbidden" };
  }

  const teamIds = [homeTeamId, awayTeamId].filter(
    (id): id is number => typeof id === "number" && id > 0,
  );
  if (teamIds.length === 0) {
    return { ok: false, status: 400, message: "Team IDs required" };
  }

  const allowed = await getSessionTeamIds(supabaseAdmin, auth.sessionToken);
  const allowedSet = new Set(allowed);
  if (!teamIds.some((id) => allowedSet.has(id))) {
    return { ok: false, status: 403, message: "No access to these teams" };
  }

  return auth;
}
