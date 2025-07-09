// Hardcoded competition data - replaces database tables
// This data can be updated 1x per year by admin

export interface CompetitionFormat {
  id: number;
  name: string;
  description: string | null;
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
  day_of_week: number; // 0=Sunday, 1=Monday, etc.
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

// Competition formats - matches current database data
export const COMPETITION_FORMATS: CompetitionFormat[] = [
  {
    id: 1,
    name: "Reguliere competitie (enkele ronde)",
    description: "Elke ploeg speelt één keer tegen elke andere ploeg",
    has_playoffs: false,
    regular_rounds: 1
  },
  {
    id: 2,
    name: "Reguliere competitie (dubbele ronde)",
    description: "Elke ploeg speelt twee keer tegen elke andere ploeg (thuis en uit)",
    has_playoffs: false,
    regular_rounds: 2
  },
  {
    id: 3,
    name: "Competitie met Play-offs (Top 6 / Bottom 6)",
    description: "Reguliere competitie gevolgd door playoff tussen top 6 teams en degradatie playoff voor bottom 6 teams",
    has_playoffs: true,
    regular_rounds: 1
  },
  {
    id: 4,
    name: "Competitie met Play-offs (Top 4)",
    description: "Reguliere competitie gevolgd door playoff tussen top 4 teams",
    has_playoffs: true,
    regular_rounds: 1
  },
  {
    id: 5,
    name: "Beker competitie (knockout)",
    description: "Knock-out toernooi waarin elke ploeg één wedstrijd speelt en de winnaar doorgaat",
    has_playoffs: false,
    regular_rounds: 0
  }
];

// Venues - matches current database data
export const VENUES: Venue[] = [
  {
    venue_id: 1,
    name: "Sporthal De Horizon",
    address: "Horizonlaan 15, 1234 AB Voorbeeldstad"
  },
  {
    venue_id: 2,
    name: "Sportcomplex Oost",
    address: "Ooststraat 42, 1234 CD Voorbeeldstad"
  },
  {
    venue_id: 3,
    name: "Gemeentelijke Sporthal",
    address: "Gemeenteplein 8, 1234 EF Voorbeeldstad"
  }
];

// Venue timeslots - matches current database data
export const VENUE_TIMESLOTS: VenueTimeslot[] = [
  // Sporthal De Horizon (venue_id: 1)
  { timeslot_id: 1, venue_id: 1, day_of_week: 1, start_time: "19:00", end_time: "20:30" }, // Monday
  { timeslot_id: 2, venue_id: 1, day_of_week: 2, start_time: "19:00", end_time: "20:30" }, // Tuesday
  { timeslot_id: 3, venue_id: 1, day_of_week: 3, start_time: "19:00", end_time: "20:30" }, // Wednesday
  { timeslot_id: 4, venue_id: 1, day_of_week: 4, start_time: "19:00", end_time: "20:30" }, // Thursday
  { timeslot_id: 5, venue_id: 1, day_of_week: 5, start_time: "19:00", end_time: "20:30" }, // Friday
  { timeslot_id: 6, venue_id: 1, day_of_week: 6, start_time: "14:00", end_time: "15:30" }, // Saturday afternoon
  { timeslot_id: 7, venue_id: 1, day_of_week: 6, start_time: "15:30", end_time: "17:00" }, // Saturday afternoon
  
  // Sportcomplex Oost (venue_id: 2)
  { timeslot_id: 8, venue_id: 2, day_of_week: 1, start_time: "20:00", end_time: "21:30" }, // Monday
  { timeslot_id: 9, venue_id: 2, day_of_week: 3, start_time: "20:00", end_time: "21:30" }, // Wednesday
  { timeslot_id: 10, venue_id: 2, day_of_week: 5, start_time: "20:00", end_time: "21:30" }, // Friday
  { timeslot_id: 11, venue_id: 2, day_of_week: 6, start_time: "10:00", end_time: "11:30" }, // Saturday morning
  { timeslot_id: 12, venue_id: 2, day_of_week: 6, start_time: "11:30", end_time: "13:00" }, // Saturday morning
  
  // Gemeentelijke Sporthal (venue_id: 3)
  { timeslot_id: 13, venue_id: 3, day_of_week: 2, start_time: "20:00", end_time: "21:30" }, // Tuesday
  { timeslot_id: 14, venue_id: 3, day_of_week: 4, start_time: "20:00", end_time: "21:30" }, // Thursday
  { timeslot_id: 15, venue_id: 3, day_of_week: 0, start_time: "10:00", end_time: "11:30" }, // Sunday morning
  { timeslot_id: 16, venue_id: 3, day_of_week: 0, start_time: "11:30", end_time: "13:00" }, // Sunday morning
];

// Vacation periods - matches current database data
export const VACATION_PERIODS: VacationPeriod[] = [
  {
    id: 1,
    name: "Kerstvakantie",
    start_date: "2024-12-23",
    end_date: "2025-01-06",
    is_active: true
  },
  {
    id: 2,
    name: "Krokusvakantie",
    start_date: "2025-02-24",
    end_date: "2025-03-02",
    is_active: true
  },
  {
    id: 3,
    name: "Paasvakantie",
    start_date: "2025-04-14",
    end_date: "2025-04-28",
    is_active: true
  },
  {
    id: 4,
    name: "Zomervakantie",
    start_date: "2025-07-01",
    end_date: "2025-08-31",
    is_active: true
  }
];

// Helper functions
export const getVenueById = (id: number): Venue | undefined => {
  return VENUES.find(venue => venue.venue_id === id);
};

export const getTimeslotsByVenue = (venueId: number): VenueTimeslot[] => {
  return VENUE_TIMESLOTS.filter(slot => slot.venue_id === venueId);
};

export const getFormatById = (id: number): CompetitionFormat | undefined => {
  return COMPETITION_FORMATS.find(format => format.id === id);
};

export const getActiveVacationPeriods = (): VacationPeriod[] => {
  return VACATION_PERIODS.filter(period => period.is_active);
};

// Day of week names for display
export const DAY_NAMES = [
  'Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 
  'Donderdag', 'Vrijdag', 'Zaterdag'
];