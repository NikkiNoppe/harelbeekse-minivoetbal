
export type UserRole = 'admin' | 'player_manager' | 'referee' | 'superadmin';

export interface User {
  id: number;
  username: string;
  password: string;
  role: UserRole;
  teamId?: number;
  email?: string;
  isSuperAdmin?: boolean;
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
