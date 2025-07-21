
export type UserRole = 'admin' | 'player_manager' | 'referee';

export interface User {
  id: number;
  username: string;
  password: string;
  role: UserRole;
  teamId?: number;
  email?: string;
}

export interface TeamData {
  id: number;
  name: string;
  email?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}
