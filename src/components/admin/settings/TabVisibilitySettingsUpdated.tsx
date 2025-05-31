
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, RotateCcw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TabVisibilitySetting {
  id: number;
  setting_name: string;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

const TabVisibilitySettingsUpdated: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: settings, isLoading } = useQuery({
    queryKey: ['tab-visibility-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tab_visibility_settings')
        .select('*')
        .order('setting_name');
      
      if (error) throw error;
      return data as TabVisibilitySetting[];
    }
  });

  const updateVisibilityMutation = useMutation({
    mutationFn: async ({ settingName, isVisible }: { settingName: string; isVisible: boolean }) => {
      const { error } = await supabase
        .from('tab_visibility_settings')
        .update({ 
          is_visible: isVisible,
          updated_at: new Date().toISOString()
        })
        .eq('setting_name', settingName);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tab-visibility-settings'] });
      toast({
        title: "Instelling bijgewerkt",
        description: "Tab zichtbaarheid is succesvol aangepast."
      });
    },
    onError: () => {
      toast({
        title: "Fout bij opslaan",
        description: "Kon instelling niet bijwerken",
        variant: "destructive",
      });
    }
  });

  const resetToDefaultsMutation = useMutation({
    mutationFn: async () => {
      const defaultSettings = ['algemeen', 'competitie', 'playoff', 'beker', 'schorsingen', 'reglement'];
      
      for (const settingName of defaultSettings) {
        const { error } = await supabase
          .from('tab_visibility_settings')
          .upsert({ 
            setting_name: settingName,
            is_visible: true,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'setting_name'
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tab-visibility-settings'] });
      toast({
        title: "Instellingen hersteld",
        description: "Tab zichtbaarheid is teruggezet naar standaardinstellingen."
      });
    },
    onError: () => {
      toast({
        title: "Fout bij herstellen",
        description: "Kon standaardinstellingen niet herstellen",
        variant: "destructive",
      });
    }
  });

  const handleVisibilityChange = (settingName: string, isVisible: boolean) => {
    updateVisibilityMutation.mutate({ settingName, isVisible });
  };

  const getTabDisplayName = (settingName: string) => {
    const displayNames: { [key: string]: string } = {
      'algemeen': 'Algemeen',
      'competitie': 'Competitie',
      'playoff': 'Play-Off',
      'beker': 'Beker',
      'schorsingen': 'Schorsingen',
      'reglement': 'Reglement'
    };
    return displayNames[settingName] || settingName.charAt(0).toUpperCase() + settingName.slice(1);
  };
  
  if (isLoading) {
    return <div className="py-4 text-center text-muted-foreground">Instellingen laden...</div>;
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hoofdtab Zichtbaarheid</CardTitle>
        <CardDescription>
          Configureer welke hoofdtabbladen zichtbaar zijn
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {settings?.map((setting) => (
            <div key={setting.setting_name} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {setting.is_visible ? (
                    <Eye className="h-4 w-4 text-green-500" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-red-500" />
                  )}
                  <Label className="font-medium">
                    {getTabDisplayName(setting.setting_name)}
                  </Label>
                </div>
                <Switch
                  checked={setting.is_visible}
                  onCheckedChange={(checked) => 
                    handleVisibilityChange(setting.setting_name, checked)
                  }
                  disabled={updateVisibilityMutation.isPending}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => resetToDefaultsMutation.mutate()}
          disabled={resetToDefaultsMutation.isPending}
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Standaardinstellingen
        </Button>
        <div className="text-sm text-muted-foreground self-center">
          Wijzigingen worden automatisch opgeslagen
        </div>
      </CardFooter>
    </Card>
  );
};

export default TabVisibilitySettingsUpdated;
