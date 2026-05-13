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

function costNameImpliesMatchCostSuppression(name: string | null | undefined): boolean {
  const n = (name || '').toLowerCase().trim();
  if (!n) return false;
  return (
    n.includes('forfait') ||
    (n.includes('walk') && n.includes('over')) ||
    n.includes('vrijstelling') ||
    n.includes('niet gespeeld') ||
    n.includes('niet afgewerkt')
  );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🟢 [sync-all-match-costs] Starting batch sync...');

    // Fetch all matches with scores
    const { data: allMatches, error: matchesErr } = await supabaseServiceRole
      .from('matches')
      .select('match_id, home_team_id, away_team_id, match_date, home_score, away_score, is_submitted, is_cup_match, is_playoff_match, assigned_referee_id, referee, skip_auto_match_costs')
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
      .eq('category', 'match_cost');

    if (costErr) throw new Error(`Failed to fetch cost settings: ${costErr.message}`);

    if (!costSettings || costSettings.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'Geen actieve wedstrijdkosten gevonden', syncedCount: 0, updatedCount: 0, skippedCount: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fieldCost = costSettings.find((cs: any) => {
      const n = (cs.name || '').toLowerCase();
      return n.includes('veld') || n.includes('field');
    });
    const refereeCost = costSettings.find((cs: any) => cs.name?.toLowerCase().includes('scheids'));
    const adminCost = costSettings.find((cs: any) => {
      const n = (cs.name || '').toLowerCase();
      return n.includes('administratie') || n.includes('admin');
    });

    if (!fieldCost) throw new Error('Veldkosten niet gevonden');

    const allMatchCostSettingIds = costSettings.map((c: { id: number }) => c.id);

    const matchIds = allMatches.map((m: { match_id: number }) => m.match_id);
    const { data: forfaitPenaltyRows, error: forfaitErr } = await supabaseServiceRole
      .from('team_costs')
      .select('match_id, costs!inner(name, category)')
      .in('match_id', matchIds)
      .eq('costs.category', 'penalty');

    if (forfaitErr) console.warn('⚠️ Forfait check query:', forfaitErr);

    const forfaitMatchIds = new Set<number>();
    for (const row of forfaitPenaltyRows || []) {
      const r = row as { match_id: number | null; costs?: { name?: string | null } };
      const c = r.costs;
      if (costNameImpliesMatchCostSuppression(c?.name) && r.match_id != null) forfaitMatchIds.add(r.match_id);
    }

    let forfaitCount = 0;
    let syncedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    const normalizedAmount = (v: unknown) => {
      if (v == null) return null as number | null;
      const n = Number(v);
      return Number.isNaN(n) ? null : n;
    };

    for (const match of allMatches) {
      const teamIds = [match.home_team_id, match.away_team_id].filter((id: any) => typeof id === 'number' && id > 0);
      if (teamIds.length !== 2) { skippedCount++; continue; }

      if (forfaitMatchIds.has(match.match_id)) {
        const { error: delErr } = await supabaseServiceRole
          .from('team_costs')
          .delete()
          .eq('match_id', match.match_id)
          .in('cost_setting_id', allMatchCostSettingIds);
        if (!delErr) forfaitCount++;
        else console.error(`❌ Forfait cleanup failed match ${match.match_id}:`, delErr);
        continue;
      }

      if ((match as { skip_auto_match_costs?: boolean | null }).skip_auto_match_costs === true) {
        skippedCount++;
        continue;
      }

      const transactionDate = match.match_date?.slice(0, 10) || new Date().toISOString().slice(0, 10);
      const refereeText = (match as { referee?: string | null }).referee;
      const hasReferee = match.assigned_referee_id != null || (typeof refereeText === 'string' && refereeText.trim() !== '');

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
        const fieldTarget = Number(fieldCost.amount ?? 0);
        if (!existingField) {
          costsToInsert.push({ team_id: teamId, cost_setting_id: fieldCost.id, amount: fieldTarget, transaction_date: transactionDate, match_id: match.match_id });
        } else {
          const cur = normalizedAmount(existingField.amount);
          if (cur !== fieldTarget) {
            costsToUpdate.push({ id: existingField.id, amount: fieldTarget });
          }
        }

        // Referee cost - only when referee is assigned
        if (refereeCost && hasReferee) {
          const refereeKey = `${teamId}-${refereeCost.id}`;
          const existingReferee = existingCostsMap.get(refereeKey);
          const refTarget = Number(refereeCost.amount ?? 0);
          if (!existingReferee) {
            costsToInsert.push({ team_id: teamId, cost_setting_id: refereeCost.id, amount: refTarget, transaction_date: transactionDate, match_id: match.match_id });
          } else {
            const cur = normalizedAmount(existingReferee.amount);
            if (cur !== refTarget) {
              costsToUpdate.push({ id: existingReferee.id, amount: refTarget });
            }
          }
        }

        // Admin cost - always applied
        if (adminCost) {
          const adminKey = `${teamId}-${adminCost.id}`;
          const existingAdmin = existingCostsMap.get(adminKey);
          const admTarget = Number(adminCost.amount ?? 0);
          if (!existingAdmin) {
            costsToInsert.push({ team_id: teamId, cost_setting_id: adminCost.id, amount: admTarget, transaction_date: transactionDate, match_id: match.match_id });
          } else {
            const cur = normalizedAmount(existingAdmin.amount);
            if (cur !== admTarget) {
              costsToUpdate.push({ id: existingAdmin.id, amount: admTarget });
            }
          }
        }
      }

      if (costsToInsert.length > 0) {
        const { error: insertErr } = await supabaseServiceRole.from('team_costs').insert(costsToInsert);
        if (!insertErr) { syncedCount += costsToInsert.length; }
        else { console.error(`❌ Failed to insert costs for match ${match.match_id}:`, insertErr); }
      }

      for (const cost of costsToUpdate) {
        const { error: updateErr } = await supabaseServiceRole.from('team_costs').update({ amount: cost.amount }).eq('id', cost.id);
        if (!updateErr) { updatedCount++; }
        else { console.error(`❌ Failed to update cost ${cost.id}:`, updateErr); }
      }

      if (costsToInsert.length === 0 && costsToUpdate.length === 0) { skippedCount++; }
    }

    console.log(`✅ Sync complete: ${syncedCount} inserted, ${updatedCount} updated, ${skippedCount} skipped, ${forfaitCount} forfait`);

    return new Response(
      JSON.stringify({ success: true, message: `Synchronisatie voltooid: ${syncedCount} kosten toegevoegd, ${updatedCount} bijgewerkt, ${skippedCount} overgeslagen, ${forfaitCount} forfait`, syncedCount, updatedCount, skippedCount, forfaitCount }),
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
