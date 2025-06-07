
export interface VacationPeriod {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface TeamPreference {
  id?: number;
  team_id: number;
  preferred_home_day?: number; // 0=zondag, 1=maandag, etc
  preferred_time_slot?: string;
  max_travel_distance?: number;
  blackout_dates?: string[];
  notes?: string;
}

export interface AdvancedCompetitionConfig {
  id?: number;
  name: string;
  matches_per_week: number;
  start_date: string;
  end_date: string;
  format_type: 'regular' | 'playoff' | 'cup' | 'custom';
  total_rounds?: number;
  playoff_teams?: number;
  vacation_periods: number[];
  config_data?: {
    custom_rules?: string;
    special_requirements?: string;
    venue_constraints?: any;
  };
}

export interface AIGenerationRequest {
  config: AdvancedCompetitionConfig;
  teams: Team[];
  team_preferences: TeamPreference[];
  vacation_periods: VacationPeriod[];
  ai_provider: 'openai' | 'abacus';
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

export interface AIGenerationLog {
  id: number;
  config_id: number;
  ai_provider: string;
  request_data: any;
  response_data?: any;
  status: 'pending' | 'success' | 'error';
  error_message?: string;
  generation_time_ms?: number;
  created_at: string;
}

// Re-export existing types
export type { Team, GeneratedMatch, AvailableDate } from './types';
