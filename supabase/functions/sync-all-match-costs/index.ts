// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

declare const Deno: {
  env: { get(key: string): string | undefined };
  serve: (handler: (req: Request) => Promise<Response>) => void;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseServiceRole = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🟢 [sync-all-match-costs] Starting batch sync...');

    // Fetch all matches with scores
    const { data: allMatches, error: matchesErr } = await supabaseServiceRole
      .from('matches')
      .select('match_id, home_team_id, away_team_id, match_date, home_score, away_score, is_submitted, is_cup_match, is_playoff_match, assigned_referee_id')
      .not('home_score', 'is', null)
      .not('away_score', 'is', null)
      .not('home_team_id', 'is', null)
      .not('away_team_id', 'is', null);

    if (matchesErr) throw new Error(`Failed to fetch matches: ${matchesErr.message}`);

    if (!allMatches || allMatches.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'Geen wedstrijden met scores gevonden', syncedCount: 0, updatedCount: 0, skippedCount: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Found ${allMatches.length} matches with scores`);

    // Fetch active cost settings
    const { data: costSettings, error: costErr } = await supabaseServiceRole
      .from('costs')
      .select('id, amount, name, category')
      .eq('category', 'match_cost')
      .eq('is_active', true);

    if (costErr) throw new Error(`Failed to fetch cost settings: ${costErr.message}`);

    if (!costSettings || costSettings.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'Geen actieve wedstrijdkosten gevonden', syncedCount: 0, updatedCount: 0, skippedCount: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fieldCost = costSettings.find((cs: any) => cs.name?.toLowerCase().includes('veld'));
    const refereeCost = costSettings.find((cs: any) => cs.name?.toLowerCase().includes('scheids'));
    const adminCost = costSettings.find((cs: any) => cs.name?.toLowerCase().includes('administratie'));

    if (!fieldCost) throw new Error('Veldkosten niet gevonden');

    let syncedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const match of allMatches) {
      const teamIds = [match.home_team_id, match.away_team_id].filter((id: any) => typeof id === 'number' && id > 0);
      if (teamIds.length !== 2) { skippedCount++; continue; }

      const transactionDate = match.match_date?.slice(0, 10) || new Date().toISOString().slice(0, 10);
      const hasReferee = match.assigned_referee_id != null;

      // Check existing costs for this match
      const costSettingIds = [fieldCost.id, ...(refereeCost ? [refereeCost.id] : []), ...(adminCost ? [adminCost.id] : [])];
      const { data: existingCosts, error: existingCostsErr } = await supabaseServiceRole
        .from('team_costs')
        .select('id, team_id, cost_setting_id, amount')
        .eq('match_id', match.match_id)
        .in('cost_setting_id', costSettingIds);

      if (existingCostsErr) { console.warn(`⚠️ Error checking costs for match ${match.match_id}:`, existingCostsErr); skippedCount++; continue; }

      const existingCostsMap = new Map();
      (existingCosts || []).forEach((ec: any) => existingCostsMap.set(`${ec.team_id}-${ec.cost_setting_id}`, ec));

      const costsToInsert: any[] = [];
      const costsToUpdate: any[] = [];

      for (const teamId of teamIds) {
        // Field cost - always applied
        const fieldKey = `${teamId}-${fieldCost.id}`;
        const existingField = existingCostsMap.get(fieldKey);
        if (!existingField) {
          costsToInsert.push({ team_id: teamId, cost_setting_id: fieldCost.id, amount: fieldCost.amount ?? 0, transaction_date: transactionDate, match_id: match.match_id });
        } else if (existingField.amount !== fieldCost.amount) {
          costsToUpdate.push({ id: existingField.id, amount: fieldCost.amount ?? 0 });
        }

        // Referee cost - only when referee is assigned
        if (refereeCost && hasReferee) {
          const refereeKey = `${teamId}-${refereeCost.id}`;
          const existingReferee = existingCostsMap.get(refereeKey);
          if (!existingReferee) {
            costsToInsert.push({ team_id: teamId, cost_setting_id: refereeCost.id, amount: refereeCost.amount ?? 0, transaction_date: transactionDate, match_id: match.match_id });
          } else if (existingReferee.amount !== refereeCost.amount) {
            costsToUpdate.push({ id: existingReferee.id, amount: refereeCost.amount ?? 0 });
          }
        }
      }

      // Insert new costs
      if (costsToInsert.length > 0) {
        const { error: insertErr } = await supabaseServiceRole.from('team_costs').insert(costsToInsert);
        if (!insertErr) { syncedCount += costsToInsert.length; }
        else { console.error(`❌ Failed to insert costs for match ${match.match_id}:`, insertErr); }
      }

      // Update existing costs with new prices
      for (const cost of costsToUpdate) {
        const { error: updateErr } = await supabaseServiceRole.from('team_costs').update({ amount: cost.amount }).eq('id', cost.id);
        if (!updateErr) { updatedCount++; }
        else { console.error(`❌ Failed to update cost ${cost.id}:`, updateErr); }
      }

      if (costsToInsert.length === 0 && costsToUpdate.length === 0) { skippedCount++; }
    }

    console.log(`✅ Sync complete: ${syncedCount} inserted, ${updatedCount} updated, ${skippedCount} skipped`);

    return new Response(
      JSON.stringify({ success: true, message: `Synchronisatie voltooid: ${syncedCount} kosten toegevoegd, ${updatedCount} bijgewerkt, ${skippedCount} overgeslagen`, syncedCount, updatedCount, skippedCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ FATAL ERROR:', error);
    return new Response(
      JSON.stringify({ success: false, message: `Onverwachte fout bij synchroniseren: ${error instanceof Error ? error.message : 'Unknown error'}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
