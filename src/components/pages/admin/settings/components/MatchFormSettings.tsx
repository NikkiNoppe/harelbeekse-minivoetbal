import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FileText, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface FormSettings {
  id: number | null;
  lock_minutes_before: number;
  allow_late_submission: boolean;
  late_penalty_amount: number;
  late_penalty_note: string;
}

const DEFAULT: FormSettings = {
  id: null,
  lock_minutes_before: 5,
  allow_late_submission: false,
  late_penalty_amount: 5.0,
  late_penalty_note: "⚠️ BOETE: Wedstrijdblad te laat ingevuld",
};

const MatchFormSettings: React.FC = () => {
  const [settings, setSettings] = useState<FormSettings>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("application_settings")
        .select("id, setting_value, is_active")
        .eq("setting_category", "match_form_settings")
        .eq("setting_name", "lock_rules")
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        const val = data.setting_value as Record<string, unknown>;
        setSettings({
          id: data.id,
          lock_minutes_before: (val.lock_minutes_before as number) ?? 5,
          allow_late_submission: (val.allow_late_submission as boolean) ?? false,
          late_penalty_amount: (val.late_penalty_amount as number) ?? 5.0,
          late_penalty_note: (val.late_penalty_note as string) ?? DEFAULT.late_penalty_note,
        });
      } else {
        // Create default row
        const { data: newData, error: insertError } = await supabase
          .from("application_settings")
          .insert({
            setting_category: "match_form_settings",
            setting_name: "lock_rules",
            setting_value: {
              lock_minutes_before: 5,
              allow_late_submission: false,
              late_penalty_amount: 5.0,
              late_penalty_note: DEFAULT.late_penalty_note,
            },
            is_active: true,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setSettings({ ...DEFAULT, id: newData.id });
      }
    } catch (error) {
      console.error("Error fetching match form settings:", error);
      toast({
        title: "Fout bij ophalen instellingen",
        description: "Kon wedstrijdformulier-instellingen niet ophalen",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings.id) return;
    setSaving(true);
    try {
      const settingValue = {
        lock_minutes_before: settings.lock_minutes_before,
        allow_late_submission: settings.allow_late_submission,
        late_penalty_amount: settings.late_penalty_amount,
        late_penalty_note: settings.late_penalty_note,
      };

      const { error } = await supabase
        .from("application_settings")
        .update({
          setting_value: settingValue,
          updated_at: new Date().toISOString(),
        })
        .eq("id", settings.id);

      if (error) throw error;

      // Invalidate cached settings
      queryClient.invalidateQueries({ queryKey: ["match-form-settings"] });

      toast({
        title: "Instellingen opgeslagen",
        description: "Wedstrijdformulier-instellingen zijn bijgewerkt",
      });
    } catch (error) {
      console.error("Error saving match form settings:", error);
      toast({
        title: "Fout bij opslaan",
        description: "Kon instellingen niet opslaan",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Wedstrijdformulieren
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
          <FileText className="h-5 w-5" />
          Wedstrijdformulieren
        </CardTitle>
        <CardDescription>
          Configureer vergrendeling en boetes voor wedstrijdformulieren
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Lock minutes */}
        <div className="space-y-2">
          <Label htmlFor="lock-minutes" className="font-medium">
            Automatische vergrendeling
          </Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sluit formulier</span>
            <Input
              id="lock-minutes"
              type="number"
              min={0}
              max={120}
              className="w-20"
              value={settings.lock_minutes_before}
              onChange={(e) =>
                setSettings({ ...settings, lock_minutes_before: Math.max(0, parseInt(e.target.value) || 0) })
              }
            />
            <span className="text-sm text-muted-foreground">minuten voor aanvang</span>
          </div>
        </div>

        {/* Late submission toggle */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Switch
              id="allow-late"
              checked={settings.allow_late_submission}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, allow_late_submission: checked })
              }
            />
            <Label htmlFor="allow-late">
              Sta te laat invullen toe (met boete)
            </Label>
          </div>

          {settings.allow_late_submission && (
            <div className="ml-8 space-y-3 border-l-2 border-warning/30 pl-4">
              <div className="space-y-1">
                <Label htmlFor="penalty-amount" className="text-sm">
                  Boetebedrag
                </Label>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium">€</span>
                  <Input
                    id="penalty-amount"
                    type="number"
                    min={0}
                    step={0.5}
                    className="w-24"
                    value={settings.late_penalty_amount}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        late_penalty_amount: Math.max(0, parseFloat(e.target.value) || 0),
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="penalty-note" className="text-sm">
                  Notitie bij boete
                </Label>
                <Input
                  id="penalty-note"
                  type="text"
                  value={settings.late_penalty_note}
                  onChange={(e) =>
                    setSettings({ ...settings, late_penalty_note: e.target.value })
                  }
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Team managers zien een waarschuwing en krijgen automatisch een boete bij opslaan.
              </p>
            </div>
          )}
        </div>

        {/* Info block */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted text-sm">
          <Info className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
          <span className="text-muted-foreground">
            Na het invullen van scores is het formulier onherroepelijk afgesloten voor team managers en scheidsrechters.
          </span>
        </div>

        <Button onClick={saveSettings} disabled={saving} className="btn btn--primary">
          {saving ? "Opslaan..." : "Opslaan"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default MatchFormSettings;
