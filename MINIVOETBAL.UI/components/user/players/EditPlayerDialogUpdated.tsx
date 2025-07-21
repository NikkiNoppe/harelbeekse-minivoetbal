
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

interface EditPlayerDialogUpdatedProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  player: {
    player_id: number;
    firstName: string;
    lastName: string;
    birthDate: string;
  } | null;
  onPlayerChange: (newData: {player_id: number, firstName: string, lastName: string, birthDate: string}) => void;
  onSave: () => void;
}

const EditPlayerDialogUpdated: React.FC<EditPlayerDialogUpdatedProps> = ({
  open,
  onOpenChange,
  player,
  onPlayerChange,
  onSave
}) => {
  if (!player) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-purple-100 border-purple-light shadow-lg">
        <DialogHeader className="bg-purple-100">
          <DialogTitle className="text-2xl text-purple-light">Speler bewerken</DialogTitle>
          <DialogDescription className="text-purple-dark">
            Wijzig de gegevens van deze speler
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4 bg-purple-100">
          <div className="space-y-2">
            <label className="text-purple-dark font-medium">Voornaam</label>
            <Input
              value={player.firstName}
              onChange={(e) => onPlayerChange({...player, firstName: e.target.value})}
              placeholder="Voornaam van de speler"
              className="bg-white border-gray-300 text-purple-dark"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-purple-dark font-medium">Achternaam</label>
            <Input
              value={player.lastName}
              onChange={(e) => onPlayerChange({...player, lastName: e.target.value})}
              placeholder="Achternaam van de speler"
              className="bg-white border-gray-300 text-purple-dark"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-purple-dark font-medium">Geboortedatum</label>
            <Input
              type="date"
              value={player.birthDate}
              onChange={(e) => onPlayerChange({...player, birthDate: e.target.value})}
              className="bg-white border-gray-300 text-purple-dark"
            />
          </div>
        </div>
        
        <DialogFooter className="bg-purple-100">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-purple-light text-purple-dark hover:bg-purple-light hover:text-white">
            Annuleren
          </Button>
          <Button onClick={onSave} className="bg-purple-light hover:bg-purple-dark">
            Opslaan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditPlayerDialogUpdated;
