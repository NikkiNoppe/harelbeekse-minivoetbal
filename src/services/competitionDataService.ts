import seasonConfig from '@/config/season2025-2026.json';

export interface CompetitionFormat {
  id: number;
  name: string;
  description: string;
  has_playoffs: boolean;
  regular_rounds: number;
}

export interface Venue {
  venue_id: number;
  name: string;
  address: string;
}

export interface VenueTimeslot {
  timeslot_id: number;
  venue_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface VacationPeriod {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export const competitionDataService = {
  // Get all competition formats
  getCompetitionFormats(): CompetitionFormat[] {
    return seasonConfig.competition_formats || [];
  },

  // Get all venues
  getVenues(): Venue[] {
    return seasonConfig.venues || [];
  },

  // Get all venue timeslots
  getVenueTimeslots(): VenueTimeslot[] {
    return seasonConfig.venue_timeslots || [];
  },

  // Get all vacation periods
  getVacationPeriods(): VacationPeriod[] {
    return seasonConfig.vacation_periods || [];
  },

  // Get day names
  getDayNames(): string[] {
    return seasonConfig.day_names || [];
  },

  // Get venue by ID
  getVenueById(venueId: number): Venue | undefined {
    return this.getVenues().find(venue => venue.venue_id === venueId);
  },

  // Get timeslots for a specific venue
  getTimeslotsForVenue(venueId: number): VenueTimeslot[] {
    return this.getVenueTimeslots().filter(timeslot => timeslot.venue_id === venueId);
  },

  // Get active vacation periods
  getActiveVacationPeriods(): VacationPeriod[] {
    return this.getVacationPeriods().filter(period => period.is_active);
  }
}; 