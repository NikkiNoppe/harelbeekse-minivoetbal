
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
}
