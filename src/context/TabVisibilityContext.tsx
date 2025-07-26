
import React, { createContext, useContext } from 'react';
import { useAuth } from '@/components/login/AuthProvider';
import { useTabVisibilitySettings } from '@/hooks/useTabVisibilitySettings';

interface TabVisibilityContextProps {
  isTabVisible: (tab: TabName) => boolean;
  loading: boolean;
}

const TabVisibilityContext = createContext<TabVisibilityContextProps | undefined>(undefined);

export const TabVisibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { settings, loading } = useTabVisibilitySettings();

  const isTabVisible = (tab: TabName): boolean => {
    // Special case for teams tab - always visible for now
    if (tab === "teams") {
      return true;
    }
    
    // Find the setting for this tab
    const setting = settings.find(s => s.setting_name === tab);
    
    // If no setting found or not visible, hide the tab
    if (!setting || !setting.is_visible) {
      return false;
    }
    
    // If login is required but user is not authenticated, hide the tab
    if (setting.requires_login && !user) {
      return false;
    }
    
    // For authenticated users, check role-based visibility
    if (user) {
      switch (tab) {
        case "playoff":
        case "beker":
          return user.role === "admin";
        case "schorsingen":
        case "kaarten":
          return user.role === "admin" || user.role === "referee";
        default:
          return true; // All other tabs are visible for authenticated users if enabled in settings
      }
    }
    
    // For non-authenticated users, show the tab if it doesn't require login
    return !setting.requires_login;
  };

  return (
    <TabVisibilityContext.Provider value={{ isTabVisible, loading }}>
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

export type TabName = "algemeen" | "competitie" | "playoff" | "beker" | "schorsingen" | "kaarten" | "reglement" | "teams";
