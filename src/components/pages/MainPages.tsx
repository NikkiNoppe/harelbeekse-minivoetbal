
import React, { memo, useMemo } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useTabVisibility, TabName } from "@/context/TabVisibilityContext";
import AlgemeenPage from "./public/information/AlgemeenPage";
import CompetitiePage from "./public/competition/CompetitiePage";
import PlayOffPage from "./public/competition/PlayOffPage";
import PublicBekerPage from "./public/competition/PublicBekerPage";

import KaartenPage from "./public/information/KaartenPage";
import ReglementPage from "./public/information/ReglementPage";
import TeamsPage from "./admin/teams/TeamsPage";
import ScheidsrechtersPage from "./admin/scheidsrechter/ScheidsrechtersPage";
import { useAuth } from "@/hooks/useAuth";
import MatchdayActionsBar from "./admin/matches/matchday-actions-bar";
import { useIsMobile } from "@/hooks/use-mobile";

interface MainPagesProps {
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
const MemoizedAlgemeenPage = memo(AlgemeenPage);
const MemoizedCompetitiePage = memo(CompetitiePage);
const MemoizedPlayOffPage = memo(PlayOffPage);
const MemoizedBekerPage = memo(PublicBekerPage);

const MemoizedKaartenPage = memo(KaartenPage);
const MemoizedReglementPage = memo(ReglementPage);
const MemoizedTeamsPage = memo(TeamsPage);
const MemoizedScheidsrechtersPage = memo(ScheidsrechtersPage);

MemoizedAlgemeenPage.displayName = 'MemoizedAlgemeenPage';
MemoizedCompetitiePage.displayName = 'MemoizedCompetitiePage';
MemoizedPlayOffPage.displayName = 'MemoizedPlayOffPage';
MemoizedBekerPage.displayName = 'MemoizedBekerPage';

MemoizedKaartenPage.displayName = 'MemoizedKaartenPage';
MemoizedReglementPage.displayName = 'MemoizedReglementPage';
MemoizedTeamsPage.displayName = 'MemoizedTeamsPage';
MemoizedScheidsrechtersPage.displayName = 'MemoizedScheidsrechtersPage';

// Tab content wrapper with animation
const TabContentWrapper = memo(({ children }: { children: React.ReactNode }) => (
  <div className="animate-fade-in">
    {children}
  </div>
));

TabContentWrapper.displayName = 'TabContentWrapper';

const MainPages: React.FC<MainPagesProps> = ({ activeTab, setActiveTab }) => {
  const { isTabVisible, loading } = useTabVisibility();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  // Memoize tab content components to prevent unnecessary re-renders
  const tabContents = useMemo(() => ({
    algemeen: isTabVisible("algemeen") && (
      <TabsContent value="algemeen" className="mt-0" key="algemeen">
        <TabContentWrapper>
          <MemoizedAlgemeenPage />
        </TabContentWrapper>
      </TabsContent>
    ),
    
    beker: isTabVisible("beker") && (
      <TabsContent value="beker" className="mt-0" key="beker">
        <TabContentWrapper>
          <MemoizedBekerPage />
        </TabContentWrapper>
      </TabsContent>
    ),
    
    competitie: isTabVisible("competitie") && (
      <TabsContent value="competitie" className="mt-0" key="competitie">
        <TabContentWrapper>
          <MemoizedCompetitiePage />
        </TabContentWrapper>
      </TabsContent>
    ),
    
    playoff: isTabVisible("playoff") && (
      <TabsContent value="playoff" className="mt-0" key="playoff">
        <TabContentWrapper>
          <MemoizedPlayOffPage />
        </TabContentWrapper>
      </TabsContent>
    ),
    
    reglement: isTabVisible("reglement") && (
      <TabsContent value="reglement" className="mt-0" key="reglement">
        <TabContentWrapper>
          <MemoizedReglementPage />
        </TabContentWrapper>
      </TabsContent>
    ),
    
    
    kaarten: isTabVisible("kaarten") && (
      <TabsContent value="kaarten" className="mt-0" key="kaarten">
        <TabContentWrapper>
          <MemoizedKaartenPage />
        </TabContentWrapper>
      </TabsContent>
    ),
    
    
    teams: isTabVisible("teams") && (
      <TabsContent value="teams" className="mt-0" key="teams">
        <TabContentWrapper>
          <MemoizedTeamsPage />
        </TabContentWrapper>
      </TabsContent>
    ),
    scheidsrechters: isTabVisible("scheidsrechters") && (
      <TabsContent value="scheidsrechters" className="mt-0" key="scheidsrechters">
        <TabContentWrapper>
          <MemoizedScheidsrechtersPage />
        </TabContentWrapper>
      </TabsContent>
    )
  }), [isTabVisible, user]);

  // Determine which tabs are available right now
  const visibleKeys = useMemo(() => {
    return (
      [
        'algemeen',
        'beker',
        'competitie',
        'playoff',
        'teams',
        'kaarten',
        'reglement',
        'scheidsrechters',
      ] as const
    ).filter((key) => Boolean((tabContents as any)[key]));
  }, [tabContents]);

  // Ensure the active tab is always a visible/available tab to avoid runtime issues
  const currentValue = useMemo(() => {
    return visibleKeys.includes(activeTab as any) ? activeTab : (visibleKeys[0] ?? 'algemeen');
  }, [activeTab, visibleKeys]);

  // Show loading state while fetching settings
  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
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
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Matchday Actions Bar - show on relevant pages for authenticated users on mobile */}
        {isMobile && user && ['competitie', 'beker', 'playoff', 'algemeen'].includes(currentValue) && (
          <MatchdayActionsBar />
        )}
        
        <Tabs 
          value={currentValue} 
          onValueChange={(value) => setActiveTab(value as TabName)} 
          className="w-full"
        >
          {tabContents.algemeen}
          {tabContents.beker}
          {tabContents.competitie}
          {tabContents.playoff}
          {tabContents.teams}
          {tabContents.kaarten}
          {tabContents.reglement}
          {tabContents.scheidsrechters}
        </Tabs>
      </div>
    </div>
  );
};

export default memo(MainPages);
