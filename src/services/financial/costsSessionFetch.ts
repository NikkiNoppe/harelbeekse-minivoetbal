import { supabase } from "@/integrations/supabase/client";
import { getRpcSessionArgs } from "@/lib/authSession";
import type { CostSetting } from "./costSettingsService";

export async function fetchCostsForSession(category?: CostSetting["category"]): Promise<CostSetting[]> {
  const { data, error } = await supabase.rpc("get_costs_for_session", {
    ...getRpcSessionArgs(),
    p_category: category ?? null,
  });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    amount: Number(row.amount ?? 0),
    category: row.category as CostSetting["category"],
  }));
}
