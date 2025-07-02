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
  loading: boolean;
}

const TeamDialog: React.FC<TeamDialogProps> = ({
  open,
  onOpenChange,
  editingTeam,
  formData,
  onFormChange,
  onSave,
  loading
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-purple-100 border-purple-light shadow-lg">
        <DialogHeader className="bg-purple-100">
          <DialogTitle className="text-2xl text-center text-purple-light">
            {editingTeam ? "Team bewerken" : "Nieuw team toevoegen"}
          </DialogTitle>
          <DialogDescription className="text-center text-purple-dark">
            {editingTeam 
              ? "Bewerk de gegevens van dit team" 
              : "Voeg een nieuw team toe aan de competitie"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4 bg-purple-100">
          <div className="space-y-2">
            <label className="text-purple-dark font-medium">Teamnaam</label>
            <Input
              value={formData.name}
              onChange={(e) => onFormChange("name", e.target.value)}
              placeholder="Naam van het team"
              className="bg-white placeholder:text-purple-200 border-purple-200 focus:border-purple-400"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-purple-dark font-medium">Balans</label>
            <Input
              type="number"
              step="0.01"
              value={formData.balance}
              onChange={(e) => onFormChange("balance", e.target.value)}
              placeholder="0.00"
              className="bg-white placeholder:text-purple-200 border-purple-200 focus:border-purple-400"
            />
          </div>
        </div>
        
        <DialogFooter className="bg-purple-100">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={loading}
            className="btn-light"
          >
            Annuleren
          </Button>
          <Button 
            onClick={onSave} 
            disabled={loading}
            className="btn-dark"
          >
            {loading ? "Opslaan..." : (editingTeam ? "Bijwerken" : "Toevoegen")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TeamDialog;
