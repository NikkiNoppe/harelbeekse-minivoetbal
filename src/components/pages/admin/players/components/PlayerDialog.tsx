import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from 'lucide-react';

interface PlayerDialogProps {
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

const PlayerDialog: React.FC<PlayerDialogProps> = ({
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
  const isEdit = !!editingPlayer;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-purple-100 border-purple-light shadow-lg relative">
        <button
          type="button"
          className="btn--close"
          aria-label="Sluiten"
          onClick={() => onOpenChange(false)}
        >
          <X size={20} />
        </button>
        <DialogHeader className="bg-purple-100">
          <DialogTitle className="text-2xl text-purple-light">
            {isEdit ? "Speler bewerken" : "Nieuwe speler toevoegen"}
          </DialogTitle>
          <DialogDescription className="text-purple-dark">
            {isEdit ? "Wijzig de gegevens van deze speler" : "Voeg een nieuwe speler toe aan het team"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 bg-purple-100">
          <div className="space-y-2">
            <label className="text-purple-dark font-medium">Voornaam</label>
            <Input
              value={isEdit ? editingPlayer!.firstName : newPlayer.firstName}
              onChange={(e) => isEdit && onEditPlayerChange ? onEditPlayerChange({ ...editingPlayer!, firstName: e.target.value }) : onPlayerChange({ ...newPlayer, firstName: e.target.value })}
              placeholder="Voornaam van de speler"
              className="bg-white border-gray-300 text-purple-dark"
            />
          </div>
          <div className="space-y-2">
            <label className="text-purple-dark font-medium">Achternaam</label>
            <Input
              value={isEdit ? editingPlayer!.lastName : newPlayer.lastName}
              onChange={(e) => isEdit && onEditPlayerChange ? onEditPlayerChange({ ...editingPlayer!, lastName: e.target.value }) : onPlayerChange({ ...newPlayer, lastName: e.target.value })}
              placeholder="Achternaam van de speler"
              className="bg-white border-gray-300 text-purple-dark"
            />
          </div>
          <div className="space-y-2">
            <label className="text-purple-dark font-medium">Geboortedatum</label>
            <Input
              type="date"
              value={isEdit ? editingPlayer!.birthDate : newPlayer.birthDate}
              onChange={(e) => isEdit && onEditPlayerChange ? onEditPlayerChange({ ...editingPlayer!, birthDate: e.target.value }) : onPlayerChange({ ...newPlayer, birthDate: e.target.value })}
              className="bg-white border-gray-300 text-purple-dark"
            />
          </div>
        </div>
        <DialogFooter className="bg-purple-100">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-purple-light text-purple-dark hover:bg-purple-light hover:text-white"
          >
            Annuleren
          </Button>
          <Button
            onClick={isEdit && onEditSave ? onEditSave : onSave}
            disabled={!allFieldsValid}
            className={
              allFieldsValid
                ? "bg-purple-dark text-white"
                : "bg-purple-light text-white"
            }
            type="button"
          >
            {isEdit ? "Opslaan" : "Speler toevoegen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PlayerDialog; 