
import { useState, useEffect } from "react";
import { supabase } from "@shared/integrations/supabase/client";
import { useToast } from "@shared/hooks/use-toast";

interface TabVisibilitySetting {
  id: number;
  setting_name: string;
  is_visible: boolean;
  requires_login: boolean;
}

interface TabVisibilityState {
  [key: string]: boolean;
}

export const useTabVisibilitySettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<TabVisibilitySetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabVisibility, setTabVisibility] = useState<TabVisibilityState>({});

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('tab_visibility_settings')
        .select('id, setting_name, is_visible, requires_login')
        .order('setting_name');

      if (error) throw error;
      
      setSettings(data || []);
      
      // Convert to tabVisibility state
      const visibilityState: TabVisibilityState = {};
      data?.forEach(setting => {
        visibilityState[setting.setting_name] = setting.is_visible;
      });
      setTabVisibility(visibilityState);
    } catch (error) {
      console.error('Error fetching tab settings:', error);
      // Fallback to main tabs only
      const fallbackSettings = [
        { id: 1, setting_name: 'algemeen', is_visible: true, requires_login: false },
        { id: 2, setting_name: 'competitie', is_visible: true, requires_login: false },
        { id: 3, setting_name: 'playoff', is_visible: true, requires_login: false },
        { id: 4, setting_name: 'beker', is_visible: true, requires_login: false },
        { id: 5, setting_name: 'schorsingen', is_visible: true, requires_login: false },
        { id: 6, setting_name: 'reglement', is_visible: true, requires_login: false },
      ];
      setSettings(fallbackSettings);
      
      const fallbackVisibility: TabVisibilityState = {};
      fallbackSettings.forEach(setting => {
        fallbackVisibility[setting.setting_name] = setting.is_visible;
      });
      setTabVisibility(fallbackVisibility);
      
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
      const { error } = await supabase
        .from('tab_visibility_settings')
        .update(updates)
        .eq('setting_name', settingName);

      if (error) throw error;

      setSettings(prev => 
        prev.map(setting => 
          setting.setting_name === settingName 
            ? { ...setting, ...updates }
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

  const saveTabVisibility = async (): Promise<boolean> => {
    try {
      const updates = Object.entries(tabVisibility).map(([settingName, isVisible]) => ({
        setting_name: settingName,
        is_visible: isVisible
      }));

      for (const update of updates) {
        await updateSetting(update.setting_name, { is_visible: update.is_visible });
      }

      return true;
    } catch (error) {
      console.error('Error saving tab visibility:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    updateSetting,
    refetch: fetchSettings,
    tabVisibility,
    setTabVisibility,
    saveTabVisibility
  };
};
