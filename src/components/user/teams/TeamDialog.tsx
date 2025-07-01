
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

interface TeamFormData {
  name: string;
  balance: string;
}

interface TeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTeam: { team_id: number; team_name: string; balance: number } | null;
  formData: TeamFormData;
  onFormChange: (field: keyof TeamFormData, value: string) => void;
  onSave: () => void;
}

const TeamDialog: React.FC<TeamDialogProps> = ({
  open,
  onOpenChange,
  editingTeam,
  formData,
  onFormChange,
  onSave
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingTeam ? "Team bewerken" : "Nieuw team toevoegen"}
          </DialogTitle>
          <DialogDescription>
            {editingTeam 
              ? "Bewerk de gegevens van dit team" 
              : "Voeg een nieuw team toe aan de competitie"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label>Teamnaam</label>
            <Input
              value={formData.name}
              onChange={(e) => onFormChange("name", e.target.value)}
              placeholder="Naam van het team"
            />
          </div>
          
          <div className="space-y-2">
            <label>Balans</label>
            <Input
              type="number"
              step="0.01"
              value={formData.balance}
              onChange={(e) => onFormChange("balance", e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuleren
          </Button>
          <Button onClick={onSave}>
            {editingTeam ? "Bijwerken" : "Toevoegen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TeamDialog;
