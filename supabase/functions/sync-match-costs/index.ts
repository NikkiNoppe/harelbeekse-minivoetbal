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

interface SyncMatchCostsRequest {
  matchId: number;
  matchDateISO?: string | null;
  homeTeamId: number;
  awayTeamId: number;
  isSubmitted: boolean;
  referee?: string | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { matchId, matchDateISO, homeTeamId, awayTeamId, isSubmitted, referee }: SyncMatchCostsRequest = await req.json();

    console.log('Syncing match costs for match:', { matchId, homeTeamId, awayTeamId, isSubmitted, referee });

    // Only process if match is submitted
    if (!isSubmitted) {
      console.log('Match not submitted, skipping cost sync');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Wedstrijd niet ingediend, kosten niet gesynchroniseerd',
          skipped: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Load match_cost settings (active) for field and referee costs
    const { data: matchCosts, error: costErr } = await supabaseServiceRole
      .from('costs')
      .select('id, name, amount, description')
      .eq('category', 'match_cost')
      .eq('is_active', true);

    if (costErr) {
      throw new Error(`Failed to load cost settings: ${costErr.message}`);
    }

    const costSettings = matchCosts || [];
    console.log('Loaded match cost settings:', costSettings);

    // Find field and referee cost settings
    const findCostByType = (type: 'veld' | 'scheids') => {
      const searchTerms = type === 'veld' 
        ? ['veld', 'field'] 
        : ['scheidsrechter', 'scheids', 'referee'];
      
      return costSettings.find(cs => {
        const name = (cs.name || '').toLowerCase();
        const desc = (cs.description || '').toLowerCase();
        return searchTerms.some(term => name.includes(term) || desc.includes(term));
      });
    };

    const fieldCostSetting = findCostByType('veld');
    const refereeCostSetting = findCostByType('scheids');

    console.log('Field cost setting:', fieldCostSetting);
    console.log('Referee cost setting:', refereeCostSetting);

    const transactionDate = matchDateISO ? matchDateISO.slice(0, 10) : new Date().toISOString().slice(0, 10);
    const processedCosts: Record<string, any> = {};

    // Helper: ensure exactly one cost record exists for a team/cost_setting combination
    const ensureCostExists = async (teamId: number, costSetting: any, costType: string) => {
      if (!costSetting) {
        console.log(`No ${costType} cost setting found, skipping`);
        return;
      }

      const { data: existingRows, error: existErr } = await supabaseServiceRole
        .from('team_costs')
        .select('id')
        .eq('team_id', teamId)
        .eq('match_id', matchId)
        .eq('cost_setting_id', costSetting.id)
        .eq('is_auto_card_penalty', false); // Don't touch card penalties

      if (existErr) {
        throw new Error(`Failed to check existing ${costType} costs: ${existErr.message}`);
      }

      const existingCount = (existingRows || []).length;
      console.log(`Existing ${costType} costs for team ${teamId}: ${existingCount}`);

      if (existingCount === 0) {
        // Insert one record
        const { error: insertErr } = await supabaseServiceRole
          .from('team_costs')
          .insert({
            team_id: teamId,
            cost_setting_id: costSetting.id,
            amount: costSetting.amount ?? 0,
            transaction_date: transactionDate,
            match_id: matchId,
            is_auto_card_penalty: false
          });

        if (insertErr) {
          throw new Error(`Failed to insert ${costType} cost: ${insertErr.message}`);
        }

        console.log(`Inserted ${costType} cost for team ${teamId}`);
        processedCosts[`${costType}_team_${teamId}`] = { inserted: true, amount: costSetting.amount };
      } else if (existingCount > 1) {
        // Clean up duplicates - keep the first, delete the rest
        const idsToDelete = (existingRows || []).slice(1).map(r => r.id);
        if (idsToDelete.length > 0) {
          const { error: delErr } = await supabaseServiceRole
            .from('team_costs')
            .delete()
            .in('id', idsToDelete);

          if (delErr) {
            console.error(`Failed to clean up duplicate ${costType} costs:`, delErr);
          } else {
            console.log(`Cleaned up ${idsToDelete.length} duplicate ${costType} costs for team ${teamId}`);
          }
        }
        processedCosts[`${costType}_team_${teamId}`] = { exists: true, cleaned: idsToDelete.length };
      } else {
        console.log(`${costType} cost already exists for team ${teamId}`);
        processedCosts[`${costType}_team_${teamId}`] = { exists: true };
      }
    };

    // Process field costs for both teams
    await ensureCostExists(homeTeamId, fieldCostSetting, 'field');
    await ensureCostExists(awayTeamId, fieldCostSetting, 'field');

    // Process referee costs for both teams
    await ensureCostExists(homeTeamId, refereeCostSetting, 'referee');
    await ensureCostExists(awayTeamId, refereeCostSetting, 'referee');

    console.log('Match cost sync completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Wedstrijdkosten gesynchroniseerd',
        processedCosts,
        referee
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error syncing match costs:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: `Fout bij synchroniseren wedstrijdkosten: ${errorMessage}` 
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
