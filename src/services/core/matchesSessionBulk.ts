import { supabase } from "@/integrations/supabase/client";
import { getRpcSessionArgs } from "@/lib/authSession";

type BulkResult = { success: boolean; error?: string; inserted?: number; deleted?: number };

export async function bulkInsertMatchesForSession(
  rows: Record<string, unknown>[],
): Promise<BulkResult> {
  const { data, error } = await supabase.rpc("bulk_manage_matches_for_session", {
    ...getRpcSessionArgs(),
    p_operation: "insert",
    p_payload: rows as any,
  });
  if (error) throw error;
  return data as BulkResult;
}

export async function bulkDeleteMatchesByUniqueNumbers(
  uniqueNumbers: string[],
  isCupMatch = false,
): Promise<BulkResult> {
  const { data, error } = await supabase.rpc("bulk_manage_matches_for_session", {
    ...getRpcSessionArgs(),
    p_operation: "delete_by_unique_numbers",
    p_payload: { unique_numbers: uniqueNumbers, is_cup_match: isCupMatch },
  });
  if (error) throw error;
  return data as BulkResult;
}

export async function bulkDeleteMatchesByIds(matchIds: number[]): Promise<BulkResult> {
  const { data, error } = await supabase.rpc("bulk_manage_matches_for_session", {
    ...getRpcSessionArgs(),
    p_operation: "delete_by_match_ids",
    p_payload: { match_ids: matchIds },
  });
  if (error) throw error;
  return data as BulkResult;
}

export async function bulkDeleteCompetitionMatches(): Promise<BulkResult> {
  const { data, error } = await supabase.rpc("bulk_manage_matches_for_session", {
    ...getRpcSessionArgs(),
    p_operation: "delete_competition",
    p_payload: {},
  });
  if (error) throw error;
  return data as BulkResult;
}

export async function bulkDeleteCupMatches(): Promise<BulkResult> {
  const { data, error } = await supabase.rpc("bulk_manage_matches_for_session", {
    ...getRpcSessionArgs(),
    p_operation: "delete_cup",
    p_payload: {},
  });
  if (error) throw error;
  return data as BulkResult;
}

export async function fetchMatchesForSession(
  filters: Record<string, unknown> = {},
): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabase.rpc("get_matches_for_session", {
    ...getRpcSessionArgs(),
    p_filters: filters as any,
  });
  if (error) throw error;
  return (data ?? []) as Record<string, unknown>[];
}
