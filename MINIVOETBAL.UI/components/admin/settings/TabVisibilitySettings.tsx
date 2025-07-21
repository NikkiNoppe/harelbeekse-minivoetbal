
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../../../MINIVOETBAL.UI/components/ui/card";
import { Switch } from "../../../MINIVOETBAL.UI/components/ui/switch";
import { Button } from "../../../MINIVOETBAL.UI/components/ui/button";
import { Label } from "../../../MINIVOETBAL.UI/components/ui/label";
import { Eye, EyeOff, RotateCcw } from "lucide-react";
import { useTabVisibilitySettings } from "../../../MINIVOETBAL.UI/hooks/useTabVisibilitySettings";

const TabVisibilitySettings: React.FC = () => {
  const { settings, loading, updateSetting } = useTabVisibilitySettings();
  
  const handleTabVisibilityChange = (settingName: string, isVisible: boolean) => {
    updateSetting(settingName, { is_visible: isVisible });
  };
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tab Zichtbaarheid</CardTitle>
        <CardDescription>Configureer welke tabbladen zichtbaar zijn voor gebruikers</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {settings.map((setting) => (
            <div key={setting.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {setting.is_visible ? <Eye className="h-4 w-4 text-green-500" /> : <EyeOff className="h-4 w-4 text-red-500" />}
                <Label htmlFor={`tab-${setting.setting_name}`} className="capitalize">{setting.setting_name}</Label>
              </div>
              <Switch
                id={`tab-${setting.setting_name}`}
                checked={setting.is_visible}
                onCheckedChange={(checked) => handleTabVisibilityChange(setting.setting_name, checked)}
              />
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4" />
          Standaardinstellingen
        </Button>
        <Button>
          Instellingen opslaan
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TabVisibilitySettings;
