
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type RoleKey = 'public' | 'player_manager' | 'referee' | 'admin';

export interface RoleVisibility {
  public: boolean;
  player_manager: boolean;
  referee: boolean;
  admin: boolean;
}

export interface TabVisibilitySetting {
  id: number;
  setting_name: string;
  is_visible: boolean; // Legacy - kept for backwards compatibility
  requires_login: boolean;
  visibility: RoleVisibility;
}

const DEFAULT_VISIBILITY: RoleVisibility = {
  public: true,
  player_manager: true,
  referee: true,
  admin: true,
};

export const useTabVisibilitySettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<TabVisibilitySetting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('application_settings')
        .select('id, setting_name, setting_value, is_active')
        .eq('setting_category', 'tab_visibility')
        .order('setting_name');

      if (error) throw error;
      
      const mappedSettings = (data || []).map(item => {
        const settingValue = item.setting_value as any;
        
        // Parse new visibility structure or fallback to legacy
        const visibility: RoleVisibility = settingValue?.visibility || {
          public: item.is_active ?? true,
          player_manager: true,
          referee: true,
          admin: true,
        };
        
        return {
          id: item.id,
          setting_name: item.setting_name,
          is_visible: item.is_active ?? true,
          requires_login: settingValue?.requires_login ?? false,
          visibility,
        };
      });
      
      setSettings(mappedSettings);
    } catch (error) {
      console.error('Error fetching tab settings:', error);
      // Fallback to main tabs only with default visibility
      setSettings([
        { id: 1, setting_name: 'algemeen', is_visible: true, requires_login: false, visibility: DEFAULT_VISIBILITY },
        { id: 2, setting_name: 'competitie', is_visible: true, requires_login: false, visibility: DEFAULT_VISIBILITY },
        { id: 3, setting_name: 'playoff', is_visible: true, requires_login: false, visibility: DEFAULT_VISIBILITY },
        { id: 4, setting_name: 'beker', is_visible: true, requires_login: false, visibility: DEFAULT_VISIBILITY },
        { id: 5, setting_name: 'schorsingen', is_visible: true, requires_login: false, visibility: { ...DEFAULT_VISIBILITY, public: false, referee: false } },
        { id: 6, setting_name: 'teams', is_visible: true, requires_login: false, visibility: DEFAULT_VISIBILITY },
        { id: 7, setting_name: 'reglement', is_visible: true, requires_login: false, visibility: DEFAULT_VISIBILITY },
      ]);
      toast({
        title: "Info",
        description: "Gebruikt standaard tab instellingen voor hoofdtabs",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateRoleVisibility = async (settingName: string, role: RoleKey, isVisible: boolean) => {
    try {
      const currentSetting = settings.find(s => s.setting_name === settingName);
      if (!currentSetting) throw new Error('Setting not found');

      const newVisibility = {
        ...currentSetting.visibility,
        [role]: isVisible,
      };

      const nowIso = new Date().toISOString();
      const newSettingValue = {
        visibility: newVisibility,
        requires_login: currentSetting.requires_login,
        updated_at: nowIso,
      };

      // Also update is_active based on whether any role can see it
      const anyVisible = Object.values(newVisibility).some(v => v);

      const { error } = await supabase
        .from('application_settings')
        .update({
          setting_value: newSettingValue as any,
          is_active: anyVisible,
          updated_at: nowIso,
        })
        .eq('setting_category', 'tab_visibility')
        .eq('setting_name', settingName);

      if (error) throw error;

      // Optimistic update
      setSettings(prev =>
        prev.map(setting =>
          setting.setting_name === settingName
            ? { ...setting, visibility: newVisibility, is_visible: anyVisible }
            : setting
        )
      );

      toast({
        title: "Instelling bijgewerkt",
        description: `Zichtbaarheid voor "${settingName}" is aangepast`,
      });
    } catch (error) {
      console.error('Error updating role visibility:', error);
      toast({
        title: "Fout bij opslaan",
        description: "Kon instelling niet bijwerken",
        variant: "destructive",
      });
    }
  };

  // Legacy update function for backwards compatibility
  const updateSetting = async (settingName: string, updates: Partial<TabVisibilitySetting>) => {
    try {
      const currentSetting = settings.find(s => s.setting_name === settingName);
      if (!currentSetting) throw new Error('Setting not found');

      const nowIso = new Date().toISOString();
      const updatePayload: any = { updated_at: nowIso };
      
      if (typeof updates.is_visible === 'boolean') {
        updatePayload.is_active = updates.is_visible;
      }
      
      if (typeof updates.requires_login === 'boolean') {
        updatePayload.setting_value = { 
          visibility: currentSetting.visibility,
          requires_login: updates.requires_login, 
          updated_at: nowIso 
        } as any;
      }

      const { error } = await supabase
        .from('application_settings')
        .update(updatePayload)
        .eq('setting_category', 'tab_visibility')
        .eq('setting_name', settingName);

      if (error) throw error;

      setSettings(prev =>
        prev.map(setting =>
          setting.setting_name === settingName
            ? {
                ...setting,
                is_visible: updates.is_visible ?? setting.is_visible,
                requires_login: updates.requires_login ?? setting.requires_login
              }
            : setting
        )
      );

      toast({
        title: "Instelling bijgewerkt",
        description: `Tab "${settingName}" is bijgewerkt`,
      });
    } catch (error) {
      console.error('Error updating tab setting:', error);
      toast({
        title: "Fout bij opslaan",
        description: "Kon instelling niet bijwerken",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchSettings();

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const channel = supabase
      .channel('tab-visibility-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'application_settings', filter: 'setting_category=eq.tab_visibility' },
        () => {
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            fetchSettings();
          }, 500);
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.debug('Realtime connection unavailable, continuing without live updates');
        }
      });

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      try { supabase.removeChannel(channel); } catch (_) {}
    };
  }, [fetchSettings]);

  return {
    settings,
    loading,
    updateSetting,
    updateRoleVisibility,
    refetch: fetchSettings
  };
};
