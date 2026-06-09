import { supabase } from "@/integrations/supabase/client";
import { getRpcSessionArgs } from "@/lib/authSession";

export interface TeamCostsRevision {
  row_count: number;
  max_id: number;
  amount_sum: number;
}

export function teamCostsRevisionFingerprint(revision: TeamCostsRevision): string {
  return `${revision.row_count}:${revision.max_id}:${revision.amount_sum}`;
}

export async function fetchTeamCostsRevision(): Promise<TeamCostsRevision | null> {
  const { data, error } = await supabase.rpc("get_team_costs_revision_for_session", {
    ...getRpcSessionArgs(),
  });
  if (error) return null;

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    return { row_count: 0, max_id: 0, amount_sum: 0 };
  }

  return {
    row_count: Number(row.row_count ?? 0),
    max_id: Number(row.max_id ?? 0),
    amount_sum: Number(row.amount_sum ?? 0),
  };
}
