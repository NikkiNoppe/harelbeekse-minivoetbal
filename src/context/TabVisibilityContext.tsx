
import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTabVisibilitySettings } from "@/hooks/useTabVisibilitySettings";

// Definieert de beschikbare tabbladen
export type TabName = "algemeen" | "competitie" | "playoff" | "beker" | "schorsingen" | "reglement";

// Type definitie voor de zichtbaarheidsstate
export type TabVisibility = {
  [key in TabName]: boolean;
};

// De standaard tab zichtbaarheid
const defaultTabVisibility: TabVisibility = {
  algemeen: true,
  competitie: true,
  playoff: true,
  beker: true,
  schorsingen: true,
  reglement: true
};

// Type definitie voor de context
type TabVisibilityContextType = {
  tabsVisibility: TabVisibility;
  updateTabVisibility: (tab: TabName, isVisible: boolean) => void;
  saveTabVisibilitySettings: () => void;
  isTabVisible: (tab: TabName) => boolean;
  resetToDefaults: () => void;
  loading: boolean;
};

// Creëer de context
export const TabVisibilityContext = createContext<TabVisibilityContextType | undefined>(undefined);

// Hook om de context te gebruiken
export const useTabVisibility = (): TabVisibilityContextType => {
  const context = useContext(TabVisibilityContext);
  if (!context) {
    throw new Error("useTabVisibility moet binnen een TabVisibilityProvider worden gebruikt");
  }
  return context;
};

// Context provider component
export const TabVisibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const { settings, loading: settingsLoading } = useTabVisibilitySettings();
  const [tabsVisibility, setTabsVisibility] = useState<TabVisibility>(defaultTabVisibility);
  const [loading, setLoading] = useState(true);

  // Update local state when settings are loaded from Supabase
  useEffect(() => {
    if (!settingsLoading && settings.length > 0) {
      const newVisibility: TabVisibility = { ...defaultTabVisibility };
      
      settings.forEach(setting => {
        if (setting.setting_name in newVisibility) {
          newVisibility[setting.setting_name as TabName] = setting.is_visible;
        }
      });
      
      setTabsVisibility(newVisibility);
      setLoading(false);
    } else if (!settingsLoading) {
      // No settings found, use defaults
      setTabsVisibility(defaultTabVisibility);
      setLoading(false);
    }
  }, [settings, settingsLoading]);

  // Update de zichtbaarheid van een specifieke tab
  const updateTabVisibility = (tab: TabName, isVisible: boolean) => {
    setTabsVisibility(prev => ({
      ...prev,
      [tab]: isVisible
    }));
  };

  // Sla de instellingen op (deze functie wordt nu niet meer gebruikt, maar behouden voor compatibiliteit)
  const saveTabVisibilitySettings = () => {
    toast({
      title: "Info",
      description: "Tab instellingen worden automatisch opgeslagen in de admin instellingen."
    });
  };

  // Reset naar standaard instellingen
  const resetToDefaults = () => {
    setTabsVisibility(defaultTabVisibility);
    toast({
      title: "Instellingen hersteld",
      description: "De tab zichtbaarheid is teruggezet naar de standaardinstellingen."
    });
  };

  // Helper functie om te controleren of een tab zichtbaar is
  const isTabVisible = (tab: TabName): boolean => {
    return tabsVisibility[tab];
  };

  // Waarde van de context
  const value = {
    tabsVisibility,
    updateTabVisibility,
    saveTabVisibilitySettings,
    isTabVisible,
    resetToDefaults,
    loading
  };

  return (
    <TabVisibilityContext.Provider value={value}>
      {children}
    </TabVisibilityContext.Provider>
  );
};
