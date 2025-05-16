
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { mapDatabaseUserToAppUser, User } from "@/types/auth";

interface AuthContextProps {
  user: User | null;
  allUsers: User[];
  isAuthenticated: boolean;
  login: (username: string, password?: string) => Promise<boolean>;
  logout: () => void;
  addUser: (user: User) => void;
  updateUser: (user: User) => void;
  removeUser: (id: number) => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Load user from local storage on component mount
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Fetch all users for admin management
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*');

      if (error) {
        console.error("Error fetching users:", error);
        return;
      }

      const mappedUsers = data.map(mapDatabaseUserToAppUser);
      setAllUsers(mappedUsers);
    } catch (error) {
      console.error("Unexpected error fetching users:", error);
    }
  };

  const login = async (username: string, password?: string): Promise<boolean> => {
    // In a real application, you would authenticate against a backend service
    // For mock data, we'll just check against our mock users
    const foundUser = allUsers.find(u => u.username === username && (password === undefined || u.password === password));

    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('user', JSON.stringify(foundUser));
      navigate('/dashboard');
      return true;
    }

    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    navigate('/');
  };

  const addUser = (user: User) => {
    setAllUsers(prevUsers => [...prevUsers, user]);
  };

  const updateUser = (updatedUser: User) => {
    setAllUsers(prevUsers =>
      prevUsers.map(user => (user.id === updatedUser.id ? updatedUser : user))
    );
  };

  const removeUser = (id: number) => {
    setAllUsers(prevUsers => prevUsers.filter(user => user.id !== id));
  };

  // Mock user data for authentication testing
  const mockUsers: User[] = [
    { 
      id: 1,
      username: "admin",
      role: "admin",
      password: "password"
    },
    { 
      id: 2,
      username: "team1",
      role: "player_manager",
      teamId: 1,
      password: "password"
    },
    { 
      id: 3,
      username: "team2",
      role: "player_manager",
      teamId: 2,
      password: "password"
    },
    { 
      id: 4,
      username: "ref",
      role: "referee",
      password: "password"
    },
  ];

  const value: AuthContextProps = {
    user,
    allUsers,
    isAuthenticated: !!user,
    login,
    logout,
    addUser,
    updateUser,
    removeUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
