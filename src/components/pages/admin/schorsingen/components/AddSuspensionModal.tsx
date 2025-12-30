import React, { useState } from "react";
import { AppModal, AppModalHeader, AppModalTitle } from "@/components/modals/base/app-modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { suspensionService } from "@/domains/cards-suspensions";
import { useTeams } from "@/hooks/useTeams";
import { usePlayersQuery } from "@/hooks/usePlayersQuery";
import { AlertCircle } from "lucide-react";

interface AddSuspensionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddSuspensionModal: React.FC<AddSuspensionModalProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: teams } = useTeams();
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  
  const { data: players } = usePlayersQuery(selectedTeamId ? parseInt(selectedTeamId) : undefined);

  const [formData, setFormData] = useState({
    playerId: '',
    reason: '',
    matches: '1',
    notes: ''
  });

  const handleSubmit = async () => {
    if (!formData.playerId || !formData.reason) {
      toast({
        title: "Fout",
        description: "Selecteer een speler en geef een reden op.",
        variant: "destructive"
      });
      return;
    }

    try {
      await suspensionService.applySuspension(
        parseInt(formData.playerId),
        formData.reason,
        parseInt(formData.matches) || 1,
        formData.notes || undefined
      );

      toast({
        title: "Schorsing toegevoegd",
        description: "De schorsing is succesvol toegevoegd."
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['suspensions'] });
      queryClient.invalidateQueries({ queryKey: ['playerCards'] });

      // Reset form and close
      setFormData({ playerId: '', reason: '', matches: '1', notes: '' });
      setSelectedTeamId('');
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het toevoegen van de schorsing.",
        variant: "destructive"
      });
    }
  };

  const handleClose = () => {
    setFormData({ playerId: '', reason: '', matches: '1', notes: '' });
    setSelectedTeamId('');
    onOpenChange(false);
  };

  return (
    <AppModal open={open} onOpenChange={handleClose} size="md">
      <AppModalHeader>
        <AppModalTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Schorsing Toevoegen
        </AppModalTitle>
      </AppModalHeader>

      <div className="space-y-4 py-4">
        <div>
          <Label>Team *</Label>
          <Select 
            value={selectedTeamId} 
            onValueChange={(value) => {
              setSelectedTeamId(value);
              setFormData({ ...formData, playerId: '' });
            }}
          >
            <SelectTrigger className="modal__input">
              <SelectValue placeholder="Selecteer team" />
            </SelectTrigger>
            <SelectContent>
              {teams?.map((team) => (
                <SelectItem key={team.team_id} value={team.team_id.toString()}>
                  {team.team_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Speler *</Label>
          <Select 
            value={formData.playerId} 
            onValueChange={(value) => setFormData({ ...formData, playerId: value })}
            disabled={!selectedTeamId}
          >
            <SelectTrigger className="modal__input">
              <SelectValue placeholder={selectedTeamId ? "Selecteer speler" : "Selecteer eerst een team"} />
            </SelectTrigger>
            <SelectContent>
              {players?.map((player) => (
                <SelectItem key={player.player_id} value={player.player_id.toString()}>
                  {player.first_name} {player.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Reden *</Label>
          <Input
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            placeholder="Reden voor schorsing"
            className="modal__input"
          />
        </div>

        <div>
          <Label>Aantal wedstrijden *</Label>
          <Input
            type="number"
            min="1"
            max="10"
            value={formData.matches}
            onChange={(e) => setFormData({ ...formData, matches: e.target.value })}
            className="modal__input"
          />
        </div>

        <div>
          <Label>Notities</Label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Optionele notities..."
            rows={3}
            className="modal__input"
          />
        </div>
      </div>

      <div className="modal__actions">
        <button onClick={handleSubmit} className="btn btn--primary">
          Toevoegen
        </button>
        <button onClick={handleClose} className="btn btn--secondary">
          Annuleren
        </button>
      </div>
    </AppModal>
  );
};
