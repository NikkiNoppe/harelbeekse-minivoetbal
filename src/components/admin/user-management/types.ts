
export interface DbUser {
  user_id: number;
  username: string;
  role: string;
  team_id?: number | null;
  team_name?: string | null;
  teams?: { team_id: number; team_name: string }[];
}

export interface Team {
  team_id: number;
  team_name: string;
}

export interface UserWithTeam {
  user_id: number;
  username: string;
  role: string;
  teams: Team[] | null;
}

export interface NewUser {
  name: string;
  email: string;
  role: "admin" | "referee" | "player_manager";
  teamId: number | null;
  teamIds?: number[];
}
