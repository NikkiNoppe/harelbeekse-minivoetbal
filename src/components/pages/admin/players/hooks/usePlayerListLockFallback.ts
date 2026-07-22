
import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrgQueryScope } from "@/hooks/useOrganization";
import {
  fetchPublicApplicationSettings,
  findPublicSetting,
} from "@/services/public/publicApplicationSettingsFetch";
import { formatDateShort } from "@/lib/dateUtils";
import {
  buildPlayerListLockMessage,
  isSettingsPlayerListLocked,
  isWithinActiveSeason,
  resolveLockMessageDates,
  resolvePlayerListLockReason,
  type PlayerListLockSettingValue,
} from "@/lib/playerListLockUtils";

/**
 * Fallback hook for player list lock status.
 * Used when PlayerListLockProvider is not available (backwards compatibility).
 */
export const usePlayerListLockFallback = () => {
  const { user } = useAuth();
  const { organizationId } = useOrgQueryScope();
  const [isSettingsLocked, setIsSettingsLocked] = useState(false);
  const [isSeasonLocked, setIsSeasonLocked] = useState(false);
  const [lockDate, setLockDate] = useState<string | null>(null);
  const [lockUntilDate, setLockUntilDate] = useState<string | null>(null);
  const [seasonEndDate, setSeasonEndDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const checkLockStatus = useCallback(async () => {
    if (organizationId == null) {
      setLoading(false);
      return;
    }

    try {
      let settingsLocked = false;
      let settingsLockDate: string | null = null;
      let seasonLocked = false;
      let seasonEnd: string | null = null;

      const { data: rpcLocked, error } = await supabase.rpc("is_player_list_locked", {
        p_organization_id: organizationId,
      });

      if (error) {
        console.error("❌ Error calling is_player_list_locked function:", error);
        throw error;
      }

      settingsLocked = Boolean(rpcLocked);

      const lockRows = await fetchPublicApplicationSettings(
        ["player_list_lock"],
        organizationId,
      );
      const settings = findPublicSetting(lockRows, "player_list_lock", "global_lock");

      if (settings?.setting_value) {
        const settingValue = settings.setting_value as PlayerListLockSettingValue;
        settingsLocked =
          Boolean(rpcLocked) || isSettingsPlayerListLocked(settingValue);
        if (settingValue.lock_enabled !== false) {
          const dates = resolveLockMessageDates(settingValue);
          settingsLockDate = dates.from;
          setLockUntilDate(dates.until);
        } else {
          setLockUntilDate(null);
        }
      }

      const seasonRows = await fetchPublicApplicationSettings(
        ["season_data"],
        organizationId,
      );
      const seasonConfig = findPublicSetting(seasonRows, "season_data", "main_config");
      if (seasonConfig?.setting_value) {
        const seasonValue = seasonConfig.setting_value as {
          season_start_date?: string;
          season_end_date?: string;
        };
        seasonEnd = seasonValue.season_end_date ?? null;
        seasonLocked = isWithinActiveSeason(
          seasonValue.season_start_date,
          seasonValue.season_end_date,
        );
      }

      setIsSettingsLocked(settingsLocked);
      setIsSeasonLocked(seasonLocked);
      setLockDate(settingsLockDate);
      setSeasonEndDate(seasonEnd);
    } catch (error) {
      console.error("❌ Error checking lock status:", error);
      setIsSettingsLocked(false);
      setIsSeasonLocked(false);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    checkLockStatus();
  }, [checkLockStatus]);

  const isLocked = isSettingsLocked || isSeasonLocked;
  const lockReason = resolvePlayerListLockReason(isSettingsLocked, isSeasonLocked);

  const lockMessage = useMemo(
    () =>
      buildPlayerListLockMessage(
        lockReason,
        lockDate,
        seasonEndDate,
        formatDateShort,
        lockUntilDate,
      ),
    [lockReason, lockDate, seasonEndDate, lockUntilDate],
  );

  const canEdit = useMemo(() => {
    return user?.role === "admin" || !isLocked;
  }, [user?.role, isLocked]);

  return {
    isLocked,
    isSettingsLocked,
    isSeasonLocked,
    lockReason,
    lockDate,
    seasonEndDate,
    lockMessage,
    canEdit,
    loading,
    refreshLockStatus: checkLockStatus,
  };
};
