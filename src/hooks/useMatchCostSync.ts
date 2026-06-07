import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { matchCostService } from "@/services/financial";

export const MATCH_COST_SYNC_KEY = "financial-match-costs-last-sync";
export const MATCH_COST_SYNC_COOLDOWN_MS = 2 * 60 * 1000;

export type MatchCostSyncStatus = "idle" | "syncing" | "synced" | "skipped" | "error";

const DEFAULT_INVALIDATE_KEYS = [["all-team-transactions"], ["season-report"]] as const;

let syncInFlight: Promise<"synced" | "skipped" | "error"> | null = null;

async function runSharedMatchCostSync(
  force: boolean,
  invalidate: () => Promise<void>,
): Promise<"synced" | "skipped" | "error"> {
  if (!force) {
    const lastSync = Number(sessionStorage.getItem(MATCH_COST_SYNC_KEY) || 0);
    if (Date.now() - lastSync < MATCH_COST_SYNC_COOLDOWN_MS) {
      return "skipped";
    }
  }

  if (syncInFlight) {
    return syncInFlight;
  }

  syncInFlight = (async () => {
    try {
      const [costResult, cardResult] = await Promise.all([
        matchCostService.syncAllMatchCosts(),
        matchCostService.syncAllCardPenalties(),
      ]);
      if (!costResult.success || !cardResult.success) return "error";

      sessionStorage.setItem(MATCH_COST_SYNC_KEY, String(Date.now()));
      await invalidate();
      return "synced";
    } catch {
      return "error";
    } finally {
      syncInFlight = null;
    }
  })();

  return syncInFlight;
}

export interface UseMatchCostSyncOptions {
  /** When false, sync only runs via runBackgroundSync / forceResync (e.g. after data is on screen). */
  autoRun?: boolean;
}

export function useMatchCostSync(
  enabled: boolean,
  invalidateKeys: readonly (readonly string[])[] = DEFAULT_INVALIDATE_KEYS,
  options?: UseMatchCostSyncOptions,
) {
  const autoRun = options?.autoRun ?? true;
  const queryClient = useQueryClient();
  const [syncStatus, setSyncStatus] = useState<MatchCostSyncStatus>("idle");

  const invalidateFinancialQueries = useCallback(async () => {
    await Promise.all(
      invalidateKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey: [...queryKey] })),
    );
  }, [invalidateKeys, queryClient]);

  const runSync = useCallback(
    async (force = false) => {
      setSyncStatus("syncing");
      const result = await runSharedMatchCostSync(force, invalidateFinancialQueries);
      setSyncStatus(result);
      return result;
    },
    [invalidateFinancialQueries],
  );

  const runBackgroundSync = useCallback((force = false) => runSync(force), [runSync]);

  useEffect(() => {
    if (!enabled || !autoRun) {
      if (!enabled) setSyncStatus("idle");
      return;
    }

    let cancelled = false;
    void runSync(false).then(() => {
      if (cancelled) setSyncStatus("idle");
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, autoRun, runSync]);

  useEffect(() => {
    if (syncStatus !== "synced") return;
    const timeoutId = window.setTimeout(() => setSyncStatus("idle"), 2500);
    return () => window.clearTimeout(timeoutId);
  }, [syncStatus]);

  const forceResync = useCallback(() => runSync(true), [runSync]);

  return {
    syncStatus,
    forceResync,
    runBackgroundSync,
    invalidateFinancialQueries,
  };
}
