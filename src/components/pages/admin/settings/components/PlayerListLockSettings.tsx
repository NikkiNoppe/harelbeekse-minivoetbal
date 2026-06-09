import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDateShort } from "@/lib/dateUtils";
import {
  insertApplicationSettingForSession,
  listApplicationSettingsForSession,
  updateApplicationSettingForSession,
} from "@/services/core/applicationSettingsSessionFetch";

interface LockSettings {
  id: number;
  lock_from_date: string | null;
  lock_enabled: boolean;
}

const PlayerListLockSettings: React.FC = () => {
  const [settings, setSettings] = useState<LockSettings | null>(null);
  const [lockDate, setLockDate] = useState<string>("");
  const [lockEnabled, setLockEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const rows = await listApplicationSettingsForSession('player_list_lock');
      const data = rows.find((row) => row.setting_name === 'global_lock');

      if (data) {
        const settingValue = data.setting_value as { lock_from_date?: string | null; lock_enabled?: boolean };
        const enabled = settingValue?.lock_enabled ?? true;
        const mappedSettings: LockSettings = {
          id: data.id,
          lock_from_date: settingValue?.lock_from_date || null,
          lock_enabled: enabled,
        };

        setSettings(mappedSettings);
        setLockDate(settingValue?.lock_from_date || "");
        setLockEnabled(enabled);
      } else {
        const defaultSettingValue = {
          lock_from_date: null,
          lock_enabled: false,
        };

        const newId = await insertApplicationSettingForSession({
          setting_category: 'player_list_lock',
          setting_name: 'global_lock',
          setting_value: defaultSettingValue,
        });

        const mappedSettings: LockSettings = {
          id: newId,
          lock_from_date: null,
          lock_enabled: false,
        };

        setSettings(mappedSettings);
        setLockDate("");
        setLockEnabled(false);
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
        lock_enabled: lockEnabled,
      };

      await updateApplicationSettingForSession(settings.id, {
        setting_value: settingValue,
        setting_category: 'player_list_lock',
      });

      setSettings({
        ...settings,
        lock_from_date: lockDate || null,
        lock_enabled: lockEnabled,
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
    if (!lockEnabled || !lockDate) return false;
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
            checked={lockEnabled}
            onCheckedChange={setLockEnabled}
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
            disabled={!lockEnabled}
          />
        </div>

        <Button
          onClick={saveSettings}
          disabled={saving}
          className="btn btn--primary"
        >
          {saving ? "Opslaan..." : "Opslaan"}
        </Button>

        {settings && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Status</h4>
            <div className="space-y-1 text-sm">
              <div>
                <strong>Actief:</strong> {lockEnabled ? "Ja" : "Nee"}
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
