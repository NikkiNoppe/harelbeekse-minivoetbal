
import { MatchFormData } from "./types";
import { getMockMatches } from "./mockMatchData";

export const fetchUpcomingMatches = async (teamId: number, hasElevatedPermissions: boolean = false): Promise<MatchFormData[]> => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock data based on user permissions
    const matches = getMockMatches(teamId, hasElevatedPermissions);
    
    // Sort by date
    return matches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch (error) {
    console.error("Error fetching matches:", error);
    throw error;
  }
};

export const updateMatchForm = async (matchData: MatchFormData): Promise<MatchFormData> => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log("Match form updated:", matchData);
    
    // In real implementation, this would update the database
    return matchData;
  } catch (error) {
    console.error("Error updating match form:", error);
    throw error;
  }
};

export const lockMatchForm = async (matchId: number): Promise<void> => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log("Match form locked:", matchId);
    
    // In real implementation, this would lock the match in database
  } catch (error) {
    console.error("Error locking match form:", error);
    throw error;
  }
};
