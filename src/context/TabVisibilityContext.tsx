
import React, { createContext, useContext } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
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
    // Verwijder uitzondering voor teams tab
    // Vind de setting voor deze tab
    const setting = settings.find(s => s.setting_name === tab);
    // Als geen setting gevonden of niet zichtbaar, verberg de tab
    if (!setting || !setting.is_visible) {
      return false;
    }
    // Als login vereist is maar user niet ingelogd, verberg de tab
    if (setting.requires_login && !user) {
      return false;
    }
    // Voor ingelogde gebruikers, check rol-based zichtbaarheid
    if (user) {
      switch (tab) {
        case "playoff":
        case "beker":
          return user.role === "admin";
        case "schorsingen":
        case "kaarten":
          return user.role === "admin" || user.role === "referee";
        default:
          return true; // Alle andere tabs zijn zichtbaar voor ingelogde gebruikers als enabled in settings
      }
    }
    // Voor niet-ingelogde gebruikers, toon tab als geen login vereist is
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
