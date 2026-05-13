import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTeams } from "@/hooks/useTeams";

interface SuspensionFiltersProps {
  selectedTeam: string;
  onTeamChange: (teamId: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  selectedSource: string;
  onSourceChange: (source: string) => void;
  searchTerm: string;
  onSearchChange: (searchTerm: string) => void;
}

export const SuspensionFilters: React.FC<SuspensionFiltersProps> = ({
  selectedTeam,
  onTeamChange,
  selectedStatus,
  onStatusChange,
  selectedSource,
  onSourceChange,
  searchTerm,
  onSearchChange
}) => {
  const { data: teams } = useTeams();

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_200px_200px_minmax(220px,1fr)]">
      <Select value={selectedTeam} onValueChange={onTeamChange}>
        <SelectTrigger className="w-full min-h-[44px]">
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

      <Select value={selectedStatus} onValueChange={onStatusChange}>
        <SelectTrigger className="w-full min-h-[44px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle statussen</SelectItem>
          <SelectItem value="active">Actief</SelectItem>
          <SelectItem value="completed">Afgelopen</SelectItem>
          <SelectItem value="pending">Wachtend</SelectItem>
        </SelectContent>
      </Select>

      <Select value={selectedSource} onValueChange={onSourceChange}>
        <SelectTrigger className="w-full min-h-[44px]">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle types</SelectItem>
          <SelectItem value="automatic">Automatisch</SelectItem>
          <SelectItem value="manual">Handmatig</SelectItem>
        </SelectContent>
      </Select>

      <Input
        value={searchTerm}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Zoek speler, team of reden"
        className="min-h-[44px]"
      />
    </div>
  );
};
