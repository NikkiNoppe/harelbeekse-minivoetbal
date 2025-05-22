
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { TeamOption } from "../types/userDialogTypes";

interface TeamSelectorProps {
  teams: TeamOption[];
  selectedTeamIds: number[];
  onTeamSelect: (teamId: number) => void;
  disabled?: boolean;
}

const TeamSelector: React.FC<TeamSelectorProps> = ({
  teams,
  selectedTeamIds,
  onTeamSelect,
  disabled = false
}) => {
  const [teamsOpen, setTeamsOpen] = useState(false);
  
  // Get the selected team names for display
  const selectedTeamNames = selectedTeamIds
    .map(id => teams.find(team => team.id === id)?.name || "")
    .filter(Boolean);
    
  return (
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
              disabled={disabled}
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
                        onSelect={() => onTeamSelect(team.id)}
                        className="flex items-center gap-2"
                      >
                        <Checkbox 
                          checked={selectedTeamIds.includes(team.id)} 
                          onCheckedChange={() => onTeamSelect(team.id)}
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
  );
};

export default TeamSelector;
