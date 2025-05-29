
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
      toast({
        title: "Fout bij laden",
        description: "Kon tab instellingen niet laden",
        variant: "destructive",
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
