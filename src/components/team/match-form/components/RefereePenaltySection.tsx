import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { costSettingsService } from "@/services/costSettingsService";
import { financialService } from "@/services/financialService";
import { MatchFormData } from "../types";
import { getCurrentDate } from "@/lib/dateUtils";

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

  const savePenalties = async () => {
    if (penalties.length === 0) return;

    setIsLoading(true);
    try {
      const currentDate = getCurrentDate();
      
      for (const penalty of penalties) {
        if (penalty.costSettingId && penalty.teamId) {
          const costSetting = availablePenalties.find(cs => cs.id === penalty.costSettingId);
          if (costSetting) {
            await financialService.addTeamTransaction({
              teamId: penalty.teamId,
              amount: costSetting.amount,
              description: penalty.description || costSetting.name,
              transactionType: 'penalty',
              date: currentDate,
              matchId: match.matchId
            });
          }
        }
      }

      toast({
        title: "Boetes opgeslagen",
        description: "De boetes zijn succesvol toegevoegd aan de teamtransacties.",
      });

      setPenalties([]);
    } catch (error) {
      toast({
        title: "Fout bij opslaan",
        description: "Er is een fout opgetreden bij het opslaan van de boetes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-2xl text-center text-purple-light">Scheidsrechter: Boetes</h3>
      
      <div className="space-y-4">
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
                placeholder="Extra details over de boete..."
              />
            </div>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => removePenalty(index)}
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Boete Verwijderen
            </Button>
          </div>
        ))}

        <div className="flex gap-2">
          <Button
            onClick={addPenalty}
            variant="outline"
            className="flex-1"
          >
            <Plus className="h-4 w-4 mr-2" />
            Boete Toevoegen
          </Button>
          
          {penalties.length > 0 && (
            <Button
              onClick={savePenalties}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? "Opslaan..." : "Boetes Opslaan"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
