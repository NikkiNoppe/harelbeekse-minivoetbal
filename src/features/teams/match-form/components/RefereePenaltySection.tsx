
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { costSettingsService } from "@/services/costSettingsService";
import { financialService } from "@/services/financialService";
import { MatchFormData } from "../types";

interface PenaltyItem {
  id?: number;
  costSettingId: number;
  teamId: number;
  amount?: number;
  description?: string;
}

interface RefereePenaltySectionProps {
  match: MatchFormData;
  canEdit: boolean;
}

export const RefereePenaltySection: React.FC<RefereePenaltySectionProps> = ({
  match,
  canEdit
}) => {
  const { toast } = useToast();
  const [penalties, setPenalties] = useState<PenaltyItem[]>([]);
  const [availablePenalties, setAvailablePenalties] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadAvailablePenalties();
    loadExistingPenalties();
  }, [match.matchId]);

  const loadAvailablePenalties = async () => {
    try {
      const costSettings = await costSettingsService.getPenalties();
      setAvailablePenalties(costSettings);
    } catch (error) {
      console.error('Error loading penalties:', error);
    }
  };

  const loadExistingPenalties = async () => {
    // Load existing penalties for this match from team_transactions
    // This would require a new service method to fetch penalties by match_id
  };

  const addPenalty = () => {
    setPenalties(prev => [...prev, {
      costSettingId: 0,
      teamId: match.homeTeamId,
      amount: 0,
      description: ''
    }]);
  };

  const updatePenalty = (index: number, field: keyof PenaltyItem, value: any) => {
    setPenalties(prev => prev.map((penalty, i) => 
      i === index ? { ...penalty, [field]: value } : penalty
    ));
  };

  const removePenalty = (index: number) => {
    setPenalties(prev => prev.filter((_, i) => i !== index));
  };

  const savePenalty = async (index: number) => {
    const penalty = penalties[index];
    if (!penalty.costSettingId || !penalty.teamId) {
      toast({
        title: "Fout",
        description: "Selecteer een boete en team",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const selectedPenalty = availablePenalties.find(p => p.id === penalty.costSettingId);
      
      await financialService.addTransaction({
        team_id: penalty.teamId,
        transaction_type: 'penalty',
        amount: selectedPenalty?.amount || penalty.amount || 0,
        description: penalty.description || selectedPenalty?.description || 'Boete',
        penalty_type_id: null,
        match_id: match.matchId,
        transaction_date: new Date().toISOString().split('T')[0],
        cost_setting_id: penalty.costSettingId
      });

      toast({
        title: "Boete toegevoegd",
        description: "De boete is succesvol toegevoegd aan het team.",
      });

      // Update the penalty with the saved state
      updatePenalty(index, 'id', Date.now()); // Temporary ID for UI
    } catch (error) {
      toast({
        title: "Fout bij opslaan",
        description: "Er is een fout opgetreden bij het opslaan van de boete.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!canEdit) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Scheidsrechter: Boetes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {penalties.map((penalty, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Boete Type</Label>
                <Select
                  value={penalty.costSettingId.toString()}
                  onValueChange={(value) => updatePenalty(index, 'costSettingId', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer boete" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePenalties.map((penaltyType) => (
                      <SelectItem key={penaltyType.id} value={penaltyType.id.toString()}>
                        {penaltyType.name} - €{penaltyType.amount}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Team</Label>
                <Select
                  value={penalty.teamId.toString()}
                  onValueChange={(value) => updatePenalty(index, 'teamId', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={match.homeTeamId.toString()}>
                      {match.homeTeamName}
                    </SelectItem>
                    <SelectItem value={match.awayTeamId.toString()}>
                      {match.awayTeamName}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Beschrijving (optioneel)</Label>
              <Input
                value={penalty.description || ''}
                onChange={(e) => updatePenalty(index, 'description', e.target.value)}
                placeholder="Extra details over de boete"
              />
            </div>

            <div className="flex justify-between">
              <Button
                onClick={() => savePenalty(index)}
                disabled={isLoading || !!penalty.id}
                variant="default"
                size="sm"
              >
                {penalty.id ? "Opgeslagen" : "Opslaan"}
              </Button>
              
              <Button
                onClick={() => removePenalty(index)}
                variant="destructive"
                size="sm"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        <Button
          onClick={addPenalty}
          variant="outline"
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Boete Toevoegen
        </Button>
      </CardContent>
    </Card>
  );
};
