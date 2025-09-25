
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
  matchday: string; // Simplified - no more matchdayId needed
  isCompleted: boolean;
  isLocked: boolean;
  homeScore?: number | null;
  awayScore?: number | null;
  referee?: string;
  refereeNotes?: string;
  homePlayers: PlayerSelection[];
  awayPlayers: PlayerSelection[];
  // Poll-related optional fields for backward compatibility
  assignedRefereeId?: number | null;
  pollGroupId?: string | null;
  pollMonth?: string | null;
}
