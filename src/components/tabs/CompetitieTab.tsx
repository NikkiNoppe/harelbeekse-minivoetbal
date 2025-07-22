import React, { memo, useState, useMemo } from "react";
import {
  Card,
  CardSection,
  Title,
  Text,
  Group,
  Badge as MantineBadge,
  Button as MantineButton,
  Skeleton as MantineSkeleton,
  Input as MantineInput,
  Select as MantineSelect,
  Container,
  Stack,
  Box,
  Alert,
  SimpleGrid
} from "@mantine/core";
import { Search, AlertCircle } from "lucide-react";
import MatchCard from "../match/components/MatchCard";
import ResponsiveStandingsTable from "../tables/ResponsiveStandingsTable";
import ResponsiveScheduleTable from "../tables/ResponsiveScheduleTable";
import { useCompetitionData, Team, MatchData } from "@/hooks/useCompetitionData";

const StandingsTableSkeleton = memo(() => (
  <Stack gap={8}>
    {[...Array(6)].map((_, index) => (
      <Group key={index} justify="space-between" p={8}>
        <Group gap={12}>
          <MantineSkeleton height={24} width={24} radius={24} />
          <MantineSkeleton height={16} width={128} radius="sm" />
        </Group>
        <Group gap={24}>
          <MantineSkeleton height={16} width={32} radius="sm" />
          <MantineSkeleton height={16} width={32} radius="sm" />
          <MantineSkeleton height={16} width={32} radius="sm" />
          <MantineSkeleton height={16} width={32} radius="sm" />
        </Group>
      </Group>
    ))}
  </Stack>
));

const MatchCardSkeleton = memo(() => (
  <Card shadow="sm" radius="md" p="md" withBorder>
    <CardSection>
      <Group justify="space-between" mb="xs">
        <MantineSkeleton height={16} width={96} radius="sm" />
        <MantineSkeleton height={16} width={64} radius="sm" />
      </Group>
      <MantineSkeleton height={20} width={80} radius="sm" />
    </CardSection>
    <CardSection>
      <Group justify="space-between" py={8}>
        <MantineSkeleton height={16} width={80} radius="sm" />
        <MantineSkeleton height={24} width={32} radius="sm" />
        <MantineSkeleton height={16} width={80} radius="sm" />
      </Group>
      <MantineSkeleton height={12} width={96} mt={8} radius="sm" />
    </CardSection>
  </Card>
));

const MatchesGridSkeleton = memo(({ count = 4 }: { count?: number }) => (
  <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="md">
    {[...Array(count)].map((_, index) => (
      <MatchCardSkeleton key={index} />
    ))}
  </SimpleGrid>
));

const StandingsSection = memo(({ 
  teams, 
  isLoading, 
  error, 
  onRetry 
}: { 
  teams?: Team[]; 
  isLoading: boolean; 
  error: Error | null; 
  onRetry: () => void; 
}) => (
  <section>
    <Card shadow="sm" radius="md" p="md" withBorder>
      <CardSection>
        <Title order={3} size="h3">Competitiestand</Title>
      </CardSection>
      <CardSection>
        {isLoading ? (
          <StandingsTableSkeleton />
        ) : error ? (
          <Alert
            icon={<AlertCircle size={24} />}
            title="Fout bij laden"
            color="red"
            radius="md"
            withCloseButton={false}
            style={{ textAlign: 'center', marginBottom: 16 }}
          >
            <Text mb={8}>Er is een fout opgetreden bij het laden van de competitiestand.</Text>
            <MantineButton onClick={onRetry} color="grape" variant="filled">
              Opnieuw proberen
            </MantineButton>
          </Alert>
        ) : !teams || teams.length === 0 ? (
          <Alert
            icon={<AlertCircle size={24} />}
            title="Geen competitiestand"
            color="gray"
            radius="md"
            withCloseButton={false}
            style={{ textAlign: 'center', marginBottom: 16 }}
          >
            <Text size="sm">Nog geen competitiestand beschikbaar. Standings worden automatisch bijgewerkt wanneer wedstrijden worden ingediend.</Text>
          </Alert>
        ) : (
          <ResponsiveStandingsTable teams={teams} />
        )}
      </CardSection>
    </Card>
  </section>
));

const MatchesSection = memo(({ 
  title, 
  description, 
  matches, 
  isLoading 
}: { 
  title: string; 
  description: string; 
  matches: MatchData[]; 
  isLoading: boolean; 
}) => (
  <Card shadow="sm" radius="md" p="md" withBorder>
    <CardSection>
      <Title order={4} size="h4">{title}</Title>
      <Text size="sm" c="dimmed">{description}</Text>
    </CardSection>
    <CardSection>
      {isLoading ? (
        <MatchesGridSkeleton count={matches.length || 4} />
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="md">
          {matches.map(match => (
            <MatchCard
              key={match.matchId}
              id={match.uniqueNumber || `M${match.matchId}`}
              home={match.homeTeamName}
              away={match.awayTeamName}
              homeScore={match.homeScore}
              awayScore={match.awayScore}
              date={match.date}
              time={match.time}
              location={match.location}
              status={undefined}
              badgeSlot={<div></div>}
            />
          ))}
        </SimpleGrid>
      )}
    </CardSection>
  </Card>
));

const FilterControls = memo(({ 
  searchTerm, 
  setSearchTerm, 
  selectedMatchday, 
  setSelectedMatchday, 
  selectedTeam, 
  setSelectedTeam, 
  matchdays, 
  teamNames, 
  onClearFilters 
}: {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedMatchday: string;
  setSelectedMatchday: (day: string) => void;
  selectedTeam: string;
  setSelectedTeam: (team: string) => void;
  matchdays: string[];
  teamNames: string[];
  onClearFilters: () => void;
}) => (
  <Stack gap={16} mb={16}>
    <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
      <Box>
        <Text size="sm" fw={500} mb={4}>Filter op speeldag</Text>
        <MantineSelect
          value={selectedMatchday}
          onChange={setSelectedMatchday}
          placeholder="Alle speeldagen"
          data={[{ value: "all-matchdays", label: "Alle speeldagen" }, ...matchdays.map(day => ({ value: day, label: day }))]}
        />
      </Box>
      <Box>
        <Text size="sm" fw={500} mb={4}>Filter op team</Text>
        <MantineSelect
          value={selectedTeam}
          onChange={setSelectedTeam}
          placeholder="Alle teams"
          data={[{ value: "all-teams", label: "Alle teams" }, ...teamNames.map(team => ({ value: team, label: team }))]}
        />
      </Box>
      <Box>
        <Text size="sm" fw={500} mb={4}>Zoeken</Text>
        <MantineInput
          leftSection={<Search size={16} color="var(--mantine-color-grape-6)" />}
          placeholder="Zoek op team, locatie, etc."
          value={searchTerm}
          onChange={e => setSearchTerm(e.currentTarget.value)}
        />
      </Box>
    </SimpleGrid>
    <MantineButton variant="outline" color="grape" onClick={onClearFilters} w={{ base: '100%', md: 'auto' }}>
      Filters wissen
    </MantineButton>
  </Stack>
));

const CompetitieTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMatchday, setSelectedMatchday] = useState<string>("");
  const [selectedTeam, setSelectedTeam] = useState<string>("");

  const {
    teams,
    matches,
    matchdays,
    teamNames,
    standingsLoading,
    matchesLoading,
    standingsError,
    refetchStandings
  } = useCompetitionData();

  const filteredMatches = useMemo(() => {
    return matches.all.filter(match => {
      if (selectedMatchday && selectedMatchday !== "all-matchdays" && match.matchday !== selectedMatchday) {
        return false;
      }
      if (selectedTeam && selectedTeam !== "all-teams" && 
          match.homeTeamName !== selectedTeam && match.awayTeamName !== selectedTeam) {
        return false;
      }
      if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        return (
          match.homeTeamName.toLowerCase().includes(lowerSearchTerm) ||
          match.awayTeamName.toLowerCase().includes(lowerSearchTerm) ||
          match.matchday.toLowerCase().includes(lowerSearchTerm) ||
          (match.uniqueNumber && match.uniqueNumber.toLowerCase().includes(lowerSearchTerm))
        );
      }
      return true;
    });
  }, [matches.all, selectedMatchday, selectedTeam, searchTerm]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedMatchday("");
    setSelectedTeam("");
  };

  return (
    <Container size="md" py="xl">
      <Stack gap={32}>
        <Group justify="space-between" align="center">
          <Title order={2} size="h2">Competitiestand</Title>
          <MantineBadge color="grape" variant="light" size="lg">Seizoen 2025-2026</MantineBadge>
        </Group>
        <StandingsSection
          teams={teams}
          isLoading={standingsLoading}
          error={standingsError}
          onRetry={refetchStandings}
        />
        <MatchesSection
          title="Aankomende Wedstrijden"
          description="Wedstrijden van de komende speeldag"
          matches={matches.upcoming}
          isLoading={matchesLoading}
        />
        <MatchesSection
          title="Afgelopen Wedstrijden"
          description="Resultaten van de laatst gespeelde speeldag"
          matches={matches.past}
          isLoading={matchesLoading}
        />
        <Card shadow="sm" radius="md" p="md" withBorder>
          <CardSection>
            <Title order={4} size="h4">Speelschema</Title>
            <Text size="sm" c="dimmed">Volledig overzicht van alle wedstrijden</Text>
          </CardSection>
          <CardSection>
            <FilterControls
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedMatchday={selectedMatchday}
              setSelectedMatchday={setSelectedMatchday}
              selectedTeam={selectedTeam}
              setSelectedTeam={setSelectedTeam}
              matchdays={matchdays}
              teamNames={teamNames}
              onClearFilters={handleClearFilters}
            />
            <ResponsiveScheduleTable matches={filteredMatches} />
          </CardSection>
        </Card>
      </Stack>
    </Container>
  );
};

StandingsTableSkeleton.displayName = 'StandingsTableSkeleton';
MatchCardSkeleton.displayName = 'MatchCardSkeleton';
MatchesGridSkeleton.displayName = 'MatchesGridSkeleton';
StandingsSection.displayName = 'StandingsSection';
MatchesSection.displayName = 'MatchesSection';
FilterControls.displayName = 'FilterControls';

export default memo(CompetitieTab); 