
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { listApplicationSettingsForSession } from "@/services/core/applicationSettingsSessionFetch";

interface PlayerListLockContextType {
  isLocked: boolean;
  lockDate: string | null;
  canEdit: boolean;
  loading: boolean;
  refreshLockStatus: () => Promise<void>;
}

export const PlayerListLockContext = createContext<PlayerListLockContextType | undefined>(undefined);

export const PlayerListLockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isLocked, setIsLocked] = useState(false);
  const [lockDate, setLockDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const checkLockStatus = useCallback(async () => {
    try {
      console.log('🔒 Checking player list lock status...');
      
      // Call the database function to check if player list is locked
      const { data, error } = await supabase.rpc('is_player_list_locked');
      
      if (error) {
        console.error('❌ Error calling is_player_list_locked function:', error);
        throw error;
      }
      
      console.log('🔒 Lock function result:', data);
      setIsLocked(data);

      // Also fetch the lock settings for display
      try {
        const rows = await listApplicationSettingsForSession('player_list_lock');
        const settings = rows.find((row) => row.setting_name === 'global_lock');

        if (settings?.setting_value) {
          const settingValue = settings.setting_value as { lock_from_date?: string; lock_enabled?: boolean };
          if (settingValue.lock_enabled !== false) {
            setLockDate(settingValue.lock_from_date ?? null);
          }
        }
      } catch (settingsError) {
        console.error('❌ Error fetching lock settings:', settingsError);
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
      console.log('🔒 Lock status - isLocked:', isLocked, 'user role:', user?.role, 'canEdit:', canEdit);
    }
  }, [isLocked, user?.role, canEdit, loading]);

  const value: PlayerListLockContextType = {
    isLocked,
    lockDate,
    canEdit,
    loading,
    refreshLockStatus: checkLockStatus
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
    throw new Error('usePlayerListLockContext must be used within a PlayerListLockProvider');
  }
  return context;
};

