import React, { useState } from "react";
import { AppModal } from "@/components/modals/base/app-modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { suspensionService } from "@/domains/cards-suspensions";
import { useTeams } from "@/hooks/useTeams";
import { usePlayersQuery } from "@/hooks/usePlayersQuery";

interface AddSuspensionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddSuspensionModal: React.FC<AddSuspensionModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: teams } = useTeams();
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");

  const { data: players } = usePlayersQuery(selectedTeamId ? parseInt(selectedTeamId) : undefined);

  const [formData, setFormData] = useState({
    playerId: "",
    reason: "",
    matches: "1",
    notes: "",
  });

  const handleSubmit = async () => {
    if (!formData.playerId || !formData.reason) {
      toast({
        title: "Fout",
        description: "Selecteer een speler en geef een reden op.",
        variant: "destructive",
      });
      return;
    }

    try {
      await suspensionService.applySuspension(
        parseInt(formData.playerId),
        formData.reason,
        parseInt(formData.matches) || 1,
        formData.notes || undefined,
      );

      toast({
        title: "Schorsing toegevoegd",
        description: "De schorsing is succesvol toegevoegd.",
      });

      queryClient.invalidateQueries({ queryKey: ["suspensions"] });
      queryClient.invalidateQueries({ queryKey: ["manualSuspensions"] });
      queryClient.invalidateQueries({ queryKey: ["playerCards"] });

      setFormData({ playerId: "", reason: "", matches: "1", notes: "" });
      setSelectedTeamId("");
      onOpenChange(false);
    } catch {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het toevoegen van de schorsing.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setFormData({ playerId: "", reason: "", matches: "1", notes: "" });
    setSelectedTeamId("");
    onOpenChange(false);
  };

  return (
    <AppModal
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleClose();
        else onOpenChange(true);
      }}
      title="Schorsing toevoegen"
      size="md"
      primaryAction={{
        label: "Toevoegen",
        onClick: handleSubmit,
        variant: "primary",
      }}
      secondaryAction={{
        label: "Annuleren",
        onClick: handleClose,
        variant: "secondary",
      }}
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-brand-dark">Team *</Label>
          <Select
            value={selectedTeamId}
            onValueChange={(value) => {
              setSelectedTeamId(value);
              setFormData({ ...formData, playerId: "" });
            }}
          >
            <SelectTrigger className="modal__input min-h-[44px]">
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

        <div className="space-y-1.5">
          <Label className="text-brand-dark">Speler *</Label>
          <Select
            value={formData.playerId}
            onValueChange={(value) => setFormData({ ...formData, playerId: value })}
            disabled={!selectedTeamId}
          >
            <SelectTrigger className="modal__input min-h-[44px]">
              <SelectValue
                placeholder={selectedTeamId ? "Selecteer speler" : "Selecteer eerst een team"}
              />
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

        <div className="space-y-1.5">
          <Label className="text-brand-dark">Reden *</Label>
          <Input
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            placeholder="Reden voor schorsing"
            className="modal__input min-h-[44px]"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-brand-dark">Aantal wedstrijden *</Label>
          <Input
            type="number"
            min="1"
            max="10"
            value={formData.matches}
            onChange={(e) => setFormData({ ...formData, matches: e.target.value })}
            className="modal__input min-h-[44px]"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-brand-dark">Notities</Label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Optionele notities..."
            rows={3}
            className="modal__input"
          />
        </div>
      </div>
    </AppModal>
  );
};
