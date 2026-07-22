import { useCallback, useEffect, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { FINANCIAL_REVISION_KEY } from "@/hooks/useFinancialData";
import { useMatchCostSync } from "@/hooks/useMatchCostSync";
import { useOrgQueryScope } from "@/hooks/useOrganization";
import { withOrgQueryKey } from "@/lib/orgQueryKey";
import {
  fetchTeamCostsRevision,
  teamCostsRevisionFingerprint,
} from "@/services/financial/financialRevisionFetch";
import { monthlyReportsService, type SeasonData } from "@/services/financial";

const SEASON_REPORT_INVALIDATE_KEYS = [
  ["all-team-transactions"],
  ["season-report"],
  ["available-seasons"],
  ["team-costs-revision"],
] as const;

function resolveReportDates(selectedSeasonYear: number, selectedMonth: number | null) {
  if (selectedMonth === null) {
    return {
      seasonYear: selectedSeasonYear,
      actualMonth: undefined as number | undefined,
      actualYear: undefined as number | undefined,
    };
  }
  if (selectedMonth <= 12) {
    return { seasonYear: selectedSeasonYear, actualMonth: selectedMonth, actualYear: selectedSeasonYear };
  }
  return {
    seasonYear: selectedSeasonYear,
    actualMonth: selectedMonth - 12,
    actualYear: selectedSeasonYear + 1,
  };
}

function getCurrentSeasonYear() {
  const now = new Date();
  const year = now.getFullYear();
  return now.getMonth() >= 6 ? year : year - 1;
}

export function useFinancialSeasonReportModal(open: boolean) {
  const queryClient = useQueryClient();
  const { organizationId, orgQueryEnabled } = useOrgQueryScope();
  const currentSeasonYear = getCurrentSeasonYear();
  const [selectedSeasonYear, setSelectedSeasonYear] = useState(currentSeasonYear);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  const refreshReportQueries = useCallback(async () => {
    await Promise.all(
      SEASON_REPORT_INVALIDATE_KEYS.map((queryKey) =>
        queryClient.invalidateQueries({ queryKey: [...queryKey] }),
      ),
    );
  }, [queryClient]);

  const { syncStatus, forceResync, runBackgroundSync } = useMatchCostSync(
    open,
    SEASON_REPORT_INVALIDATE_KEYS,
    { autoRun: false },
  );

  const revisionQuery = useQuery({
    queryKey: withOrgQueryKey(["team-costs-revision"], organizationId),
    queryFn: fetchTeamCostsRevision,
    enabled: open && orgQueryEnabled,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    networkMode: "online",
  });

  const { data: availableSeasons, isLoading: isSeasonsLoading, isFetched: isSeasonsFetched } = useQuery({
    queryKey: withOrgQueryKey(["available-seasons"], organizationId),
    queryFn: monthlyReportsService.getAvailableSeasons,
    enabled: open && orgQueryEnabled,
    staleTime: 0,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    networkMode: "online",
  });

  useEffect(() => {
    if (!availableSeasons?.length) return;
    const isCurrentSeasonAvailable = availableSeasons.some((s) => s.startYear === selectedSeasonYear);
    if (!isCurrentSeasonAvailable) {
      setSelectedSeasonYear(availableSeasons[0].startYear);
    }
  }, [availableSeasons, selectedSeasonYear]);

  const seasonsAvailable = !!availableSeasons && availableSeasons.length > 0;

  const {
    data: report,
    isLoading: isReportLoading,
    isFetching: isReportFetching,
    isFetched: isReportFetched,
    error,
    refetch: refetchReport,
  } = useQuery({
    queryKey: withOrgQueryKey(["season-report", selectedSeasonYear, selectedMonth], organizationId),
    queryFn: async () => {
      const { seasonYear, actualMonth, actualYear } = resolveReportDates(selectedSeasonYear, selectedMonth);
      return monthlyReportsService.getSeasonReport(seasonYear, actualMonth, actualYear);
    },
    enabled: open && orgQueryEnabled && seasonsAvailable,
    retry: 2,
    staleTime: 0,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    placeholderData: keepPreviousData,
    networkMode: "online",
  });

  useEffect(() => {
    if (!open) return;
    void refreshReportQueries();
  }, [open, refreshReportQueries]);

  useEffect(() => {
    const revision = revisionQuery.data;
    if (!open || !revision) return;

    const fingerprint = teamCostsRevisionFingerprint(revision);
    const stored = localStorage.getItem(FINANCIAL_REVISION_KEY);

    if (stored !== null && stored !== fingerprint) {
      void refreshReportQueries();
    }
    localStorage.setItem(FINANCIAL_REVISION_KEY, fingerprint);
  }, [open, revisionQuery.data, refreshReportQueries]);

  useEffect(() => {
    if (!open || !isReportFetched) return;
    const timeoutId = window.setTimeout(() => {
      void runBackgroundSync(false);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [open, isReportFetched, runBackgroundSync]);

  useEffect(() => {
    if (syncStatus !== "synced") return;
    void refreshReportQueries();
    void refetchReport();
  }, [syncStatus, refreshReportQueries, refetchReport]);

  const isInitialLoad =
    open &&
    (isSeasonsLoading || (seasonsAvailable && !report && isReportLoading));

  const isRefreshing =
    open && !!report && (isReportFetching || syncStatus === "syncing");

  const seasons: { year: number; label: string }[] =
    availableSeasons && availableSeasons.length > 0
      ? availableSeasons.map((season: SeasonData) => ({
          year: season.startYear,
          label: season.season,
        }))
      : [{ year: currentSeasonYear, label: `${currentSeasonYear}/${currentSeasonYear + 1}` }];

  return {
    availableSeasons,
    seasons,
    selectedSeasonYear,
    setSelectedSeasonYear,
    selectedMonth,
    setSelectedMonth,
    report,
    error,
    syncStatus,
    isInitialLoad,
    isRefreshing,
    isSeasonsLoading,
    isSeasonsFetched,
    forceResync,
    refetchReport,
  };
}
