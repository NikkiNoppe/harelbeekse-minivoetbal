import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create Supabase client with service role key to bypass RLS
const supabaseServiceRole = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

type CardType = "yellow" | "double_yellow" | "red" | "none";

interface PlayerLike {
  playerId: number | null;
  cardType?: string | null;
}

interface SyncCardPenaltiesRequest {
  matchId: number;
  matchDateISO?: string | null;
  homeTeamId: number;
  awayTeamId: number;
  homePlayers?: PlayerLike[];
  awayPlayers?: PlayerLike[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { matchId, matchDateISO, homeTeamId, awayTeamId, homePlayers = [], awayPlayers = [] }: SyncCardPenaltiesRequest = await req.json();

    console.log('Syncing card penalties for match:', { matchId, homeTeamId, awayTeamId });

    // Load penalty cost settings
    const { data: penalties, error: penErr } = await supabaseServiceRole
      .from('costs')
      .select('id, name, amount')
      .eq('category', 'penalty')
      .eq('is_active', true);

    if (penErr) {
      throw new Error(`Failed to load penalty settings: ${penErr.message}`);
    }

    const penaltySettings = penalties || [];
    console.log('Loaded penalty settings:', penaltySettings);

    // Helper: map card type -> cost setting
    const findCostForType = (type: CardType) => {
      const nameIncludes = (s: string, q: string) => s.toLowerCase().includes(q);
      for (const cs of penaltySettings) {
        const n = (cs.name || '').toLowerCase();
        if (type === 'yellow' && (nameIncludes(n, 'geel') || nameIncludes(n, 'yellow'))) return cs;
        if (type === 'double_yellow' && ((nameIncludes(n, '2x') && nameIncludes(n, 'geel')) || nameIncludes(n, 'dubbel') || nameIncludes(n, 'double'))) return cs;
        if (type === 'red' && (nameIncludes(n, 'rood') || nameIncludes(n, 'red'))) return cs;
      }
      return null;
    };

    // Count desired penalties per team and card type
    const countByTeamAndType: Record<string, number> = {};
    const addCount = (teamId: number, type: CardType) => {
      const key = `${teamId}:${type}`;
      countByTeamAndType[key] = (countByTeamAndType[key] || 0) + 1;
    };

    const processPlayers = (teamId: number, players: PlayerLike[]) => {
      for (const p of players) {
        if (!p?.playerId) continue;
        const type = (p.cardType as CardType | undefined) || undefined;
        if (!type || type === 'none') continue;
        if (type === 'yellow') addCount(teamId, 'yellow');
        else if (type === 'double_yellow') addCount(teamId, 'double_yellow');
        else if (type === 'red') addCount(teamId, 'red');
      }
    };

    processPlayers(homeTeamId, homePlayers);
    processPlayers(awayTeamId, awayPlayers);

    console.log('Card penalty counts:', countByTeamAndType);

    // Sync for each (team, type)
    for (const key of Object.keys(countByTeamAndType)) {
      const [teamIdStr, type] = key.split(':');
      const teamId = parseInt(teamIdStr, 10);
      const desiredCount = countByTeamAndType[key];
      const costSetting = findCostForType(type as CardType);
      if (!costSetting) {
        console.log(`No cost setting found for card type: ${type}`);
        continue;
      }

      console.log(`Processing ${type} cards for team ${teamId}: desired=${desiredCount}`);

      // Fetch existing rows for this match/team/cost
      const { data: existingRows, error: existErr } = await supabaseServiceRole
        .from('team_costs')
        .select('id')
        .eq('team_id', teamId)
        .eq('match_id', matchId)
        .eq('cost_setting_id', costSetting.id);

      if (existErr) {
        throw new Error(`Failed to fetch existing penalty records: ${existErr.message}`);
      }

      const existingCount = (existingRows || []).length;
      console.log(`Existing ${type} penalties for team ${teamId}: ${existingCount}`);

      if (existingCount < desiredCount) {
        // Insert the difference
        const toInsert = desiredCount - existingCount;
        const transactionDate = matchDateISO ? (matchDateISO.slice(0, 10)) : new Date().toISOString().slice(0, 10);
        const rows = Array.from({ length: toInsert }).map(() => ({
          team_id: teamId,
          cost_setting_id: costSetting.id,
          amount: costSetting.amount ?? 0,
          transaction_date: transactionDate,
          match_id: matchId
        }));

        console.log(`Inserting ${toInsert} penalty records:`, rows);
        const { error: insertErr } = await supabaseServiceRole.from('team_costs').insert(rows);
        if (insertErr) {
          throw new Error(`Failed to insert penalty records: ${insertErr.message}`);
        }
      } else if (existingCount > desiredCount) {
        // Delete the surplus rows
        const toDelete = existingCount - desiredCount;
        const idsToDelete = (existingRows || []).slice(0, toDelete).map(r => r.id);
        if (idsToDelete.length > 0) {
          console.log(`Deleting ${toDelete} surplus penalty records:`, idsToDelete);
          const { error: delErr } = await supabaseServiceRole
            .from('team_costs')
            .delete()
            .in('id', idsToDelete);
          if (delErr) {
            throw new Error(`Failed to delete surplus penalty records: ${delErr.message}`);
          }
        }
      }
    }

    console.log('Card penalty sync completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Kaartboetes gesynchroniseerd',
        processedCounts: countByTeamAndType
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error syncing card penalties:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: `Fout bij synchroniseren kaartboetes: ${error.message}` 
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