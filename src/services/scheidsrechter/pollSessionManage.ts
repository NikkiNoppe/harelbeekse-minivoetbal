import { supabase } from "@/integrations/supabase/client";
import { getRpcSessionArgs } from "@/lib/authSession";
import type { CreatePollInput, PollMatchDateInput, PollStatus } from "./types";

type PollRpcResult = { success?: boolean; error?: string; poll_id?: number };

async function callManagePoll(
  operation: string,
  payload: Record<string, unknown> = {},
): Promise<PollRpcResult> {
  const { data, error } = await supabase.rpc("manage_poll_for_session", {
    ...getRpcSessionArgs(),
    p_operation: operation,
    p_payload: payload as any,
  });
  if (error) throw error;
  return (data ?? {}) as PollRpcResult;
}

export async function createPollForSession(
  input: CreatePollInput,
  createdBy: number,
): Promise<{ success: boolean; pollId?: number; error?: string }> {
  const result = await callManagePoll("create", {
    poll_month: input.poll_month,
    deadline: input.deadline ?? null,
    status: "draft",
    created_by: createdBy,
    notes: input.notes ?? null,
    match_dates: input.match_dates ?? [],
  });
  if (!result.success) {
    return { success: false, error: result.error ?? "Kon poll niet aanmaken" };
  }
  return { success: true, pollId: result.poll_id };
}

export async function updatePollForSession(
  pollId: number,
  patch: { deadline?: string | null; status?: PollStatus; notes?: string | null },
): Promise<boolean> {
  const result = await callManagePoll("update", { poll_id: pollId, ...patch });
  return !!result.success;
}

export async function addPollMatchDateForSession(
  pollId: number,
  matchDate: PollMatchDateInput,
): Promise<boolean> {
  const result = await callManagePoll("add_match_date", {
    poll_id: pollId,
    match_date: matchDate.match_date,
    location: matchDate.location ?? null,
    time_slot: matchDate.time_slot ?? null,
    match_count: matchDate.match_count ?? 2,
  });
  return !!result.success;
}

export async function removePollMatchDateForSession(matchDateId: number): Promise<boolean> {
  const result = await callManagePoll("remove_match_date", { match_date_id: matchDateId });
  return !!result.success;
}

export async function deletePollForSession(pollId: number): Promise<{ success: boolean; error?: string }> {
  const result = await callManagePoll("delete", { poll_id: pollId });
  return { success: !!result.success, error: result.error };
}
