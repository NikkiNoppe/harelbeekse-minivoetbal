
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import { listApplicationSettingsForSession } from "@/services/core/applicationSettingsSessionFetch";
import { formatDateShort } from "@/lib/dateUtils";
import {
  buildPlayerListLockMessage,
  isSettingsPlayerListLocked,
  isWithinActiveSeason,
  resolvePlayerListLockReason,
  type PlayerListLockReason,
} from "@/lib/playerListLockUtils";

interface PlayerListLockContextType {
  isLocked: boolean;
  isSettingsLocked: boolean;
  isSeasonLocked: boolean;
  lockReason: PlayerListLockReason;
  lockDate: string | null;
  seasonEndDate: string | null;
  lockMessage: string | null;
  canEdit: boolean;
  loading: boolean;
  refreshLockStatus: () => Promise<void>;
}

export const PlayerListLockContext = createContext<PlayerListLockContextType | undefined>(undefined);

export const PlayerListLockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { organizationId, isOrganizationReady } = useOrganization();
  const [isSettingsLocked, setIsSettingsLocked] = useState(false);
  const [isSeasonLocked, setIsSeasonLocked] = useState(false);
  const [lockDate, setLockDate] = useState<string | null>(null);
  const [lockUntilDate, setLockUntilDate] = useState<string | null>(null);
  const [seasonEndDate, setSeasonEndDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const checkLockStatus = useCallback(async () => {
    if (!isOrganizationReady || organizationId == null) {
      return;
    }

    const orgId = organizationId;

    try {
      let settingsLocked = false;
      let settingsLockDate: string | null = null;
      let seasonLocked = false;
      let seasonEnd: string | null = null;

      const { data: rpcLocked, error } = await supabase.rpc("is_player_list_locked", {
        p_organization_id: orgId,
      });

      if (error) {
        console.error("❌ Error calling is_player_list_locked function:", error);
        throw error;
      }

      settingsLocked = Boolean(rpcLocked);

      try {
        const rows = await listApplicationSettingsForSession("player_list_lock");
        const settings = rows.find((row) => row.setting_name === "global_lock");

        if (settings?.setting_value) {
          const settingValue = settings.setting_value as {
            lock_from_date?: string;
            lock_until_date?: string;
            lock_enabled?: boolean;
          };
          settingsLocked =
            Boolean(rpcLocked) ||
            isSettingsPlayerListLocked(settingValue);
          if (settingValue.lock_enabled !== false) {
            settingsLockDate = settingValue.lock_from_date ?? null;
            setLockUntilDate(settingValue.lock_until_date ?? null);
          } else {
            setLockUntilDate(null);
          }
        }
      } catch (settingsError) {
        console.error("❌ Error fetching lock settings:", settingsError);
      }

      try {
        const seasonRows = await listApplicationSettingsForSession("season_data");
        const seasonConfig = seasonRows.find((row) => row.setting_name === "main_config");
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
      } catch (seasonError) {
        console.error("❌ Error fetching season data for player lock:", seasonError);
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
  }, [isOrganizationReady, organizationId]);

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

  const value: PlayerListLockContextType = {
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

  return (
    <PlayerListLockContext.Provider value={value}>
      {children}
    </PlayerListLockContext.Provider>
  );
};

export const usePlayerListLockContext = () => {
  const context = useContext(PlayerListLockContext);
  if (context === undefined) {
    throw new Error("usePlayerListLockContext must be used within a PlayerListLockProvider");
  }
  return context;
};
