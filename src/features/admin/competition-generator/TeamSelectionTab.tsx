import React from "react";
import { Button } from "@shared/components/ui/button";
import { Checkbox } from "@shared/components/ui/checkbox";
import { Label } from "@shared/components/ui/label";
import { Loader2 } from "lucide-react";
import { Team } from "./types";

interface TeamSelectionTabProps {
  teams: Team[] | undefined;
  loadingTeams: boolean;
  selectedTeams: number[];
  onTeamToggle: (teamId: number) => void;
  selectAllTeams: () => void;
  deselectAllTeams: () => void;
}

const TeamSelectionTab: React.FC<TeamSelectionTabProps> = ({
  teams,
  loadingTeams,
  selectedTeams,
  onTeamToggle,
  selectAllTeams,
  deselectAllTeams
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between mb-4">
        <h3 className="text-lg font-medium">Selecteer de deelnemende teams</h3>
        <div className="space-x-2">
          <Button variant="outline" onClick={selectAllTeams} size="sm">
            Alles selecteren
          </Button>
          <Button variant="outline" onClick={deselectAllTeams} size="sm">
            Alles deselecteren
          </Button>
        </div>
      </div>
      
      {loadingTeams ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams?.map((team) => (
            <div key={team.team_id} className="flex items-center space-x-2 border p-3 rounded-md">
              <Checkbox
                id={`team-${team.team_id}`}
                checked={selectedTeams.includes(team.team_id)}
                onCheckedChange={() => onTeamToggle(team.team_id)}
              />
              <Label htmlFor={`team-${team.team_id}`} className="flex-1 cursor-pointer">{team.team_name}</Label>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-4 pt-4 border-t flex justify-end">
        <Button variant="default">
          Volgende
        </Button>
      </div>
    </div>
  );
};

export default TeamSelectionTab;
