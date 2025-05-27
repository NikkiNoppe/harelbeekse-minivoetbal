
import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "@/types/auth";
import { supabase } from "@/integrations/supabase/client";

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load users from database
  const loadUsers = async () => {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('user_id, username, email, role')
        .order('username');

      if (error) {
        console.error('Error loading users:', error);
        return;
      }

      // Map database users to our User type
      const mappedUsers: User[] = users.map(dbUser => ({
        id: dbUser.user_id,
        username: dbUser.username,
        password: '', // Don't expose password
        role: dbUser.role,
        email: dbUser.email
      }));

      setAllUsers(mappedUsers);
    } catch (error) {
      console.error('Failed to load users from database:', error);
    }
  };

  // Check for existing user in localStorage on mount
  useEffect(() => {
    const initializeAuth = async () => {
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

      await loadUsers();
      setIsLoaded(true);
    };

    initializeAuth();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem("currentUser", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("currentUser");
  };

  const updateUser = async (updatedUser: User) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          username: updatedUser.username,
          email: updatedUser.email,
          role: updatedUser.role
        })
        .eq('user_id', updatedUser.id);

      if (error) {
        console.error('Error updating user:', error);
        return;
      }

      // Reload users from database
      await loadUsers();
      
      // Update current user if it's the same
      if (user && user.id === updatedUser.id) {
        setUser(updatedUser);
        localStorage.setItem("currentUser", JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };
  
  const addUser = async (newUser: User) => {
    try {
      const { error } = await supabase
        .rpc('create_user_with_hashed_password', {
          username_param: newUser.username,
          email_param: newUser.email || null,
          password_param: newUser.password,
          role_param: newUser.role
        });

      if (error) {
        console.error('Error adding user:', error);
        return;
      }

      // Reload users from database
      await loadUsers();
    } catch (error) {
      console.error('Failed to add user:', error);
    }
  };
  
  const removeUser = async (userId: number) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error removing user:', error);
        return;
      }

      // Reload users from database
      await loadUsers();
      
      // Logout if current user is removed
      if (user && user.id === userId) {
        logout();
      }
    } catch (error) {
      console.error('Failed to remove user:', error);
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
