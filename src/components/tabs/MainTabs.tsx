
import React from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useTabVisibility, TabName } from "@/context/TabVisibilityContext";
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
