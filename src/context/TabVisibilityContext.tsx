
import React, { createContext, useContext } from 'react';
import { useAuth } from '@/components/pages/login/AuthProvider';
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
    // Teams tab - always visible for now
    if (tab === "teams") {
      return true;
    }

    // Admin match forms: admins always have access
    const isAdminMatchForms =
      tab === 'admin_match_forms_league' ||
      tab === 'admin_match_forms_cup' ||
      tab === 'admin_match_forms_playoffs';

    if (isAdminMatchForms) {
      // Require login for any admin section logic
      if (!user) return false;
      if (user.role === 'admin') return true;

      // For non-admin authenticated users, respect the visibility toggle
      const adminSetting = settings.find(s => s.setting_name === tab);
      return !!adminSetting?.is_visible;
    }

    // Find the setting for public tabs
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

export type TabName =
  | "algemeen"
  | "competitie"
  | "playoff"
  | "beker"
  | "schorsingen"
  | "kaarten"
  | "reglement"
  | "teams"
  | "admin_match_forms_league"
  | "admin_match_forms_cup"
  | "admin_match_forms_playoffs";
