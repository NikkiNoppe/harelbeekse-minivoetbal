import { supabase } from "../MINIVOETBAL.SDK/client";

// Simple test for player update permissions
export const testPlayerUpdate = async () => {
  try {
    const { data: players, error: readError } = await supabase
      .from('players')
      .select('player_id, first_name, last_name')
      .limit(1);

    if (readError || !players || players.length === 0) {
      return { success: false, error: 'Cannot read players' };
    }

    const testPlayer = players[0];
    const { error: updateError } = await supabase
      .from('players')
      .update({ last_name: testPlayer.last_name })
      .eq('player_id', testPlayer.player_id);

    return { 
      success: !updateError, 
      error: updateError?.message || null 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}; 