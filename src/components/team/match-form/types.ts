
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
  matchday: string;
  isCompleted: boolean;
  isLocked: boolean;
  playersSubmitted: boolean;
  homeScore?: number;
  awayScore?: number;
  referee?: string;
  refereeNotes?: string;
}
