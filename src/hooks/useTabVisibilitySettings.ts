
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
        .from('tab_visibility_settings')
        .select('*')
        .order('setting_name');

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Error fetching tab settings:', error);
      // Fallback to main tabs only
      setSettings([
        { id: 1, setting_name: 'algemeen', is_visible: true, requires_login: false },
        { id: 2, setting_name: 'competitie', is_visible: true, requires_login: false },
        { id: 3, setting_name: 'playoff', is_visible: true, requires_login: false },
        { id: 4, setting_name: 'beker', is_visible: true, requires_login: false },
        { id: 5, setting_name: 'schorsingen', is_visible: true, requires_login: false },
        { id: 6, setting_name: 'reglement', is_visible: true, requires_login: false },
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

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    updateSetting,
    refetch: fetchSettings
  };
};
