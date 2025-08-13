export * from './MatchesFormTypes';

// Additional types for compatibility
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