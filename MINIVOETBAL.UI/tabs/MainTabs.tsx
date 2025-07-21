
import React, { memo, useMemo } from "react";
import { Tabs, TabsContent } from "../components/ui/tabs";
import { Skeleton } from "../components/ui/skeleton";
import { useTabVisibility, TabName } from "../context/TabVisibilityContext";
import AlgemeenTab from "./AlgemeenTab";
import CompetitieTab from "./CompetitieTab";
import PlayOffTab from "./PlayOffTab";
import BekerTab from "./BekerTab";
import SchorsingenTab from "./SchorsingenTab";
import KaartenTab from "./KaartenTab";
import ReglementTab from "./ReglementTab";
import TeamsTab from "./TeamsTab";

interface MainTabsProps {
  activeTab: TabName;
  setActiveTab: (tab: TabName) => void;
}

// Loading skeleton for tab content
const TabContentSkeleton = memo(() => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-24" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
    <div className="space-y-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  </div>
));

TabContentSkeleton.displayName = 'TabContentSkeleton';

// Memoized tab content components
const MemoizedAlgemeenTab = memo(AlgemeenTab);
const MemoizedCompetitieTab = memo(CompetitieTab);
const MemoizedPlayOffTab = memo(PlayOffTab);
const MemoizedBekerTab = memo(BekerTab);
const MemoizedSchorsingenTab = memo(SchorsingenTab);
const MemoizedKaartenTab = memo(KaartenTab);
const MemoizedReglementTab = memo(ReglementTab);
const MemoizedTeamsTab = memo(TeamsTab);

MemoizedAlgemeenTab.displayName = 'MemoizedAlgemeenTab';
MemoizedCompetitieTab.displayName = 'MemoizedCompetitieTab';
MemoizedPlayOffTab.displayName = 'MemoizedPlayOffTab';
MemoizedBekerTab.displayName = 'MemoizedBekerTab';
MemoizedSchorsingenTab.displayName = 'MemoizedSchorsingenTab';
MemoizedKaartenTab.displayName = 'MemoizedKaartenTab';
MemoizedReglementTab.displayName = 'MemoizedReglementTab';
MemoizedTeamsTab.displayName = 'MemoizedTeamsTab';

// Tab content wrapper with animation
const TabContentWrapper = memo(({ children }: { children: React.ReactNode }) => (
  <div className="animate-fade-in">
    {children}
  </div>
));

TabContentWrapper.displayName = 'TabContentWrapper';

const MainTabs: React.FC<MainTabsProps> = ({ activeTab, setActiveTab }) => {
  const { isTabVisible, loading } = useTabVisibility();

  // Memoize tab content components to prevent unnecessary re-renders
  const tabContents = useMemo(() => ({
    algemeen: isTabVisible("algemeen") && (
      <TabsContent value="algemeen" className="mt-0" key="algemeen">
        <TabContentWrapper>
          <MemoizedAlgemeenTab />
        </TabContentWrapper>
      </TabsContent>
    ),
    
    beker: isTabVisible("beker") && (
      <TabsContent value="beker" className="mt-0" key="beker">
        <TabContentWrapper>
          <MemoizedBekerTab />
        </TabContentWrapper>
      </TabsContent>
    ),
    
    competitie: isTabVisible("competitie") && (
      <TabsContent value="competitie" className="mt-0" key="competitie">
        <TabContentWrapper>
          <MemoizedCompetitieTab />
        </TabContentWrapper>
      </TabsContent>
    ),
    
    playoff: isTabVisible("playoff") && (
      <TabsContent value="playoff" className="mt-0" key="playoff">
        <TabContentWrapper>
          <MemoizedPlayOffTab />
        </TabContentWrapper>
      </TabsContent>
    ),
    
    reglement: isTabVisible("reglement") && (
      <TabsContent value="reglement" className="mt-0" key="reglement">
        <TabContentWrapper>
          <MemoizedReglementTab />
        </TabContentWrapper>
      </TabsContent>
    ),
    
    schorsingen: isTabVisible("schorsingen") && (
      <TabsContent value="schorsingen" className="mt-0" key="schorsingen">
        <TabContentWrapper>
          <MemoizedSchorsingenTab />
        </TabContentWrapper>
      </TabsContent>
    ),
    
    kaarten: isTabVisible("kaarten") && (
      <TabsContent value="kaarten" className="mt-0" key="kaarten">
        <TabContentWrapper>
          <MemoizedKaartenTab />
        </TabContentWrapper>
      </TabsContent>
    ),
    
    teams: isTabVisible("teams") && (
      <TabsContent value="teams" className="mt-0" key="teams">
        <TabContentWrapper>
          <MemoizedTeamsTab />
        </TabContentWrapper>
      </TabsContent>
    )
  }), [isTabVisible]);

  // Show loading state while fetching settings
  if (loading) {
    return (
      <div className="w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <div className="flex justify-center items-center py-8">
              <div className="text-purple-600 flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                <span>Tabs laden...</span>
              </div>
            </div>
            <TabContentSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as TabName)} 
          className="w-full"
        >
          {tabContents.algemeen}
          {tabContents.beker}
          {tabContents.competitie}
          {tabContents.playoff}
          {tabContents.schorsingen}
          {tabContents.teams}
          {tabContents.kaarten}
          {tabContents.reglement}
        </Tabs>
      </div>
    </div>
  );
};

export default memo(MainTabs);
