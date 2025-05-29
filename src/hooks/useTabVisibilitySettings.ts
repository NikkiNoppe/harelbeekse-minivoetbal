
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
      // Use raw SQL query since the table isn't in the generated types yet
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: 'SELECT * FROM tab_visibility_settings ORDER BY setting_name'
      });

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Error fetching tab settings:', error);
      // Fallback to default settings if table doesn't exist yet
      setSettings([
        { id: 1, setting_name: 'match-forms', is_visible: true, requires_login: false },
        { id: 2, setting_name: 'players', is_visible: true, requires_login: false },
        { id: 3, setting_name: 'competition', is_visible: true, requires_login: false },
        { id: 4, setting_name: 'settings', is_visible: true, requires_login: true },
      ]);
      toast({
        title: "Info",
        description: "Gebruikt standaard tab instellingen",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (settingName: string, updates: Partial<TabVisibilitySetting>) => {
    try {
      // Use raw SQL query for updates
      const updateFields = Object.entries(updates)
        .map(([key, value]) => `${key} = ${typeof value === 'boolean' ? value : `'${value}'`}`)
        .join(', ');
      
      const { error } = await supabase.rpc('exec_sql', {
        sql: `UPDATE tab_visibility_settings SET ${updateFields} WHERE setting_name = '${settingName}'`
      });

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
