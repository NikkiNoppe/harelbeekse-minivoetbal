
import React, { createContext, useContext, useCallback } from 'react';
import { useAuth } from '@/components/pages/login/AuthProvider';
import { useTabVisibilitySettings, RoleKey } from '@/hooks/useTabVisibilitySettings';

interface TabVisibilityContextProps {
  isTabVisible: (tab: TabName | string) => boolean;
  loading: boolean;
}

const TabVisibilityContext = createContext<TabVisibilityContextProps | undefined>(undefined);

export const TabVisibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { settings, loading } = useTabVisibilitySettings();

  const isTabVisible = useCallback((tab: TabName | string): boolean => {
    // Map admin tabs to their public equivalents for tab visibility checks
    const adminToPublicMapping: Record<string, string> = {
      'competition': 'competitie',
      'cup': 'beker',
      'playoffs': 'playoff',
    };

    // Use mapped tab name if it exists, otherwise use original
    const mappedTab = adminToPublicMapping[tab] || tab;

    // Match forms: login required tabs that respect visibility settings
    const isMatchFormTab =
      tab === 'match-forms-league' ||
      tab === 'match-forms-cup' ||
      tab === 'match-forms-playoffs';

    if (isMatchFormTab) {
      // Require login for match forms
      if (!user) return false;
      
      const setting = settings.find(s => s.setting_name === tab);
      if (!setting) return false;
      
      // Check role-specific visibility
      const userRole = getUserRole(user.role);
      return setting.visibility?.[userRole] ?? true;
    }

    // Special case for match-forms - check if any match forms are visible
    if (tab === 'match-forms') {
      if (!user) return false;
      
      const userRole = getUserRole(user.role);
      
      const leagueSetting = settings.find(s => s.setting_name === 'match-forms-league');
      const cupSetting = settings.find(s => s.setting_name === 'match-forms-cup');
      const playoffsSetting = settings.find(s => s.setting_name === 'match-forms-playoffs');
      
      return !!(
        leagueSetting?.visibility?.[userRole] || 
        cupSetting?.visibility?.[userRole] || 
        playoffsSetting?.visibility?.[userRole]
      );
    }

    // Essential public tabs that should always be visible as fallback
    const alwaysVisiblePublicTabs = ['algemeen', 'competitie', 'beker', 'reglement', 'teams'];

    // Find the setting for public tabs
    const setting = settings.find(s => s.setting_name === mappedTab);

    // If no setting found, use safe fallback for essential public tabs
    if (!setting) {
      return alwaysVisiblePublicTabs.includes(mappedTab);
    }

    // Determine which role to check
    const roleToCheck: RoleKey = user ? getUserRole(user.role) : 'public';

    // Check role-specific visibility from the new structure
    const isVisibleForRole = setting.visibility?.[roleToCheck] ?? setting.is_visible;

    if (!isVisibleForRole) {
      return false;
    }

    // If login is required but user is not authenticated, hide the tab
    if (setting.requires_login && !user) {
      return false;
    }

    return true;
  }, [settings, user]);

  return (
    <TabVisibilityContext.Provider value={{ isTabVisible, loading }}>
      {children}
    </TabVisibilityContext.Provider>
  );
};

// Helper function to map user role to RoleKey
function getUserRole(role: string): RoleKey {
  switch (role) {
    case 'admin':
      return 'admin';
    case 'player_manager':
      return 'player_manager';
    case 'referee':
      return 'referee';
    default:
      return 'public';
  }
}

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
  | "scheidsrechters"
  | "admin_match_forms_league"
  | "admin_match_forms_cup"
  | "admin_match_forms_playoffs";
