
import { supabase } from "@/integrations/supabase/client";
import { suspensionRulesService } from "./suspensionRulesService";

export interface PlayerCard {
  playerId: number;
  playerName: string;
  teamName: string;
  yellowCards: number;
  redCards: number;
  suspendedMatches?: number;
}

export interface Suspension {
  playerId: number;
  playerName: string;
  teamName: string;
  reason: string;
  matches: number;
  status: 'active' | 'pending' | 'completed';
}

export const suspensionService = {
  async getPlayerCards(): Promise<PlayerCard[]> {
    try {
      const { data, error } = await supabase
        .from('players')
        .select(`
          player_id,
          first_name,
          last_name,
          yellow_cards,
          red_cards,
          suspended_matches_remaining,
          teams:team_id (
            team_name
          )
        `)
        .order('yellow_cards', { ascending: false });

      if (error) {
        console.error('Error fetching player cards:', error);
        throw error;
      }

      return data.map(player => ({
        playerId: player.player_id,
        playerName: `${player.first_name} ${player.last_name}`,
        teamName: player.teams?.team_name || 'Onbekend Team',
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
    try {
      const { data, error } = await supabase.rpc('is_player_suspended', {
        player_id_param: playerId,
        match_date_param: matchDate.toISOString()
      });

      if (error) {
        console.error('Error checking player eligibility:', error);
        return false;
      }

      return !data; // Return true if NOT suspended
    } catch (error) {
      console.error('Error in checkPlayerEligibility:', error);
      return false;
    }
  },

  async applySuspension(playerId: number, reason: string, matches: number, notes?: string): Promise<void> {
    try {
      const { error } = await supabase
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
      const { error } = await supabase
        .from('application_settings')
        .update({
          setting_value: updates,
          is_active: updates.isActive
        })
        .eq('id', suspensionId);

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
      const { error } = await supabase
        .from('application_settings')
        .delete()
        .eq('id', suspensionId);

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

      playerCards.forEach(player => {
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
            suspensions.push({
              playerId: player.playerId,
              playerName: player.playerName,
              teamName: player.teamName,
              reason,
              matches,
              status: 'active'
            });
          }
        }

        // Logic voor rode kaarten - use dynamic rules
        if (player.redCards > 0) {
          suspensions.push({
            playerId: player.playerId,
            playerName: player.playerName,
            teamName: player.teamName,
            reason: `${player.redCards} rode kaart${player.redCards > 1 ? 'en' : ''}`,
            matches: player.redCards * rules.red_card_rules.default_suspension_matches,
            status: 'active'
          });
        }
      });

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
