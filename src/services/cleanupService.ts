
import { supabase } from "@/integrations/supabase/client";

/**
 * Clean up test data from the database and reset matches
 */
export const cleanupTestData = async () => {
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
    
    // Trigger standings update to reinitialize all teams
    const { error: standingsError } = await supabase.rpc('update_competition_standings');
    if (standingsError) {
      console.error('Error updating competition standings:', standingsError);
    }
    
    return { success: true, message: "Test data successfully cleaned" };
  } catch (error) {
    console.error("Error cleaning test data:", error);
    return { success: false, message: "Error cleaning test data" };
  }
};
