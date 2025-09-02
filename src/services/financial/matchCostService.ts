import { supabase } from "@/integrations/supabase/client";

interface ServiceResponse {
  success: boolean;
  message: string;
}

export const matchCostService = {
  // Apply per-match costs (e.g., field/referee) to both teams if not already applied
  async applyCostsForMatch(matchId: number): Promise<ServiceResponse> {
    try {
      if (!matchId || isNaN(matchId)) {
        return { success: false, message: "Ongeldige wedstrijd ID" };
      }

      // Fetch match info
      const { data: match, error: matchErr } = await supabase
        .from('matches')
        .select('match_id, home_team_id, away_team_id, match_date')
        .eq('match_id', matchId)
        .single();

      if (matchErr || !match) {
        return { success: false, message: `Kon wedstrijd niet ophalen: ${matchErr?.message || 'onbekende fout'}` };
      }

      const teamIds: number[] = [match.home_team_id, match.away_team_id].filter((id: any) => typeof id === 'number');
      if (teamIds.length === 0) {
        return { success: false, message: 'Geen teams gevonden voor deze wedstrijd' };
      }

      // If any team_costs already exist for this match, skip to keep idempotent
      const { data: existingCosts, error: existingErr } = await supabase
        .from('team_costs')
        .select('id')
        .eq('match_id', matchId)
        .limit(1);

      if (existingErr) {
        // Non-fatal: proceed but log
        console.warn('Kon bestaande team_costs niet controleren:', existingErr);
      } else if (existingCosts && existingCosts.length > 0) {
        return { success: true, message: 'Kosten reeds toegepast voor deze wedstrijd' };
      }

      // Fetch active match_cost settings (e.g., field cost, referee cost)
      const { data: costSettings, error: costErr } = await supabase
        .from('costs')
        .select('id, amount, name, category')
        .eq('category', 'match_cost')
        .eq('is_active', true);

      if (costErr) {
        return { success: false, message: `Kon kostentarieven niet ophalen: ${costErr.message}` };
      }

      if (!costSettings || costSettings.length === 0) {
        return { success: true, message: 'Geen actieve wedstrijdkosten gevonden' };
      }

      const transactionDate = match.match_date?.slice(0, 10) || new Date().toISOString().slice(0, 10);

      // Build rows to insert for each team and each cost setting
      const rows: any[] = [];
      for (const teamId of teamIds) {
        for (const cs of costSettings) {
          rows.push({
            team_id: teamId,
            cost_setting_id: cs.id,
            amount: cs.amount ?? 0,
            transaction_date: transactionDate,
            match_id: matchId,
          });
        }
      }

      if (rows.length === 0) {
        return { success: true, message: 'Geen kosten om toe te passen' };
      }

      const { error: insertErr } = await supabase
        .from('team_costs')
        .insert(rows);

      if (insertErr) {
        return { success: false, message: `Fout bij toepassen kosten: ${insertErr.message}` };
      }

      return { success: true, message: 'Kosten automatisch toegepast' };
    } catch (error) {
      return { success: false, message: `Onverwachte fout bij toepassen kosten: ${error instanceof Error ? error.message : 'Onbekende fout'}` };
    }
  }
};


