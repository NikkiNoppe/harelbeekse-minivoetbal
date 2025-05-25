
import { MatchFormData } from "./types";
import { MOCK_MATCH_FORMS } from "./mockMatchData";

// For now, we'll use mock data. Later this will be replaced with Supabase calls
let mockData = [...MOCK_MATCH_FORMS];

export const fetchUpcomingMatches = async (teamId: number = 0, hasElevatedPermissions: boolean = false): Promise<MatchFormData[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  if (hasElevatedPermissions) {
    // Admins and referees see all matches
    return mockData;
  } else {
    // Team managers only see their team's matches
    return mockData.filter(match => 
      match.homeTeamId === teamId || match.awayTeamId === teamId
    );
  }
};

export const updateMatchForm = async (matchData: MatchFormData): Promise<void> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const index = mockData.findIndex(match => match.matchId === matchData.matchId);
  if (index !== -1) {
    mockData[index] = { ...mockData[index], ...matchData };
  }
};

export const lockMatchForm = async (matchId: number): Promise<void> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const index = mockData.findIndex(match => match.matchId === matchId);
  if (index !== -1) {
    mockData[index].isLocked = true;
  }
};

export const getMatchForm = async (matchId: number): Promise<MatchFormData | null> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return mockData.find(match => match.matchId === matchId) || null;
};
