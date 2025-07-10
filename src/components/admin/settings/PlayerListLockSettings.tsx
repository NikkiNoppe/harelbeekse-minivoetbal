import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDateShort } from "@/lib/dateUtils";

interface LockSettings {
  id: number;
  lock_from_date: string | null;
  is_active: boolean;
  created_by: number | null;
}

const PlayerListLockSettings: React.FC = () => {
  const [settings, setSettings] = useState<LockSettings | null>(null);
  const [lockDate, setLockDate] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('application_settings')
        .select('id, setting_value, is_active')
        .eq('setting_category', 'player_list_lock')
        .eq('setting_name', 'global_lock')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        const settingValue = data.setting_value as any;
        const mappedSettings: LockSettings = {
          id: data.id,
          lock_from_date: settingValue?.lock_from_date || null,
          is_active: data.is_active,
          created_by: null
        };
        
        setSettings(mappedSettings);
        setLockDate(settingValue?.lock_from_date || "");
        setIsActive(data.is_active);
      } else {
        // Create default settings if none exist
        const defaultSettingValue = {
          lock_from_date: null,
          updated_at: new Date().toISOString()
        };

        const { data: newData, error: insertError } = await supabase
          .from('application_settings')
          .insert({
            setting_category: 'player_list_lock',
            setting_name: 'global_lock',
            setting_value: defaultSettingValue,
            is_active: false
          })
          .select()
          .single();

        if (insertError) throw insertError;

        const mappedSettings: LockSettings = {
          id: newData.id,
          lock_from_date: null,
          is_active: false,
          created_by: null
        };

        setSettings(mappedSettings);
        setLockDate("");
        setIsActive(false);
      }
    } catch (error) {
      console.error('Error fetching player list lock settings:', error);
      toast({
        title: "Fout bij ophalen instellingen",
        description: "Kon vergrendelingsinstellingen niet ophalen",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      const settingValue = {
        lock_from_date: lockDate || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('application_settings')
        .update({
          setting_value: settingValue,
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', settings.id);

      if (error) throw error;

      setSettings({
        ...settings,
        lock_from_date: lockDate || null,
        is_active: isActive,
      });

      toast({
        title: "Instellingen opgeslagen",
        description: "Spelerslijst vergrendelingsinstellingen zijn bijgewerkt",
      });
    } catch (error) {
      console.error('Error saving player list lock settings:', error);
      toast({
        title: "Fout bij opslaan",
        description: "Kon vergrendelingsinstellingen niet opslaan",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const isCurrentlyLocked = (): boolean => {
    if (!isActive || !lockDate) return false;
    const today = new Date();
    const lockDateObj = new Date(lockDate);
    return today >= lockDateObj;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Spelerslijst Vergrendeling
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>Laden...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Spelerslijst Vergrendeling
        </CardTitle>
        <CardDescription>
          Configureer wanneer de spelerslijst wordt vergrendeld voor wijzigingen
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="lock-enabled"
            checked={isActive}
            onCheckedChange={setIsActive}
          />
          <Label htmlFor="lock-enabled">
            Vergrendeling inschakelen
          </Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="lock-date" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Vergrendel vanaf datum
          </Label>
          <Input
            id="lock-date"
            type="date"
            value={lockDate}
            onChange={(e) => setLockDate(e.target.value)}
            disabled={!isActive}
          />
        </div>

        <Button 
          onClick={saveSettings} 
          disabled={saving}
        >
          {saving ? "Opslaan..." : "Opslaan"}
        </Button>

        {settings && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Status</h4>
            <div className="space-y-1 text-sm">
              <div>
                <strong>Actief:</strong> {isActive ? "Ja" : "Nee"}
              </div>
              {lockDate && (
                <div>
                  <strong>Vergrendeld vanaf:</strong> {formatDateShort(lockDate)}
                </div>
              )}
              <div>
                <strong>Momenteel vergrendeld:</strong>{" "}
                <span className={isCurrentlyLocked() ? "text-destructive" : "text-success"}>
                  {isCurrentlyLocked() ? "Ja" : "Nee"}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlayerListLockSettings;