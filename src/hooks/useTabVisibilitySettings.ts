
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

  const DEFAULT_TABS = [
    'algemeen',
    'competitie',
    'playoff',
    'beker',
    'schorsingen',
    'teams',
    'reglement'
  ];

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('application_settings')
        .select('id, setting_name, setting_value, is_active')
        .eq('setting_category', 'tab_visibility')
        .order('setting_name');

      if (error) throw error;
      
      // Map bestaande settings
      const mappedSettings = (data || []).map(item => {
        const settingValue = item.setting_value as any;
        return {
          id: item.id,
          setting_name: item.setting_name,
          is_visible: item.is_active ?? true, // Gebruik is_active als bron
          requires_login: settingValue?.requires_login ?? false,
        };
      });
      // Voeg ontbrekende tabs toe met default zichtbaarheid
      const allSettings = [...mappedSettings];
      for (const tab of DEFAULT_TABS) {
        if (!allSettings.find(s => s.setting_name === tab)) {
          // Insert nieuwe row in de database
          await supabase.from('application_settings').insert({
            setting_category: 'tab_visibility',
            setting_name: tab,
            setting_value: { requires_login: false },
            is_active: true
          });
          allSettings.push({
            id: -1,
            setting_name: tab,
            is_visible: true,
            requires_login: false
          });
        }
      }
      setSettings(allSettings);
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

      // Merge updates with current values
      const newSettingValue = {
        requires_login: updates.requires_login ?? currentSetting.requires_login,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('application_settings')
        .update({ 
          setting_value: newSettingValue,
          is_active: updates.is_visible ?? currentSetting.is_visible,
          updated_at: new Date().toISOString()
        })
        .eq('setting_category', 'tab_visibility')
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
