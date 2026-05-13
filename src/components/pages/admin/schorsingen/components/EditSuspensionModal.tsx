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
        notes: suspension.notes || ''
      });
    }
  }, [suspension]);

  const handleSave = async () => {
    if (!suspension) return;

    if (suspension.source === 'automatic') {
      if (!suspension.automaticKind) {
        toast({
          title: "Fout",
          description: "Kon het type automatische schorsing niet bepalen.",
          variant: "destructive"
        });
        return;
      }

      try {
        const baselineM = suspension.baselineMatches ?? suspension.matches;
        const baselineR = suspension.baselineReason ?? suspension.reason;
        const formM = Math.max(1, parseInt(formData.matches, 10) || baselineM);
        const formR = formData.reason.trim();
        const notes = formData.notes.trim();

        const matches_override = formM !== baselineM ? formM : null;
        const reason_override = formR !== baselineR ? formR : null;
        const hasNotes = notes.length > 0;
        const hasMatchOv = matches_override != null;
        const hasReasonOv = reason_override != null;

        if (!hasNotes && !hasMatchOv && !hasReasonOv) {
          await suspensionService.deleteAutomaticSuspensionOverride(
            suspension.playerId,
            suspension.automaticKind
          );
          toast({
            title: "Standaard hersteld",
            description: "Aanpassingen en notities zijn verwijderd; kaartregels gelden opnieuw."
          });
        } else {
          await suspensionService.upsertAutomaticSuspensionOverride(
            suspension.playerId,
            suspension.automaticKind,
            {
              notes,
              matches_override,
              reason_override
            }
          );
          toast({
            title: "Opgeslagen",
            description: "Aanpassingen en notities zijn bewaard en zichtbaar voor het team."
          });
        }

        queryClient.invalidateQueries({ queryKey: ['suspensions'] });
        queryClient.invalidateQueries({ queryKey: ['playerCards'] });
        onOpenChange(false);
      } catch {
        toast({
          title: "Fout",
          description: "Kon de automatische schorsing niet bijwerken.",
          variant: "destructive"
        });
      }
      return;
    }

    if (!formData.reason.trim()) {
      toast({
        title: "Fout",
        description: "Geef een reden op.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (!suspension.manualSuspensionId) {
        toast({
          title: "Fout",
          description: "Geen geldige handmatige schorsing om bij te werken.",
          variant: "destructive"
        });
        return;
      }

      const matches = parseInt(formData.matches, 10) || 1;
      await suspensionService.updateSuspension(suspension.manualSuspensionId, {
        reason: formData.reason,
        matches,
        start_date: suspension.startDate || new Date().toISOString(),
        end_date: new Date(Date.now() + (matches * 7 * 24 * 60 * 60 * 1000)).toISOString(),
        notes: formData.notes || undefined,
        type: 'manual',
        isActive: true
      });

      toast({ title: "Schorsing bijgewerkt", description: "De wijzigingen zijn opgeslagen." });
      queryClient.invalidateQueries({ queryKey: ['suspensions'] });
      queryClient.invalidateQueries({ queryKey: ['manualSuspensions'] });
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

    if (suspension.source === 'automatic') {
      if (!suspension.automaticKind) return;
      try {
        await suspensionService.deleteAutomaticSuspensionOverride(
          suspension.playerId,
          suspension.automaticKind
        );
        toast({
          title: "Aanpassingen verwijderd",
          description: "Je wijzigingen en team-notities zijn gewist; de schorsing volgt weer enkel de regels."
        });
        queryClient.invalidateQueries({ queryKey: ['suspensions'] });
        queryClient.invalidateQueries({ queryKey: ['playerCards'] });
        onOpenChange(false);
      } catch {
        toast({
          title: "Fout",
          description: "Kon de aanpassingen niet verwijderen.",
          variant: "destructive"
        });
      }
      return;
    }

    try {
      if (!suspension.manualSuspensionId) {
        toast({
          title: "Fout",
          description: "Geen handmatige schorsing om te verwijderen.",
          variant: "destructive"
        });
        return;
      }

      await suspensionService.deleteSuspension(suspension.manualSuspensionId);

      toast({ title: "Schorsing verwijderd" });
      queryClient.invalidateQueries({ queryKey: ['suspensions'] });
      queryClient.invalidateQueries({ queryKey: ['manualSuspensions'] });
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
          <p className="text-xs text-muted-foreground">
            Type: {suspension.source === 'manual' ? 'Handmatige schorsing' : 'Automatisch via kaartregels'}
          </p>
          {suspension.source === 'automatic' &&
            suspension.baselineReason != null &&
            suspension.baselineMatches != null && (
              <p className="text-xs text-muted-foreground pt-1 border-t border-border/50 mt-1">
                Basis volgens regels: {suspension.baselineReason} · {suspension.baselineMatches} wedstrijd
                {suspension.baselineMatches !== 1 ? 'en' : ''}
              </p>
            )}
          {suspension.suspendedForMatches && suspension.suspendedForMatches.length > 0 ? (
            <div className="space-y-0.5 text-xs text-muted-foreground">
              {suspension.suspendedForMatches.map((match, index) => (
                <p key={`${match.date}-${match.opponent}-${index}`}>
                  Geschorst {index + 1}: {match.date} – tegen {match.opponent}
                </p>
              ))}
            </div>
          ) : suspension.suspendedForMatch && (
            <p className="text-xs text-muted-foreground">
              Geschorst voor: {suspension.suspendedForMatch.date} – tegen {suspension.suspendedForMatch.opponent}
            </p>
          )}
        </div>

        <div>
          <Label>{suspension.source === 'automatic' ? 'Weergave reden' : 'Reden *'}</Label>
          <Input
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            placeholder={
              suspension.source === 'automatic'
                ? 'Aangepaste reden (laat gelijk aan basis om enkel regels te tonen)'
                : 'Reden voor schorsing'
            }
            className="modal__input"
          />
        </div>

        <div>
          <Label>Aantal wedstrijden{suspension.source === 'manual' ? ' *' : ''}</Label>
          <Input
            type="number"
            min="1"
            max="10"
            value={formData.matches}
            onChange={(e) => setFormData({ ...formData, matches: e.target.value })}
            className="modal__input"
          />
          {suspension.source === 'automatic' && (
            <p className="text-xs text-muted-foreground mt-1">
              Afwijkend van de regel? Pas het aantal aan; anders gelijk laten aan de basis hierboven.
            </p>
          )}
        </div>

        <div>
          <Label>Notitie voor teamverantwoordelijke</Label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Zichtbaar voor de teamverantwoordelijke op het dashboard (o.a. extra uitleg)…"
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
        {suspension.source === 'manual' ? (
          <button type="button" onClick={handleDelete} className="btn btn--danger">
            Verwijderen
          </button>
        ) : (
          <button type="button" onClick={handleDelete} className="btn btn--secondary">
            Herstel regels (wis aanpassingen)
          </button>
        )}
      </div>
    </AppModal>
  );
};
