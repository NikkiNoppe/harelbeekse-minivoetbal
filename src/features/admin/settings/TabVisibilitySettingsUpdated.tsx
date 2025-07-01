import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Switch } from "@shared/components/ui/switch";
import { Button } from "@shared/components/ui/button";
import { Label } from "@shared/components/ui/label";
import { Separator } from "@shared/components/ui/separator";
import { useTabVisibilitySettings } from "@shared/hooks/useTabVisibilitySettings";
import { useToast } from "@shared/hooks/use-toast";
import { Eye, EyeOff, Save } from "lucide-react";

interface TabVisibilitySettingsProps {
  tabs: { id: string; label: string }[];
}

const TabVisibilitySettingsUpdated: React.FC<TabVisibilitySettingsProps> = ({ tabs }) => {
  const { tabVisibility, setTabVisibility, saveTabVisibility } = useTabVisibilitySettings();
  const { toast } = useToast();

  const handleVisibilityChange = (tabId: string, isVisible: boolean) => {
    setTabVisibility(prev => ({ ...prev, [tabId]: isVisible }));
  };

  const handleSaveSettings = async () => {
    const success = await saveTabVisibility();
    if (success) {
      toast({
        title: "Instellingen opgeslagen",
        description: "Tabblad zichtbaarheid is succesvol opgeslagen.",
      });
    } else {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het opslaan van de instellingen.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Tabblad Zichtbaarheid
        </CardTitle>
        <CardDescription>Beheer welke tabbladen zichtbaar zijn voor gebruikers.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {tabs.map(tab => (
          <div key={tab.id} className="flex items-center justify-between">
            <Label htmlFor={tab.id} className="capitalize">
              {tab.label}
            </Label>
            <Switch
              id={tab.id}
              checked={tabVisibility[tab.id] !== false}
              onCheckedChange={(checked) => handleVisibilityChange(tab.id, checked)}
            />
          </div>
        ))}
        <Separator />
        <Button onClick={handleSaveSettings} className="w-full">
          <Save className="mr-2 h-4 w-4" />
          Opslaan
        </Button>
      </CardContent>
    </Card>
  );
};

export default TabVisibilitySettingsUpdated;
