
export interface MatchFormData {
  matchId: number;
  uniqueNumber: string;
  date: string;
  time: string;
  homeTeamId: number;
  homeTeamName: string;
  awayTeamId: number;
  awayTeamName: string;
  location: string;
  isHomeTeam: boolean;
}

export interface PlayerData {
  playerId: number;
  playerName: string;
  jerseyNumber: number | null;
  isCaptain: boolean;
}
