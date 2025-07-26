
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
import UserFormFields from "./dialog/UserFormFields";
import { UserDialogProps, UserFormData } from "./types/userDialogTypes";
import { X } from 'lucide-react';
import { Input } from "@/components/ui/input";

interface TeamOption {
  id: number;
  name: string;
}

interface UserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingUser?: {
    id: number;
    username: string;
    email?: string;
    password: string;
    role: "admin" | "referee" | "player_manager";
    teamId?: number;
    teams?: {team_id: number, team_name: string}[];
  };
  onSave: (formData: any) => Promise<boolean>;
  teams: TeamOption[];
  isLoading?: boolean;
}

const UserModal: React.FC<UserModalProps> = ({
  open,
  onOpenChange,
  editingUser,
  onSave,
  teams,
  isLoading
}) => {
  const [formData, setFormData] = useState<UserFormData>({
    username: "",
    email: "",
    password: "",
    role: "player_manager",
    teamId: 0,
    teamIds: []
  });
  
  // Set form data when editingUser changes
  useEffect(() => {
    if (editingUser) {
      console.log('Setting form data for editing user:', editingUser);
      // Get team IDs from the teams array if available, otherwise use teamId
      const teamIds = editingUser.teams && editingUser.teams.length > 0 
        ? editingUser.teams.map(team => team.team_id) 
        : (editingUser.teamId ? [editingUser.teamId] : []);
      
      setFormData({
        username: editingUser.username,
        email: editingUser.email || "",
        password: "",
        role: editingUser.role,
        teamId: editingUser.teamId || 0,
        teamIds: teamIds
      });
    } else {
      // Reset form for new user
      setFormData({
        username: "",
        email: "",
        password: "",
        role: "player_manager",
        teamId: teams.length > 0 ? teams[0].id : 0,
        teamIds: []
      });
    }
  }, [editingUser, teams, open]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting form data:', formData);
    
    try {
      const success = await onSave(formData);
      
      // Only close dialog and reset form if save was successful
      if (success) {
        onOpenChange(false);
        // Reset form data
        setFormData({
          username: "",
          email: "",
          password: "",
          role: "player_manager",
          teamId: teams.length > 0 ? teams[0].id : 0,
          teamIds: []
        });
      }
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="modal relative">
        <button
          type="button"
          className="btn--close absolute top-3 right-3 z-10"
          aria-label="Sluiten"
          onClick={() => onOpenChange(false)}
        >
          <X size={20} />
        </button>
        
        <div className="modal__title">
          {editingUser ? "Gebruiker bewerken" : "Nieuwe gebruiker toevoegen"}
        </div>
        
        <form className="space-y-4">
          <div className="space-y-2">
            <label className="text-purple-dark">Gebruikersnaam</label>
            <Input
              placeholder="Voer gebruikersnaam in"
              className="modal__input bg-white placeholder:text-purple-200"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-purple-dark">Volledige naam</label>
            <Input
              placeholder="Voer volledige naam in"
              className="modal__input bg-white placeholder:text-purple-200"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-purple-dark">E-mail (optioneel)</label>
            <Input
              type="email"
              placeholder="E-mailadres (optioneel)"
              className="modal__input bg-white placeholder:text-purple-200"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-purple-dark">Rol</label>
            <select
              className="modal__input bg-white placeholder:text-purple-200"
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value as "admin" | "referee" | "player_manager"})}
              disabled={isLoading}
            >
              <option value="player_manager">Speler Manager</option>
              <option value="admin">Administrator</option>
              <option value="referee">Scheidsrechter</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-purple-dark">Team</label>
            <select
              className="modal__input bg-white placeholder:text-purple-200"
              value={formData.teamId}
              onChange={(e) => setFormData({...formData, teamId: parseInt(e.target.value) || 0})}
              disabled={isLoading}
            >
              <option value="">Geen team</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="modal__actions">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="btn btn--secondary"
              disabled={isLoading}
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn--primary"
            >
              {editingUser ? "Bijwerken" : "Toevoegen"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserModal;
