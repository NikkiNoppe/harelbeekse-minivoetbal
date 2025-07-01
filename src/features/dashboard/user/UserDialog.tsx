
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog";
import { Button } from "@shared/components/ui/button";
import UserFormFields from "./dialog/UserFormFields";
import { UserDialogProps, UserFormData } from "./types/userDialogTypes";

const UserDialog: React.FC<UserDialogProps> = ({
  open,
  onOpenChange,
  editingUser,
  onSave,
  teams,
  isLoading = false
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
      
      setFormData({
        username: editingUser.username,
        email: editingUser.email || "",
        password: "",
        role: editingUser.role,
        teamId: editingUser.teamId || 0,
        teamIds: editingUser.teamId ? [editingUser.teamId] : []
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
      <DialogContent className="sm:max-w-md bg-purple-100 border-purple-light shadow-lg">
        <DialogHeader className="bg-purple-100">
          <DialogTitle className="text-2xl text-purple-light">
            {editingUser ? "Gebruiker bewerken" : "Nieuwe gebruiker toevoegen"}
          </DialogTitle>
          <DialogDescription className="text-purple-dark">
            {editingUser
              ? "Bewerk de gegevens van deze gebruiker"
              : "Voeg een nieuwe gebruiker toe aan het systeem"}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-2 bg-purple-100">
          <UserFormFields
            formData={formData}
            setFormData={setFormData}
            teams={teams}
            isEditing={!!editingUser}
            isLoading={isLoading}
          />
          
          <DialogFooter className="pt-4 bg-purple-100">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-purple-light text-purple-dark hover:bg-purple-light hover:text-white">
              Annuleren
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-purple-light hover:bg-purple-dark">
              {editingUser ? "Bijwerken" : "Toevoegen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserDialog;
