import { seasonService } from './seasonService';

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
  async getCompetitionFormats(): Promise<CompetitionFormat[]> {
    const data = await seasonService.getSeasonData();
    return data.competition_formats || [];
  },

  // Get all venues
  async getVenues(): Promise<Venue[]> {
    const data = await seasonService.getSeasonData();
    return data.venues || [];
  },

  // Get all venue timeslots
  async getVenueTimeslots(): Promise<VenueTimeslot[]> {
    const data = await seasonService.getSeasonData();
    return data.venue_timeslots || [];
  },

  // Get all vacation periods
  async getVacationPeriods(): Promise<VacationPeriod[]> {
    const data = await seasonService.getSeasonData();
    return data.vacation_periods || [];
  },

  // Get day names
  async getDayNames(): Promise<string[]> {
    const data = await seasonService.getSeasonData();
    return data.day_names || [];
  },

  // Get venue by ID
  async getVenueById(venueId: number): Promise<Venue | undefined> {
    const venues = await this.getVenues();
    return venues.find(venue => venue.venue_id === venueId);
  },

  // Get timeslots for a specific venue
  async getTimeslotsForVenue(venueId: number): Promise<VenueTimeslot[]> {
    const timeslots = await this.getVenueTimeslots();
    return timeslots.filter(timeslot => timeslot.venue_id === venueId);
  },

  // Get active vacation periods
  async getActiveVacationPeriods(): Promise<VacationPeriod[]> {
    const periods = await this.getVacationPeriods();
    return periods.filter(period => period.is_active);
  }
}; 