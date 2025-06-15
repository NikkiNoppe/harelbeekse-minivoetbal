export interface PlayerSelection {
  playerId: number | null;
  playerName: string;
  jerseyNumber: string;
  isCaptain: boolean;
}

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
  matchday: string;
  isCompleted: boolean;
  isLocked: boolean;
  homeScore?: number;
  awayScore?: number;
  referee?: string;
  refereeNotes?: string;
  homePlayers: PlayerSelection[];
  awayPlayers: PlayerSelection[];
}
