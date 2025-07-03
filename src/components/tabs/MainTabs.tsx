import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTabVisibility, TabName } from "@/context/TabVisibilityContext";
import { Home, Award, Trophy, Target, BookOpen, Ban, AlertTriangle } from "lucide-react";
import TabItem from "./TabItem";
import AlgemeenTab from "./AlgemeenTab";
import CompetitionTab from "./CompetitionTab";
import PlayOffTab from "./PlayOffTab";
import CupTab from "./CupTab";
import SuspensionsTab from "./SuspensionsTab";
import CardsTab from "./CardsTab";
import RegulationsTab from "./RegulationsTab";

interface MainTabsProps {
  activeTab: TabName;
  setActiveTab: (tab: TabName) => void;
}

const MainTabs: React.FC<MainTabsProps> = ({ activeTab, setActiveTab }) => {
  const { isTabVisible, loading } = useTabVisibility();

  // Define all possible tabs with their configurations in the original order
  const tabConfigs = [
    { key: "algemeen" as TabName, label: "Algemeen", icon: <Home size={16} /> },
    { key: "beker" as TabName, label: "Beker", icon: <Award size={16} /> },
    { key: "competitie" as TabName, label: "Competitie", icon: <Trophy size={16} /> },
    { key: "playoff" as TabName, label: "Play-off", icon: <Target size={16} /> },
    { key: "reglement" as TabName, label: "Reglement", icon: <BookOpen size={16} /> },
    { key: "schorsingen" as TabName, label: "Schorsingen", icon: <Ban size={16} /> },
    { key: "kaarten" as TabName, label: "Kaarten", icon: <AlertTriangle size={16} /> }
  ];

  // Filter visible tabs
  const visibleTabs = tabConfigs.filter(tab => isTabVisible(tab.key));

  // Show loading state while fetching settings
  if (loading) {
    return (
      <div className="w-full flex justify-center items-center py-8">
        <div className="text-purple-600">Tabs laden...</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Modern Full-Width Tabs */}
      <div className="w-full bg-white border-b border-purple-200 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabName)} className="w-full">
            <TabsList className="custom-tabs-list">
              <div className="custom-tabs-container">
                {visibleTabs.map((tab) => (
                  <TabsTrigger
                    key={tab.key}
                    value={tab.key}
                    className="custom-tab-trigger"
                  >
                    {tab.icon}
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                  </TabsTrigger>
                ))}
              </div>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabName)} className="w-full">
          <div className="animate-fade-in">
            {isTabVisible("algemeen") && (
              <TabsContent value="algemeen" className="mt-0">
                <AlgemeenTab />
              </TabsContent>
            )}
            
            {isTabVisible("beker") && (
              <TabsContent value="beker" className="mt-0">
                <CupTab />
              </TabsContent>
            )}
            
            {isTabVisible("competitie") && (
              <TabsContent value="competitie" className="mt-0">
                <CompetitionTab />
              </TabsContent>
            )}
            
            {isTabVisible("playoff") && (
              <TabsContent value="playoff" className="mt-0">
                <PlayOffTab />
              </TabsContent>
            )}
            
            {isTabVisible("reglement") && (
              <TabsContent value="reglement" className="mt-0">
                <RegulationsTab />
              </TabsContent>
            )}
            
            {isTabVisible("schorsingen") && (
              <TabsContent value="schorsingen" className="mt-0">
                <SuspensionsTab />
              </TabsContent>
            )}
            
            {isTabVisible("kaarten") && (
              <TabsContent value="kaarten" className="mt-0">
                <CardsTab />
              </TabsContent>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default MainTabs;
