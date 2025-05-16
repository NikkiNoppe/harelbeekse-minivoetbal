
export interface AvailableDate {
  date_id: number;
  available_date: string;
  is_cup_date: boolean;
  is_available: boolean;
}

export interface CompetitionFormat {
  format_id: number;
  name: string;
  description: string | null;
  has_playoffs: boolean;
  regular_rounds: number;
}

export interface Team {
  team_id: number;
  team_name: string;
}

export interface GeneratedMatch {
  home_team_id: number;
  away_team_id: number;
  matchday: number;
  home_team_name: string;
  away_team_name: string;
  unique_code?: string;
  location?: string;
  match_time?: string;
  match_date?: string;
}

export interface CompetitionType {
  id: string;
  name: string;
  description: string;
  hasPlayoffs: boolean;
  regularRounds: number;
  playoffTeams?: number;
  isCup?: boolean;
  
  // Add these properties to make it compatible with CompetitionFormat
  format_id?: number;
  has_playoffs?: boolean;
  regular_rounds?: number;
}
