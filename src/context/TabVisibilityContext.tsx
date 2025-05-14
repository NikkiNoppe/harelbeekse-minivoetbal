
import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

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
};

// Creëer de context
export const TabVisibilityContext = createContext<TabVisibilityContextType | undefined>(undefined);

// Functie om instellingen uit localStorage te laden
const loadTabVisibilitySettings = (): TabVisibility => {
  try {
    const savedSettings = localStorage.getItem("tabVisibilitySettings");
    return savedSettings ? JSON.parse(savedSettings) : defaultTabVisibility;
  } catch (error) {
    console.error("Fout bij het laden van tab zichtbaarheid instellingen:", error);
    return defaultTabVisibility;
  }
};

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
  // Haal instellingen op uit localStorage of gebruik de standaardwaarden
  const [tabsVisibility, setTabsVisibility] = useState<TabVisibility>(loadTabVisibilitySettings);

  // Update de zichtbaarheid van een specifieke tab
  const updateTabVisibility = (tab: TabName, isVisible: boolean) => {
    setTabsVisibility(prev => ({
      ...prev,
      [tab]: isVisible
    }));
  };

  // Sla de instellingen op in localStorage
  const saveTabVisibilitySettings = () => {
    try {
      localStorage.setItem("tabVisibilitySettings", JSON.stringify(tabsVisibility));
      toast({
        title: "Instellingen opgeslagen",
        description: "De tab zichtbaarheid is succesvol bijgewerkt."
      });
    } catch (error) {
      console.error("Fout bij het opslaan van tab zichtbaarheid instellingen:", error);
      toast({
        title: "Fout bij opslaan",
        description: "Er is een probleem opgetreden bij het opslaan van de instellingen.",
        variant: "destructive"
      });
    }
  };

  // Reset naar standaard instellingen
  const resetToDefaults = () => {
    setTabsVisibility(defaultTabVisibility);
    localStorage.setItem("tabVisibilitySettings", JSON.stringify(defaultTabVisibility));
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
    resetToDefaults
  };

  return (
    <TabVisibilityContext.Provider value={value}>
      {children}
    </TabVisibilityContext.Provider>
  );
};
