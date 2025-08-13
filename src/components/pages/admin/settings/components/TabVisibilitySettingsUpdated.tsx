
import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Save, Settings, Shield } from "lucide-react";
import { useTabVisibilitySettings } from "@/hooks/useTabVisibilitySettings";
import { useToast } from "@/hooks/use-toast";

const TabVisibilitySettingsUpdated: React.FC = () => {
  const { settings, loading, updateSetting } = useTabVisibilitySettings();
  const [localSettings, setLocalSettings] = useState<typeof settings>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Update local settings when settings from hook change
  useEffect(() => {
    setLocalSettings(settings);
    setHasChanges(false);
  }, [settings]);

  const publicTabKeys = useMemo(
    () => ['algemeen', 'competitie', 'playoff', 'beker', 'schorsingen', 'reglement', 'teams'],
    []
  );
  const isAdminMatchFormKey = (key: string) => key.startsWith('admin_match_forms_');

  const publicTabs = useMemo(
    () => localSettings.filter(s => publicTabKeys.includes(s.setting_name)),
    [localSettings, publicTabKeys]
  );
  const adminFormTabs = useMemo(
    () => localSettings.filter(s => isAdminMatchFormKey(s.setting_name)),
    [localSettings]
  );

  const handleVisibilityChange = (settingName: string, isVisible: boolean) => {
    setLocalSettings(prev =>
      prev.map(setting =>
        setting.setting_name === settingName
          ? { ...setting, is_visible: isVisible }
          : setting
      )
    );
    setHasChanges(true);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      for (const localSetting of localSettings) {
        const originalSetting = settings.find(s => s.setting_name === localSetting.setting_name);
        if (
          originalSetting &&
          (originalSetting.is_visible !== localSetting.is_visible ||
            originalSetting.requires_login !== localSetting.requires_login)
        ) {
          await updateSetting(localSetting.setting_name, {
            is_visible: localSetting.is_visible,
            requires_login: localSetting.requires_login
          });
        }
      }
      setHasChanges(false);
      toast({
        title: "Instellingen opgeslagen",
        description: "Zichtbaarheid is succesvol bijgewerkt."
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
      const defaultPublic = ['algemeen', 'competitie', 'playoff', 'beker', 'schorsingen', 'reglement', 'teams'];
      const defaultAdminForms = ['admin_match_forms_league', 'admin_match_forms_cup', 'admin_match_forms_playoffs'];

      for (const tabName of [...defaultPublic, ...defaultAdminForms]) {
        const existingSetting = settings.find(s => s.setting_name === tabName);
        if (existingSetting) {
          await updateSetting(tabName, {
            is_visible: true,
            requires_login: isAdminMatchFormKey(tabName) ? true : existingSetting.requires_login ?? false
          });
        }
      }
      toast({
        title: "Instellingen hersteld",
        description: "Zichtbaarheid is teruggezet naar standaardinstellingen."
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
    const displayNames: { [key: string]: string } = {
      'algemeen': 'Algemeen',
      'competitie': 'Competitie',
      'playoff': 'Play-offs',
      'beker': 'Beker',
      'schorsingen': 'Schorsingen',
      'reglement': 'Reglement',
      'teams': 'Teams',
      'admin_match_forms_league': 'Wedstrijdformulieren (Competitie)',
      'admin_match_forms_cup': 'Wedstrijdformulieren (Beker)',
      'admin_match_forms_playoffs': 'Wedstrijdformulieren (Play-offs)'
    };
    return displayNames[settingName] || settingName.charAt(0).toUpperCase() + settingName.slice(1);
  };

  if (loading) {
    return <div className="py-4 text-center text-muted-foreground">Instellingen laden...</div>;
  }

  const renderRow = (setting: (typeof settings)[number]) => (
    <div key={setting.setting_name} className="border rounded-lg p-4 space-y-3 bg-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {setting.is_visible ? <Eye className="h-4 w-4 text-green-500" /> : <EyeOff className="h-4 w-4 text-red-500" />}
          <Label className="font-medium">
            {getTabDisplayName(setting.setting_name)}
          </Label>
        </div>
        <Switch
          checked={setting.is_visible}
          onCheckedChange={(checked) => handleVisibilityChange(setting.setting_name, checked)}
        />
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Tab Zichtbaarheid
            </CardTitle>
            <CardDescription>
              Beheer welke tabs zichtbaar zijn voor gebruikers. Admin wedstrijdformulieren kun je hieronder apart verbergen.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={saveSettings} disabled={!hasChanges || saving} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {saving ? "Opslaan..." : "Instellingen opslaan"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-8">
          <section>
            <h3 className="text-base font-semibold mb-3">Publieke tabs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {publicTabs.map(renderRow)}
            </div>
          </section>

          {adminFormTabs.length > 0 && (
            <section>
              <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Admin - Wedstrijdformulieren
              </h3>
              <CardDescription className="mb-3">
                Deze instellingen bepalen of niet-admin gebruikers deze formulieren kunnen openen.
              </CardDescription>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {adminFormTabs.map(renderRow)}
              </div>
            </section>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-end gap-2">
        <Button onClick={saveSettings} disabled={!hasChanges || saving} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          {saving ? "Opslaan..." : "Opslaan"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TabVisibilitySettingsUpdated;
