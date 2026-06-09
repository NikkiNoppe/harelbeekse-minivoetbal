
import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchPublicApplicationSettings,
  findPublicSetting,
} from "@/services/public/publicApplicationSettingsFetch";

/**
 * Fallback hook for player list lock status.
 * Used when PlayerListLockProvider is not available (backwards compatibility).
 * This creates a separate instance and may cause multiple database calls.
 */
export const usePlayerListLockFallback = () => {
  const { user } = useAuth();
  const [isLocked, setIsLocked] = useState(false);
  const [lockDate, setLockDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const checkLockStatus = useCallback(async () => {
    try {
      console.log('🔒 Checking player list lock status (fallback)...');
      
      // Call the database function to check if player list is locked
      const { data, error } = await supabase.rpc('is_player_list_locked');
      
      if (error) {
        console.error('❌ Error calling is_player_list_locked function:', error);
        throw error;
      }
      
      console.log('🔒 Lock function result:', data);
      setIsLocked(data);

      const lockRows = await fetchPublicApplicationSettings(['player_list_lock']);
      const settings = findPublicSetting(lockRows, 'player_list_lock', 'global_lock');

      if (settings?.setting_value) {
        const settingValue = settings.setting_value as { lock_from_date?: string; lock_enabled?: boolean };
        if (settingValue.lock_enabled !== false) {
          setLockDate(settingValue.lock_from_date ?? null);
        }
      }
    } catch (error) {
      console.error('❌ Error checking lock status:', error);
      // Default to unlocked if there's an error
      setIsLocked(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkLockStatus();
  }, [checkLockStatus]);

  // Admin users can always edit regardless of lock status
  const canEdit = useMemo(() => {
    return user?.role === 'admin' || !isLocked;
  }, [user?.role, isLocked]);

  // Only log when lock status or user role actually changes
  useEffect(() => {
    if (!loading) {
      console.log('🔒 Lock status (fallback) - isLocked:', isLocked, 'user role:', user?.role, 'canEdit:', canEdit);
    }
  }, [isLocked, user?.role, canEdit, loading]);

  return {
    isLocked,
    lockDate,
    canEdit,
    loading,
    refreshLockStatus: checkLockStatus
  };
};

