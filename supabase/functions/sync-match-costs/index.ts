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

    if (!isSubmitted) {
      console.log('Match not submitted, skipping cost sync');
      return new Response(
        JSON.stringify({ success: true, message: 'Wedstrijd niet ingediend, kosten niet gesynchroniseerd', skipped: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for forfait penalties (cost_setting_id 6 = Forfait verwittigd, 25 = Forfait tijdens de wedstrijd)
    const { data: forfaitCosts, error: forfaitErr } = await supabaseServiceRole
      .from('team_costs')
      .select('id')
      .eq('match_id', matchId)
      .in('cost_setting_id', [6, 25]);

    if (forfaitErr) {
      console.warn('⚠️ Error checking forfait:', forfaitErr);
    }

    if (forfaitCosts && forfaitCosts.length > 0) {
      console.log(`🚫 Forfait detected for match ${matchId}, removing existing match costs and skipping sync`);
      
      // Get active match_cost IDs to delete
      const { data: matchCostSettings } = await supabaseServiceRole
        .from('costs')
        .select('id')
        .eq('category', 'match_cost')
        .eq('is_active', true);

      if (matchCostSettings && matchCostSettings.length > 0) {
        const costIds = matchCostSettings.map((cs: any) => cs.id);
        await supabaseServiceRole
          .from('team_costs')
          .delete()
          .eq('match_id', matchId)
          .in('cost_setting_id', costIds);
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Forfait wedstrijd: geen wedstrijdkosten toegepast', forfait: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Load match_cost settings (active)
    const { data: matchCosts, error: costErr } = await supabaseServiceRole
      .from('costs')
      .select('id, name, amount')
      .eq('category', 'match_cost')
      .eq('is_active', true);

    if (costErr) throw new Error(`Failed to load cost settings: ${costErr.message}`);

    const costSettings = matchCosts || [];
    console.log('Loaded match cost settings:', costSettings);

    const findCostByType = (type: 'veld' | 'scheids' | 'administratie') => {
      const searchTerms = type === 'veld' 
        ? ['veld', 'field'] 
        : type === 'scheids'
        ? ['scheidsrechter', 'scheids', 'referee']
        : ['administratie', 'admin'];
      
      return costSettings.find(cs => {
        const name = (cs.name || '').toLowerCase();
        return searchTerms.some(term => name.includes(term));
      });
    };

    const fieldCostSetting = findCostByType('veld');
    const refereeCostSetting = findCostByType('scheids');
    const adminCostSetting = findCostByType('administratie');

    const transactionDate = matchDateISO ? matchDateISO.slice(0, 10) : new Date().toISOString().slice(0, 10);
    const processedCosts: Record<string, any> = {};

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
        .eq('is_auto_card_penalty', false);

      if (existErr) throw new Error(`Failed to check existing ${costType} costs: ${existErr.message}`);

      const existingCount = (existingRows || []).length;

      if (existingCount === 0) {
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

        if (insertErr) throw new Error(`Failed to insert ${costType} cost: ${insertErr.message}`);
        processedCosts[`${costType}_team_${teamId}`] = { inserted: true, amount: costSetting.amount };
      } else if (existingCount > 1) {
        const idsToDelete = (existingRows || []).slice(1).map(r => r.id);
        if (idsToDelete.length > 0) {
          const { error: delErr } = await supabaseServiceRole
            .from('team_costs')
            .delete()
            .in('id', idsToDelete);
          if (delErr) console.error(`Failed to clean up duplicate ${costType} costs:`, delErr);
        }
        processedCosts[`${costType}_team_${teamId}`] = { exists: true, cleaned: idsToDelete.length };
      } else {
        processedCosts[`${costType}_team_${teamId}`] = { exists: true };
      }
    };

    // Process field costs for both teams
    await ensureCostExists(homeTeamId, fieldCostSetting, 'field');
    await ensureCostExists(awayTeamId, fieldCostSetting, 'field');

    // Process referee costs for both teams
    await ensureCostExists(homeTeamId, refereeCostSetting, 'referee');
    await ensureCostExists(awayTeamId, refereeCostSetting, 'referee');

    // Process admin costs for both teams
    await ensureCostExists(homeTeamId, adminCostSetting, 'admin');
    await ensureCostExists(awayTeamId, adminCostSetting, 'admin');

    console.log('Match cost sync completed successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Wedstrijdkosten gesynchroniseerd', processedCosts, referee }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error syncing match costs:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, message: `Fout bij synchroniseren wedstrijdkosten: ${errorMessage}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
