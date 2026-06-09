import { supabase } from "@/integrations/supabase/client";
import { getRpcSessionArgs } from "@/lib/authSession";

export interface RefereeAvailabilityRow {
  match_id: number | null;
  is_available: boolean | null;
  poll_group_id: string | null;
  poll_month: string | null;
}

async function callManageRefereeMatches(
  operation: string,
  payload: Record<string, unknown> = {},
): Promise<unknown> {
  const { data, error } = await supabase.rpc("manage_referee_matches_for_session", {
    ...getRpcSessionArgs(),
    p_operation: operation,
    p_payload: payload as any,
  });
  if (error) throw error;
  return data;
}

export async function fetchRefereeAvailabilityForSession(
  filters: { refereeId?: number; matchIds?: number[]; pollMonth?: string },
): Promise<RefereeAvailabilityRow[]> {
  const payload: Record<string, unknown> = {};
  if (filters.refereeId !== undefined) payload.referee_id = filters.refereeId;
  if (filters.matchIds?.length) payload.match_ids = filters.matchIds;
  if (filters.pollMonth) payload.poll_month = filters.pollMonth;

  const data = await callManageRefereeMatches("get_availability", payload);
  return Array.isArray(data) ? (data as RefereeAvailabilityRow[]) : [];
}

export async function upsertRefereeAvailabilityForSession(
  row: {
    refereeId?: number;
    matchId?: number | null;
    pollGroupId?: string | null;
    pollMonth?: string | null;
    isAvailable: boolean | null;
  },
): Promise<boolean> {
  const payload: Record<string, unknown> = {
    is_available: row.isAvailable,
  };
  if (row.refereeId !== undefined) payload.referee_id = row.refereeId;
  if (row.matchId != null) payload.match_id = row.matchId;
  if (row.pollGroupId) payload.poll_group_id = row.pollGroupId;
  if (row.pollMonth) payload.poll_month = row.pollMonth;

  const result = (await callManageRefereeMatches("upsert_availability", payload)) as {
    success?: boolean;
  };
  return !!result?.success;
}
