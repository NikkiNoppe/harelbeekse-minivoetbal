
import React, { createContext, useContext } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';

interface TabVisibilityContextProps {
  isTabVisible: (tab: TabName) => boolean;
}

const TabVisibilityContext = createContext<TabVisibilityContextProps | undefined>(undefined);

export const TabVisibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const isTabVisible = (tab: TabName): boolean => {
    if (!user) {
      // Define visibility for non-authenticated users
      return tab === "algemeen" || tab === "reglement";
    }

    // Define visibility based on user role and other criteria
    switch (tab) {
      case "algemeen":
      case "competitie":
      case "reglement":
        return true; // Visible for all authenticated users
      case "playoff":
        return user.role === "admin"; // Visible only for admins
      case "beker":
        return user.role === "admin"; // Visible only for admins
      case "schorsingen":
        return user.role === "admin" || user.role === "referee"; // Visible for admins and referees
      case "kaarten":
        return user.role === "admin" || user.role === "referee"; // Visible for admins and referees
      default:
        return false;
    }
  };

  return (
    <TabVisibilityContext.Provider value={{ isTabVisible }}>
      {children}
    </TabVisibilityContext.Provider>
  );
};

export const useTabVisibility = () => {
  const context = useContext(TabVisibilityContext);
  if (!context) {
    throw new Error("useTabVisibility must be used within a TabVisibilityProvider");
  }
  return context;
};

export type TabName = "algemeen" | "competitie" | "playoff" | "beker" | "schorsingen" | "kaarten" | "reglement";
