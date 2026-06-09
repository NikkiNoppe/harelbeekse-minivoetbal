import { supabase } from "@/integrations/supabase/client";
import { getRpcSessionArgs } from "@/lib/authSession";
import type { Referee } from "@/services/core/refereeService";

export interface ScheidsScheduleRow {
  match_id: number;
  match_date: string;
  location: string | null;
  home_team_id: number | null;
  away_team_id: number | null;
  home_team_name: string | null;
  away_team_name: string | null;
  assigned_referee_id: number | null;
  poll_group_id?: string | null;
  referee?: string | null;
}

export interface RefereeAssignmentRow {
  id: number;
  match_id: number;
  referee_id: number;
  assigned_by: number | null;
  assigned_at: string;
  match_date: string | null;
  location: string | null;
  home_team_name: string | null;
  away_team_name: string | null;
}

export interface RefereeAvailabilityRow {
  user_id: number;
  match_id: number | null;
  poll_group_id: string;
  is_available: boolean;
}

export interface ScheidsAssignmentStatRow {
  referee_id: number;
  referee_name: string;
  total_assignments: number;
}

export interface ScheidsAvailabilityStats {
  total_referees: number;
  responded_count: number;
  available_by_date: Record<string, number>;
}

export interface ScheidsPollOverview {
  poll_id: number;
  poll_month: string;
  deadline: string | null;
  status: string;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  notes: string | null;
  match_dates_count: number;
  referees_responded: number;
  referees_total: number;
  matches_assigned: number;
  matches_total: number;
}

export async function fetchRefereesForSession(userId?: number): Promise<Referee[]> {
  const { data, error } = await supabase.rpc("get_referees_for_session", {
    ...getRpcSessionArgs(),
    p_user_id: userId ?? null,
  });
  if (error) throw error;
  return (data as Referee[]) ?? [];
}

export async function fetchScheidsScheduleForMonth(month: string): Promise<ScheidsScheduleRow[]> {
  const { data, error } = await supabase.rpc("get_scheids_schedule_for_session", {
    ...getRpcSessionArgs(),
    p_month: month,
  });
  if (error) throw error;
  return (data as ScheidsScheduleRow[]) ?? [];
}

export async function fetchRefereeAssignmentsForSession(
  month?: string,
): Promise<RefereeAssignmentRow[]> {
  const { data, error } = await supabase.rpc("get_referee_assignments_for_session", {
    ...getRpcSessionArgs(),
    p_month: month ?? null,
  });
  if (error) throw error;
  return (data as RefereeAssignmentRow[]) ?? [];
}

export async function fetchRefereeAvailabilityForSession(
  pollMonth: string,
): Promise<RefereeAvailabilityRow[]> {
  const { data, error } = await supabase.rpc("get_referee_availability_for_session", {
    ...getRpcSessionArgs(),
    p_poll_month: pollMonth,
  });
  if (error) throw error;
  return (data as RefereeAvailabilityRow[]) ?? [];
}

export async function fetchAvailableRefereesForMatch(matchId: number) {
  const { data, error } = await supabase.rpc("get_available_referees_for_match", {
    ...getRpcSessionArgs(),
    p_match_id: matchId,
  });
  if (error) throw error;
  return data ?? [];
}

export async function fetchScheidsAssignmentStats(
  month?: string,
): Promise<ScheidsAssignmentStatRow[]> {
  const { data, error } = await supabase.rpc("get_scheids_assignment_stats_for_session", {
    ...getRpcSessionArgs(),
    p_month: month ?? null,
  });
  if (error) throw error;
  return (data as ScheidsAssignmentStatRow[]) ?? [];
}

export async function fetchScheidsAvailabilityStats(
  pollMonth: string,
): Promise<ScheidsAvailabilityStats> {
  const { data, error } = await supabase.rpc("get_scheids_availability_stats_for_session", {
    ...getRpcSessionArgs(),
    p_poll_month: pollMonth,
  });
  if (error) throw error;
  const stats = data as unknown as ScheidsAvailabilityStats | null;
  return stats ?? {
    total_referees: 0,
    responded_count: 0,
    available_by_date: {},
  };
}

export async function fetchScheidsPollOverview(
  pollId: number,
): Promise<ScheidsPollOverview | null> {
  const { data, error } = await supabase.rpc("get_scheids_poll_overview_for_session", {
    ...getRpcSessionArgs(),
    p_poll_id: pollId,
  });
  if (error) throw error;
  return (data as unknown as ScheidsPollOverview | null) ?? null;
}

export async function fetchMonthlyPollsForSession() {
  const { data, error } = await supabase.rpc("get_monthly_polls_for_session", {
    ...getRpcSessionArgs(),
  });
  if (error) throw error;
  return data ?? [];
}

export async function fetchPollMatchDateKeysForSession(pollMonth: string) {
  const { data, error } = await supabase.rpc("get_poll_match_dates_for_session", {
    ...getRpcSessionArgs(),
    p_poll_month: pollMonth,
  });
  if (error) throw error;
  return (data ?? []) as Array<{ match_date: string; location: string | null }>;
}

export async function fetchScheidsWorkloadStats(pollMonth: string): Promise<
  Map<number, { monthCount: number; seasonCount: number }>
> {
  const { data, error } = await supabase.rpc("get_scheids_workload_stats_for_session", {
    ...getRpcSessionArgs(),
    p_poll_month: pollMonth,
  });
  if (error) throw error;
  const map = new Map<number, { monthCount: number; seasonCount: number }>();
  for (const row of (data as Array<{
    referee_id: number;
    month_count: number;
    season_count: number;
  }>) ?? []) {
    map.set(row.referee_id, {
      monthCount: row.month_count,
      seasonCount: row.season_count,
    });
  }
  return map;
}
