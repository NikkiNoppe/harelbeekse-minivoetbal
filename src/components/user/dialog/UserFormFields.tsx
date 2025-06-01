
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import TeamSelector from "./TeamSelector";
import { TeamOption, UserFormData } from "../types/userDialogTypes";

interface UserFormFieldsProps {
  formData: UserFormData;
  setFormData: React.Dispatch<React.SetStateAction<UserFormData>>;
  teams: TeamOption[];
  isEditing: boolean;
  isLoading?: boolean;
}

const UserFormFields: React.FC<UserFormFieldsProps> = ({
  formData,
  setFormData,
  teams,
  isEditing,
  isLoading = false
}) => {
  
  const handleTeamSelect = (teamId: number) => {
    const teamIdNum = typeof teamId === 'string' ? parseInt(teamId) : teamId;
    
    // Check if team is already selected
    const isSelected = formData.teamIds.includes(teamIdNum);
    
    let newTeamIds: number[];
    
    if (isSelected) {
      // Remove team if already selected
      newTeamIds = formData.teamIds.filter(id => id !== teamIdNum);
    } else {
      // Add team if not selected
      newTeamIds = [...formData.teamIds, teamIdNum];
    }
    
    setFormData({ 
      ...formData, 
      teamIds: newTeamIds,
      teamId: newTeamIds.length > 0 ? newTeamIds[0] : 0 // Maintain backward compatibility
    });
  };

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="username">Gebruikersnaam</Label>
        <Input
          id="username"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          placeholder="Gebruikersnaam"
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">E-mailadres</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="E-mailadres"
          required
          disabled={isLoading}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">
          Wachtwoord {isEditing && "(leeg laten om ongewijzigd te houden)"}
        </Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="Wachtwoord"
          required={!isEditing}
          disabled={isLoading}
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
              // Reset teamIds if role is not player_manager
              teamIds: value === "player_manager" ? formData.teamIds : []
            });
          }}
          disabled={isLoading}
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
        <TeamSelector
          teams={teams}
          selectedTeamIds={formData.teamIds}
          onTeamSelect={handleTeamSelect}
          disabled={isLoading}
        />
      )}
    </>
  );
};

export default UserFormFields;
