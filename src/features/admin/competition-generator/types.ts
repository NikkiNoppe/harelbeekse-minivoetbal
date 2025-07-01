
export interface Team {
  team_id: number;
  team_name: string;
}

export interface CompetitionFormat {
  id: string;
  name: string;
  description: string;
  regularRounds: number;
  hasPlayoffs: boolean;
  isCup: boolean;
}

export interface CompetitionType {
  id: string;
  name: string;
  description: string;
  regularRounds: number;
  hasPlayoffs: boolean;
  isCup: boolean;
  has_playoffs?: boolean; // Added for compatibility
  regular_rounds?: number; // Added for compatibility
  playoffTeams?: number; // Added missing property
}

export interface AvailableDate {
  date_id: number;
  available_date: string;
  is_available: boolean;
  is_cup_date: boolean;
}

export interface GeneratedMatch {
  matchday: number;
  home_team_id: number;
  away_team_id: number;
  home_team_name: string;
  away_team_name: string;
  match_date?: string;
  match_time?: string;
  location?: string;
  unique_code?: string;
}

// Add missing state and actions interfaces
export interface CompetitionGeneratorState {
  selectedDates: number[];
  selectedFormat: string | null;
  generatedMatches: GeneratedMatch[];
  competitionName: string;
  isCreating: boolean;
  minimumDatesRequired: number;
  activeTab: string;
}

export interface CompetitionGeneratorActions {
  setActiveTab: (tab: string) => void;
  setSelectedFormat: (format: string | null) => void;
  setCompetitionName: (name: string) => void;
  toggleDate: (dateId: number) => void;
  generateSchedule: () => Promise<void>;
  saveCompetition: () => Promise<void>;
}
