import { useEffect, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMatchCostSync } from "@/hooks/useMatchCostSync";
import { monthlyReportsService, type SeasonData } from "@/services/financial";

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
  const currentSeasonYear = getCurrentSeasonYear();
  const [selectedSeasonYear, setSelectedSeasonYear] = useState(currentSeasonYear);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const { syncStatus, forceResync, runBackgroundSync } = useMatchCostSync(open, undefined, {
    autoRun: false,
  });

  const { data: availableSeasons, isLoading: isSeasonsLoading } = useQuery({
    queryKey: ["available-seasons"],
    queryFn: monthlyReportsService.getAvailableSeasons,
    enabled: open,
    staleTime: 5 * 60 * 1000,
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
  } = useQuery({
    queryKey: ["season-report", selectedSeasonYear, selectedMonth],
    queryFn: async () => {
      const { seasonYear, actualMonth, actualYear } = resolveReportDates(selectedSeasonYear, selectedMonth);
      return monthlyReportsService.getSeasonReport(seasonYear, actualMonth, actualYear);
    },
    enabled: open && seasonsAvailable,
    retry: 2,
    staleTime: 0,
    refetchOnMount: "always",
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (!open || !seasonsAvailable) return;
    void queryClient.invalidateQueries({ queryKey: ["season-report"] });
  }, [open, seasonsAvailable, queryClient]);

  useEffect(() => {
    if (!open || !isReportFetched) return;
    const timeoutId = window.setTimeout(() => {
      void runBackgroundSync(false);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [open, isReportFetched, runBackgroundSync]);

  useEffect(() => {
    if (syncStatus !== "synced") return;
    void queryClient.invalidateQueries({ queryKey: ["season-report"] });
  }, [syncStatus, queryClient]);

  const isInitialLoad = open && seasonsAvailable && !report && (isReportLoading || isSeasonsLoading);

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
    forceResync,
  };
}
