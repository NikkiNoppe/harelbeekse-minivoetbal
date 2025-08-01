import { MatchFormData } from "@/components/pages/admin/matches/types/MatchesFormTypes";

/**
 * Generic function to sort matches by date and time
 * @param matches Array of matches to sort
 * @returns Sorted matches array
 */
export const sortMatchesByDateAndTime = <T extends { date: string; time: string }>(
  matches: T[]
): T[] => {
  return matches.sort((a, b) => {
    // First sort by date
    const aDate = new Date(a.date);
    const bDate = new Date(b.date);
    
    if (aDate.getTime() !== bDate.getTime()) {
      return aDate.getTime() - bDate.getTime();
    }
    
    // Same date, sort by time (earliest time first)
    return a.time.localeCompare(b.time);
  });
};

/**
 * Sort cup matches by round, then by date and time
 * @param matches Array of cup matches to sort
 * @returns Sorted cup matches array
 */
export const sortCupMatches = (matches: MatchFormData[]): MatchFormData[] => {
  const getRoundOrder = (uniqueNumber: string): number => {
    if (uniqueNumber.startsWith('1/8-')) return 1; // Achtste finales
    if (uniqueNumber.startsWith('QF-')) return 2;  // Kwartfinales
    if (uniqueNumber.startsWith('SF-')) return 3;  // Halve finales
    if (uniqueNumber === 'FINAL') return 4;        // Finale
    return 99; // Unknown/other
  };

  const getRoundSubOrder = (uniqueNumber: string): number => {
    const match = uniqueNumber.match(/-(\d+)$/);
    return match ? parseInt(match[1], 10) : 0;
  };

  return matches.sort((a, b) => {
    const aRound = getRoundOrder(a.uniqueNumber);
    const bRound = getRoundOrder(b.uniqueNumber);
    
    // First sort by round (Achtste finales, Kwartfinales, etc.)
    if (aRound !== bRound) {
      return aRound - bRound;
    }
    
    // Same round, sort by date first
    const aDate = new Date(a.date);
    const bDate = new Date(b.date);
    
    if (aDate.getTime() !== bDate.getTime()) {
      return aDate.getTime() - bDate.getTime();
    }
    
    // Same date, sort by time (earliest time first)
    const aTime = a.time;
    const bTime = b.time;
    
    if (aTime !== bTime) {
      return aTime.localeCompare(bTime);
    }
    
    // Same date and time, sort by sub-order (1/8-1, 1/8-2, etc.)
    return getRoundSubOrder(a.uniqueNumber) - getRoundSubOrder(b.uniqueNumber);
  });
};

/**
 * Sort league matches by matchday, then by date and time
 * @param matches Array of league matches to sort
 * @returns Sorted league matches array
 */
export const sortLeagueMatches = (matches: MatchFormData[]): MatchFormData[] => {
  const getMatchdayNumber = (matchday: string): number => {
    const num = matchday.match(/\d+/);
    return num ? parseInt(num[0]) : 0;
  };

  return matches.sort((a, b) => {
    // First sort by matchday number
    const aMatchday = getMatchdayNumber(a.matchday);
    const bMatchday = getMatchdayNumber(b.matchday);
    
    if (aMatchday !== bMatchday) {
      return aMatchday - bMatchday;
    }
    
    // Same matchday, sort by date first
    const aDate = new Date(a.date);
    const bDate = new Date(b.date);
    
    if (aDate.getTime() !== bDate.getTime()) {
      return aDate.getTime() - bDate.getTime();
    }
    
    // Same date, sort by time (earliest time first)
    const aTime = a.time;
    const bTime = b.time;
    
    if (aTime !== bTime) {
      return aTime.localeCompare(bTime);
    }
    
    // Same date and time, sort by unique number
    return a.uniqueNumber.localeCompare(b.uniqueNumber);
  });
};

/**
 * Sort matches within groups (for display purposes)
 * @param groupedMatches Object with groups of matches
 * @param isCupMatchList Whether these are cup matches
 * @returns Object with sorted groups
 */
export const sortMatchesWithinGroups = (
  groupedMatches: Record<string, MatchFormData[]>,
  isCupMatchList: boolean
): Record<string, MatchFormData[]> => {
  const sortedGroups = { ...groupedMatches };
  
  Object.keys(sortedGroups).forEach(groupKey => {
    if (isCupMatchList) {
      // For cup matches, sort by date and time within each round
      sortedGroups[groupKey] = sortMatchesByDateAndTime(sortedGroups[groupKey]);
    } else {
      // For league matches, sort by date and time within each matchday
      sortedGroups[groupKey] = sortMatchesByDateAndTime(sortedGroups[groupKey]);
    }
  });
  
  return sortedGroups;
};

/**
 * Get cup round name from unique number
 * @param uniqueNumber The unique number of the match
 * @returns The round name
 */
export const getCupRoundName = (uniqueNumber: string): string => {
  if (uniqueNumber.startsWith('1/8-')) return 'Achtste Finales';
  if (uniqueNumber.startsWith('QF-')) return 'Kwart Finales';
  if (uniqueNumber.startsWith('SF-')) return 'Halve Finales';
  if (uniqueNumber === 'FINAL') return 'Finale';
  return 'Andere';
};

/**
 * Sort group keys (rounds or matchdays) in the correct order
 * @param groupKeys Array of group keys to sort
 * @param isCupMatchList Whether these are cup matches
 * @returns Sorted group keys
 */
export const sortGroupKeys = (groupKeys: string[], isCupMatchList: boolean): string[] => {
  if (isCupMatchList) {
    // Sort cup rounds in tournament order
    const roundOrder = { 
      'Achtste Finales': 1, 
      'Kwart Finales': 2, 
      'Halve Finales': 3, 
      'Finale': 4, 
      'Andere': 99 
    };
    return groupKeys.sort((a, b) => (roundOrder[a] || 99) - (roundOrder[b] || 99));
  } else {
    // Sort matchdays numerically
    const getMatchdayNumber = (str: string) => {
      const num = str.match(/\d+/);
      return num ? parseInt(num[0]) : 0;
    };
    return groupKeys.sort((a, b) => getMatchdayNumber(a) - getMatchdayNumber(b));
  }
}; 