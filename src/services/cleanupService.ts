
import { supabase } from "@/integrations/supabase/client";

/**
 * Clean up test and mock data from the database
 */
export const cleanupMockData = async () => {
  try {
    // Clear match forms data
    await supabase.from('match_forms').delete().gt('form_id', 0);
    
    // Clear match results that are test data
    // This preserves the structure but removes results
    const { data: matchesToUpdate } = await supabase
      .from('matches')
      .select('match_id')
      .not('result', 'is', null);
      
    if (matchesToUpdate && matchesToUpdate.length > 0) {
      await supabase
        .from('matches')
        .update({ result: null })
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
