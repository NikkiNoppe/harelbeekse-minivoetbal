export interface PlayerSelection {
  playerId: number | null;
  playerName: string;
  jerseyNumber: string;
  isCaptain: boolean;
  cardType?: string;
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
  matchdayId?: number; // Add this for admin editing
  isCompleted: boolean;
  isLocked: boolean;
  homeScore?: number;
  awayScore?: number;
  referee?: string;
  refereeNotes?: string;
  homePlayers: PlayerSelection[];
  awayPlayers: PlayerSelection[];
}
