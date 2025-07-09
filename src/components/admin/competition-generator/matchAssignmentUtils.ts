
import { AvailableDate, GeneratedMatch } from "./types";
import { VENUES } from "@/constants/competitionData";

export const assignMatchDetails = async (
  matches: GeneratedMatch[], 
  selectedDatesObjects: AvailableDate[]
): Promise<GeneratedMatch[]> => {
  if (!selectedDatesObjects.length) return matches;
  
  // Use hardcoded venue data
  const venues = [{ venue_id: 1, name: "Sporthal De Horizon" }];
  const availableDatesWithVenues = selectedDatesObjects.map(date => ({
    ...date,
    venues: { name: venues[0]?.name || "Sporthal De Horizon" }
  }));

  return matches.map((match, index) => {
    // Create unique code: matchday number (2 digits) + match number in that day (2 digits)
    const matchday = String(match.matchday).padStart(2, '0');
    const matchNumber = String((index % 9) + 1).padStart(2, '0');
    
    const dateIndex = Math.floor(index / 9) % selectedDatesObjects.length;
    const dateObj = selectedDatesObjects[dateIndex];
    
    // Get the corresponding available date with venue info
    const availableDateWithVenue = availableDatesWithVenues?.find(
      ad => ad.available_date === dateObj?.available_date
    );
    
    // Alternate between time slots if multiple are available
    const timeSlots = ["18:30", "19:30", "20:30"];
    const timeIndex = index % timeSlots.length;
    
    return {
      ...match,
      unique_code: `${matchday}${matchNumber}`,
      location: availableDateWithVenue?.venues?.name || "Locatie TBD",
      match_time: timeSlots[timeIndex],
      match_date: dateObj ? dateObj.available_date : ''
    };
  });
};

export const calculateRequiredMatchdays = (matchesCount: number): number => {
  // Max 9 matches per matchday
  return Math.ceil(matchesCount / 9);
};
