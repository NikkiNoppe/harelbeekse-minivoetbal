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

export const MOCK_TEAMS = [
  {
    id: 1,
    name: "Garage Verbeke",
    email: "garage.verbeke@example.com",
    played: 10,
    won: 8,
    draw: 1,
    lost: 1,
    goalDiff: 15,
    points: 25
  }, {
    id: 2,
    name: "Shakthar Truu",
    email: "shakthar.truu@example.com",
    played: 10,
    won: 7,
    draw: 2,
    lost: 1,
    goalDiff: 12,
    points: 23
  }, {
    id: 3,
    name: "De Dageraad",
    email: "dageraad@example.com",
    played: 10,
    won: 6,
    draw: 2,
    lost: 2,
    goalDiff: 8,
    points: 20
  }, {
    id: 4,
    name: "Cafe De Gilde",
    email: "cafe.degilde@example.com",
    played: 10,
    won: 5,
    draw: 3,
    lost: 2,
    goalDiff: 6,
    points: 18
  }, {
    id: 5,
    name: "De Florre",
    email: "deflorre@example.com",
    played: 10,
    won: 4,
    draw: 4,
    lost: 2,
    goalDiff: 4,
    points: 16
  }, {
    id: 6,
    name: "Bemarmi Boys",
    email: "bemarmi.boys@example.com",
    played: 10,
    won: 4,
    draw: 2,
    lost: 4,
    goalDiff: 0,
    points: 14
  }
];

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
