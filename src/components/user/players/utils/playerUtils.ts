
import { Player } from "../types";

// Format date to display in DD-MM-YYYY format
export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('nl-NL');
};

// Get full name
export const getFullName = (player: Player) => {
  return `${player.first_name} ${player.last_name}`.trim();
};

// Handle team selection (admins only)
export const handleTeamChange = (teamId: number, setSelectedTeam: (id: number) => void, setEditMode: (mode: boolean) => void) => {
  setSelectedTeam(teamId);
  setEditMode(false);
};
