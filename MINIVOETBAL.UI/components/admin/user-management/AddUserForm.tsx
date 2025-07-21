import React, { useState } from "react";
import { Label } from "../../../MINIVOETBAL.UI/components/ui/label";
import { Input } from "../../../MINIVOETBAL.UI/components/ui/input";
import { Button } from "../../../MINIVOETBAL.UI/components/ui/button";
import { UserPlus, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../../../MINIVOETBAL.UI/components/ui/select";
import { Team } from "./types";

interface AddUserFormProps {
  teams: Team[];
  onAddUser: (userData: {
    name: string;
    email: string;
    role: "admin" | "referee" | "player_manager";
    teamId: number | null;
  }) => void;
  isAdding: boolean;
}

const AddUserForm: React.FC<AddUserFormProps> = ({ teams, onAddUser, isAdding }) => {
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "player_manager" as "admin" | "referee" | "player_manager",
    teamId: null as number | null
  });

  const handleSubmit = () => {
    onAddUser(newUser);
    // Only reset the form if the operation succeeds (this will be handled by the parent component)
    // We'll keep the form values for now in case there's an error
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Nieuwe gebruiker toevoegen</h3>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Naam</Label>
          <Input 
            id="name" 
            placeholder="Volledige naam"
            value={newUser.name}
            onChange={(e) => setNewUser({...newUser, name: e.target.value})}
            disabled={isAdding}
            className="input-login-style"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">E-mail (optioneel)</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="E-mailadres (optioneel)"
            value={newUser.email}
            onChange={(e) => setNewUser({...newUser, email: e.target.value})}
            disabled={isAdding}
            className="input-login-style"
          />
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="role">Rol</Label>
          <Select 
            value={newUser.role} 
            onValueChange={(value: "admin" | "referee" | "player_manager") => {
              setNewUser({
                ...newUser, 
                role: value,
                // Reset teamId if role is not player_manager
                teamId: value === "player_manager" ? newUser.teamId : null
              });
            }}
            disabled={isAdding}
          >
            <SelectTrigger id="role" className="dropdown-login-style">
              <SelectValue placeholder="Selecteer een rol" />
            </SelectTrigger>
            <SelectContent className="dropdown-content-login-style">
              <SelectItem value="admin" className="dropdown-item-login-style">Administrator</SelectItem>
              <SelectItem value="player_manager" className="dropdown-item-login-style">Teamverantwoordelijke</SelectItem>
              <SelectItem value="referee" className="dropdown-item-login-style">Scheidsrechter</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {newUser.role === "player_manager" && (
          <div className="space-y-2">
            <Label htmlFor="team">Team</Label>
            <Select 
              value={newUser.teamId?.toString() || ""} 
              onValueChange={(value) => {
                setNewUser({
                  ...newUser,
                  teamId: value ? parseInt(value) : null
                });
              }}
              disabled={isAdding}
            >
              <SelectTrigger id="team" className="dropdown-login-style">
                <SelectValue placeholder="Selecteer een team" />
              </SelectTrigger>
              <SelectContent className="dropdown-content-login-style">
                {teams.map((team) => (
                  <SelectItem key={team.team_id} value={team.team_id.toString()} className="dropdown-item-login-style">
                    {team.team_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      
      <Button 
        onClick={handleSubmit}
        className="flex items-center gap-2"
        disabled={isAdding}
      >
        {isAdding ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Toevoegen...
          </>
        ) : (
          <>
            <UserPlus className="h-4 w-4" />
            Gebruiker toevoegen
          </>
        )}
      </Button>
    </div>
  );
};

export default AddUserForm;
