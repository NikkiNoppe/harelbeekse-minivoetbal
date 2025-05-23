
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

interface EditPlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  player: {
    player_id: number;
    name: string;
    birthDate: string;
  } | null;
  onPlayerChange: (newData: {player_id: number, name: string, birthDate: string}) => void;
  onSave: () => void;
}

const EditPlayerDialog: React.FC<EditPlayerDialogProps> = ({
  open,
  onOpenChange,
  player,
  onPlayerChange,
  onSave
}) => {
  if (!player) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Speler bewerken</DialogTitle>
          <DialogDescription>
            Wijzig de gegevens van deze speler
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label>Naam</label>
            <Input
              value={player.name}
              onChange={(e) => onPlayerChange({...player, name: e.target.value})}
              placeholder="Naam van de speler"
            />
          </div>
          
          <div className="space-y-2">
            <label>Geboortedatum</label>
            <Input
              type="date"
              value={player.birthDate}
              onChange={(e) => onPlayerChange({...player, birthDate: e.target.value})}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuleren
          </Button>
          <Button onClick={onSave}>
            Opslaan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditPlayerDialog;
