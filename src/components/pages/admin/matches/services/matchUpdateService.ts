import { supabase } from "@/integrations/supabase/client";
import { getRpcSessionArgs } from "@/lib/authSession";

export interface MatchUpdateData {
  match_id: number;
  home_score?: number;
  away_score?: number;
  location?: string;
  referee?: string;
  referee_notes?: string;
  field_cost?: number;
  referee_cost?: number;
  home_players?: unknown[];
  away_players?: unknown[];
  is_submitted?: boolean;
  speeldag?: string;
  assigned_referee_id?: number | null;
  poll_group_id?: string | null;
  poll_month?: string | null;
}

export const updateMatchData = async (
  data: MatchUpdateData,
): Promise<{ success: boolean; message: string }> => {
  try {
    const { match_id, ...fields } = data;
    const updatePayload = {
      ...fields,
      updated_at: new Date().toISOString(),
    };

    const { data: rpcData, error } = await supabase.rpc("update_match_for_session", {
      ...getRpcSessionArgs(),
      p_match_id: match_id,
      p_update_data: updatePayload as any,
    });

    if (error) {
      return { success: false, message: `Fout bij opslaan: ${error.message}` };
    }

    const result = Array.isArray(rpcData) ? rpcData[0] : rpcData;
    if (!result?.success) {
      return { success: false, message: result?.message || "Kon wedstrijd niet bijwerken" };
    }

    return { success: true, message: "Wedstrijdgegevens succesvol opgeslagen" };
  } catch (error) {
    console.error("[matchUpdateService] Unexpected error:", error);
    return { success: false, message: "Er is een onverwachte fout opgetreden" };
  }
};
