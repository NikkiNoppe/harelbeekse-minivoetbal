
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/components/ui/tabs";
import { useTabVisibility, TabName } from "@shared/context/TabVisibilityContext";
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
      <div className="w-full flex justify-center items-center py-12">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-purple-600 font-medium">Tabs laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      {/* Page Title */}
      <div className="text-center space-y-4 py-8">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-purple-800 mb-4">
          Harelbeekse Minivoetbal
        </h1>
        <p className="text-lg text-purple-600 max-w-3xl mx-auto leading-relaxed">
          Welkom bij de officiële website van de Harelbeekse Minivoetbal Competitie. 
          Hier vind je alle informatie over wedstrijden, standen en meer.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabName)} className="w-full">
        <TabsList className="grid w-full gap-1 p-1 bg-white border-2 border-purple-200 rounded-lg shadow-sm" 
                 style={{ gridTemplateColumns: `repeat(${Math.min(visibleTabs.length, 4)}, 1fr)` }}>
          {visibleTabs.map((tab) => (
            <TabsTrigger 
              key={tab.key} 
              value={tab.key} 
              className="flex-1 px-3 py-2 sm:px-4 sm:py-3 rounded-md font-medium text-purple-600 hover:text-purple-800 hover:bg-purple-50 transition-all duration-200 data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              <TabItem value={tab.key} label={tab.label} icon={tab.icon} />
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-8">
          {isTabVisible("algemeen") && (
            <TabsContent value="algemeen" className="mt-0">
              <div className="bg-white border-2 border-purple-200 rounded-lg shadow-sm">
                <AlgemeenTab />
              </div>
            </TabsContent>
          )}
          
          {isTabVisible("beker") && (
            <TabsContent value="beker" className="mt-0">
              <div className="bg-white border-2 border-purple-200 rounded-lg shadow-sm">
                <CupTab />
              </div>
            </TabsContent>
          )}
          
          {isTabVisible("competitie") && (
            <TabsContent value="competitie" className="mt-0">
              <div className="bg-white border-2 border-purple-200 rounded-lg shadow-sm">
                <CompetitionTab />
              </div>
            </TabsContent>
          )}
          
          {isTabVisible("playoff") && (
            <TabsContent value="playoff" className="mt-0">
              <div className="bg-white border-2 border-purple-200 rounded-lg shadow-sm">
                <PlayOffTab />
              </div>
            </TabsContent>
          )}
          
          {isTabVisible("reglement") && (
            <TabsContent value="reglement" className="mt-0">
              <div className="bg-white border-2 border-purple-200 rounded-lg shadow-sm">
                <RegulationsTab />
              </div>
            </TabsContent>
          )}
          
          {isTabVisible("schorsingen") && (
            <TabsContent value="schorsingen" className="mt-0">
              <div className="bg-white border-2 border-purple-200 rounded-lg shadow-sm">
                <SuspensionsTab />
              </div>
            </TabsContent>
          )}
          
          {isTabVisible("kaarten") && (
            <TabsContent value="kaarten" className="mt-0">
              <div className="bg-white border-2 border-purple-200 rounded-lg shadow-sm">
                <CardsTab />
              </div>
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
};

export default MainTabs;
