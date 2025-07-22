
import React, { memo, useMemo } from "react";
import {
  Tabs as MantineTabs,
  Skeleton as MantineSkeleton,
  Container,
  Stack,
  Box,
  Group
} from "@mantine/core";
import { useTabVisibility, TabName } from "@/context/TabVisibilityContext";
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

const TabContentSkeleton = memo(() => (
  <Stack gap={24}>
    <Group justify="space-between" align="center">
      <MantineSkeleton height={32} width={192} radius="sm" />
      <MantineSkeleton height={40} width={96} radius="sm" />
    </Group>
    <Stack gap={16}>
      <MantineSkeleton height={256} width="100%" radius="sm" />
      <MantineSkeleton height={256} width="100%" radius="sm" />
    </Stack>
    <Stack gap={8}>
      <MantineSkeleton height={48} width="100%" radius="sm" />
      <MantineSkeleton height={48} width="100%" radius="sm" />
      <MantineSkeleton height={48} width="100%" radius="sm" />
    </Stack>
  </Stack>
));

TabContentSkeleton.displayName = 'TabContentSkeleton';

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

const TabContentWrapper = memo(({ children }: { children: React.ReactNode }) => (
  <Box>{children}</Box>
));

TabContentWrapper.displayName = 'TabContentWrapper';

const MainTabs: React.FC<MainTabsProps> = ({ activeTab, setActiveTab }) => {
  const { isTabVisible, loading } = useTabVisibility();

  const tabContents = useMemo(() => ({
    algemeen: isTabVisible("algemeen") && (
      <MantineTabs.Panel value="algemeen" key="algemeen">
        <TabContentWrapper>
          <MemoizedAlgemeenTab />
        </TabContentWrapper>
      </MantineTabs.Panel>
    ),
    beker: isTabVisible("beker") && (
      <MantineTabs.Panel value="beker" key="beker">
        <TabContentWrapper>
          <MemoizedBekerTab />
        </TabContentWrapper>
      </MantineTabs.Panel>
    ),
    competitie: isTabVisible("competitie") && (
      <MantineTabs.Panel value="competitie" key="competitie">
        <TabContentWrapper>
          <MemoizedCompetitieTab />
        </TabContentWrapper>
      </MantineTabs.Panel>
    ),
    playoff: isTabVisible("playoff") && (
      <MantineTabs.Panel value="playoff" key="playoff">
        <TabContentWrapper>
          <MemoizedPlayOffTab />
        </TabContentWrapper>
      </MantineTabs.Panel>
    ),
    reglement: isTabVisible("reglement") && (
      <MantineTabs.Panel value="reglement" key="reglement">
        <TabContentWrapper>
          <MemoizedReglementTab />
        </TabContentWrapper>
      </MantineTabs.Panel>
    ),
    schorsingen: isTabVisible("schorsingen") && (
      <MantineTabs.Panel value="schorsingen" key="schorsingen">
        <TabContentWrapper>
          <MemoizedSchorsingenTab />
        </TabContentWrapper>
      </MantineTabs.Panel>
    ),
    kaarten: isTabVisible("kaarten") && (
      <MantineTabs.Panel value="kaarten" key="kaarten">
        <TabContentWrapper>
          <MemoizedKaartenTab />
        </TabContentWrapper>
      </MantineTabs.Panel>
    ),
    teams: isTabVisible("teams") && (
      <MantineTabs.Panel value="teams" key="teams">
        <TabContentWrapper>
          <MemoizedTeamsTab />
        </TabContentWrapper>
      </MantineTabs.Panel>
    )
  }), [isTabVisible]);

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Stack gap={32}>
          <Group justify="center" align="center" py={32}>
            <MantineSkeleton height={24} width={24} radius={24} />
            <span style={{ color: 'var(--mantine-color-grape-6)' }}>Tabs laden...</span>
          </Group>
          <TabContentSkeleton />
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <MantineTabs value={activeTab} onChange={setActiveTab}>
        {tabContents.algemeen}
        {tabContents.beker}
        {tabContents.competitie}
        {tabContents.playoff}
        {tabContents.schorsingen}
        {tabContents.teams}
        {tabContents.kaarten}
        {tabContents.reglement}
      </MantineTabs>
    </Container>
  );
};

export default memo(MainTabs);
