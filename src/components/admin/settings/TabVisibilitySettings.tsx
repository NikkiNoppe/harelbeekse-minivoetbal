
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

// Initial tabs visibility settings
const initialTabsVisibility = {
  algemeen: true,
  competitie: true,
  playoff: true,
  beker: true,
  schorsingen: true,
  reglement: true
};

const TabVisibilitySettings: React.FC = () => {
  const { toast } = useToast();
  const [tabsVisibility, setTabsVisibility] = useState(initialTabsVisibility);
  
  const handleTabVisibilityChange = (tab: keyof typeof tabsVisibility) => {
    setTabsVisibility(prev => ({
      ...prev,
      [tab]: !prev[tab]
    }));
    
    toast({
      title: `Tab ${tab} ${!tabsVisibility[tab] ? "zichtbaar" : "verborgen"}`,
      description: `De tab is nu ${!tabsVisibility[tab] ? "zichtbaar" : "verborgen"} voor gebruikers.`
    });
  };
  
  const handleSaveSettings = () => {
    // In a real app, this would save the settings to a backend
    toast({
      title: "Instellingen opgeslagen",
      description: "De tab zichtbaarheid is succesvol bijgewerkt."
    });
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
                onCheckedChange={() => handleTabVisibilityChange(tab as keyof typeof tabsVisibility)}
              />
            </div>
          ))}
          
          <Button className="mt-4" onClick={handleSaveSettings}>
            Instellingen opslaan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TabVisibilitySettings;
