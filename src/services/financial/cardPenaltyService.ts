import { supabase } from "@/integrations/supabase/client";

type CardType = "yellow" | "double_yellow" | "red" | "none";

interface PlayerLike {
  playerId: number | null;
  cardType?: string | null;
}

export const cardPenaltyService = {
  // Synchronize automatic penalty transactions with current cards for a match
  async syncCardPenaltiesForMatch(params: {
    matchId: number;
    matchDateISO?: string | null;
    homeTeamId: number;
    awayTeamId: number;
    homePlayers?: PlayerLike[];
    awayPlayers?: PlayerLike[];
  }): Promise<{ success: boolean; message: string }> {
    const { matchId, matchDateISO, homeTeamId, awayTeamId, homePlayers = [], awayPlayers = [] } = params;
    try {
      // Load penalty cost settings
      const { data: penalties, error: penErr } = await supabase
        .from('costs')
        .select('id, name, amount')
        .eq('category', 'penalty')
        .eq('is_active', true);

      if (penErr) throw penErr;
      const penaltySettings = penalties || [];

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

      // Sync for each (team, type)
      for (const key of Object.keys(countByTeamAndType)) {
        const [teamIdStr, type] = key.split(':');
        const teamId = parseInt(teamIdStr, 10);
        const desiredCount = countByTeamAndType[key];
        const costSetting = findCostForType(type as CardType);
        if (!costSetting) {
          // Skip if we can't map this card type to a cost setting
          continue;
        }

        // Fetch existing rows for this match/team/cost WITHOUT description filter
        const { data: existingRows, error: existErr } = await supabase
          .from('team_costs')
          .select('id')
          .eq('team_id', teamId)
          .eq('match_id', matchId)
          .eq('cost_setting_id', costSetting.id);

        if (existErr) throw existErr;
        const existingCount = (existingRows || []).length;

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
          const { error: insertErr } = await supabase.from('team_costs').insert(rows);
          if (insertErr) throw insertErr;
        } else if (existingCount > desiredCount) {
          // Delete the surplus AUTO rows
          const toDelete = existingCount - desiredCount;
          const idsToDelete = (existingRows || []).slice(0, toDelete).map(r => r.id);
          if (idsToDelete.length > 0) {
            const { error: delErr } = await supabase
              .from('team_costs')
              .delete()
              .in('id', idsToDelete);
            if (delErr) throw delErr;
          }
        }
      }

      return { success: true, message: 'Kaartboetes gesynchroniseerd' };
    } catch (error) {
      console.error('Error syncing card penalties:', error);
      return { success: false, message: 'Fout bij synchroniseren kaartboetes' };
    }
  }
};


