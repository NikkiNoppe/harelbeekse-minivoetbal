
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../MINIVOETBAL.UI/components/ui/dialog";
import { Button } from "../../../MINIVOETBAL.UI/components/ui/button";
import { Input } from "../../../MINIVOETBAL.UI/components/ui/input";

interface PlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newPlayer: {
    name: string;
    birthDate: string;
  };
  onPlayerChange: (newData: {name: string, birthDate: string}) => void;
  onSave: () => void;
}

const PlayerDialog: React.FC<PlayerDialogProps> = ({
  open,
  onOpenChange,
  newPlayer,
  onPlayerChange,
  onSave
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nieuwe speler toevoegen</DialogTitle>
          <DialogDescription>
            Voeg een nieuwe speler toe aan het team
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label>Naam</label>
            <Input
              value={newPlayer.name}
              onChange={(e) => onPlayerChange({...newPlayer, name: e.target.value})}
              placeholder="Naam van de speler"
            />
          </div>
          
          <div className="space-y-2">
            <label>Geboortedatum</label>
            <Input
              type="date"
              value={newPlayer.birthDate}
              onChange={(e) => onPlayerChange({...newPlayer, birthDate: e.target.value})}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuleren
          </Button>
          <Button onClick={onSave}>
            Speler toevoegen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PlayerDialog;
