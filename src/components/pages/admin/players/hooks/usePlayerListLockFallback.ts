
import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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

      // Also fetch the lock settings for display
      const { data: settings, error: settingsError } = await supabase
        .from('application_settings')
        .select('setting_value, is_active')
        .eq('setting_category', 'player_list_lock')
        .eq('setting_name', 'global_lock')
        .single();

      if (settingsError) {
        console.error('❌ Error fetching lock settings:', settingsError);
        // Don't throw here, just log and continue
      } else {
        console.log('🔒 Lock settings:', settings);
        if (settings?.is_active && settings?.setting_value) {
          const settingValue = settings.setting_value as any;
          setLockDate(settingValue?.lock_from_date);
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

