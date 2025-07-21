
import { useState, useEffect } from "react";
import { supabase } from "../../../MINIVOETBAL.SDK/client";
import { useAuth } from "../../../auth/AuthProvider";

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
  };

  // Admin users can always edit regardless of lock status
  const canEdit = user?.role === 'admin' || !isLocked;
  
  console.log('🔒 Lock status - isLocked:', isLocked, 'user role:', user?.role, 'canEdit:', canEdit);

  return {
    isLocked,
    lockDate,
    canEdit,
    loading,
    refreshLockStatus: checkLockStatus
  };
};
