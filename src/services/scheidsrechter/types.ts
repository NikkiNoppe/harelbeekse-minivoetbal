// =====================================================
// SCHEIDSRECHTER SYSTEEM - TYPE DEFINITIES
// =====================================================

// Basis types
export type PollStatus = 'draft' | 'open' | 'closed' | 'processing' | 'completed';
export type AssignmentStatus = 'pending' | 'confirmed' | 'declined' | 'cancelled';

// Monthly Poll
export interface MonthlyPoll {
  id: number;
  poll_month: string; // YYYY-MM
  deadline: string | null;
  status: PollStatus;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  notes: string | null;
}

export interface CreatePollInput {
  poll_month: string;
  deadline?: string;
  notes?: string;
  match_dates?: PollMatchDateInput[];
}

// Poll Match Dates
export interface PollMatchDate {
  id: number;
  poll_id: number;
  match_date: string;
  location: string | null;
  time_slot: string | null;
  match_count: number;
  created_at: string;
}

export interface PollMatchDateInput {
  match_date: string;
  location?: string;
  time_slot?: string;
  match_count?: number;
}

// Referee Availability
export interface RefereeAvailabilityRecord {
  id: number;
  user_id: number;
  match_id: number | null;
  poll_group_id: string;
  poll_month: string;
  is_available: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AvailabilityInput {
  match_id?: number;
  poll_group_id?: string;
  is_available: boolean;
  notes?: string;
}

export interface RefereeWithAvailability {
  user_id: number;
  username: string;
  email?: string;
  availability: AvailabilityInput[];
}

// Referee Assignments
export interface RefereeAssignment {
  id: number;
  match_id: number;
  referee_id: number;
  assigned_at: string;
  assigned_by: number | null;
  status: AssignmentStatus;
  confirmed_at: string | null;
  notes: string | null;
  // Joined data
  referee_name?: string;
  match_date?: string;
  home_team_name?: string;
  away_team_name?: string;
  location?: string;
}

export interface CreateAssignmentInput {
  match_id: number;
  referee_id: number;
  notes?: string;
}

// Available Referee for Match
export interface AvailableReferee {
  user_id: number;
  username: string;
  is_available: boolean;
  has_conflict: boolean;
}

// Poll Summary (for admin overview)
export interface PollSummary {
  poll: MonthlyPoll;
  match_dates_count: number;
  referees_responded: number;
  referees_total: number;
  matches_assigned: number;
  matches_total: number;
}

// Assignment Statistics
export interface RefereeAssignmentStats {
  referee_id: number;
  referee_name: string;
  total_assignments: number;
  pending_count: number;
  confirmed_count: number;
  declined_count: number;
}
