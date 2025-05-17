
export interface Player {
  id: number;
  name: string;
  team?: string;
  teamId?: number;
  dateOfBirth?: string;
  isActive?: boolean;
}

export interface Team {
  team_id: number;
  team_name: string;
}
