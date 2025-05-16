
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
    role: "team",
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
        role: "team",
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
            <label htmlFor="username" className="text-sm font-medium">
              Gebruikersnaam
            </label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="Gebruikersnaam"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Wachtwoord {editingUser && "(leeg laten om ongewijzigd te houden)"}
            </label>
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
            <label htmlFor="role" className="text-sm font-medium">
              Rol
            </label>
            <select
              id="role"
              className="w-full p-2 border rounded-md"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="admin">Beheerder</option>
              <option value="team">Team</option>
              <option value="referee">Scheidsrechter</option>
            </select>
          </div>
          
          {formData.role === "team" && (
            <div className="space-y-2">
              <label htmlFor="team" className="text-sm font-medium">
                Team
              </label>
              <select
                id="team"
                className="w-full p-2 border rounded-md"
                value={formData.teamId}
                onChange={(e) => setFormData({ ...formData, teamId: parseInt(e.target.value) })}
              >
                <option value={0} disabled>
                  Selecteer een team
                </option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
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
