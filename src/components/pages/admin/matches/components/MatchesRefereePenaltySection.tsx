import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { costSettingsService, financialService } from "@/domains/financial";
import { MatchFormData } from "../types";
import { getCurrentDate } from "@/lib/dateUtils";

interface PenaltyItem {
  id?: number;
  costSettingId: number;
  teamId: number;
}

interface RefereePenaltySectionProps {
  match: MatchFormData;
  canEdit: boolean;
}

// Memoized penalty item component
const PenaltyItemComponent = React.memo<{
  penalty: PenaltyItem;
  index: number;
  availablePenalties: any[];
  teamOptions: { id: number; name: string }[];
  onUpdate: (index: number, field: keyof PenaltyItem, value: any) => void;
  onRemove: (index: number) => void;
  canEdit: boolean;
}>(({ penalty, index, availablePenalties, teamOptions, onUpdate, onRemove, canEdit }) => {
  const handleTeamChange = useCallback((value: string) => {
    onUpdate(index, 'teamId', parseInt(value));
  }, [index, onUpdate]);

  const handleCostSettingChange = useCallback((value: string) => {
    onUpdate(index, 'costSettingId', parseInt(value));
  }, [index, onUpdate]);

  // Remove inline delete action from the temporary add-penalty row as requested

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-4 p-4 border rounded-lg bg-gray-50">
      <div className="flex-1">
        <Label htmlFor={`penalty-team-${index}`}>Team</Label>
        <Select
          value={penalty.teamId.toString()}
          onValueChange={handleTeamChange}
          disabled={!canEdit}
        >
          <SelectTrigger className="dropdown-login-style">
            <SelectValue placeholder="Selecteer team" />
          </SelectTrigger>
          <SelectContent className="dropdown-content-login-style z-50">
            {teamOptions.map((team) => (
              <SelectItem
                key={team.id}
                value={team.id.toString()}
                className="dropdown-item-login-style"
              >
                {team.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1">
        <Label htmlFor={`penalty-cost-${index}`}>Type Boete</Label>
        <Select
          value={penalty.costSettingId.toString()}
          onValueChange={handleCostSettingChange}
          disabled={!canEdit}
        >
          <SelectTrigger className="dropdown-login-style">
            <SelectValue placeholder="Selecteer boete type" />
          </SelectTrigger>
          <SelectContent className="dropdown-content-login-style z-50">
            {availablePenalties.map((costSetting) => (
              <SelectItem
                key={costSetting.id}
                value={costSetting.id.toString()}
                className="dropdown-item-login-style"
              >
                {costSetting.name} - €{costSetting.amount}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Delete icon removed in temporary penalty item row */}
    </div>
  );
});

export const RefereePenaltySection: React.FC<RefereePenaltySectionProps> = (props) => {
  const { toast } = useToast();
  const [penalties, setPenalties] = useState<PenaltyItem[]>([]);
  const [availablePenalties, setAvailablePenalties] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [savedPenalties, setSavedPenalties] = useState<Array<{ teamName: string; penaltyName: string; amount: number }>>([]);

  // Memoize expensive computations
  const memoizedAvailablePenalties = useMemo(() => availablePenalties, [availablePenalties]);
  const memoizedPenalties = useMemo(() => penalties, [penalties]);
  const teamOptions = useMemo(() => ([
    { id: props.match.homeTeamId, name: props.match.homeTeamName },
    { id: props.match.awayTeamId, name: props.match.awayTeamName },
  ]), [props.match.homeTeamId, props.match.homeTeamName, props.match.awayTeamId, props.match.awayTeamName]);

  useEffect(() => {
    loadAvailablePenalties();
    loadExistingPenalties();
  }, [props.match.matchId]);

  const loadAvailablePenalties = useCallback(async () => {
    try {
      const costSettings = await costSettingsService.getPenalties();
      setAvailablePenalties(costSettings);
    } catch (error) {
      console.error('Error loading penalties:', error);
    }
  }, []);

  const loadExistingPenalties = useCallback(async () => {
    try {
      // Load penalties for both teams for this match
      const homeTeamTransactions = await financialService.getTeamTransactions(props.match.homeTeamId);
      const awayTeamTransactions = await financialService.getTeamTransactions(props.match.awayTeamId);
      
      const matchPenalties = [...homeTeamTransactions, ...awayTeamTransactions]
        .filter(t => t.match_id === props.match.matchId && t.transaction_type === 'penalty')
        .map(t => ({
          teamName: t.team_id === props.match.homeTeamId ? props.match.homeTeamName : props.match.awayTeamName,
          penaltyName: t.cost_settings?.name || 'Boete',
          amount: t.amount
        }));
      
      setSavedPenalties(matchPenalties);
    } catch (error) {
      console.error('Error loading existing penalties:', error);
    }
  }, [props.match.matchId, props.match.homeTeamId, props.match.awayTeamId, props.match.homeTeamName, props.match.awayTeamName]);

  const addPenalty = useCallback(() => {
    setPenalties(prev => [...prev, {
      costSettingId: 0,
      teamId: props.match.homeTeamId,
    }]);
  }, [props.match.homeTeamId]);

  const updatePenalty = useCallback((index: number, field: keyof PenaltyItem, value: any) => {
    setPenalties(prev => prev.map((penalty, i) => 
      i === index ? { ...penalty, [field]: value } : penalty
    ));
  }, []);

  const removePenalty = useCallback((index: number) => {
    setPenalties(prev => prev.filter((_, i) => i !== index));
  }, []);

  const savePenalties = useCallback(async () => {
    if (penalties.length === 0) return;

    setIsLoading(true);
    try {
      const currentDate = getCurrentDate();
      const savedThis: Array<{ teamName: string; penaltyName: string; amount: number }> = [];
      
      for (const penalty of penalties) {
        if (penalty.costSettingId && penalty.teamId) {
          const costSetting = availablePenalties.find(cs => cs.id === penalty.costSettingId);
          if (costSetting) {
            await financialService.addTransaction({
              team_id: penalty.teamId,
              amount: costSetting.amount,
              description: null,
              transaction_type: 'penalty',
              transaction_date: currentDate,
              match_id: props.match.matchId,
              penalty_type_id: null,
              cost_setting_id: penalty.costSettingId
            });
            const teamName = teamOptions.find(t => t.id === penalty.teamId)?.name || 'Team';
            savedThis.push({ teamName, penaltyName: costSetting.name, amount: costSetting.amount });
          }
        }
      }

      toast({
        title: "Boetes opgeslagen",
        description: "De boetes zijn succesvol toegevoegd aan de teamtransacties.",
      });

      setPenalties([]);
      setSavedPenalties(prev => [...savedThis, ...prev].slice(0, 10));
    } catch (error) {
      console.error('Error saving penalties:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het opslaan van de boetes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [penalties, availablePenalties, props.match.matchId, toast]);

  const removeSavedPenalty = useCallback((index: number) => {
    setSavedPenalties(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Memoize the add penalty button disabled state
  const isAddButtonDisabled = useMemo(() => {
    return !props.canEdit || isLoading;
  }, [props.canEdit, isLoading]);

  // Memoize the save button disabled state
  const isSaveButtonDisabled = useMemo(() => {
    return penalties.length === 0 || isLoading || !props.canEdit;
  }, [penalties.length, isLoading, props.canEdit]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-4">
        <Button
          onClick={addPenalty}
          disabled={isAddButtonDisabled}
          className="btn btn--secondary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Boete Toevoegen
        </Button>
      </div>

      {penalties.length > 0 && (
        <div className="relative space-y-4">
          <button
            type="button"
            className="btn--close absolute top-2 right-2 w-3 h-3 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Sluiten"
            onClick={() => setPenalties([])}
          >
            <X className="w-2.5 h-2.5" />
          </button>
          {penalties.map((penalty, index) => (
            <PenaltyItemComponent
              key={`penalty-${index}`}
              penalty={penalty}
              index={index}
              availablePenalties={memoizedAvailablePenalties}
              teamOptions={teamOptions}
              onUpdate={updatePenalty}
              onRemove={removePenalty}
              canEdit={props.canEdit}
            />
          ))}
          
          <div className="flex justify-end">
            <Button
              onClick={savePenalties}
              disabled={isSaveButtonDisabled}
              className="btn btn--primary"
            >
              {isLoading ? "Bezig..." : "Boetes Opslaan"}
            </Button>
          </div>
        </div>
      )}

      {penalties.length === 0 && savedPenalties.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>Nog geen boetes toegevoegd</p>
          <p className="text-sm">Klik op "Boete Toevoegen" om een boete toe te voegen</p>
        </div>
      )}

      {savedPenalties.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground">Toegevoegd (sessie)</div>
          <div className="space-y-1">
            {savedPenalties.map((p, i) => (
              <div key={i} className="flex items-center justify-between text-sm border rounded px-2 py-1.5 bg-white">
                <div className="truncate">
                  <span className="font-medium">{p.teamName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>{p.penaltyName}</span>
                  <span className="text-muted-foreground">€{p.amount}</span>
                  <Button type="button" variant="outline" onClick={() => removeSavedPenalty(i)} className="btn btn--icon btn--danger" aria-label="Verwijderen">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(RefereePenaltySection);
