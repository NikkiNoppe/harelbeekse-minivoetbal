import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { withUserContext } from "@/lib/supabaseUtils";
import { useMatchCostSync } from "@/hooks/useMatchCostSync";
import {
  computeTeamFinances,
  type TeamFinancesSummary,
} from "@/services/financial/teamCostCategories";
import {
  fetchAllTeamTransactionsOverview,
  type FinancialTeamTransaction,
} from "@/services/financial/financialTransactionsFetch";
import { invalidateFinancialTransactionQueries } from "@/services/financial";

export type { FinancialTeamTransaction };

interface Team {
  team_id: number;
  team_name: string;
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

const MIN_LOADING_TIME = 250;
const MAX_LOADING_TIME = 5000;

function useMinLoadingGate(isWaiting: boolean) {
  const [minReady, setMinReady] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const startRef = useRef<number | undefined>(undefined);
  const minTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const maxTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (isWaiting) {
      if (startRef.current === undefined) {
        startRef.current = Date.now();
        setMinReady(false);
        setTimedOut(false);
        if (minTimeoutRef.current) clearTimeout(minTimeoutRef.current);
        if (maxTimeoutRef.current) clearTimeout(maxTimeoutRef.current);
        maxTimeoutRef.current = setTimeout(() => {
          setTimedOut(true);
          startRef.current = undefined;
        }, MAX_LOADING_TIME);
      }
      return;
    }

    if (startRef.current !== undefined) {
      const elapsed = Date.now() - startRef.current;
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsed);
      if (maxTimeoutRef.current) {
        clearTimeout(maxTimeoutRef.current);
        maxTimeoutRef.current = undefined;
      }
      if (remainingTime > 0) {
        if (minTimeoutRef.current) clearTimeout(minTimeoutRef.current);
        minTimeoutRef.current = setTimeout(() => {
          setMinReady(true);
          startRef.current = undefined;
          minTimeoutRef.current = undefined;
        }, remainingTime);
      } else {
        setMinReady(true);
        startRef.current = undefined;
      }
    } else {
      setMinReady(true);
    }

    return () => {
      if (minTimeoutRef.current) clearTimeout(minTimeoutRef.current);
      if (maxTimeoutRef.current) clearTimeout(maxTimeoutRef.current);
    };
  }, [isWaiting]);

  return { minReady, timedOut };
}

export const useFinancialData = (options?: { enableSync?: boolean }) => {
  const enableSync = options?.enableSync ?? true;
  const queryClient = useQueryClient();
  const { syncStatus, forceResync, invalidateFinancialQueries, runBackgroundSync } = useMatchCostSync(
    enableSync,
    undefined,
    { autoRun: false },
  );

  const teamsQuery = useQuery({
    queryKey: ["teams-financial"],
    queryFn: async (): Promise<Team[]> => {
      return withUserContext(async () => {
        const { data, error } = await supabase
          .from("teams")
          .select("team_id, team_name")
          .order("team_name");

        if (error) throw error;
        return (data || []) as Team[];
      });
    },
    staleTime: 0,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    placeholderData: keepPreviousData,
    networkMode: "online",
  });

  const transactionsQuery = useQuery({
    queryKey: ["all-team-transactions"],
    queryFn: fetchAllTeamTransactionsOverview,
    staleTime: 0,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    placeholderData: keepPreviousData,
    networkMode: "online",
  });

  const hasTeams = teamsQuery.data !== undefined;
  const hasTransactions = transactionsQuery.data !== undefined;

  const waitingForTeams = !hasTeams && teamsQuery.isFetching;
  const waitingForTransactions = hasTeams && !hasTransactions && transactionsQuery.isFetching;

  const teamsLoadingGate = useMinLoadingGate(waitingForTeams);
  const transactionsLoadingGate = useMinLoadingGate(waitingForTransactions);

  useEffect(() => {
    if (!enableSync || !transactionsQuery.isFetched) return;
    const timeoutId = window.setTimeout(() => {
      void runBackgroundSync(false);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [enableSync, transactionsQuery.isFetched, runBackgroundSync]);

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

  const calculateTeamFinances = useCallback(
    (teamId: number): TeamFinancesSummary | null => {
      if (!hasTransactions) return null;
      return (
        teamFinancesById.get(teamId) ?? {
          startCapital: 0,
          fieldCosts: 0,
          refereeCosts: 0,
          adminCosts: 0,
          fines: 0,
          adjustments: 0,
          currentBalance: 0,
        }
      );
    },
    [hasTransactions, teamFinancesById],
  );

  const teamsWithFinances = useMemo(() => {
    const teams = teamsQuery.data;
    if (!teams) return undefined;
    return teams.map((team) => ({
      ...team,
      finances: calculateTeamFinances(team.team_id),
    }));
  }, [teamsQuery.data, calculateTeamFinances]);

  const financialStatistics = useMemo((): FinancialStatistics | null => {
    const teams = teamsQuery.data;
    const transactions = transactionsQuery.data;
    if (!teams || !transactions) return null;

    const balances = teams.map(
      (team) => calculateTeamFinances(team.team_id)?.currentBalance ?? 0,
    );
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
  }, [teamsQuery.data, transactionsQuery.data, calculateTeamFinances]);

  const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
    }).format(amount);

  const isListLoading =
    !teamsLoadingGate.timedOut &&
    !hasTeams &&
    (waitingForTeams || !teamsLoadingGate.minReady);

  const isAmountsLoading =
    !transactionsLoadingGate.timedOut &&
    hasTeams &&
    !hasTransactions &&
    (waitingForTransactions || !transactionsLoadingGate.minReady);

  const isRefreshing =
    (hasTransactions && transactionsQuery.isFetching && !transactionsQuery.isLoading) ||
    (syncStatus === "syncing" && !isListLoading && !isAmountsLoading);

  const teamsError = teamsLoadingGate.timedOut
    ? { message: "Het laden van teams duurt te lang (>5 seconden)." }
    : teamsQuery.error;

  const transactionsError = transactionsLoadingGate.timedOut
    ? { message: "Het laden van financiële gegevens duurt te lang (>5 seconden)." }
    : transactionsQuery.error;

  const showTeamsEmpty =
    hasTeams &&
    teamsQuery.isFetched &&
    !teamsQuery.isPlaceholderData &&
    (teamsQuery.data?.length ?? 0) === 0;

  const showTransactionsError =
    !!transactionsError && !hasTransactions && hasTeams && !isAmountsLoading;

  const hasBlockingError = !!teamsError && !hasTeams;

  const refreshInstantly = useCallback(async () => {
    await invalidateFinancialTransactionQueries(queryClient);
    await Promise.all([teamsQuery.refetch(), transactionsQuery.refetch()]);
  }, [queryClient, teamsQuery, transactionsQuery]);

  return {
    teams: teamsQuery.data,
    transactions: transactionsQuery.data,
    teamsWithFinances,
    financialStatistics,
    calculateTeamFinances,
    formatCurrency,
    syncStatus,
    forceResync,
    invalidateFinancialQueries,
    refreshInstantly,
    isListLoading,
    isAmountsLoading,
    isRefreshing,
    showTeamsEmpty,
    showTransactionsError,
    teamsLoading: teamsQuery.isLoading,
    transactionsLoading: transactionsQuery.isLoading,
    isLoading: isListLoading,
    teamsError,
    transactionsError,
    hasBlockingError,
    hasError: hasBlockingError,
    refetchTransactions: transactionsQuery.refetch,
    refetchAll: () => Promise.all([teamsQuery.refetch(), transactionsQuery.refetch()]),
  };
};
