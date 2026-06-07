import { supabase } from "@/integrations/supabase/client";
import { withUserContext } from "@/lib/supabaseUtils";

export interface FinancialTeamTransaction {
  id: number;
  team_id: number;
  transaction_type: string;
  amount: number;
  description?: string | null;
  cost_setting_id?: number | null;
  match_id?: number | null;
  transaction_date: string;
  cost_settings?: {
    name?: string | null;
    category?: string | null;
    amount?: number | null;
  };
  matches?: {
    unique_number?: string;
    match_date?: string;
    home_team_id?: number;
    away_team_id?: number;
    teams_home?: { team_name: string };
    teams_away?: { team_name: string };
  };
}

const OVERVIEW_SELECT = `
  id,
  team_id,
  amount,
  transaction_date,
  cost_setting_id,
  match_id,
  costs(name, category, amount)
`;

const DETAIL_SELECT = `
  *,
  costs(name, category, amount),
  matches(
    unique_number,
    match_date,
    home_team_id,
    away_team_id,
    teams_home:teams!home_team_id(team_name),
    teams_away:teams!away_team_id(team_name)
  )
`;

function mapOverviewRow(transaction: Record<string, unknown>): FinancialTeamTransaction {
  const costs = transaction.costs as
    | { name?: string; category?: string; amount?: number }
    | null
    | undefined;

  return {
    id: transaction.id as number,
    team_id: transaction.team_id as number,
    transaction_type: costs?.category || "adjustment",
    amount:
      transaction.amount !== null && transaction.amount !== undefined
        ? Number(transaction.amount)
        : typeof costs?.amount === "number"
          ? costs.amount
          : 0,
    description: costs?.name || null,
    cost_setting_id: transaction.cost_setting_id as number | null | undefined,
    match_id: transaction.match_id as number | null | undefined,
    transaction_date: transaction.transaction_date as string,
    cost_settings: costs
      ? { name: costs.name, category: costs.category, amount: costs.amount }
      : undefined,
  };
}

function mapDetailRow(transaction: Record<string, unknown>): FinancialTeamTransaction {
  const base = mapOverviewRow(transaction);
  const matches = transaction.matches as FinancialTeamTransaction["matches"] | null | undefined;
  return { ...base, matches: matches ?? undefined };
}

export async function fetchAllTeamTransactionsOverview(): Promise<FinancialTeamTransaction[]> {
  return withUserContext(async () => {
    let allData: Record<string, unknown>[] = [];
    let from = 0;
    const batchSize = 1000;

    while (true) {
      const { data: batch, error } = await supabase
        .from("team_costs")
        .select(OVERVIEW_SELECT)
        .order("transaction_date", { ascending: false })
        .range(from, from + batchSize - 1);

      if (error) throw error;
      if (!batch?.length) break;

      allData = allData.concat(batch as Record<string, unknown>[]);
      if (batch.length < batchSize) break;
      from += batchSize;
    }

    return allData.map(mapOverviewRow);
  });
}

export async function fetchTeamTransactionsByTeamId(
  teamId: number,
): Promise<FinancialTeamTransaction[]> {
  return withUserContext(async () => {
    const { data, error } = await supabase
      .from("team_costs")
      .select(DETAIL_SELECT)
      .eq("team_id", teamId)
      .order("transaction_date", { ascending: false });

    if (error) throw error;
    return (data || []).map((row) => mapDetailRow(row as Record<string, unknown>));
  });
}
