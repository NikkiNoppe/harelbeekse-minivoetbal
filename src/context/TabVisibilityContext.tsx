
import React, { createContext, useContext } from 'react';
import { useAuth } from '@/components/pages/login/AuthProvider';
import { useTabVisibilitySettings } from '@/hooks/useTabVisibilitySettings';

interface TabVisibilityContextProps {
  isTabVisible: (tab: TabName | string) => boolean;
  loading: boolean;
}

const TabVisibilityContext = createContext<TabVisibilityContextProps | undefined>(undefined);

export const TabVisibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { settings, loading } = useTabVisibilitySettings();

  const isTabVisible = (tab: TabName | string): boolean => {
    // Map admin tabs to their public equivalents for tab visibility checks
    const adminToPublicMapping: Record<string, string> = {
      'competition': 'competitie',
      'cup': 'beker', 
      'playoffs': 'playoff',
      'match-forms': 'admin_match_forms_league', // Check league forms as primary
      'match-forms-league': 'admin_match_forms_league',
      'match-forms-cup': 'admin_match_forms_cup',
      'match-forms-playoffs': 'admin_match_forms_playoffs',
    };

    // Use mapped tab name if it exists, otherwise use original
    const mappedTab = adminToPublicMapping[tab] || tab;

    // Teams: respect visibility settings (no longer always visible)

    // Admin match forms: admins always have access
    const isAdminMatchForms =
      mappedTab === 'admin_match_forms_league' ||
      mappedTab === 'admin_match_forms_cup' ||
      mappedTab === 'admin_match_forms_playoffs';

    if (isAdminMatchForms) {
      // Require login for any admin section logic
      if (!user) return false;
      if (user.role === 'admin') return true;

      // For non-admin authenticated users, respect the visibility toggle
      const adminSetting = settings.find(s => s.setting_name === mappedTab);
      return !!adminSetting?.is_visible;
    }

    // Special case for match-forms - check if any admin match forms are visible
    if (tab === 'match-forms') {
      if (!user) return false;
      if (user.role === 'admin') return true;
      
      // Check if any admin match forms are visible
      const leagueSetting = settings.find(s => s.setting_name === 'admin_match_forms_league');
      const cupSetting = settings.find(s => s.setting_name === 'admin_match_forms_cup');
      const playoffsSetting = settings.find(s => s.setting_name === 'admin_match_forms_playoffs');
      
      return !!(leagueSetting?.is_visible || cupSetting?.is_visible || playoffsSetting?.is_visible);
    }

    // Find the setting for public tabs
    const setting = settings.find(s => s.setting_name === mappedTab);
    
    // If no setting found, hide the tab by default (unless it's a fallback tab)
    if (!setting) {
      return false;
    }
    
    // Check visibility from setting_value
    if (!setting.is_visible) {
      return false;
    }
    
    // If login is required but user is not authenticated, hide the tab
    if (setting.requires_login && !user) {
      return false;
    }
    
    // For authenticated users, check role-based visibility
    if (user) {
      switch (mappedTab) {
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
