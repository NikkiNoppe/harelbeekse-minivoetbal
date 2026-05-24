import { useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMatchCostSync } from "@/hooks/useMatchCostSync";
import {
  computeTeamFinances,
  type TeamFinancesSummary,
} from "@/services/financial/teamCostCategories";

interface Team {
  team_id: number;
  team_name: string;
}

interface TeamTransaction {
  team_id: number;
  amount: number;
  description?: string | null;
  transaction_date: string;
  cost_settings?: {
    name?: string | null;
    category?: string | null;
  };
  matches?: {
    unique_number?: string;
    match_date?: string;
  };
}

export type TeamFinances = TeamFinancesSummary;

export interface FinancialStatistics {
  totalTeams: number;
  totalBalance: number;
  averageBalance: number;
  positiveTeams: number;
  negativeTeams: number;
  totalRevenue: number;
  totalExpenses: number;
}

async function fetchAllTeamTransactions(): Promise<TeamTransaction[]> {
  let allData: any[] = [];
  let from = 0;
  const batchSize = 1000;

  while (true) {
    const { data: batch, error } = await supabase
      .from("team_costs")
      .select(`
        *,
        costs(name, category, amount),
        matches(unique_number, match_date)
      `)
      .order("transaction_date", { ascending: false })
      .range(from, from + batchSize - 1);

    if (error) throw error;
    if (!batch || batch.length === 0) break;

    allData = allData.concat(batch);
    if (batch.length < batchSize) break;
    from += batchSize;
  }

  return allData.map((transaction) => ({
    team_id: transaction.team_id,
    amount:
      transaction.amount ??
      (typeof transaction.costs?.amount === "number" ? transaction.costs.amount : 0),
    description: transaction.costs?.name || null,
    transaction_date: transaction.transaction_date,
    cost_settings: transaction.costs
      ? {
          name: transaction.costs.name,
          category: transaction.costs.category,
        }
      : undefined,
    matches: transaction.matches
      ? {
          unique_number: transaction.matches.unique_number,
          match_date: transaction.matches.match_date,
        }
      : undefined,
  }));
}

export const useFinancialData = (options?: { enableSync?: boolean }) => {
  const enableSync = options?.enableSync ?? true;
  const { syncStatus, forceResync } = useMatchCostSync(enableSync);

  const teamsQuery = useQuery({
    queryKey: ["teams-financial"],
    queryFn: async (): Promise<Team[]> => {
      const { data, error } = await supabase
        .from("teams")
        .select("team_id, team_name")
        .order("team_name");

      if (error) throw error;
      return (data || []) as Team[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const transactionsQuery = useQuery({
    queryKey: ["all-team-transactions"],
    queryFn: fetchAllTeamTransactions,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const teamFinancesById = useMemo(() => {
    const map = new Map<number, TeamFinancesSummary>();
    const teams = teamsQuery.data;
    const transactions = transactionsQuery.data;
    if (!teams || !transactions) return map;

    for (const team of teams) {
      map.set(team.team_id, computeTeamFinances(team.team_id, transactions));
    }
    return map;
  }, [teamsQuery.data, transactionsQuery.data]);

  const calculateTeamFinances = (teamId: number): TeamFinancesSummary =>
    teamFinancesById.get(teamId) ?? {
      startCapital: 0,
      fieldCosts: 0,
      refereeCosts: 0,
      adminCosts: 0,
      fines: 0,
      adjustments: 0,
      currentBalance: 0,
    };

  const teamsWithFinances = useMemo(
    () =>
      (teamsQuery.data || []).map((team) => ({
        ...team,
        finances: teamFinancesById.get(team.team_id) ?? calculateTeamFinances(team.team_id),
      })),
    [teamsQuery.data, teamFinancesById],
  );

  const financialStatistics = useMemo((): FinancialStatistics => {
    const teams = teamsQuery.data || [];
    const transactions = transactionsQuery.data || [];

    if (!teams.length) {
      return {
        totalTeams: 0,
        totalBalance: 0,
        averageBalance: 0,
        positiveTeams: 0,
        negativeTeams: 0,
        totalRevenue: 0,
        totalExpenses: 0,
      };
    }

    const balances = teams.map((team) => calculateTeamFinances(team.team_id).currentBalance);
    const totalBalance = balances.reduce((sum, value) => sum + value, 0);

    const totalRevenue = transactions
      .filter((t) => t.cost_settings?.category === "deposit")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpenses = transactions
      .filter((t) => ["match_cost", "penalty"].includes(t.cost_settings?.category || ""))
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

    return {
      totalTeams: teams.length,
      totalBalance,
      averageBalance: teams.length > 0 ? totalBalance / teams.length : 0,
      positiveTeams: balances.filter((value) => value > 0).length,
      negativeTeams: balances.filter((value) => value < 0).length,
      totalRevenue,
      totalExpenses,
    };
  }, [teamsQuery.data, transactionsQuery.data, teamFinancesById]);

  const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
    }).format(amount);

  const isInitialLoad =
    !teamsQuery.data?.length && (teamsQuery.isLoading || transactionsQuery.isLoading);
  const isRefreshing =
    !!teamsQuery.data?.length &&
    (transactionsQuery.isFetching || syncStatus === "syncing");

  return {
    teams: teamsQuery.data || [],
    transactions: transactionsQuery.data || [],
    teamsWithFinances,
    financialStatistics,
    calculateTeamFinances,
    formatCurrency,
    syncStatus,
    forceResync,
    isInitialLoad,
    isRefreshing,
    teamsLoading: teamsQuery.isLoading,
    transactionsLoading: transactionsQuery.isLoading,
    isLoading: teamsQuery.isLoading || transactionsQuery.isLoading,
    teamsError: teamsQuery.error,
    transactionsError: transactionsQuery.error,
    hasError: !!teamsQuery.error || !!transactionsQuery.error,
    refetchTransactions: transactionsQuery.refetch,
    refetchAll: () => Promise.all([teamsQuery.refetch(), transactionsQuery.refetch()]),
  };
};
