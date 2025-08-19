import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface PlayerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newPlayer: {
    firstName: string;
    lastName: string;
    birthDate: string;
  };
  onPlayerChange: (newData: { firstName: string; lastName: string; birthDate: string }) => void;
  onSave: () => Promise<boolean> | void;
  editingPlayer?: {
    player_id: number;
    firstName: string;
    lastName: string;
    birthDate: string;
  } | null;
  onEditPlayerChange?: (newData: { player_id: number; firstName: string; lastName: string; birthDate: string }) => void;
  onEditSave?: () => void;
}

const isValid = ({
  firstName,
  lastName,
  birthDate,
}: {
  firstName: string;
  lastName: string;
  birthDate: string;
}) => {
  return (
    !!firstName.trim() &&
    !!lastName.trim() &&
    !!birthDate &&
    /^\d{4}-\d{2}-\d{2}$/.test(birthDate) &&
    !isNaN(Date.parse(birthDate))
  );
};

const PlayerModal: React.FC<PlayerModalProps> = ({
  open,
  onOpenChange,
  newPlayer,
  onPlayerChange,
  onSave,
  editingPlayer,
  onEditPlayerChange,
  onEditSave
}) => {
  const allFieldsValid = isValid(editingPlayer || newPlayer);
  // More explicit check for edit mode - ensure editingPlayer exists and has required fields
  const isEdit = !!editingPlayer && editingPlayer.player_id && editingPlayer.firstName && editingPlayer.lastName && editingPlayer.birthDate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="modal relative">
        <DialogDescription className="sr-only">
          {isEdit ? "Bewerk de gegevens van de speler" : "Voeg een nieuwe speler toe aan het team"}
        </DialogDescription>
        <div className="modal__title">
          {isEdit ? "Speler bewerken" : "Nieuwe speler toevoegen"}
        </div>

        <form className="space-y-4">
          <div className="space-y-2">
            <label className="text-purple-dark">Voornaam</label>
            <Input
              placeholder="Voornaam van de speler"
              className="modal__input bg-white placeholder:text-purple-200"
              value={isEdit ? editingPlayer!.firstName : newPlayer.firstName}
              onChange={(e) => isEdit && onEditPlayerChange ? onEditPlayerChange({ ...editingPlayer!, firstName: e.target.value }) : onPlayerChange({ ...newPlayer, firstName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-purple-dark">Achternaam</label>
            <Input
              placeholder="Achternaam van de speler"
              className="modal__input bg-white placeholder:text-purple-200"
              value={isEdit ? editingPlayer!.lastName : newPlayer.lastName}
              onChange={(e) => isEdit && onEditPlayerChange ? onEditPlayerChange({ ...editingPlayer!, lastName: e.target.value }) : onPlayerChange({ ...newPlayer, lastName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-purple-dark">Geboortedatum</label>
            <Input
              type="date"
              className="modal__input bg-white placeholder:text-purple-200"
              value={isEdit ? editingPlayer!.birthDate : newPlayer.birthDate}
              onChange={(e) => isEdit && onEditPlayerChange ? onEditPlayerChange({ ...editingPlayer!, birthDate: e.target.value }) : onPlayerChange({ ...newPlayer, birthDate: e.target.value })}
            />
          </div>

          <div className="modal__actions">
            <button
              type="button"
              onClick={isEdit && onEditSave ? onEditSave : onSave}
              disabled={!allFieldsValid}
              className="btn btn--primary"
            >
              {isEdit ? "Opslaan" : "Speler toevoegen"}
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="btn btn--secondary"
            >
              Annuleren
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PlayerModal; 