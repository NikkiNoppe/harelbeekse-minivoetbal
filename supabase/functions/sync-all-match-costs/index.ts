// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

// Declare Deno namespace for TypeScript
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve: (handler: (req: Request) => Promise<Response>) => void;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create Supabase client with service role key to bypass RLS
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

    // Fetch all matches with scores (competitie, beker, play-off)
    const { data: allMatches, error: matchesErr } = await supabaseServiceRole
      .from('matches')
      .select('match_id, home_team_id, away_team_id, match_date, home_score, away_score, is_submitted, is_cup_match, is_playoff_match')
      .not('home_score', 'is', null)
      .not('away_score', 'is', null)
      .not('home_team_id', 'is', null)
      .not('away_team_id', 'is', null);

    if (matchesErr) {
      throw new Error(`Failed to fetch matches: ${matchesErr.message}`);
    }

    if (!allMatches || allMatches.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Geen wedstrijden met scores gevonden',
          syncedCount: 0,
          updatedCount: 0,
          skippedCount: 0
        }),
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

    if (costErr) {
      throw new Error(`Failed to fetch cost settings: ${costErr.message}`);
    }

    if (!costSettings || costSettings.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Geen actieve wedstrijdkosten gevonden',
          syncedCount: 0,
          updatedCount: 0,
          skippedCount: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find field and referee cost settings
    const fieldCost = costSettings.find(cs => 
      cs.name?.toLowerCase().includes('veld') || 
      cs.description?.toLowerCase().includes('veld')
    );
    const refereeCost = costSettings.find(cs => 
      cs.name?.toLowerCase().includes('scheids') || 
      cs.description?.toLowerCase().includes('scheids')
    );

    if (!fieldCost || !refereeCost) {
      throw new Error('Veldkosten of Scheidsrechterkosten niet gevonden');
    }

    let syncedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    // Process each match
    for (const match of allMatches) {
      const teamIds = [match.home_team_id, match.away_team_id].filter((id: any) => typeof id === 'number' && id > 0);
      if (teamIds.length !== 2) {
        skippedCount++;
        continue;
      }

      const transactionDate = match.match_date?.slice(0, 10) || new Date().toISOString().slice(0, 10);

      // Check existing costs for this match
      const { data: existingCosts, error: existingCostsErr } = await supabaseServiceRole
        .from('team_costs')
        .select('id, team_id, cost_setting_id, amount')
        .eq('match_id', match.match_id)
        .in('cost_setting_id', [fieldCost.id, refereeCost.id]);

      if (existingCostsErr) {
        console.warn(`⚠️ Error checking existing costs for match ${match.match_id}:`, existingCostsErr);
        skippedCount++;
        continue;
      }
      
      const existingCostsMap = new Map();
      (existingCosts || []).forEach((ec: any) => {
        const key = `${ec.team_id}-${ec.cost_setting_id}`;
        existingCostsMap.set(key, ec);
      });

      // Prepare costs to insert/update
      const costsToInsert: any[] = [];
      const costsToUpdate: any[] = [];

      for (const teamId of teamIds) {
        // Field cost
        const fieldKey = `${teamId}-${fieldCost.id}`;
        const existingField = existingCostsMap.get(fieldKey);
        if (!existingField) {
          costsToInsert.push({
            team_id: teamId,
            cost_setting_id: fieldCost.id,
            amount: fieldCost.amount ?? 0,
            transaction_date: transactionDate,
            match_id: match.match_id,
          });
        } else if (existingField.amount !== fieldCost.amount) {
          costsToUpdate.push({
            id: existingField.id,
            amount: fieldCost.amount ?? 0,
          });
        }

        // Referee cost
        const refereeKey = `${teamId}-${refereeCost.id}`;
        const existingReferee = existingCostsMap.get(refereeKey);
        if (!existingReferee) {
          costsToInsert.push({
            team_id: teamId,
            cost_setting_id: refereeCost.id,
            amount: refereeCost.amount ?? 0,
            transaction_date: transactionDate,
            match_id: match.match_id,
          });
        } else if (existingReferee.amount !== refereeCost.amount) {
          costsToUpdate.push({
            id: existingReferee.id,
            amount: refereeCost.amount ?? 0,
          });
        }
      }

      // Insert new costs in batch
      if (costsToInsert.length > 0) {
        const { error: insertErr } = await supabaseServiceRole
          .from('team_costs')
          .insert(costsToInsert);
        
        if (!insertErr) {
          syncedCount += costsToInsert.length;
        } else {
          console.error(`❌ Failed to insert costs for match ${match.match_id}:`, insertErr);
        }
      }

      // Update existing costs with new prices
      if (costsToUpdate.length > 0) {
        for (const cost of costsToUpdate) {
          const { error: updateErr } = await supabaseServiceRole
            .from('team_costs')
            .update({ amount: cost.amount })
            .eq('id', cost.id);
          
          if (!updateErr) {
            updatedCount++;
          } else {
            console.error(`❌ Failed to update cost ${cost.id}:`, updateErr);
          }
        }
      }

      // Verify that we actually have all required costs for both teams
      const missingCosts: any[] = [];
      
      for (const teamId of teamIds) {
        const fieldKey = `${teamId}-${fieldCost.id}`;
        const refereeKey = `${teamId}-${refereeCost.id}`;
        
        if (!existingCostsMap.has(fieldKey)) {
          missingCosts.push({
            team_id: teamId,
            cost_setting_id: fieldCost.id,
            amount: fieldCost.amount ?? 0,
            transaction_date: transactionDate,
            match_id: match.match_id,
          });
        }
        
        if (!existingCostsMap.has(refereeKey)) {
          missingCosts.push({
            team_id: teamId,
            cost_setting_id: refereeCost.id,
            amount: refereeCost.amount ?? 0,
            transaction_date: transactionDate,
            match_id: match.match_id,
          });
        }
      }
      
      // If we found missing costs that weren't caught earlier, add them
      if (missingCosts.length > 0) {
        const { error: insertErr } = await supabaseServiceRole
          .from('team_costs')
          .insert(missingCosts);
        
        if (!insertErr) {
          syncedCount += missingCosts.length;
        } else {
          console.error(`❌ Failed to insert missing costs for match ${match.match_id}:`, insertErr);
        }
      } else if (costsToInsert.length === 0 && costsToUpdate.length === 0) {
        // All costs exist and are up-to-date
        skippedCount++;
      }
    }

    console.log(`✅ Sync complete: ${syncedCount} inserted, ${updatedCount} updated, ${skippedCount} skipped`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Synchronisatie voltooid: ${syncedCount} kosten toegevoegd, ${updatedCount} bijgewerkt, ${skippedCount} overgeslagen`,
        syncedCount,
        updatedCount,
        skippedCount
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('❌ FATAL ERROR:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: `Onverwachte fout bij synchroniseren: ${errorMessage}` 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});

