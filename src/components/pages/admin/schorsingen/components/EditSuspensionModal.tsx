import React, { useState, useEffect } from "react";
import { AppModal, AppModalHeader, AppModalTitle } from "@/components/modals/base/app-modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { suspensionService, type Suspension } from "@/domains/cards-suspensions";
import { Edit } from "lucide-react";

interface EditSuspensionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suspension: Suspension | null;
}

export const EditSuspensionModal: React.FC<EditSuspensionModalProps> = ({ 
  open, 
  onOpenChange,
  suspension
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    reason: '',
    matches: '1',
    notes: ''
  });

  useEffect(() => {
    if (suspension) {
      setFormData({
        reason: suspension.reason || '',
        matches: String(suspension.matches || 1),
        notes: ''
      });
    }
  }, [suspension]);

  const handleSave = async () => {
    if (!suspension || !formData.reason) {
      toast({
        title: "Fout",
        description: "Geef een reden op.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Re-apply suspension with updated data
      await suspensionService.applySuspension(
        suspension.playerId,
        formData.reason,
        parseInt(formData.matches) || 1,
        formData.notes || undefined
      );

      toast({ title: "Schorsing bijgewerkt", description: "De wijzigingen zijn opgeslagen." });
      queryClient.invalidateQueries({ queryKey: ['suspensions'] });
      queryClient.invalidateQueries({ queryKey: ['playerCards'] });
      onOpenChange(false);
    } catch {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het opslaan.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async () => {
    if (!suspension) return;
    
    try {
      // Get manual suspensions to find the matching one
      const manualSuspensions = await suspensionService.getManualSuspensions();
      const match = manualSuspensions.find(s => s.playerId === suspension.playerId);
      
      if (match) {
        await suspensionService.deleteSuspension(match.id);
      }

      toast({ title: "Schorsing verwijderd" });
      queryClient.invalidateQueries({ queryKey: ['suspensions'] });
      queryClient.invalidateQueries({ queryKey: ['playerCards'] });
      onOpenChange(false);
    } catch {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het verwijderen.",
        variant: "destructive"
      });
    }
  };

  const handleClose = () => onOpenChange(false);

  if (!suspension) return null;

  return (
    <AppModal open={open} onOpenChange={handleClose} size="md">
      <AppModalHeader>
        <AppModalTitle className="flex items-center gap-2">
          <Edit className="h-5 w-5" />
          Schorsing Bewerken
        </AppModalTitle>
      </AppModalHeader>

      <div className="space-y-4 py-4">
        {/* Read-only info */}
        <div className="rounded-md bg-muted/50 p-3 space-y-1">
          <p className="text-sm font-medium text-foreground">{suspension.playerName}</p>
          <p className="text-xs text-muted-foreground">{suspension.teamName}</p>
          {suspension.suspendedForMatch && (
            <p className="text-xs text-muted-foreground">
              Geschorst voor: {suspension.suspendedForMatch.date} – tegen {suspension.suspendedForMatch.opponent}
            </p>
          )}
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
        <button onClick={handleSave} className="btn btn--primary">
          Opslaan
        </button>
        <button onClick={handleClose} className="btn btn--secondary">
          Annuleren
        </button>
        <button onClick={handleDelete} className="btn btn--danger">
          Verwijderen
        </button>
      </div>
    </AppModal>
  );
};
