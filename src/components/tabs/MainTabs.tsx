
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTabVisibility, TabName } from "@/context/TabVisibilityContext";
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
  const { isTabVisible } = useTabVisibility();

  // Define all possible tabs with their configurations in the original order
  const tabConfigs = [
    { key: "algemeen" as TabName, label: "Algemeen", icon: "Home" },
    { key: "beker" as TabName, label: "Beker", icon: "Award" },
    { key: "competitie" as TabName, label: "Competitie", icon: "Trophy" },
    { key: "playoff" as TabName, label: "Play-off", icon: "Target" },
    { key: "reglement" as TabName, label: "Reglement", icon: "BookOpen" },
    { key: "schorsingen" as TabName, label: "Schorsingen", icon: "Ban" },
    { key: "kaarten" as TabName, label: "Kaarten", icon: "AlertTriangle" }
  ];

  // Filter visible tabs
  const visibleTabs = tabConfigs.filter(tab => isTabVisible(tab.key));

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabName)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-1 h-auto p-1">
          {visibleTabs.map((tab) => (
            <TabsTrigger key={tab.key} value={tab.key} className="flex-1">
              <TabItem value={tab.key} label={tab.label} icon={tab.icon} />
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-6">
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
  );
};

export default MainTabs;
