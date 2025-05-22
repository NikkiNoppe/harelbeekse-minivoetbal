
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface Team {
  team_id: number;
  team_name: string;
}

interface AddUserFormProps {
  teams: Team[];
  onAddUser: (userData: {
    name: string;
    email: string;
    role: "admin" | "referee" | "player_manager";
    teamId: number | null;
  }) => void;
}

const AddUserForm: React.FC<AddUserFormProps> = ({ teams, onAddUser }) => {
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "player_manager" as "admin" | "referee" | "player_manager",
    teamId: null as number | null
  });

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
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="E-mailadres"
            value={newUser.email}
            onChange={(e) => setNewUser({...newUser, email: e.target.value})}
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
          >
            <SelectTrigger id="role">
              <SelectValue placeholder="Selecteer een rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Administrator</SelectItem>
              <SelectItem value="player_manager">Teamverantwoordelijke</SelectItem>
              <SelectItem value="referee">Scheidsrechter</SelectItem>
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
            >
              <SelectTrigger id="team">
                <SelectValue placeholder="Selecteer een team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.team_id} value={team.team_id.toString()}>
                    {team.team_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      
      <Button 
        onClick={() => onAddUser(newUser)}
        className="flex items-center gap-2"
      >
        <UserPlus className="h-4 w-4" />
        Gebruiker toevoegen
      </Button>
    </div>
  );
};

export default AddUserForm;
