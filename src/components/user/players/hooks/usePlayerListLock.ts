
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

export const usePlayerListLock = () => {
  const { user } = useAuth();
  const [isLocked, setIsLocked] = useState(false);
  const [lockDate, setLockDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkLockStatus();
  }, []);

  const checkLockStatus = async () => {
    try {
      // Call the database function to check if player list is locked
      const { data, error } = await supabase.rpc('is_player_list_locked');
      
      if (error) throw error;
      
      setIsLocked(data);

      // Also fetch the lock settings for display
      const { data: settings, error: settingsError } = await supabase
        .from('player_list_lock_settings')
        .select('lock_from_date, is_active')
        .eq('id', 1)
        .single();

      if (!settingsError && settings?.is_active) {
        setLockDate(settings.lock_from_date);
      }
    } catch (error) {
      console.error('Error checking lock status:', error);
      // Default to unlocked if there's an error
      setIsLocked(false);
    } finally {
      setLoading(false);
    }
  };

  // Admin users can always edit regardless of lock status
  const canEdit = user?.role === 'admin' || !isLocked;

  return {
    isLocked,
    lockDate,
    canEdit,
    loading,
    refreshLockStatus: checkLockStatus
  };
};
