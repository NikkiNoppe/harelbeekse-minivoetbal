import { supabase } from "@/integrations/supabase/client";
import { getRpcSessionArgs } from "@/lib/authSession";

export async function fetchProfilePollsForSession(
  organizationId: number,
): Promise<unknown> {
  const { data, error } = await supabase.rpc("get_profile_polls_for_session", {
    ...getRpcSessionArgs(),
    p_organization_id: organizationId,
  });
  if (error) throw error;
  return data;
}

export async function submitProfilePollResponseForSession(
  organizationId: number,
  pollId: number,
  optionIds: string[],
): Promise<unknown> {
  const { data, error } = await supabase.rpc(
    "submit_profile_poll_response_for_session",
    {
      ...getRpcSessionArgs(),
      p_organization_id: organizationId,
      p_poll_id: pollId,
      p_option_ids: optionIds,
    },
  );
  if (error) throw error;
  return data;
}

export async function manageProfilePollForSession(
  organizationId: number,
  operation: "create" | "update" | "close" | "delete",
  pollId?: number,
  payload?: Record<string, unknown>,
): Promise<unknown> {
  const { data, error } = await supabase.rpc("manage_profile_poll_for_session", {
    ...getRpcSessionArgs(),
    p_organization_id: organizationId,
    p_operation: operation,
    p_poll_id: pollId ?? null,
    p_payload: (payload ?? {}) as never,
  });
  if (error) throw error;
  return data;
}
