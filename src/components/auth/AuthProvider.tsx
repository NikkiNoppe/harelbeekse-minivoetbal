
import React, { createContext, useContext, useState, useEffect } from "react";

export interface User {
  id: number;
  username: string;
  role: "admin" | "team" | "referee"; // Restrict to only these three values
  teamId?: number; // Optional since admin and referee users don't have a teamId
  password?: string; // Used for mock data, would not be included in a real app
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  allUsers: User[];
  updateUser: (updatedUser: User) => void;
  addUser: (newUser: User) => void;
  removeUser: (userId: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Default mock users
const DEFAULT_USERS: User[] = [
  { id: 1, username: "admin", password: "admin123", role: "admin" },
  { id: 2, username: "team1", password: "team123", role: "team", teamId: 1 },
  { id: 3, username: "team2", password: "team123", role: "team", teamId: 2 },
  { id: 4, username: "referee", password: "referee123", role: "referee" },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>(DEFAULT_USERS);
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

    // Load all users from localStorage if available
    const storedUsers = localStorage.getItem("allUsers");
    if (storedUsers) {
      try {
        const parsedUsers = JSON.parse(storedUsers);
        setAllUsers(parsedUsers);
      } catch (error) {
        console.error("Failed to parse stored users", error);
        // Fallback to default users
        localStorage.setItem("allUsers", JSON.stringify(DEFAULT_USERS));
      }
    } else {
      // Store default users if none exist
      localStorage.setItem("allUsers", JSON.stringify(DEFAULT_USERS));
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

  const updateUser = (updatedUser: User) => {
    const updatedUsers = allUsers.map(u => 
      u.id === updatedUser.id ? updatedUser : u
    );
    setAllUsers(updatedUsers);
    localStorage.setItem("allUsers", JSON.stringify(updatedUsers));
    
    // Update current user if it's the same
    if (user && user.id === updatedUser.id) {
      setUser(updatedUser);
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));
    }
  };
  
  const addUser = (newUser: User) => {
    const updatedUsers = [...allUsers, newUser];
    setAllUsers(updatedUsers);
    localStorage.setItem("allUsers", JSON.stringify(updatedUsers));
  };
  
  const removeUser = (userId: number) => {
    const updatedUsers = allUsers.filter(u => u.id !== userId);
    setAllUsers(updatedUsers);
    localStorage.setItem("allUsers", JSON.stringify(updatedUsers));
    
    // Logout if current user is removed
    if (user && user.id === userId) {
      logout();
    }
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    allUsers,
    updateUser,
    addUser,
    removeUser
  };

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
