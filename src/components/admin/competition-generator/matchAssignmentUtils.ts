
import { AvailableDate, GeneratedMatch } from "./types";

export const assignMatchDetails = (
  matches: GeneratedMatch[], 
  selectedDatesObjects: AvailableDate[]
): GeneratedMatch[] => {
  if (!selectedDatesObjects.length) return matches;
  
  return matches.map((match, index) => {
    // Create unique code: matchday number (2 digits) + match number in that day (2 digits)
    const matchday = String(match.matchday).padStart(2, '0');
    const matchNumber = String((index % 9) + 1).padStart(2, '0');
    
    const dateIndex = Math.floor(index / 9) % selectedDatesObjects.length;
    const dateObj = selectedDatesObjects[dateIndex];
    
    // Alternate between venues and time slots
    const venues = ["Harelbeke - Dageraad", "Bavikhove - Vlasschaard"];
    const timeSlots = ["18:30", "19:30", "20:30"];
    
    const venueIndex = index % venues.length;
    const timeIndex = index % timeSlots.length;
    
    return {
      ...match,
      unique_code: `${matchday}${matchNumber}`,
      location: venues[venueIndex],
      match_time: timeSlots[timeIndex],
      match_date: dateObj ? dateObj.available_date : ''
    };
  });
};

export const calculateRequiredMatchdays = (matchesCount: number): number => {
  // Max 9 matches per matchday
  return Math.ceil(matchesCount / 9);
};
