import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, Unlock, Save } from "lucide-react";
import { useTabVisibilitySettings } from "@/hooks/useTabVisibilitySettings";
import { useToast } from "@/hooks/use-toast";
const TabVisibilitySettingsUpdated: React.FC = () => {
  const {
    settings,
    loading,
    updateSetting,
    refetch
  } = useTabVisibilitySettings();
  const [localSettings, setLocalSettings] = useState<typeof settings>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const {
    toast
  } = useToast();

  // Update local settings when settings from hook change
  useEffect(() => {
    setLocalSettings(settings);
    setHasChanges(false);
  }, [settings]);
  const handleVisibilityChange = (settingName: string, isVisible: boolean) => {
    setLocalSettings(prev => prev.map(setting => setting.setting_name === settingName ? {
      ...setting,
      is_visible: isVisible
    } : setting));
    setHasChanges(true);
  };
  const handleLoginRequirementChange = (settingName: string, requiresLogin: boolean) => {
    setLocalSettings(prev => prev.map(setting => setting.setting_name === settingName ? {
      ...setting,
      requires_login: requiresLogin
    } : setting));
    setHasChanges(true);
  };
  const saveSettings = async () => {
    setSaving(true);
    try {
      // Save all changed settings
      for (const localSetting of localSettings) {
        const originalSetting = settings.find(s => s.setting_name === localSetting.setting_name);
        if (originalSetting && (originalSetting.is_visible !== localSetting.is_visible || originalSetting.requires_login !== localSetting.requires_login)) {
          await updateSetting(localSetting.setting_name, {
            is_visible: localSetting.is_visible,
            requires_login: localSetting.requires_login
          });
        }
      }
      setHasChanges(false);
      await refetch(); // <-- direct settings opnieuw ophalen
      toast({
        title: "Instellingen opgeslagen",
        description: "Tab zichtbaarheid instellingen zijn succesvol bijgewerkt."
      });
    } catch (error) {
      toast({
        title: "Fout bij opslaan",
        description: "Kon instellingen niet opslaan",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  const resetToDefaults = async () => {
    setSaving(true);
    try {
      // Reset all main tabs to default values
      const mainTabs = ['algemeen', 'competitie', 'playoff', 'beker', 'schorsingen', 'reglement'];
      for (const tabName of mainTabs) {
        const existingSetting = settings.find(s => s.setting_name === tabName);
        if (existingSetting) {
          await updateSetting(tabName, {
            is_visible: true,
            requires_login: false
          });
        }
      }
      toast({
        title: "Instellingen hersteld",
        description: "Tab zichtbaarheid is teruggezet naar standaardinstellingen."
      });
    } finally {
      setSaving(false);
    }
  };
  const discardChanges = () => {
    setLocalSettings(settings);
    setHasChanges(false);
  };
  const getTabDisplayName = (settingName: string) => {
    const displayNames: {
      [key: string]: string;
    } = {
      'algemeen': 'Algemeen',
      'competitie': 'Competitie',
      'playoff': 'Play-Off',
      'beker': 'Beker',
      'schorsingen': 'Schorsingen',
      'reglement': 'Reglement'
    };
    return displayNames[settingName] || settingName.charAt(0).toUpperCase() + settingName.slice(1);
  };
  if (loading) {
    return <div className="py-4 text-center text-muted-foreground">Instellingen laden...</div>;
  }
  return <Card>
      <CardHeader>
        <CardTitle>Zichtbaarheid</CardTitle>
        <CardDescription>
          Configureer welke hoofdtabbladen zichtbaar zijn en of inloggen vereist is
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {localSettings.map(setting => <div key={setting.setting_name} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {setting.is_visible ? <Eye className="h-4 w-4 text-green-500" /> : <EyeOff className="h-4 w-4 text-red-500" />}
                  <Label className="font-medium">
                    {getTabDisplayName(setting.setting_name)}
                  </Label>
                </div>
                <Switch checked={setting.is_visible} onCheckedChange={checked => handleVisibilityChange(setting.setting_name, checked)} />
              </div>
              
              {setting.is_visible}
            </div>)}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        
        <div className="flex gap-2">
          {hasChanges}
          <Button onClick={saveSettings} disabled={!hasChanges || saving} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {saving ? "Opslaan..." : "Instellingen Opslaan"}
          </Button>
        </div>
      </CardFooter>
    </Card>;
};
export default TabVisibilitySettingsUpdated;