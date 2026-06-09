import { supabase } from "@/integrations/supabase/client";
import { getRpcSessionArgs } from "@/lib/authSession";

export interface UserProfileSessionData {
  user_id: number;
  username: string;
  email: string;
  role: string;
  teams: Array<{
    team_id: number;
    team_name: string;
    club_colors?: string;
    contact_person?: string;
    contact_email?: string;
    contact_phone?: string;
  }>;
  team_users: Array<{ team_id: number; team_name: string }>;
}

export async function fetchUserProfileForSession(): Promise<UserProfileSessionData | null> {
  const { data, error } = await supabase.rpc("get_user_profile_for_session", getRpcSessionArgs());
  if (error) throw error;
  if (!data) return null;
  return data as UserProfileSessionData;
}

export async function fetchTeamBalanceForSession(teamId: number): Promise<number | null> {
  const { data, error } = await supabase.rpc("get_team_balance_for_session", {
    ...getRpcSessionArgs(),
    p_team_id: teamId,
  });
  if (error) throw error;
  return data as number | null;
}

export async function fetchTeamRecipientsForSession(teamIds: number[]) {
  const { data, error } = await supabase.rpc("get_team_recipients_for_session", {
    ...getRpcSessionArgs(),
    p_team_ids: teamIds,
  });
  if (error) throw error;
  return data ?? [];
}
