import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, Plus, Save, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  suspensionRulesService, 
  type SuspensionRules, 
  type YellowCardRule 
} from "@/services/suspensionRulesService";

export const SuspensionRulesSettings: React.FC = () => {
  const { toast } = useToast();
  const [rules, setRules] = useState<SuspensionRules | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      setIsLoading(true);
      const suspensionRules = await suspensionRulesService.getSuspensionRules();
      setRules(suspensionRules);
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
      const success = await suspensionRulesService.updateSuspensionRules(rules);
      
      if (success) {
        toast({
          title: "Opgeslagen",
          description: "Schorsingsregels zijn bijgewerkt."
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
    
    const newRule: YellowCardRule = {
      min_cards: 1,
      max_cards: 1,
      suspension_matches: 1
    };
    
    setRules({
      ...rules,
      yellow_card_rules: [...rules.yellow_card_rules, newRule]
    });
  };

  const updateYellowCardRule = (index: number, field: keyof YellowCardRule, value: number) => {
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Schorsingsregels
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadRules}
              disabled={isLoading}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Herladen
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Opslaan...' : 'Opslaan'}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Yellow Card Rules */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <Label className="text-base font-medium">Gele Kaarten Regels</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={addYellowCardRule}
            >
              <Plus className="h-4 w-4 mr-2" />
              Regel Toevoegen
            </Button>
          </div>
          
          <div className="space-y-3">
            {rules.yellow_card_rules.map((rule, index) => (
              <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Label htmlFor={`min-${index}`} className="text-sm">Van:</Label>
                  <Input
                    id={`min-${index}`}
                    type="number"
                    value={rule.min_cards}
                    onChange={(e) => updateYellowCardRule(index, 'min_cards', parseInt(e.target.value) || 0)}
                    className="w-16"
                    min="1"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Label htmlFor={`max-${index}`} className="text-sm">Tot:</Label>
                  <Input
                    id={`max-${index}`}
                    type="number"
                    value={rule.max_cards}
                    onChange={(e) => updateYellowCardRule(index, 'max_cards', parseInt(e.target.value) || 0)}
                    className="w-16"
                    min="1"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Label htmlFor={`suspension-${index}`} className="text-sm">Schorsing:</Label>
                  <Input
                    id={`suspension-${index}`}
                    type="number"
                    value={rule.suspension_matches}
                    onChange={(e) => updateYellowCardRule(index, 'suspension_matches', parseInt(e.target.value) || 0)}
                    className="w-16"
                    min="0"
                  />
                  <span className="text-sm text-muted-foreground">wedstrijd(en)</span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeYellowCardRule(index)}
                  className="ml-auto"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Red Card Rules */}
        <div>
          <Label className="text-base font-medium">Rode Kaarten Regels</Label>
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-4">
              <Label htmlFor="red-default">Standaard schorsing:</Label>
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
                className="w-20"
                min="1"
              />
              <span className="text-sm text-muted-foreground">wedstrijd(en)</span>
            </div>
            
            <div className="flex items-center gap-4">
              <Label htmlFor="red-max">Maximum schorsing:</Label>
              <Input
                id="red-max"
                type="number"
                value={rules.red_card_rules.max_suspension_matches}
                onChange={(e) => setRules({
                  ...rules,
                  red_card_rules: {
                    ...rules.red_card_rules,
                    max_suspension_matches: parseInt(e.target.value) || 5
                  }
                })}
                className="w-20"
                min="1"
                max="10"
              />
              <span className="text-sm text-muted-foreground">wedstrijd(en)</span>
            </div>
            
            <div className="flex items-center gap-3">
              <Switch
                id="admin-modify"
                checked={rules.red_card_rules.admin_can_modify}
                onCheckedChange={(checked) => setRules({
                  ...rules,
                  red_card_rules: {
                    ...rules.red_card_rules,
                    admin_can_modify: checked
                  }
                })}
              />
              <Label htmlFor="admin-modify">Admin kan schorsing aanpassen</Label>
            </div>
          </div>
        </div>

        <Separator />

        {/* Reset Rules */}
        <div>
          <Label className="text-base font-medium">Reset Regels</Label>
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-4">
              <Label htmlFor="reset-matches">Reset gele kaarten na:</Label>
              <Input
                id="reset-matches"
                type="number"
                value={rules.reset_rules.reset_yellow_cards_after_matches}
                onChange={(e) => setRules({
                  ...rules,
                  reset_rules: {
                    ...rules.reset_rules,
                    reset_yellow_cards_after_matches: parseInt(e.target.value) || 10
                  }
                })}
                className="w-20"
                min="1"
              />
              <span className="text-sm text-muted-foreground">wedstrijden</span>
            </div>
            
            <div className="flex items-center gap-3">
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
              <Label htmlFor="season-reset">Reset aan einde van seizoen</Label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 