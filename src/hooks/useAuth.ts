
import { createContext, useContext } from 'react';
import { User, AuthState } from '@/types/auth';

export interface AuthContextType extends AuthState {
  authContextReady: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

// Context defined here to avoid circular imports
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
