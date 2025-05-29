
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, RotateCcw, Lock, Unlock } from "lucide-react";
import { useTabVisibilitySettings } from "@/hooks/useTabVisibilitySettings";

const TabVisibilitySettingsUpdated: React.FC = () => {
  const { settings, loading, updateSetting } = useTabVisibilitySettings();
  const [saving, setSaving] = useState(false);
  
  const handleVisibilityChange = async (settingName: string, isVisible: boolean) => {
    await updateSetting(settingName, { is_visible: isVisible });
  };
  
  const handleLoginRequirementChange = async (settingName: string, requiresLogin: boolean) => {
    await updateSetting(settingName, { requires_login: requiresLogin });
  };
  
  const resetToDefaults = async () => {
    setSaving(true);
    try {
      // Reset all settings to default values
      for (const setting of settings) {
        await updateSetting(setting.setting_name, { 
          is_visible: true, 
          requires_login: setting.setting_name === 'settings' 
        });
      }
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return <div className="py-4 text-center text-muted-foreground">Instellingen laden...</div>;
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tab Zichtbaarheid</CardTitle>
        <CardDescription>
          Configureer welke tabbladen zichtbaar zijn en of inloggen vereist is
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {settings.map((setting) => (
            <div key={setting.setting_name} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {setting.is_visible ? (
                    <Eye className="h-4 w-4 text-green-500" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-red-500" />
                  )}
                  <Label className="capitalize font-medium">
                    {setting.setting_name.replace('-', ' ')}
                  </Label>
                </div>
                <Switch
                  checked={setting.is_visible}
                  onCheckedChange={(checked) => 
                    handleVisibilityChange(setting.setting_name, checked)
                  }
                />
              </div>
              
              {setting.is_visible && (
                <div className="flex items-center justify-between pl-6 border-l-2 border-gray-200">
                  <div className="flex items-center gap-2">
                    {setting.requires_login ? (
                      <Lock className="h-4 w-4 text-orange-500" />
                    ) : (
                      <Unlock className="h-4 w-4 text-green-500" />
                    )}
                    <Label className="text-sm text-muted-foreground">
                      Inloggen vereist
                    </Label>
                  </div>
                  <Switch
                    checked={setting.requires_login}
                    onCheckedChange={(checked) => 
                      handleLoginRequirementChange(setting.setting_name, checked)
                    }
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={resetToDefaults} 
          disabled={saving}
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Standaardinstellingen
        </Button>
        <div className="text-sm text-muted-foreground">
          Wijzigingen worden automatisch opgeslagen
        </div>
      </CardFooter>
    </Card>
  );
};

export default TabVisibilitySettingsUpdated;
