
import { supabase } from "@/integrations/supabase/client";

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
        .eq('is_active', true)
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
      const playerCards = await this.getPlayerCards();
      const suspensions: Suspension[] = [];

      playerCards.forEach(player => {
        // Logic voor schorsingen op basis van gele kaarten
        if (player.yellowCards >= 2) {
          let matches = 0;
          let reason = '';
          
          if (player.yellowCards === 2 || player.yellowCards === 3) {
            matches = 1;
            reason = `${player.yellowCards} gele kaarten`;
          } else if (player.yellowCards === 4 || player.yellowCards === 5) {
            matches = 2;
            reason = `${player.yellowCards} gele kaarten`;
          } else if (player.yellowCards >= 6) {
            matches = 3;
            reason = `${player.yellowCards} gele kaarten`;
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

        // Logic voor rode kaarten
        if (player.redCards > 0) {
          suspensions.push({
            playerId: player.playerId,
            playerName: player.playerName,
            teamName: player.teamName,
            reason: `${player.redCards} rode kaart${player.redCards > 1 ? 'en' : ''}`,
            matches: player.redCards,
            status: 'active'
          });
        }
      });

      return suspensions;
    } catch (error) {
      console.error('Error in getActiveSuspensions:', error);
      return [];
    }
  }
};
