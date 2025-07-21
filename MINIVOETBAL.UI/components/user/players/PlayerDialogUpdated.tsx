
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";

interface PlayerDialogUpdatedProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newPlayer: {
    firstName: string;
    lastName: string;
    birthDate: string;
  };
  onPlayerChange: (newData: { firstName: string; lastName: string; birthDate: string }) => void;
  onSave: () => Promise<boolean> | void;
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
    // birthDate must be in YYYY-MM-DD and a valid date
    /^\d{4}-\d{2}-\d{2}$/.test(birthDate) &&
    !isNaN(Date.parse(birthDate))
  );
};

const PlayerDialogUpdated: React.FC<PlayerDialogUpdatedProps> = ({
  open,
  onOpenChange,
  newPlayer,
  onPlayerChange,
  onSave,
}) => {
  const allFieldsValid = isValid(newPlayer);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-purple-100 border-purple-light shadow-lg">
        <DialogHeader className="bg-purple-100">
          <DialogTitle className="text-2xl text-purple-light">
            Nieuwe speler toevoegen
          </DialogTitle>
          <DialogDescription className="text-purple-dark">
            Voeg een nieuwe speler toe aan het team
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 bg-purple-100">
          <div className="space-y-2">
            <label className="text-purple-dark font-medium">Voornaam</label>
            <Input
              value={newPlayer.firstName}
              onChange={(e) => onPlayerChange({ ...newPlayer, firstName: e.target.value })}
              placeholder="Voornaam van de speler"
              className="bg-white border-gray-300 text-purple-dark"
            />
          </div>

          <div className="space-y-2">
            <label className="text-purple-dark font-medium">Achternaam</label>
            <Input
              value={newPlayer.lastName}
              onChange={(e) => onPlayerChange({ ...newPlayer, lastName: e.target.value })}
              placeholder="Achternaam van de speler"
              className="bg-white border-gray-300 text-purple-dark"
            />
          </div>

          <div className="space-y-2">
            <label className="text-purple-dark font-medium">Geboortedatum</label>
            <Input
              type="date"
              value={newPlayer.birthDate}
              onChange={(e) => onPlayerChange({ ...newPlayer, birthDate: e.target.value })}
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
            onClick={onSave}
            disabled={!allFieldsValid}
            className={
              allFieldsValid
                ? "bg-purple-dark text-white"
                : "bg-purple-light text-white"
            }
            type="button"
          >
            Speler toevoegen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PlayerDialogUpdated;
