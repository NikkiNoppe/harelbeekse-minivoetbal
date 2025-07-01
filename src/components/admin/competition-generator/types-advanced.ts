
export interface AdvancedCompetitionConfig {
  name: string;
  format_type: string;
  start_date: string;
  end_date: string;
  matches_per_week: number;
  vacation_periods: number[];
  total_rounds?: number;
  playoff_teams?: number;
  config_data?: any;
}

export interface TeamPreference {
  team_id: number;
  preferred_home_day?: number;
  preferred_time_slot?: string;
  preferred_location?: string;
  max_travel_distance?: number;
  blackout_dates?: string[];
  notes?: string;
}

export interface VacationPeriod {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
}

export interface Team {
  team_id: number;
  team_name: string;
}

export interface GeneratedMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
  location: string;
  matchday: string;
  home_team_name: string;
  away_team_name: string;
  match_time?: string;
}

export interface AIGeneratedSchedule {
  matches: GeneratedMatch[];
  matchdays: {
    name: string;
    date: string;
    matches: GeneratedMatch[];
  }[];
  validation_notes: string[];
  confidence_score: number;
}

export interface AIGenerationRequest {
  config: AdvancedCompetitionConfig;
  teams: Team[];
  team_preferences: TeamPreference[];
  vacation_periods: VacationPeriod[];
  ai_provider: 'openai' | 'abacus';
}
