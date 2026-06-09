
import { fetchPlayersForSession } from "@/services/core/playersSessionFetch";

export interface Player {
  player_id: number;
  first_name: string;
  last_name: string;
  birth_date: string;
  team_id: number;
}

export const playerService = {
  async getPlayersByTeam(teamId: number): Promise<Player[]> {
    const players = await fetchPlayersForSession(teamId);
    return players.map((p) => ({
      player_id: p.player_id,
      first_name: p.first_name,
      last_name: p.last_name,
      birth_date: p.birth_date,
      team_id: p.team_id,
    }));
  },

  async getAllPlayers(): Promise<Player[]> {
    const players = await fetchPlayersForSession(null);
    return players.map((p) => ({
      player_id: p.player_id,
      first_name: p.first_name,
      last_name: p.last_name,
      birth_date: p.birth_date,
      team_id: p.team_id,
    }));
  },

  async getPlayerById(playerId: number): Promise<Player | null> {
    const players = await fetchPlayersForSession(null);
    const player = players.find((p) => p.player_id === playerId);
    if (!player) return null;
    return {
      player_id: player.player_id,
      first_name: player.first_name,
      last_name: player.last_name,
      birth_date: player.birth_date,
      team_id: player.team_id,
    };
  },
};
