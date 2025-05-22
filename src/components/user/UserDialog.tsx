
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { User } from "@/types/auth";

interface TeamOption {
  id: number;
  name: string;
}

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingUser?: {
    id: number;
    username: string;
    password: string;
    role: "admin" | "referee" | "player_manager";
    teamId?: number;
    teams?: {team_id: number, team_name: string}[];
  };
  onSave: (formData: any) => void;
  teams: TeamOption[];
  isLoading?: boolean;
}

const UserDialog: React.FC<UserDialogProps> = ({
  open,
  onOpenChange,
  editingUser,
  onSave,
  teams,
  isLoading
}) => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "player_manager" as "admin" | "referee" | "player_manager",
    teamId: 0,
    teamIds: [] as number[]
  });
  
  const [teamsOpen, setTeamsOpen] = useState(false);
  
  // Set form data when editingUser changes
  useEffect(() => {
    if (editingUser) {
      // Get team IDs from the teams array if available, otherwise use teamId
      const teamIds = editingUser.teams && editingUser.teams.length > 0 
        ? editingUser.teams.map(team => team.team_id) 
        : (editingUser.teamId ? [editingUser.teamId] : []);
      
      setFormData({
        username: editingUser.username,
        password: "",
        role: editingUser.role,
        teamId: editingUser.teamId || 0,
        teamIds: teamIds
      });
    } else {
      // Default values for new user
      setFormData({
        username: "",
        password: "",
        role: "player_manager",
        teamId: teams.length > 0 ? teams[0].id : 0,
        teamIds: []
      });
    }
  }, [editingUser, teams]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };
  
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
  
  // Get the selected team names for display
  const selectedTeamNames = formData.teamIds
    .map(id => teams.find(team => team.id === id)?.name || "")
    .filter(Boolean);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
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
                  // Reset teamIds if role is not player_manager
                  teamIds: value === "player_manager" ? formData.teamIds : []
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
              <Label>Teams</Label>
              <div className="flex flex-col gap-2">
                <Popover open={teamsOpen} onOpenChange={setTeamsOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={teamsOpen}
                      className="justify-between"
                    >
                      {selectedTeamNames.length > 0
                        ? `${selectedTeamNames.length} team${selectedTeamNames.length > 1 ? 's' : ''} geselecteerd`
                        : "Selecteer teams"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0">
                    <Command>
                      <CommandInput placeholder="Zoek team..." />
                      <CommandEmpty>Geen teams gevonden.</CommandEmpty>
                      <CommandList>
                        <CommandGroup>
                          <ScrollArea className="h-72">
                            {teams.map((team) => (
                              <CommandItem
                                key={team.id}
                                onSelect={() => handleTeamSelect(team.id)}
                                className="flex items-center gap-2"
                              >
                                <Checkbox 
                                  checked={formData.teamIds.includes(team.id)} 
                                  onCheckedChange={() => handleTeamSelect(team.id)}
                                  id={`team-${team.id}`}
                                  className="mr-2"
                                />
                                <Label htmlFor={`team-${team.id}`} className="flex-grow cursor-pointer">
                                  {team.name}
                                </Label>
                              </CommandItem>
                            ))}
                          </ScrollArea>
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                
                {selectedTeamNames.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedTeamNames.map((name, i) => (
                      <Badge key={i} variant="secondary">
                        {name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuleren
            </Button>
            <Button type="submit" disabled={isLoading}>
              {editingUser ? "Bijwerken" : "Toevoegen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserDialog;
