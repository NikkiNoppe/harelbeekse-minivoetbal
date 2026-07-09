import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SearchInput from "@/components/ui/search-input";
import { useTeams } from "@/hooks/useTeams";
import { cn } from "@/lib/utils";
import { PUBLIC_CARD_CLASS } from "@/components/layout";

interface SuspensionFiltersProps {
  selectedTeam: string;
  onTeamChange: (teamId: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  selectedSource: string;
  onSourceChange: (source: string) => void;
  searchTerm: string;
  onSearchChange: (searchTerm: string) => void;
  addButton?: React.ReactNode;
}

export const SuspensionFilters: React.FC<SuspensionFiltersProps> = ({
  selectedTeam,
  onTeamChange,
  selectedStatus,
  onStatusChange,
  selectedSource,
  onSourceChange,
  searchTerm,
  onSearchChange,
  addButton,
}) => {
  const { data: teams } = useTeams();

  return (
    <Card className={cn(PUBLIC_CARD_CLASS, "shadow-sm")}>
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="block md:hidden space-y-3">
          <SearchInput
            placeholder="Zoek speler, team of reden..."
            value={searchTerm}
            onChange={onSearchChange}
            className="min-h-[44px]"
          />
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
          {addButton && <div className="pt-2">{addButton}</div>}
        </div>

        <div className="hidden md:flex md:items-end md:gap-4">
          <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SearchInput
              placeholder="Zoek speler, team of reden..."
              value={searchTerm}
              onChange={onSearchChange}
            />
            <Select value={selectedTeam} onValueChange={onTeamChange}>
              <SelectTrigger className="min-h-[44px]">
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
              <SelectTrigger className="min-h-[44px]">
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
              <SelectTrigger className="min-h-[44px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle types</SelectItem>
                <SelectItem value="automatic">Automatisch</SelectItem>
                <SelectItem value="manual">Handmatig</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {addButton && <div className="flex-shrink-0">{addButton}</div>}
        </div>
      </CardContent>
    </Card>
  );
};
