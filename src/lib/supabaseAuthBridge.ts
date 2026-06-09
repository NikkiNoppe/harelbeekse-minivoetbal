import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types/auth";

export interface AppSessionEstablishResult {
  user: User;
  sessionToken: string;
  teamIds: number[];
}

function looksLikeEmail(value: string): boolean {
  return value.includes("@");
}

export async function loginWithSupabaseAuthBridge(
  usernameOrEmail: string,
  password: string,
): Promise<AppSessionEstablishResult | null> {
  const loginEmail = looksLikeEmail(usernameOrEmail)
    ? usernameOrEmail.trim()
    : null;

  if (!loginEmail) {
    return null;
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: loginEmail,
    password,
  });
  if (signInError) {
    console.error("Supabase Auth sign-in failed:", signInError.message);
    return null;
  }

  const { data, error } = await supabase.rpc("establish_app_session_from_supabase_auth");
  if (error || !data?.[0]?.session_token) {
    console.error("establish_app_session_from_supabase_auth failed:", error?.message);
    await supabase.auth.signOut();
    return null;
  }

  const row = data[0] as {
    session_token: string;
    user_id: number;
    username: string;
    email: string | null;
    role: string;
    team_ids: number[] | null;
  };

  const teamIds = Array.isArray(row.team_ids) ? row.team_ids : [];
  const teamId = teamIds.length > 0 ? teamIds[0] : undefined;

  const user: User = {
    id: row.user_id,
    username: row.username,
    password: "",
    role: row.role,
    email: row.email || "",
    isSuperAdmin: false,
    ...(teamId !== undefined ? { teamId } : {}),
  };

  return { user, sessionToken: row.session_token, teamIds };
}

export async function restoreSupabaseAuthBridgeSession(): Promise<AppSessionEstablishResult | null> {
  const { data: authData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !authData.session) {
    return null;
  }

  const { data, error } = await supabase.rpc("establish_app_session_from_supabase_auth");
  if (error || !data?.[0]?.session_token) {
    return null;
  }

  const row = data[0] as {
    session_token: string;
    user_id: number;
    username: string;
    email: string | null;
    role: string;
    team_ids: number[] | null;
  };

  const teamIds = Array.isArray(row.team_ids) ? row.team_ids : [];
  const teamId = teamIds.length > 0 ? teamIds[0] : undefined;

  return {
    sessionToken: row.session_token,
    teamIds,
    user: {
      id: row.user_id,
      username: row.username,
      password: "",
      role: row.role,
      email: row.email || "",
      isSuperAdmin: false,
      ...(teamId !== undefined ? { teamId } : {}),
    },
  };
}

export async function signOutSupabaseAuthBridge(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.warn("Supabase Auth sign-out failed:", error);
  }
}
