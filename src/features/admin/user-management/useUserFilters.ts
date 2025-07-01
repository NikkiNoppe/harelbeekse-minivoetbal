
import { useState, useMemo } from "react";
import { DbUser } from "./types";

export const useUserFilters = (users: DbUser[]) => {
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");

  // Filter users based on search term and filters
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Text search filter (case insensitive)
      const matchesSearch = searchTerm === "" || 
        user.username.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Role filter
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      
      // Team filter
      const matchesTeam = teamFilter === "all" || 
        (teamFilter === "none" ? 
          (!user.teams || user.teams.length === 0) : 
          (user.teams && user.teams.some(team => team.team_id === parseInt(teamFilter)))
        );
      
      return matchesSearch && matchesRole && matchesTeam;
    });
  }, [users, searchTerm, roleFilter, teamFilter]);

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
  };

  const handleRoleFilterChange = (role: string) => {
    setRoleFilter(role);
  };

  const handleTeamFilterChange = (teamId: string) => {
    setTeamFilter(teamId);
  };

  return {
    filteredUsers,
    searchTerm,
    roleFilter,
    teamFilter,
    handleSearchChange,
    handleRoleFilterChange,
    handleTeamFilterChange
  };
};
