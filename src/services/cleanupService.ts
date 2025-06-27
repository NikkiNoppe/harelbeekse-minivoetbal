
import { supabase } from "@/integrations/supabase/client";

/**
 * Clean up test and mock data from the database
 */
export const cleanupMockData = async () => {
  try {
    // Clear match data that are test data
    // Reset submitted matches to unsubmitted state
    const { data: matchesToUpdate } = await supabase
      .from('matches')
      .select('match_id')
      .eq('is_submitted', true);
      
    if (matchesToUpdate && matchesToUpdate.length > 0) {
      await supabase
        .from('matches')
        .update({ 
          is_submitted: false,
          is_locked: false,
          home_score: null,
          away_score: null,
          home_players: [],
          away_players: [],
          referee: null,
          referee_notes: null
        })
        .in('match_id', matchesToUpdate.map(m => m.match_id));
    }
    
    // Clear competition standings
    await supabase.from('competition_standings').delete().gt('standing_id', 0);
    
    return { success: true, message: "Mock data successfully cleaned" };
  } catch (error) {
    console.error("Error cleaning mock data:", error);
    return { success: false, message: "Error cleaning mock data" };
  }
};
