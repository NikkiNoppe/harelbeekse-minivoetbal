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

const TAB_CONFIG = [
  { id: "algemeen", icon: Info, label: "Algemeen", component: AlgemeenTab },
  { id: "competitie", icon: Award, label: "Competitie", component: CompetitionTab, props: { teams: MOCK_TEAMS } },
  { id: "playoff", icon: Layers, label: "Play-Off", component: PlayOffTab },
  { id: "beker", icon: Trophy, label: "Beker", component: CupTab },
  { id: "schorsingen", icon: Ban, label: "Schorsingen", component: SuspensionsTab },
  { id: "reglement", icon: FileText, label: "Reglement", component: RegulationsTab }
] as const;

const MainTabs: React.FC<MainTabsProps> = ({ activeTab, setActiveTab }) => {
  const { isTabVisible, loading } = useTabVisibility();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 sm:h-40">
        <div className="text-muted-foreground text-sm sm:text-base">Tabs laden...</div>
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={value => setActiveTab(value as TabName)} className="w-full">
      <TabsList className="w-full flex scrollbar-hide min-h-[40px]">
        {TAB_CONFIG.map(({ id, icon: Icon, label }) => 
          isTabVisible(id) && (
            <TabItem key={id} value={id} icon={<Icon />} label={label} />
          )
        )}
      </TabsList>
      
      <div className="animate-fade-in">
        {TAB_CONFIG.map(({ id, component: Component, props }) => 
          isTabVisible(id) && (
            <TabsContent key={id} value={id}>
              <Component {...props} />
            </TabsContent>
          )
        )}
      </div>
    </Tabs>
  );
};

export default MainTabs;