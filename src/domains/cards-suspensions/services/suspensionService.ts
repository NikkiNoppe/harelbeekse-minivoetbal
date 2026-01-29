// Cards & Suspensions Domain - Suspension Service
// Moved from src/services/suspensionService.ts

import { supabase } from "@/integrations/supabase/client";
import { suspensionRulesService } from "./suspensionRulesService";
import { withUserContext } from "@/lib/supabaseUtils";

export interface PlayerCard {
  playerId: number;
  playerName: string;
  teamName: string;
  teamId?: number;
  yellowCards: number;
  redCards: number;
  suspendedMatches?: number;
}

export interface Suspension {
  playerId: number;
  playerName: string;
  teamName: string;
  teamId?: number;
  reason: string;
  matches: number;
  status: 'active' | 'pending' | 'completed';
  cardDate?: string; // Datum waarop de kaart is gegeven
  suspendedForMatch?: {
    date: string;
    opponent: string;
  };
}

export const suspensionService = {
  async getPlayerCards(): Promise<PlayerCard[]> {
    try {
      // Get user ID from localStorage for RPC call
      const authDataString = localStorage.getItem('auth_data');
      const userId = authDataString ? JSON.parse(authDataString)?.user?.id : null;
      
      if (!userId) {
        console.error('No user ID found for player cards fetch');
        return [];
      }
      
      // Use SECURITY DEFINER RPC for reliable admin/manager access
      const { data, error } = await supabase.rpc('get_player_cards_for_admin', {
        p_user_id: userId
      });

      if (error) {
        console.error('Error fetching player cards via RPC:', error);
        throw error;
      }

      return (data || []).map((player: any) => ({
        playerId: player.player_id,
        playerName: `${player.first_name} ${player.last_name}`,
        teamName: player.team_name || 'Onbekend Team',
        teamId: player.team_id,
        yellowCards: player.yellow_cards || 0,
        redCards: player.red_cards || 0,
        suspendedMatches: player.suspended_matches_remaining || 0
      }));
    } catch (error) {
      console.error('Error in getPlayerCards:', error);
      return [];
    }
  },

  async checkPlayerEligibility(playerId: number, matchDate: Date): Promise<boolean> {
    // Minimal-change caching & inflight dedupe to avoid RPC flood
    // Cache key: playerId + exact ISO timestamp
    const cacheKey = `${playerId}|${matchDate.toISOString()}`;
    const now = Date.now();
    const TTL_MS = 5 * 60 * 1000; // Extended to 5 minutes for better performance

    // Lazy init singletons on the service object to avoid global state
    // @ts-ignore - attach non-enumerable fields for cache
    if (!suspensionService.__eligibilityCache) {
      // @ts-ignore
      suspensionService.__eligibilityCache = new Map<string, { value: boolean; ts: number }>();
    }
    // @ts-ignore
    const cache: Map<string, { value: boolean; ts: number }> = suspensionService.__eligibilityCache;

    // @ts-ignore
    if (!suspensionService.__eligibilityInflight) {
      // @ts-ignore
      suspensionService.__eligibilityInflight = new Map<string, Promise<boolean>>();
    }
    // @ts-ignore
    const inflight: Map<string, Promise<boolean>> = suspensionService.__eligibilityInflight;

    // Serve from cache if fresh
    const cached = cache.get(cacheKey);
    if (cached && now - cached.ts < TTL_MS) {
      return cached.value;
    }

    // Deduplicate concurrent calls
    const existing = inflight.get(cacheKey);
    if (existing) return existing;

    const promise = (async () => {
      try {
        const { data, error } = await supabase.rpc('is_player_suspended', {
          player_id_param: playerId,
          match_date_param: matchDate.toISOString()
        });

        if (error) {
          console.error('Error checking player eligibility:', error);
          return false;
        }

        const value = !data; // true if NOT suspended
        cache.set(cacheKey, { value, ts: Date.now() });
        return value;
      } catch (error) {
        console.error('Error in checkPlayerEligibility:', error);
        return false;
      } finally {
        inflight.delete(cacheKey);
      }
    })();

    inflight.set(cacheKey, promise);
    return promise;
  },

  // New batch function to check multiple players at once - significantly reduces DB calls
  async checkBatchPlayerEligibility(playerIds: number[], matchDate: Date): Promise<Record<number, boolean>> {
    if (!playerIds.length) return {};

    const batchCacheKey = `batch_${playerIds.sort().join(',')}_${matchDate.toISOString()}`;
    const now = Date.now();
    const TTL_MS = 5 * 60 * 1000; // 5 minutes cache

    // Initialize batch cache if needed
    // @ts-ignore
    if (!suspensionService.__batchEligibilityCache) {
      // @ts-ignore
      suspensionService.__batchEligibilityCache = new Map<string, { value: Record<number, boolean>; ts: number }>();
    }
    // @ts-ignore
    const batchCache: Map<string, { value: Record<number, boolean>; ts: number }> = suspensionService.__batchEligibilityCache;

    // Check cache first
    const cached = batchCache.get(batchCacheKey);
    if (cached && now - cached.ts < TTL_MS) {
      return cached.value;
    }

    try {
      const { data, error } = await supabase.rpc('check_batch_players_suspended', {
        player_ids: playerIds,
        match_date_param: matchDate.toISOString()
      });

      if (error) {
        console.error('Error checking batch player eligibility:', error);
        // Fallback to individual calls on error
        const result: Record<number, boolean> = {};
        for (const playerId of playerIds) {
          result[playerId] = await this.checkPlayerEligibility(playerId, matchDate);
        }
        return result;
      }

      // Convert array result to object: playerId -> isEligible (NOT suspended)
      const result: Record<number, boolean> = {};
      if (data && Array.isArray(data)) {
        data.forEach((row: any) => {
          result[row.player_id] = !row.is_suspended; // true if NOT suspended
        });
      }

      // Fill in any missing players as eligible (fallback)
      playerIds.forEach(id => {
        if (!(id in result)) {
          result[id] = true;
        }
      });

      // Cache the result
      batchCache.set(batchCacheKey, { value: result, ts: now });
      return result;
      
    } catch (error) {
      console.error('Error in checkBatchPlayerEligibility:', error);
      // Fallback: return all as eligible to avoid blocking UI
      const fallbackResult: Record<number, boolean> = {};
      playerIds.forEach(id => fallbackResult[id] = true);
      return fallbackResult;
    }
  },

  async applySuspension(playerId: number, reason: string, matches: number, notes?: string): Promise<void> {
    try {
      const { error } = await withUserContext(async () => {
        return await supabase
          .from('application_settings')
          .insert({
            setting_category: 'manual_suspensions',
            setting_name: playerId.toString(),
            setting_value: {
              reason,
              matches,
              start_date: new Date().toISOString(),
              end_date: new Date(Date.now() + (matches * 7 * 24 * 60 * 60 * 1000)).toISOString(), // Rough estimate
              notes,
              created_by: 'admin', // Could be dynamic based on current user
              type: 'manual'
            },
            is_active: true
          });
      });

      if (error) {
        console.error('Error applying suspension:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in applySuspension:', error);
      throw error;
    }
  },

  async getManualSuspensions(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('application_settings')
        .select(`
          id,
          setting_name,
          setting_value,
          created_at,
          is_active
        `)
        .eq('setting_category', 'manual_suspensions')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching manual suspensions:', error);
        return [];
      }

      return data.map(suspension => {
        const settingValue = suspension.setting_value as any;
        return {
          id: suspension.id,
          playerId: parseInt(suspension.setting_name),
          reason: settingValue?.reason || '',
          matches: settingValue?.matches || 0,
          startDate: settingValue?.start_date || '',
          endDate: settingValue?.end_date || '',
          notes: settingValue?.notes || '',
          type: settingValue?.type || 'manual',
          isActive: suspension.is_active,
          createdAt: suspension.created_at
        };
      });
    } catch (error) {
      console.error('Error in getManualSuspensions:', error);
      return [];
    }
  },

  async updateSuspension(suspensionId: number, updates: any): Promise<void> {
    try {
      const { error } = await withUserContext(async () => {
        return await supabase
          .from('application_settings')
          .update({
            setting_value: updates,
            is_active: updates.isActive
          })
          .eq('id', suspensionId);
      });

      if (error) {
        console.error('Error updating suspension:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in updateSuspension:', error);
      throw error;
    }
  },

  async deleteSuspension(suspensionId: number): Promise<void> {
    try {
      const { error } = await withUserContext(async () => {
        return await supabase
          .from('application_settings')
          .delete()
          .eq('id', suspensionId);
      });

      if (error) {
        console.error('Error deleting suspension:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteSuspension:', error);
      throw error;
    }
  },

  async getUpcomingMatches(playerId: number): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          match_id,
          match_date,
          home_team_id,
          away_team_id,
          location,
          is_cup_match,
          teams!matches_home_team_id_fkey(team_name),
          teams!matches_away_team_id_fkey(team_name)
        `)
        .or(`home_team_id.eq.${playerId},away_team_id.eq.${playerId}`)
        .gte('match_date', new Date().toISOString())
        .eq('is_submitted', false)
        .order('match_date', { ascending: true })
        .limit(10);

      if (error) {
        console.error('Error fetching upcoming matches:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUpcomingMatches:', error);
      return [];
    }
  },

  async getActiveSuspensions(): Promise<Suspension[]> {
    try {
      const playerCards = await suspensionService.getPlayerCards();
      const suspensions: Suspension[] = [];

      console.log('Player cards data:', playerCards); // Debug log

      // Get dynamic suspension rules
      const rules = await suspensionRulesService.getSuspensionRules();

      // Fetch submitted matches to get card dates (cards only come from played matches)
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select(`
          match_id,
          match_date,
          home_team_id,
          away_team_id,
          home_players,
          away_players,
          teams_home:teams!home_team_id ( team_name ),
          teams_away:teams!away_team_id ( team_name )
        `)
        .eq('is_submitted', true)
        .order('match_date', { ascending: false });

      if (matchesError) {
        console.error('Error fetching matches for card dates:', matchesError);
      }

      // Fetch ALL matches (including unplayed) for "next match after card" calculation
      const { data: allMatchesData, error: allMatchesError } = await supabase
        .from('matches')
        .select(`
          match_id,
          match_date,
          home_team_id,
          away_team_id,
          teams_home:teams!home_team_id ( team_name ),
          teams_away:teams!away_team_id ( team_name )
        `)
        .order('match_date', { ascending: true });

      if (allMatchesError) {
        console.error('Error fetching all matches:', allMatchesError);
      }

      // Helper function to get last card date for a player
      const getLastCardDate = (playerId: number, cardType: 'yellow' | 'red'): string | undefined => {
        if (!matchesData) return undefined;
        
        for (const match of matchesData) {
          const homePlayers = Array.isArray(match.home_players) ? match.home_players : [];
          const awayPlayers = Array.isArray(match.away_players) ? match.away_players : [];
          const allPlayers = [...homePlayers, ...awayPlayers];
          
          for (const p of allPlayers) {
            if (p && typeof p === 'object' && 'playerId' in p && p.playerId === playerId) {
              const cardTypeValue = (p as { cardType?: string }).cardType?.toLowerCase();
              if (
                (cardType === 'yellow' && (cardTypeValue === 'yellow' || cardTypeValue === 'geel')) ||
                (cardType === 'red' && (cardTypeValue === 'red' || cardTypeValue === 'rood' || cardTypeValue === 'double_yellow'))
              ) {
                return match.match_date ? new Date(match.match_date).toISOString().slice(0, 10) : undefined;
              }
            }
          }
        }
        return undefined;
      };

      // Helper function to get next match AFTER a specific date for a team
      const getNextMatchAfterDate = (
        teamId: number, 
        afterDate: string
      ): { date: string; opponent: string } | undefined => {
        if (!allMatchesData || !afterDate) return undefined;  // Use allMatchesData (includes unplayed matches)
        
        const afterDateTime = new Date(afterDate).getTime();
        
        // Filter ALL matches for this team that are AFTER the card date
        const teamMatches = allMatchesData
          .filter(match => 
            (match.home_team_id === teamId || match.away_team_id === teamId) &&
            new Date(match.match_date).getTime() > afterDateTime
          )
          .sort((a, b) => 
            new Date(a.match_date).getTime() - new Date(b.match_date).getTime()
          );
        
        if (teamMatches.length === 0) return undefined;
        
        const firstMatch = teamMatches[0];
        const isHome = firstMatch.home_team_id === teamId;
        const opponent = isHome 
          ? (firstMatch.teams_away as any)?.team_name || 'Onbekend'
          : (firstMatch.teams_home as any)?.team_name || 'Onbekend';
        
        // Use UTC date components to avoid timezone shifts
        const matchDate = new Date(firstMatch.match_date);
        const year = matchDate.getUTCFullYear();
        const month = String(matchDate.getUTCMonth() + 1).padStart(2, '0');
        const day = String(matchDate.getUTCDate()).padStart(2, '0');
        
        return {
          date: `${year}-${month}-${day}`,
          opponent
        };
      };

      // Process each player
      for (const player of playerCards) {
        // Logic voor schorsingen op basis van gele kaarten
        if (player.yellowCards >= 2) {
          let matches = 0;
          let reason = '';
          
          // Use dynamic rules instead of hardcoded logic
          for (const rule of rules.yellow_card_rules) {
            if (player.yellowCards >= rule.min_cards && player.yellowCards <= rule.max_cards) {
              matches = rule.suspension_matches;
              reason = `${player.yellowCards} gele kaarten`;
              break;
            }
          }

          if (matches > 0) {
            const cardDate = getLastCardDate(player.playerId, 'yellow');
            // Calculate suspended match based on card date, not current date
            const suspendedForMatch = cardDate && player.teamId 
              ? getNextMatchAfterDate(player.teamId, cardDate) 
              : undefined;
            
            suspensions.push({
              playerId: player.playerId,
              playerName: player.playerName,
              teamName: player.teamName,
              teamId: player.teamId,
              reason,
              matches,
              status: 'active',
              cardDate,
              suspendedForMatch
            });
          }
        }

        // Logic voor rode kaarten - use dynamic rules
        if (player.redCards > 0) {
          const cardDate = getLastCardDate(player.playerId, 'red');
          // Calculate suspended match based on card date, not current date
          const suspendedForMatch = cardDate && player.teamId 
            ? getNextMatchAfterDate(player.teamId, cardDate) 
            : undefined;
          
          suspensions.push({
            playerId: player.playerId,
            playerName: player.playerName,
            teamName: player.teamName,
            teamId: player.teamId,
            reason: `${player.redCards} rode kaart${player.redCards > 1 ? 'en' : ''}`,
            matches: player.redCards * rules.red_card_rules.default_suspension_matches,
            status: 'active',
            cardDate,
            suspendedForMatch
          });
        }
      }

      console.log('Generated suspensions:', suspensions); // Debug log
      return suspensions;
    } catch (error) {
      console.error('Error in getActiveSuspensions:', error);
      return [];
    }
  },

  // Trigger manual update of player cards
  async refreshPlayerCards(): Promise<void> {
    try {
      const { error } = await supabase.rpc('update_player_cards');
      if (error) {
        console.error('Error refreshing player cards:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in refreshPlayerCards:', error);
      throw error;
    }
  }
};
