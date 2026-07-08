import { Player } from "../types";
import { formatDateShort } from "@/lib/dateUtils";

/** Reglement: max. spelers per team per seizoen */
export const MAX_TEAM_PLAYERS = 20;

export function isTeamRosterFull(playerCount: number): boolean {
  return playerCount >= MAX_TEAM_PLAYERS;
}

// Format date to display in DD-MM-YYYY format
export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return formatDateShort(dateString);
};

// Get full name (voornaam achternaam)
export const getFullName = (player: Player) => {
  return `${player.first_name} ${player.last_name}`.trim();
};

/** Lijstweergave: achternaam, voornaam */
export const getRosterDisplayName = (player: Pick<Player, "first_name" | "last_name">) => {
  return `${player.last_name}, ${player.first_name}`.trim();
};

// Handle team selection (admins only)
export const handleTeamChange = (teamId: number | null, setSelectedTeam: (id: number | null) => void, setEditMode: (mode: boolean) => void) => {
  setSelectedTeam(teamId);
  setEditMode(false);
};
