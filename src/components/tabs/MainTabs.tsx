
import React from "react";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { Award, FileText, Trophy, Ban, Info, Layers } from "lucide-react";
import CompetitionTab from "@/components/tabs/CompetitionTab";
import CupTab from "@/components/tabs/CupTab";
import SuspensionsTab from "@/components/tabs/SuspensionsTab";
import RegulationsTab from "@/components/tabs/RegulationsTab";
import AlgemeenTab from "@/components/tabs/AlgemeenTab";
import PlayOffTab from "@/components/tabs/PlayOffTab";
import TabItem from "@/components/tabs/TabItem";
import { useTabVisibility, TabName } from "@/context/TabVisibilityContext";
import { MOCK_TEAMS } from "@/data/mockData";

interface MainTabsProps {
  activeTab: TabName;
  setActiveTab: (tab: TabName) => void;
}

const MainTabs: React.FC<MainTabsProps> = ({ activeTab, setActiveTab }) => {
  const { isTabVisible } = useTabVisibility();

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabName)} className="w-full">
      <TabsList className="w-full flex mb-8 bg-secondary p-1 overflow-x-auto">
        {isTabVisible("algemeen") && <TabItem value="algemeen" icon={<Info />} label="Algemeen" />}
        {isTabVisible("competitie") && <TabItem value="competitie" icon={<Award />} label="Competitie" />}
        {isTabVisible("playoff") && <TabItem value="playoff" icon={<Layers />} label="Play-Off" />}
        {isTabVisible("beker") && <TabItem value="beker" icon={<Trophy />} label="Beker" />}
        {isTabVisible("schorsingen") && <TabItem value="schorsingen" icon={<Ban />} label="Schorsingen" />}
        {isTabVisible("reglement") && <TabItem value="reglement" icon={<FileText />} label="Reglement" />}
      </TabsList>
      <div className="animate-fade-in">
        {isTabVisible("algemeen") && <TabsContent value="algemeen"><AlgemeenTab /></TabsContent>}
        {isTabVisible("competitie") && <TabsContent value="competitie"><CompetitionTab teams={MOCK_TEAMS} /></TabsContent>}
        {isTabVisible("playoff") && <TabsContent value="playoff"><PlayOffTab /></TabsContent>}
        {isTabVisible("beker") && <TabsContent value="beker"><CupTab /></TabsContent>}
        {isTabVisible("schorsingen") && <TabsContent value="schorsingen"><SuspensionsTab /></TabsContent>}
        {isTabVisible("reglement") && <TabsContent value="reglement"><RegulationsTab /></TabsContent>}
      </div>
    </Tabs>
  );
};

export default MainTabs;
