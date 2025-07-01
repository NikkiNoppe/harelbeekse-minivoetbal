
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";

export interface TeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
  teamName: string;
  onTeamNameChange: (name: string) => void;
  isDeleteMode?: boolean;
}

const TeamDialog: React.FC<TeamDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  isSaving,
  teamName,
  onTeamNameChange,
  isDeleteMode = false
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isDeleteMode ? "Team verwijderen" : "Team"}
          </DialogTitle>
        </DialogHeader>
        
        {!isDeleteMode && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="teamName">Team naam</Label>
              <Input
                id="teamName"
                value={teamName}
                onChange={(e) => onTeamNameChange(e.target.value)}
                placeholder="Voer team naam in"
              />
            </div>
          </div>
        )}

        {isDeleteMode && (
          <p>Weet je zeker dat je dit team wilt verwijderen?</p>
        )}
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuleren
          </Button>
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? "Bezig..." : (isDeleteMode ? "Verwijderen" : "Opslaan")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TeamDialog;
