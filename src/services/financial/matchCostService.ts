import { supabase } from "@/integrations/supabase/client";

interface ServiceResponse {
  success: boolean;
  message: string;
}

export const matchCostService = {
  // Sync all submitted matches to ensure they have costs (including cup and playoff)
  async syncAllMatchCosts(): Promise<ServiceResponse & { syncedCount?: number; updatedCount?: number; skippedCount?: number }> {
    console.log('🔵 [matchCostService] ========== START syncAllMatchCosts ==========');
    
    try {
      // Use Edge Function with service role to bypass RLS
      const { data, error } = await supabase.functions.invoke('sync-all-match-costs', {
        body: {}
      });

      if (error) {
        console.error('❌ [matchCostService] Edge function error:', error);
        throw error;
      }

      if (data && data.success) {
        console.log('✅ [matchCostService] Sync completed via Edge Function');
        console.log('🔵 [matchCostService] ========== END syncAllMatchCosts ==========');
        return {
          success: true,
          message: data.message || 'Synchronisatie voltooid',
          syncedCount: data.syncedCount || 0,
          updatedCount: data.updatedCount || 0,
          skippedCount: data.skippedCount || 0
        };
      } else {
        throw new Error(data?.message || 'Unknown error from Edge Function');
      }
    } catch (error) {
      console.error('❌ [matchCostService] FATAL ERROR:', error);
      console.log('🔵 [matchCostService] ========== END syncAllMatchCosts (ERROR) ==========');
      return { 
        success: false, 
        message: `Onverwachte fout bij synchroniseren: ${error instanceof Error ? error.message : 'Onbekende fout'}` 
      };
    }
  },


  // Apply per-match costs (e.g., field/referee) to both teams if not already applied
  async applyCostsForMatch(matchId: number): Promise<ServiceResponse> {
    console.log('🔵 [matchCostService] ========== START applyCostsForMatch ==========');
    console.log('🔵 [matchCostService] Match ID:', matchId);
    
    try {
      if (!matchId || isNaN(matchId)) {
        console.error('❌ [matchCostService] Invalid match ID:', matchId);
        return { success: false, message: "Ongeldige wedstrijd ID" };
      }
      console.log('✅ [matchCostService] Match ID validated');

      // Fetch match info
      console.log('🔵 [matchCostService] Fetching match info from database...');
      const { data: match, error: matchErr } = await supabase
        .from('matches')
        .select('match_id, home_team_id, away_team_id, match_date, home_score, away_score, is_submitted')
        .eq('match_id', matchId)
        .single();

      if (matchErr || !match) {
        console.error('❌ [matchCostService] Failed to fetch match:', matchErr);
        return { success: false, message: `Kon wedstrijd niet ophalen: ${matchErr?.message || 'onbekende fout'}` };
      }
      console.log('✅ [matchCostService] Match fetched:', {
        match_id: match.match_id,
        home_team_id: match.home_team_id,
        away_team_id: match.away_team_id,
        is_submitted: match.is_submitted,
        home_score: match.home_score,
        away_score: match.away_score
      });

      // Only apply costs if match has scores and is submitted
      if (!match.is_submitted || match.home_score === null || match.away_score === null) {
        console.log('🔵 [matchCostService] Skipping costs - match not completed or no scores');
        return { success: true, message: 'Kosten niet toegepast - wedstrijd heeft nog geen scores' };
      }
      console.log('✅ [matchCostService] Match is completed with scores, proceeding...');

      const teamIds: number[] = [match.home_team_id, match.away_team_id].filter((id: any) => typeof id === 'number');
      if (teamIds.length === 0) {
        console.error('❌ [matchCostService] No valid team IDs found');
        return { success: false, message: 'Geen teams gevonden voor deze wedstrijd' };
      }
      console.log('✅ [matchCostService] Team IDs:', teamIds);

      // If any team_costs already exist for this match, skip to keep idempotent
      console.log('🔵 [matchCostService] Checking for existing costs...');
      const { data: existingCosts, error: existingErr } = await supabase
        .from('team_costs')
        .select('id')
        .eq('match_id', matchId)
        .limit(1);

      if (existingErr) {
        // Non-fatal: proceed but log
        console.warn('⚠️ [matchCostService] Could not check existing team_costs:', existingErr);
      } else if (existingCosts && existingCosts.length > 0) {
        console.log('🔵 [matchCostService] Costs already exist for this match, skipping');
        return { success: true, message: 'Kosten reeds toegepast voor deze wedstrijd' };
      }
      console.log('✅ [matchCostService] No existing costs found, proceeding to add costs');

      // Fetch active match_cost settings (e.g., field cost, referee cost)
      console.log('🔵 [matchCostService] Fetching active cost settings...');
      const { data: costSettings, error: costErr } = await supabase
        .from('costs')
        .select('id, amount, name, category')
        .eq('category', 'match_cost')
        .eq('is_active', true);

      if (costErr) {
        console.error('❌ [matchCostService] Failed to fetch cost settings:', costErr);
        return { success: false, message: `Kon kostentarieven niet ophalen: ${costErr.message}` };
      }

      if (!costSettings || costSettings.length === 0) {
        console.log('🔵 [matchCostService] No active match costs found');
        return { success: true, message: 'Geen actieve wedstrijdkosten gevonden' };
      }
      console.log('✅ [matchCostService] Cost settings fetched:', costSettings.map(cs => ({ id: cs.id, name: cs.name, amount: cs.amount })));

      const transactionDate = match.match_date?.slice(0, 10) || new Date().toISOString().slice(0, 10);
      console.log('🔵 [matchCostService] Transaction date:', transactionDate);

      // Build rows to insert for each team and each cost setting
      console.log('🔵 [matchCostService] Building cost rows to insert...');
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
      console.log('✅ [matchCostService] Built', rows.length, 'cost rows:', rows);

      if (rows.length === 0) {
        console.log('🔵 [matchCostService] No rows to insert');
        return { success: true, message: 'Geen kosten om toe te passen' };
      }

      console.log('🔵 [matchCostService] INSERTING COSTS INTO team_costs table...');
      console.log('🔵 [matchCostService] Rows to insert:', JSON.stringify(rows, null, 2));
      const { error: insertErr } = await supabase
        .from('team_costs')
        .insert(rows);

      if (insertErr) {
        console.error('❌ [matchCostService] INSERT FAILED:', insertErr);
        console.error('❌ [matchCostService] Error details:', {
          code: insertErr.code,
          message: insertErr.message,
          details: insertErr.details,
          hint: insertErr.hint
        });
        return { success: false, message: `Fout bij toepassen kosten: ${insertErr.message}` };
      }

      console.log('✅ [matchCostService] Costs inserted successfully');
      console.log('🔵 [matchCostService] ========== END applyCostsForMatch ==========');
      return { success: true, message: 'Kosten automatisch toegepast' };
    } catch (error) {
      console.error('❌ [matchCostService] FATAL ERROR:', error);
      console.error('❌ [matchCostService] Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Onbekende fout',
        stack: error instanceof Error ? error.stack : undefined
      });
      console.log('🔵 [matchCostService] ========== END applyCostsForMatch (ERROR) ==========');
      return { success: false, message: `Onverwachte fout bij toepassen kosten: ${error instanceof Error ? error.message : 'Onbekende fout'}` };
    }
  },

  // Diagnostic function to check missing costs for a specific team
  async diagnoseTeamMissingCosts(teamName: string, targetDates?: string[]): Promise<{
    success: boolean;
    message: string;
    teamId?: number;
    matchesWithScores?: any[];
    matchesWithCosts?: any[];
    missingMatches?: any[];
  }> {
    console.log('🔍 [matchCostService] ========== START diagnoseTeamMissingCosts ==========');
    console.log('🔍 [matchCostService] Team name:', teamName);
    console.log('🔍 [matchCostService] Target dates:', targetDates);
    
    try {
      // Find team by name
      const { data: team, error: teamErr } = await supabase
        .from('teams')
        .select('team_id, team_name')
        .ilike('team_name', `%${teamName}%`)
        .single();

      if (teamErr || !team) {
        console.error('❌ [matchCostService] Team not found:', teamErr);
        return { success: false, message: `Team "${teamName}" niet gevonden` };
      }

      console.log('✅ [matchCostService] Team found:', team);

      // Find all matches for this team with scores
      let matchesQuery = supabase
        .from('matches')
        .select('match_id, match_date, home_team_id, away_team_id, home_score, away_score, is_submitted, is_cup_match, is_playoff_match, unique_number')
        .or(`home_team_id.eq.${team.team_id},away_team_id.eq.${team.team_id}`)
        .not('home_score', 'is', null)
        .not('away_score', 'is', null);

      // Filter by target dates if provided
      if (targetDates && targetDates.length > 0) {
        // Parse dates in DD-MM-YYYY format or YYYY-MM-DD format
        const parsedDates = targetDates.map(dateStr => {
          // Try DD-MM-YYYY format first
          const parts = dateStr.split('-');
          if (parts.length === 3) {
            if (parts[0].length === 2) {
              // DD-MM-YYYY format
              return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            } else {
              // YYYY-MM-DD format
              return new Date(dateStr);
            }
          }
          return new Date(dateStr);
        });

        // Build date range filters
        const dateConditions: string[] = [];
        for (const date of parsedDates) {
          const startOfDay = new Date(date);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(date);
          endOfDay.setHours(23, 59, 59, 999);
          dateConditions.push(`match_date.gte.${startOfDay.toISOString()},match_date.lte.${endOfDay.toISOString()}`);
        }
        
        if (dateConditions.length > 0) {
          matchesQuery = matchesQuery.or(dateConditions.join(','));
        }
      }

      const { data: matchesWithScores, error: matchesErr } = await matchesQuery.order('match_date', { ascending: true });

      if (matchesErr) {
        console.error('❌ [matchCostService] Failed to fetch matches:', matchesErr);
        return { success: false, message: `Kon wedstrijden niet ophalen: ${matchesErr.message}` };
      }

      console.log(`✅ [matchCostService] Found ${matchesWithScores?.length || 0} matches with scores for ${team.team_name}`);

      // Find all costs for this team
      const { data: teamCosts, error: costsErr } = await supabase
        .from('team_costs')
        .select('match_id, cost_setting_id, amount, transaction_date, costs(category)')
        .eq('team_id', team.team_id)
        .not('match_id', 'is', null);

      if (costsErr) {
        console.error('❌ [matchCostService] Failed to fetch costs:', costsErr);
        return { success: false, message: `Kon kosten niet ophalen: ${costsErr.message}` };
      }

      // Get unique match IDs that have costs
      const matchIdsWithCosts = new Set(
        (teamCosts || [])
          .filter(tc => tc.costs?.category === 'match_cost')
          .map(tc => tc.match_id)
      );

      console.log(`✅ [matchCostService] Found ${matchIdsWithCosts.size} unique matches with costs`);

      // Find matches that have scores but no costs
      const missingMatches = (matchesWithScores || []).filter(match => !matchIdsWithCosts.has(match.match_id));

      console.log(`⚠️ [matchCostService] Found ${missingMatches.length} matches with scores but no costs`);

      if (missingMatches.length > 0) {
        console.log('📋 [matchCostService] Missing matches:');
        missingMatches.forEach(match => {
          const matchDate = match.match_date ? new Date(match.match_date).toLocaleDateString('nl-NL') : 'Unknown';
          const matchType = match.is_cup_match ? 'beker' : match.is_playoff_match ? 'play-off' : 'competitie';
          console.log(`  - Match ${match.match_id} (${matchType}): ${matchDate}, unique: ${match.unique_number}, submitted: ${match.is_submitted}`);
        });
      }

      return {
        success: true,
        message: `Diagnose voltooid: ${missingMatches.length} wedstrijden zonder kosten gevonden`,
        teamId: team.team_id,
        matchesWithScores: matchesWithScores || [],
        matchesWithCosts: Array.from(matchIdsWithCosts),
        missingMatches: missingMatches
      };
    } catch (error) {
      console.error('❌ [matchCostService] FATAL ERROR in diagnose:', error);
      return {
        success: false,
        message: `Onverwachte fout: ${error instanceof Error ? error.message : 'Onbekende fout'}`
      };
    }
  }
};


