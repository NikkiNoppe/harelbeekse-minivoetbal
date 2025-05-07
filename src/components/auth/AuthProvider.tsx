
import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  id: number;
  username: string;
  role: string;
  teamId?: number; // Optional since admin users don't have a teamId
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Check for existing user in localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse stored user", error);
        localStorage.removeItem("currentUser");
      }
    }
    setIsLoaded(true);
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem("currentUser", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("currentUser");
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
  };

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
