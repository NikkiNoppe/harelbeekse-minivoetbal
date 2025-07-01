
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
  
  // These properties ensure compatibility with CompetitionFormat
  format_id?: number;
  has_playoffs: boolean;
  regular_rounds: number;
}

// New types for the hook responses
export interface CompetitionGeneratorState {
  selectedDates: number[];
  selectedFormat: string | null;
  generatedMatches: GeneratedMatch[];
  competitionName: string;
  isCreating: boolean;
  activeTab: string;
  minimumDatesRequired: number;
}

export interface CompetitionGeneratorActions {
  setSelectedFormat: (formatId: string) => void;
  setCompetitionName: (name: string) => void;
  toggleDate: (dateId: number) => void;
  generateSchedule: () => void;
  saveCompetition: () => Promise<void>;
  setActiveTab: (tab: string) => void;
}
