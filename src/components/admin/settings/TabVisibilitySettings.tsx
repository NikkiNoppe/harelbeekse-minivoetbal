
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, RotateCcw } from "lucide-react";
import { useTabVisibility, TabName } from "@/context/TabVisibilityContext";

const TabVisibilitySettings: React.FC = () => {
  const { tabsVisibility, updateTabVisibility, saveTabVisibilitySettings, resetToDefaults } = useTabVisibility();
  
  const handleTabVisibilityChange = (tab: TabName) => {
    updateTabVisibility(tab, !tabsVisibility[tab]);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tab Zichtbaarheid</CardTitle>
        <CardDescription>Configureer welke tabbladen zichtbaar zijn voor gebruikers</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(tabsVisibility).map(([tab, isVisible]) => (
            <div key={tab} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isVisible ? <Eye className="h-4 w-4 text-green-500" /> : <EyeOff className="h-4 w-4 text-red-500" />}
                <Label htmlFor={`tab-${tab}`} className="capitalize">{tab}</Label>
              </div>
              <Switch
                id={`tab-${tab}`}
                checked={isVisible}
                onCheckedChange={() => handleTabVisibilityChange(tab as TabName)}
              />
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={resetToDefaults} className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4" />
          Standaardinstellingen
        </Button>
        <Button onClick={saveTabVisibilitySettings}>
          Instellingen opslaan
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TabVisibilitySettings;
