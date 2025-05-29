
export interface Player {
  player_id: number;
  first_name: string;
  last_name: string;
  birth_date: string;
  team_id: number;
  is_active: boolean;
}

export interface Team {
  team_id: number;
  team_name: string;
}

export interface NewPlayerData {
  firstName: string;
  lastName: string;
  birthDate: string;
}

export interface EditingPlayerData {
  player_id: number;
  firstName: string;
  lastName: string;
  birthDate: string;
}
