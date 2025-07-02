import React from "react";
import SearchInput from "@/components/ui/search-input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface UserSearchFilterProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  roleFilter: string;
  onRoleFilterChange: (role: string) => void;
  teamFilter: string;
  onTeamFilterChange: (teamId: string) => void;
  teams: { team_id: number; team_name: string }[];
}

const UserSearchFilter: React.FC<UserSearchFilterProps> = ({
  searchTerm,
  onSearchTermChange,
  roleFilter,
  onRoleFilterChange,
  teamFilter,
  onTeamFilterChange,
  teams
}) => {
  return (
    <div className="mb-4 space-y-3 md:space-y-0 md:grid md:grid-cols-3 md:gap-4">
      {/* Search by name */}
      <SearchInput
        placeholder="Zoeken op naam..."
        value={searchTerm}
        onChange={onSearchTermChange}
      />

      {/* Filter by role */}
      <Select
        value={roleFilter}
        onValueChange={onRoleFilterChange}
      >
        <SelectTrigger className="dropdown-login-style">
          <SelectValue placeholder="Alle rollen" />
        </SelectTrigger>
        <SelectContent className="dropdown-content-login-style">
          <SelectItem value="all" className="dropdown-item-login-style">Alle rollen</SelectItem>
          <SelectItem value="admin" className="dropdown-item-login-style">Administrator</SelectItem>
          <SelectItem value="player_manager" className="dropdown-item-login-style">Teamverantwoordelijke</SelectItem>
          <SelectItem value="referee" className="dropdown-item-login-style">Scheidsrechter</SelectItem>
        </SelectContent>
      </Select>

      {/* Filter by team */}
      <Select
        value={teamFilter}
        onValueChange={onTeamFilterChange}
        disabled={teams.length === 0}
      >
        <SelectTrigger className="dropdown-login-style">
          <SelectValue placeholder="Alle teams" />
        </SelectTrigger>
        <SelectContent className="dropdown-content-login-style">
          <SelectItem value="all" className="dropdown-item-login-style">Alle teams</SelectItem>
          {teams.map((team) => (
            <SelectItem key={team.team_id} value={team.team_id.toString()} className="dropdown-item-login-style">
              {team.team_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default UserSearchFilter;
