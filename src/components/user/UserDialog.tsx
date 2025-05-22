
import React, { useState, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { User } from "@/types/auth";

interface TeamOption {
  id: number;
  name: string;
}

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingUser: User | null;
  onSave: (formData: any, editingUser: User | null) => void;
  teams: TeamOption[];
}

const UserDialog: React.FC<UserDialogProps> = ({
  open,
  onOpenChange,
  editingUser,
  onSave,
  teams
}) => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "player_manager",
    teamId: 0
  });
  
  // Set form data when editingUser changes
  useEffect(() => {
    if (editingUser) {
      setFormData({
        username: editingUser.username,
        password: "",
        role: editingUser.role,
        teamId: editingUser.teamId || 0
      });
    } else {
      // Default values for new user
      setFormData({
        username: "",
        password: "",
        role: "player_manager",
        teamId: teams.length > 0 ? teams[0].id : 0
      });
    }
  }, [editingUser, teams]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData, editingUser);
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingUser ? "Gebruiker bewerken" : "Nieuwe gebruiker toevoegen"}
          </DialogTitle>
          <DialogDescription>
            {editingUser
              ? "Bewerk de gegevens van deze gebruiker"
              : "Voeg een nieuwe gebruiker toe aan het systeem"}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="username">Gebruikersnaam</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="Gebruikersnaam"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">
              Wachtwoord {editingUser && "(leeg laten om ongewijzigd te houden)"}
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Wachtwoord"
              required={!editingUser}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Rol</Label>
            <Select
              value={formData.role}
              onValueChange={(value: "admin" | "referee" | "player_manager") => {
                setFormData({ 
                  ...formData, 
                  role: value,
                  // Reset teamId if role is not player_manager
                  teamId: value === "player_manager" ? formData.teamId : 0
                });
              }}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Selecteer een rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Beheerder</SelectItem>
                <SelectItem value="player_manager">Teamverantwoordelijke</SelectItem>
                <SelectItem value="referee">Scheidsrechter</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {formData.role === "player_manager" && teams.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="team">Team</Label>
              <Select
                value={formData.teamId > 0 ? formData.teamId.toString() : ""}
                onValueChange={(value) => {
                  setFormData({ 
                    ...formData, 
                    teamId: parseInt(value) 
                  });
                }}
              >
                <SelectTrigger id="team">
                  <SelectValue placeholder="Selecteer een team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0" disabled>
                    Selecteer een team
                  </SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id.toString()}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuleren
            </Button>
            <Button type="submit">
              {editingUser ? "Bijwerken" : "Toevoegen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserDialog;
