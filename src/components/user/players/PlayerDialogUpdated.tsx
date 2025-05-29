
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

interface PlayerDialogUpdatedProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newPlayer: {
    firstName: string;
    lastName: string;
    birthDate: string;
  };
  onPlayerChange: (newData: {firstName: string, lastName: string, birthDate: string}) => void;
  onSave: () => void;
}

const PlayerDialogUpdated: React.FC<PlayerDialogUpdatedProps> = ({
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
            <label>Voornaam</label>
            <Input
              value={newPlayer.firstName}
              onChange={(e) => onPlayerChange({...newPlayer, firstName: e.target.value})}
              placeholder="Voornaam van de speler"
            />
          </div>
          
          <div className="space-y-2">
            <label>Achternaam</label>
            <Input
              value={newPlayer.lastName}
              onChange={(e) => onPlayerChange({...newPlayer, lastName: e.target.value})}
              placeholder="Achternaam van de speler"
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

export default PlayerDialogUpdated;
