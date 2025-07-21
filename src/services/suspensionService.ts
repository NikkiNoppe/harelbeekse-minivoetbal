
import { supabase } from "@/integrations/supabase/client";
import { suspensionRulesService } from "./suspensionRulesService";

export interface PlayerCard {
  playerId: number;
  playerName: string;
  teamName: string;
  yellowCards: number;
  redCards: number;
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
        redCards: player.red_cards || 0
      }));
    } catch (error) {
      console.error('Error in getPlayerCards:', error);
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
