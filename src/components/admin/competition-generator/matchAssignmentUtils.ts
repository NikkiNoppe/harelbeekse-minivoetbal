
import { AvailableDate, GeneratedMatch } from "./types";
import { timeslotPriorityService } from "@/services";

export const assignMatchDetails = async (
  matches: GeneratedMatch[], 
  selectedDatesObjects: AvailableDate[]
): Promise<GeneratedMatch[]> => {
  if (!selectedDatesObjects.length) return matches;

  // Group matches by matchday to count matches per day
  const matchesByDay: { [key: number]: GeneratedMatch[] } = {};
  matches.forEach(match => {
    if (!matchesByDay[match.matchday]) {
      matchesByDay[match.matchday] = [];
    }
    matchesByDay[match.matchday].push(match);
  });

  return Promise.all(
    matches.map(async (match, index) => {
      // Create unique code: matchday number (2 digits) + match number in that day (2 digits)
      const matchday = String(match.matchday).padStart(2, '0');
      const matchNumber = String((index % 9) + 1).padStart(2, '0');
      
      const dateIndex = Math.floor(index / 9) % selectedDatesObjects.length;
      const dateObj = selectedDatesObjects[dateIndex];
      
      // Get number of matches on this day for optimal timeslot selection
      const matchesThisDay = matchesByDay[match.matchday]?.length || 1;
      const matchIndexInDay = matchesByDay[match.matchday]?.indexOf(match) || 0;
      
      // Get optimal timeslot using priority service
      const { time, venue } = await timeslotPriorityService.getMatchDetails(
        matchIndexInDay, 
        matchesThisDay,
        dateObj ? dateObj.available_date : undefined
      );
      
      return {
        ...match,
        unique_code: `${matchday}${matchNumber}`,
        location: venue,
        match_time: time,
        match_date: dateObj ? dateObj.available_date : ''
      };
    })
  );
};

export const calculateRequiredMatchdays = (matchesCount: number): number => {
  // Max 9 matches per matchday
  return Math.ceil(matchesCount / 9);
};
