import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTeams } from "@/hooks/useTeams";

interface SuspensionFiltersProps {
  selectedTeam: string;
  onTeamChange: (teamId: string) => void;
}

export const SuspensionFilters: React.FC<SuspensionFiltersProps> = ({
  selectedTeam,
  onTeamChange
}) => {
  const { data: teams } = useTeams();

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
      <Select value={selectedTeam} onValueChange={onTeamChange}>
        <SelectTrigger className="w-full sm:w-[200px] min-h-[44px]">
          <SelectValue placeholder="Alle teams" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle teams</SelectItem>
          {teams?.map((team) => (
            <SelectItem key={team.team_id} value={team.team_id.toString()}>
              {team.team_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
