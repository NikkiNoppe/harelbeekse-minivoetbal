// Cards & Suspensions Domain - Card Penalty Service
// Moved from src/services/financial/cardPenaltyService.ts
// This service handles card-related penalties (financial transactions for cards)

import { supabase } from "@/integrations/supabase/client";
import { getRpcSessionArgs } from "@/lib/authSession";
import { fetchCostsForSession } from "@/services/financial/costsSessionFetch";
import { fetchTeamCostsForMatch } from "@/services/financial/matchCostService";

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
      const penaltySettings = await fetchCostsForSession('penalty');

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

      const matchCosts = await fetchTeamCostsForMatch(matchId);

      // Sync for each (team, type)
      for (const key of Object.keys(countByTeamAndType)) {
        const [teamIdStr, type] = key.split(':');
        const teamId = parseInt(teamIdStr, 10);
        const desiredCount = countByTeamAndType[key];
        const costSetting = findCostForType(type as CardType);
        if (!costSetting) {
          continue;
        }

        const existingRows = matchCosts.filter(
          (row) => row.team_id === teamId && row.cost_setting_id === costSetting.id,
        );
        const existingCount = existingRows.length;

        if (existingCount < desiredCount) {
          const toInsert = desiredCount - existingCount;
          const transactionDate = matchDateISO ? (matchDateISO.slice(0, 10)) : new Date().toISOString().slice(0, 10);
          for (let i = 0; i < toInsert; i++) {
            const { data, error: insertErr } = await supabase.rpc('add_team_cost_for_session', {
              ...getRpcSessionArgs(),
              p_team_id: teamId,
              p_cost_setting_id: costSetting.id,
              p_amount: costSetting.amount ?? 0,
              p_transaction_date: transactionDate,
              p_match_id: matchId,
            });
            if (insertErr) throw insertErr;
            if (data && (data as { success?: boolean }).success === false) {
              throw new Error((data as { error?: string }).error || 'Insert failed');
            }
          }
        } else if (existingCount > desiredCount) {
          const toDelete = existingCount - desiredCount;
          const idsToDelete = existingRows.slice(0, toDelete).map((r) => r.id);
          for (const costId of idsToDelete) {
            const { data, error: delErr } = await supabase.rpc('manage_team_cost_for_session', {
              ...getRpcSessionArgs(),
              p_cost_id: costId,
              p_operation: 'delete',
            } as any);
            if (delErr) throw delErr;
            if (data && (data as { success?: boolean }).success === false) {
              throw new Error((data as { error?: string }).error || 'Delete failed');
            }
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
