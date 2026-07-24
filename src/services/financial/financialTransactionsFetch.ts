import { supabase } from "@/integrations/supabase/client";
import { getRpcSessionArgs } from "@/lib/authSession";

export interface FinancialTeamTransaction {
  id: number;
  team_id: number;
  transaction_type: string;
  amount: number;
  description?: string | null;
  cost_setting_id?: number | null;
  match_id?: number | null;
  transaction_date: string;
  season_label?: string | null;
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

interface TeamCostTransactionRow {
  id: number;
  team_id: number;
  cost_setting_id: number | null;
  match_id: number | null;
  amount: number | null;
  transaction_date: string;
  cost_name: string | null;
  cost_category: string | null;
  cost_default_amount: number | null;
  match_unique_number?: string | null;
  match_date?: string | null;
  home_team_id?: number | null;
  away_team_id?: number | null;
  home_team_name?: string | null;
  away_team_name?: string | null;
  season_label?: string | null;
}

function mapOverviewRow(row: TeamCostTransactionRow): FinancialTeamTransaction {
  return {
    id: row.id,
    team_id: row.team_id,
    transaction_type: row.cost_category || "adjustment",
    amount:
      row.amount !== null && row.amount !== undefined
        ? Number(row.amount)
        : typeof row.cost_default_amount === "number"
          ? row.cost_default_amount
          : 0,
    description: row.cost_name || null,
    cost_setting_id: row.cost_setting_id,
    match_id: row.match_id,
    transaction_date: row.transaction_date,
    season_label: row.season_label ?? null,
    cost_settings:
      row.cost_name || row.cost_category
        ? {
            name: row.cost_name,
            category: row.cost_category,
            amount: row.cost_default_amount,
          }
        : undefined,
  };
}

function mapDetailRow(row: TeamCostTransactionRow): FinancialTeamTransaction {
  const base = mapOverviewRow(row);
  if (!row.match_id) return base;

  return {
    ...base,
    matches: {
      unique_number: row.match_unique_number ?? undefined,
      match_date: row.match_date ?? undefined,
      home_team_id: row.home_team_id ?? undefined,
      away_team_id: row.away_team_id ?? undefined,
      teams_home: row.home_team_name ? { team_name: row.home_team_name } : undefined,
      teams_away: row.away_team_name ? { team_name: row.away_team_name } : undefined,
    },
  };
}

/** PostgREST default max rows per request — overview has 1300+ team_costs rows. */
const RPC_PAGE_SIZE = 1000;

async function fetchTeamCostTransactions(
  teamId?: number,
): Promise<TeamCostTransactionRow[]> {
  const rows: TeamCostTransactionRow[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .rpc("get_team_costs_transactions", {
        ...getRpcSessionArgs(),
        p_team_id: teamId ?? null,
      })
      .range(offset, offset + RPC_PAGE_SIZE - 1);

    if (error) throw error;

    const batch = (data as TeamCostTransactionRow[]) ?? [];
    rows.push(...batch);

    if (batch.length < RPC_PAGE_SIZE) break;
    offset += RPC_PAGE_SIZE;
  }

  return rows;
}

export async function fetchAllTeamTransactionsOverview(): Promise<FinancialTeamTransaction[]> {
  const rows = await fetchTeamCostTransactions();
  return rows.map(mapOverviewRow);
}

export async function fetchTeamTransactionsByTeamId(
  teamId: number,
): Promise<FinancialTeamTransaction[]> {
  const rows = await fetchTeamCostTransactions(teamId);
  return rows.map(mapDetailRow);
}
