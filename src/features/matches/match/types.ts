// Match types for the different components
export interface MatchFormData {
  id?: number;
  date: string;
  time: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamName?: string;
  awayTeamName?: string;
  location: string;
  homeScore?: number | null;
  awayScore?: number | null;
  referee?: string;
  notes?: string;
  refereeNotes?: string;
  uniqueNumber?: string;
}

export interface PastMatch {
  id: number;
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  location: string;
  referee: string;
  uniqueNumber?: string;
}

export interface MatchesResult {
  past: PastMatch[];
  upcoming: MatchFormData[];
}
