import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Lock, Unlock } from "lucide-react";

interface LockSettings {
  id: number;
  lock_from_date: string | null;
  is_active: boolean;
  created_by: number | null;
}

const PlayerListLockSettings: React.FC = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<LockSettings | null>(null);
  const [lockDate, setLockDate] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch current settings
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('player_list_lock_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (error) throw error;

      setSettings(data);
      setLockDate(data.lock_from_date || "");
      setIsActive(data.is_active || false);
    } catch (error) {
      console.error('Error fetching lock settings:', error);
      toast({
        title: "Fout",
        description: "Kon lock instellingen niet laden",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('player_list_lock_settings')
        .update({
          lock_from_date: lockDate || null,
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', 1);

      if (error) throw error;

      await fetchSettings();
      
      toast({
        title: "Instellingen opgeslagen",
        description: `Spelerslijst ${isActive ? 'vergrendeld' : 'ontgrendeld'}`,
      });
    } catch (error) {
      console.error('Error saving lock settings:', error);
      toast({
        title: "Fout",
        description: "Kon instellingen niet opslaan",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const isCurrentlyLocked = () => {
    if (!isActive || !lockDate) return false;
    return new Date() >= new Date(lockDate);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isCurrentlyLocked() ? (
            <Lock className="h-5 w-5 text-red-500" />
          ) : (
            <Unlock className="h-5 w-5 text-green-500" />
          )}
          Spelerslijst Vergrendeling
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="lock-active"
            checked={isActive}
            onCheckedChange={setIsActive}
          />
          <Label htmlFor="lock-active">
            Spelerslijst vergrendeling actief
          </Label>
        </div>

        <div className="space-y-1">
          <Label htmlFor="lock-date">
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

        {isActive && lockDate && (
          <div className="p-2 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">
              Status: {isCurrentlyLocked() ? (
                <span className="text-red-600 font-medium">
                  Spelerslijst is vergrendeld sinds {new Date(lockDate).toLocaleDateString('nl-NL')}
                </span>
              ) : (
                <span className="text-green-600 font-medium">
                  Spelerslijst wordt vergrendeld op {new Date(lockDate).toLocaleDateString('nl-NL')}
                </span>
              )}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Teamverantwoordelijken kunnen geen spelers meer toevoegen, bewerken of verwijderen vanaf de lock datum.
            </p>
          </div>
        )}

        <Button 
          onClick={saveSettings} 
          disabled={saving}
          size="sm"
          className="w-full"
        >
          {saving ? "Opslaan..." : "Instellingen opslaan"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PlayerListLockSettings;
