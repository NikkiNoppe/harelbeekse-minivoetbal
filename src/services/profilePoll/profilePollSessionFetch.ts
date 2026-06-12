import { supabase } from "@/integrations/supabase/client";
import { getRpcSessionArgs } from "@/lib/authSession";

export async function fetchProfilePollsForSession(): Promise<unknown> {
  const { data, error } = await supabase.rpc("get_profile_polls_for_session", {
    ...getRpcSessionArgs(),
  });
  if (error) throw error;
  return data;
}

export async function submitProfilePollResponseForSession(
  pollId: number,
  optionIds: string[],
): Promise<unknown> {
  const { data, error } = await supabase.rpc(
    "submit_profile_poll_response_for_session",
    {
      ...getRpcSessionArgs(),
      p_poll_id: pollId,
      p_option_ids: optionIds,
    },
  );
  if (error) throw error;
  return data;
}

export async function manageProfilePollForSession(
  operation: "create" | "update" | "close" | "delete",
  pollId?: number,
  payload?: Record<string, unknown>,
): Promise<unknown> {
  const { data, error } = await supabase.rpc("manage_profile_poll_for_session", {
    ...getRpcSessionArgs(),
    p_operation: operation,
    p_poll_id: pollId ?? null,
    p_payload: (payload ?? {}) as never,
  });
  if (error) throw error;
  return data;
}
