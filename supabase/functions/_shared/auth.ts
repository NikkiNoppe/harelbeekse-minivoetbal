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

interface MatchTeams {
  homeTeamId: number;
  awayTeamId: number;
}

async function resolveMatchTeams(
  supabaseAdmin: SupabaseClient,
  matchId: number,
  clientHomeTeamId?: number | null,
  clientAwayTeamId?: number | null,
): Promise<MatchTeams | { error: string }> {
  const { data, error } = await supabaseAdmin
    .from("matches")
    .select("home_team_id, away_team_id")
    .eq("match_id", matchId)
    .maybeSingle();

  if (error || !data?.home_team_id || !data?.away_team_id) {
    return { error: "Match not found" };
  }

  const homeTeamId = data.home_team_id as number;
  const awayTeamId = data.away_team_id as number;

  if (
    (typeof clientHomeTeamId === "number" && clientHomeTeamId > 0 && clientHomeTeamId !== homeTeamId) ||
    (typeof clientAwayTeamId === "number" && clientAwayTeamId > 0 && clientAwayTeamId !== awayTeamId)
  ) {
    return { error: "Team IDs do not match match record" };
  }

  return { homeTeamId, awayTeamId };
}

/** Admin, referee, or team manager with access to involved teams (validated against DB when matchId given). */
export async function requireMatchMutationAccess(
  req: Request,
  supabaseAdmin: SupabaseClient,
  homeTeamId?: number | null,
  awayTeamId?: number | null,
  matchId?: number | null,
): Promise<SessionAuthResult & { homeTeamId?: number; awayTeamId?: number }> {
  const auth = await requireSession(req, supabaseAdmin);
  if (!auth.ok) return auth;

  let resolvedHome = homeTeamId;
  let resolvedAway = awayTeamId;

  if (typeof matchId === "number" && matchId > 0) {
    const teams = await resolveMatchTeams(supabaseAdmin, matchId, homeTeamId, awayTeamId);
    if ("error" in teams) {
      return { ok: false, status: 400, message: teams.error };
    }
    resolvedHome = teams.homeTeamId;
    resolvedAway = teams.awayTeamId;
  }

  const teamIds = [resolvedHome, resolvedAway].filter(
    (id): id is number => typeof id === "number" && id > 0,
  );

  if (auth.role === "admin" || auth.role === "referee") {
    return { ...auth, homeTeamId: resolvedHome ?? undefined, awayTeamId: resolvedAway ?? undefined };
  }

  if (auth.role === "player_manager") {
    if (teamIds.length === 0) {
      return { ok: false, status: 400, message: "Team IDs required" };
    }

    const allowed = await getSessionTeamIds(supabaseAdmin, auth.sessionToken);
    const allowedSet = new Set(allowed);

    const hasHome = typeof resolvedHome === "number" && allowedSet.has(resolvedHome);
    const hasAway = typeof resolvedAway === "number" && allowedSet.has(resolvedAway);

    if (!hasHome && !hasAway) {
      return { ok: false, status: 403, message: "No access to this match" };
    }

    if (hasHome && hasAway) {
      return { ...auth, homeTeamId: resolvedHome ?? undefined, awayTeamId: resolvedAway ?? undefined };
    }

    return {
      ok: false,
      status: 403,
      message: "Team manager must manage both teams in this match",
    };
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
