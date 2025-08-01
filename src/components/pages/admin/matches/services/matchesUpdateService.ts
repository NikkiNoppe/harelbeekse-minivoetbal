
import { supabase } from "@/integrations/supabase/client";

export interface MatchUpdateData {
  match_id: number;
  home_score?: number;
  away_score?: number;
  location?: string;
  referee?: string;
  referee_notes?: string;
  field_cost?: number;
  referee_cost?: number;
  home_players?: any[];
  away_players?: any[];
  is_submitted?: boolean;
  speeldag?: string;
}

export const updateMatchData = async (data: MatchUpdateData): Promise<{ success: boolean; message: string }> => {
  try {
    const { error } = await supabase
      .from('matches')
      .update({
        home_score: data.home_score,
        away_score: data.away_score,
        location: data.location,
        referee: data.referee,
        referee_notes: data.referee_notes,
        field_cost: data.field_cost,
        referee_cost: data.referee_cost,
        home_players: data.home_players,
        away_players: data.away_players,
        is_submitted: data.is_submitted,
        speeldag: data.speeldag,
        updated_at: new Date().toISOString()
      })
      .eq('match_id', data.match_id);

    if (error) {
      console.error('Error updating match:', error);
      return { success: false, message: `Fout bij opslaan: ${error.message}` };
    }

    return { success: true, message: 'Wedstrijdgegevens succesvol opgeslagen' };
  } catch (error) {
    console.error('Error in updateMatchData:', error);
    return { success: false, message: 'Er is een onverwachte fout opgetreden' };
  }
};
