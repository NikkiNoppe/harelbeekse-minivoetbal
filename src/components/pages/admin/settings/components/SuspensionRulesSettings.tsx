import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, Plus, Save, ShieldAlert, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { 
  suspensionRulesService, 
  type SuspensionRules, 
  type YellowCardRule 
} from "@/domains/cards-suspensions";

function fingerprintSuspensionRules(r: SuspensionRules): string {
  const normalized: SuspensionRules = {
    ...r,
    yellow_card_rules: [...r.yellow_card_rules].sort((a, b) => a.card_count - b.card_count),
  };
  return JSON.stringify(normalized);
}

export const SuspensionRulesSettings: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rules, setRules] = useState<SuspensionRules | null>(null);
  const [savedFingerprint, setSavedFingerprint] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      setIsLoading(true);
      const suspensionRules = await suspensionRulesService.getSuspensionRules();
      setRules(suspensionRules);
      setSavedFingerprint(fingerprintSuspensionRules(suspensionRules));
    } catch (error) {
      console.error('Error loading suspension rules:', error);
      toast({
        title: "Fout",
        description: "Kon schorsingsregels niet laden.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!rules) return;

    try {
      setIsSaving(true);
      const rulesToSave: SuspensionRules = {
        ...rules,
        yellow_card_rules: [...rules.yellow_card_rules].sort((a, b) => a.card_count - b.card_count),
        red_card_rules: {
          ...rules.red_card_rules,
          admin_can_modify: true
        }
      };

      const success = await suspensionRulesService.updateSuspensionRules(rulesToSave);
      
      if (success) {
        setRules(rulesToSave);
        setSavedFingerprint(fingerprintSuspensionRules(rulesToSave));
        queryClient.invalidateQueries({ queryKey: ['suspensions'] });
        toast({
          title: "Opgeslagen",
          description: "Schorsingsregels zijn bijgewerkt en opnieuw toegepast."
        });
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      console.error('Error saving suspension rules:', error);
      toast({
        title: "Fout",
        description: "Kon schorsingsregels niet opslaan.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addYellowCardRule = () => {
    if (!rules) return;
    
    const highestCardCount = Math.max(0, ...rules.yellow_card_rules.map((rule) => rule.card_count || 0));
    const newRule: YellowCardRule = {
      card_count: highestCardCount + 2,
      suspension_matches: 1
    };
    
    setRules({
      ...rules,
      yellow_card_rules: [...rules.yellow_card_rules, newRule]
    });
  };

  const updateYellowCardRule = (index: number, field: 'card_count' | 'suspension_matches', value: number) => {
    if (!rules) return;
    
    const updatedRules = [...rules.yellow_card_rules];
    updatedRules[index] = { ...updatedRules[index], [field]: value };
    
    setRules({
      ...rules,
      yellow_card_rules: updatedRules
    });
  };

  const removeYellowCardRule = (index: number) => {
    if (!rules) return;
    
    const updatedRules = rules.yellow_card_rules.filter((_, i) => i !== index);
    setRules({
      ...rules,
      yellow_card_rules: updatedRules
    });
  };

  const currentFingerprint = useMemo(
    () => (rules ? fingerprintSuspensionRules(rules) : null),
    [rules]
  );
  const isDirty =
    savedFingerprint !== null &&
    currentFingerprint !== null &&
    currentFingerprint !== savedFingerprint;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Schorsingsregels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!rules) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Schorsingsregels</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              Kon schorsingsregels niet laden. Probeer de pagina te vernieuwen.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 text-2xl font-semibold leading-none tracking-tight text-left text-inherit hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md -m-1 p-1"
                aria-expanded={settingsOpen}
                aria-controls="suspension-rules-settings-panel"
                id="suspension-rules-settings-trigger"
              >
                <ChevronDown
                  className={cn(
                    "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200",
                    settingsOpen ? "rotate-0" : "-rotate-90"
                  )}
                  aria-hidden
                />
                <ShieldAlert className="h-5 w-5 text-destructive shrink-0" />
                Kaarten & Schorsingen
              </button>
            </CollapsibleTrigger>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || !isDirty}
              className="btn btn--primary"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Opslaan...' : 'Opslaan'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CollapsibleContent id="suspension-rules-settings-panel" role="region" aria-labelledby="suspension-rules-settings-trigger">
          <CardContent className="space-y-4 pt-0">
            <p className="text-sm text-muted-foreground">
              Aanpasbaar tijdens het seizoen. Na opslaan worden de huidige kaarttotalen opnieuw tegen deze regels berekend.
            </p>

            {/* Yellow Card Rules */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <Label className="text-base font-medium">Gele kaarten</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addYellowCardRule}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Regel Toevoegen
                </Button>
              </div>

              <div className="grid gap-2">
                {rules.yellow_card_rules.map((rule, index) => (
                  <div key={index} className="grid gap-2 rounded-md border border-border/50 bg-muted/10 px-3 py-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground whitespace-nowrap">Vanaf</span>
                      <Input
                        type="number"
                        value={rule.card_count}
                        onChange={(e) => updateYellowCardRule(index, 'card_count', parseInt(e.target.value) || 1)}
                        className="w-16"
                        min="1"
                      />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">gele kaarten</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground whitespace-nowrap">=</span>
                      <Input
                        type="number"
                        value={rule.suspension_matches}
                        onChange={(e) => updateYellowCardRule(index, 'suspension_matches', parseInt(e.target.value) || 0)}
                        className="w-16"
                        min="0"
                      />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">wedstrijd(en)</span>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeYellowCardRule(index)}
                      className="md:ml-auto"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Red Card Rules */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Rechtstreeks rood</Label>
              <div className="rounded-md border border-border/50 bg-muted/10 px-3 py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Label htmlFor="red-default" className="text-sm text-muted-foreground">Standaard</Label>
                  <Input
                    id="red-default"
                    type="number"
                    value={rules.red_card_rules.default_suspension_matches}
                    onChange={(e) => setRules({
                      ...rules,
                      red_card_rules: {
                        ...rules.red_card_rules,
                        default_suspension_matches: parseInt(e.target.value) || 1
                      }
                    })}
                    className="w-16"
                    min="1"
                  />
                  <span className="text-sm text-muted-foreground">wedstrijd(en)</span>
                  <span className="text-xs text-muted-foreground">
                    Geen maximum; afwijkingen beheer je als handmatige schorsing.
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Reset Rules */}
            <div className="flex items-center justify-between gap-3 rounded-md border border-border/50 bg-muted/10 px-3 py-2">
              <Label htmlFor="season-reset" className="text-sm font-medium">Reset kaarten aan einde seizoen</Label>
              <Switch
                id="season-reset"
                checked={rules.reset_rules.reset_at_season_end}
                onCheckedChange={(checked) => setRules({
                  ...rules,
                  reset_rules: {
                    ...rules.reset_rules,
                    reset_at_season_end: checked
                  }
                })}
              />
            </div>

            <div
              className={cn(
                'rounded-md border px-3 py-2.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between',
                isDirty
                  ? 'border-primary/20 bg-primary/5'
                  : 'border-border/40 bg-muted/20'
              )}
            >
              <p className="text-xs text-muted-foreground leading-snug">
                {isDirty
                  ? 'Wijzigingen zijn nog niet actief. Bewaar om de regels opnieuw toe te passen op de kaarttotalen.'
                  : 'Alle regels zijn opgeslagen zoals ze nu gelden.'}
              </p>
              <Button
                type="button"
                size="sm"
                variant={isDirty ? 'default' : 'secondary'}
                className="shrink-0 h-8 text-xs"
                disabled={!isDirty || isSaving}
                onClick={handleSave}
              >
                <Save className="h-3.5 w-3.5 mr-1.5" />
                {isSaving ? 'Bezig…' : 'Wijzigingen bewaren'}
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}; 
