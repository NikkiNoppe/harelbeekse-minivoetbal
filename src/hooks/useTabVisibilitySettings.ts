
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TabVisibilitySetting {
  id: number;
  setting_name: string;
  is_visible: boolean;
  requires_login: boolean;
}

export const useTabVisibilitySettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<TabVisibilitySetting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('application_settings')
        .select('id, setting_name, setting_value, is_active')
        .eq('setting_category', 'tab_visibility')
        .order('setting_name');

      if (error) throw error;
      
      const mappedSettings = (data || []).map(item => {
        const settingValue = item.setting_value as any;
        return {
          id: item.id,
          setting_name: item.setting_name,
          // Use is_active as the source of truth for visibility
          is_visible: item.is_active ?? true,
          // Keep requires_login from JSON value
          requires_login: settingValue?.requires_login ?? false,
        };
      });
      
      setSettings(mappedSettings);
    } catch (error) {
      console.error('Error fetching tab settings:', error);
      // Fallback to main tabs only
      setSettings([
        { id: 1, setting_name: 'algemeen', is_visible: true, requires_login: false },
        { id: 2, setting_name: 'competitie', is_visible: true, requires_login: false },
        { id: 3, setting_name: 'playoff', is_visible: true, requires_login: false },
        { id: 4, setting_name: 'beker', is_visible: true, requires_login: false },
        { id: 5, setting_name: 'schorsingen', is_visible: true, requires_login: false },
        { id: 6, setting_name: 'teams', is_visible: true, requires_login: false },
        { id: 7, setting_name: 'reglement', is_visible: true, requires_login: false },
      ]);
      toast({
        title: "Info",
        description: "Gebruikt standaard tab instellingen voor hoofdtabs",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (settingName: string, updates: Partial<TabVisibilitySetting>) => {
    try {
      // Get current setting
      const currentSetting = settings.find(s => s.setting_name === settingName);
      if (!currentSetting) throw new Error('Setting not found');

      const nowIso = new Date().toISOString();

      // Build update payload: use is_active for visibility; optionally update requires_login inside JSONB
      const updatePayload: any = { updated_at: nowIso };
      if (typeof updates.is_visible === 'boolean') {
        updatePayload.is_active = updates.is_visible;
      }
      if (typeof updates.requires_login === 'boolean') {
        updatePayload.setting_value = { requires_login: updates.requires_login, updated_at: nowIso } as any;
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
    // Subscribe to realtime changes so UI updates across the app immediately
    const channel = supabase
      .channel('tab-visibility-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'application_settings', filter: 'setting_category=eq.tab_visibility' },
        () => {
          fetchSettings();
        }
      )
      .subscribe();

    return () => {
      try { supabase.removeChannel(channel); } catch (_) {}
    };
  }, []);

  return {
    settings,
    loading,
    updateSetting,
    refetch: fetchSettings
  };
};
