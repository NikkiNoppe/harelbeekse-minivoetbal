import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchTeamTransactionsByTeamId,
  type FinancialTeamTransaction,
} from "@/services/financial";
import { useOrgQueryScope } from "@/hooks/useOrganization";
import { withOrgQueryKey } from "@/lib/orgQueryKey";

const MIN_LOADING_TIME = 250;
const MAX_LOADING_TIME = 5000;

function getOverviewTransactionsForTeam(
  queryClient: ReturnType<typeof useQueryClient>,
  teamId: number,
  organizationId: number | undefined,
): FinancialTeamTransaction[] | undefined {
  const all = queryClient.getQueryData<FinancialTeamTransaction[]>(
    withOrgQueryKey(["all-team-transactions"], organizationId),
  );
  const filtered = all?.filter((t) => t.team_id === teamId);
  return filtered?.length ? filtered : undefined;
}

export function useTeamFinancialDetailModal(teamId: number | undefined, open: boolean) {
  const queryClient = useQueryClient();
  const { organizationId, orgQueryEnabled } = useOrgQueryScope();
  const [minReady, setMinReady] = useState(false);
  const [loadTimeout, setLoadTimeout] = useState(false);
  const loadStartRef = useRef<number | undefined>(undefined);
  const minTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const maxTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const transactionsQuery = useQuery({
    queryKey: withOrgQueryKey(["team-transactions", teamId], organizationId),
    queryFn: () => fetchTeamTransactionsByTeamId(teamId!),
    enabled: open && !!teamId && orgQueryEnabled,
    staleTime: 0,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    placeholderData: (previous, _prevQuery) => {
      if (previous?.length) return previous;
      if (!teamId) return undefined;
      return getOverviewTransactionsForTeam(queryClient, teamId, organizationId);
    },
    networkMode: "online",
  });

  const teamTransactions = transactionsQuery.data;

  useEffect(() => {
    if (!open) {
      setMinReady(false);
      setLoadTimeout(false);
      loadStartRef.current = undefined;
      return;
    }

    const waitingForData = teamTransactions === undefined && transactionsQuery.isFetching;

    if (waitingForData) {
      if (loadStartRef.current === undefined) {
        loadStartRef.current = Date.now();
        setMinReady(false);
        setLoadTimeout(false);

        if (minTimeoutRef.current) clearTimeout(minTimeoutRef.current);
        if (maxTimeoutRef.current) clearTimeout(maxTimeoutRef.current);

        maxTimeoutRef.current = setTimeout(() => {
          setLoadTimeout(true);
          loadStartRef.current = undefined;
        }, MAX_LOADING_TIME);
      }
      return;
    }

    if (loadStartRef.current !== undefined) {
      const elapsed = Date.now() - loadStartRef.current;
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsed);

      if (maxTimeoutRef.current) {
        clearTimeout(maxTimeoutRef.current);
        maxTimeoutRef.current = undefined;
      }

      if (remainingTime > 0) {
        if (minTimeoutRef.current) clearTimeout(minTimeoutRef.current);
        minTimeoutRef.current = setTimeout(() => {
          setMinReady(true);
          loadStartRef.current = undefined;
          minTimeoutRef.current = undefined;
        }, remainingTime);
      } else {
        setMinReady(true);
        loadStartRef.current = undefined;
      }
    } else {
      setMinReady(true);
    }

    return () => {
      if (minTimeoutRef.current) clearTimeout(minTimeoutRef.current);
      if (maxTimeoutRef.current) clearTimeout(maxTimeoutRef.current);
    };
  }, [open, teamTransactions, transactionsQuery.isFetching]);

  const isListLoading = useMemo(() => {
    if (!open || !teamId) return false;
    if (loadTimeout) return false;
    if (teamTransactions !== undefined) return false;
    return transactionsQuery.isFetching || !minReady;
  }, [
    open,
    teamId,
    loadTimeout,
    teamTransactions,
    transactionsQuery.isFetching,
    minReady,
  ]);

  const isRefreshing =
    teamTransactions !== undefined &&
    transactionsQuery.isFetching &&
    !transactionsQuery.isLoading;

  const showEmpty =
    !isListLoading &&
    !loadTimeout &&
    transactionsQuery.isFetched &&
    !transactionsQuery.isPlaceholderData &&
    !transactionsQuery.isError &&
    (teamTransactions?.length ?? 0) === 0;

  const transactionsError = loadTimeout
    ? { message: "Het laden van transacties duurt te lang (>5 seconden)." }
    : transactionsQuery.error;

  const refetchTransactions = transactionsQuery.refetch;

  return {
    teamTransactions: teamTransactions ?? [],
    isListLoading,
    isRefreshing,
    showEmpty,
    hasError: !!transactionsError,
    transactionsError,
    refetchTransactions,
    isFetched: transactionsQuery.isFetched,
    isPlaceholderData: transactionsQuery.isPlaceholderData,
  };
}

export function prefetchTeamFinancialDetail(
  queryClient: ReturnType<typeof useQueryClient>,
  teamId: number,
  organizationId: number | undefined,
) {
  const queryKey = withOrgQueryKey(["team-transactions", teamId], organizationId);
  const cached = queryClient.getQueryData<FinancialTeamTransaction[]>(queryKey);
  if (cached?.length) return;

  const placeholder = getOverviewTransactionsForTeam(
    queryClient,
    teamId,
    organizationId,
  );

  return queryClient.prefetchQuery({
    queryKey,
    queryFn: () => fetchTeamTransactionsByTeamId(teamId),
    staleTime: 0,
    ...(placeholder ? { initialData: placeholder } : {}),
  });
}
