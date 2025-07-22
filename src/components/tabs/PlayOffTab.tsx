import React, { memo } from "react";
import {
  Card,
  CardSection,
  Title,
  Text,
  Group,
  Badge as MantineBadge,
  Button as MantineButton,
  Skeleton as MantineSkeleton,
  SimpleGrid,
  Stack,
  Box,
  Alert
} from "@mantine/core";
import { AlertCircle, Trophy } from "lucide-react";
import AutoFitText from "@/components/ui/auto-fit-text";
import ResponsiveStandingsTable from "../tables/ResponsiveStandingsTable";
import { usePlayoffData, PlayoffMatch } from "@/hooks/usePlayoffData";
import { Team } from "@/hooks/useCompetitionData";

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

const PlayoffMatchSkeleton = memo(() => (
  <Card shadow="sm" radius="md" p="md" withBorder>
    <CardSection>
      <Group justify="space-between" mb="xs">
        <MantineSkeleton height={24} width={80} radius="sm" />
        <MantineSkeleton height={16} width={64} radius="sm" />
      </Group>
      <MantineSkeleton height={20} width={64} radius="sm" />
      <MantineSkeleton height={16} width={96} radius="sm" />
    </CardSection>
    <CardSection>
      <Group justify="space-between" py={8}>
        <MantineSkeleton height={16} width={80} radius="sm" />
        <MantineSkeleton height={24} width={48} radius="sm" />
        <MantineSkeleton height={16} width={80} radius="sm" />
      </Group>
    </CardSection>
  </Card>
));

const PlayoffMatchesSkeleton = memo(({ count = 6 }: { count?: number }) => (
  <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md" style={{ maxWidth: 900, margin: '0 auto' }}>
    {[...Array(count)].map((_, index) => (
      <PlayoffMatchSkeleton key={index} />
    ))}
  </SimpleGrid>
));

const PlayoffLoading = memo(() => (
  <Stack gap={32}>
    <Group justify="space-between" align="center">
      <Title order={2} size="h2">Eindklassement</Title>
      <MantineBadge color="grape" variant="light" size="lg">Seizoen 2025-2026</MantineBadge>
    </Group>
    <Card shadow="sm" radius="md" p="md" withBorder>
      <CardSection>
        <StandingsTableSkeleton />
      </CardSection>
    </Card>
    <Title order={2} size="h2">Uitslagen Play-Offs</Title>
    <PlayoffMatchesSkeleton count={9} />
  </Stack>
));

const PlayoffError = memo(({ error, onRetry }: { error: Error; onRetry: () => void }) => (
  <Alert
    icon={<AlertCircle size={24} />}
    title="Fout bij laden"
    color="red"
    radius="md"
    withCloseButton={false}
    style={{ textAlign: 'center', marginBottom: 16 }}
  >
    <Text mb={8}>Kon playoff gegevens niet laden</Text>
    <MantineButton onClick={onRetry} color="grape" variant="filled">
      Opnieuw proberen
    </MantineButton>
  </Alert>
));

const PlayoffStandingsSection = memo(({ teams }: { teams: Team[] }) => (
  <Card shadow="sm" radius="md" p="md" withBorder>
    <CardSection>
      <ResponsiveStandingsTable teams={teams} showPlayoff={true} />
    </CardSection>
  </Card>
));

const PlayoffMatchCard = memo(({ match }: { match: PlayoffMatch }) => (
  <Card shadow="sm" radius="md" p="md" withBorder>
    <CardSection>
      <Group justify="space-between" mb={4}>
        <MantineBadge color="grape" variant="light">{match.playoff}</MantineBadge>
        <Text size="sm" c="dimmed">{match.matchday}</Text>
      </Group>
      <Title order={4} size="h4">{match.date}</Title>
      <Text size="sm" c="dimmed">{match.location}</Text>
    </CardSection>
    <CardSection>
      <Group justify="space-between" py={8}>
        <Box style={{ maxWidth: '47%' }}>
          <AutoFitText 
            text={match.home}
            maxFontSize={16}
            minFontSize={7}
            className="font-medium"
            style={{ textAlign: 'left' }}
          />
        </Box>
        <Box px={12} py={4} bg="gray.1" style={{ borderRadius: 8, fontWeight: 700 }}>
          {match.result || 'VS'}
        </Box>
        <Box style={{ maxWidth: '47%' }}>
          <AutoFitText 
            text={match.away}
            maxFontSize={16}
            minFontSize={7}
            className="font-medium"
            style={{ textAlign: 'right' }}
          />
        </Box>
      </Group>
    </CardSection>
  </Card>
));

const PlayoffMatchesSection = memo(({ matches }: { matches: PlayoffMatch[] }) => (
  <Stack gap={16}>
    <Title order={2} size="h2">Uitslagen Play-Offs</Title>
    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md" style={{ maxWidth: 900, margin: '0 auto' }}>
      {matches.map((match, index) => (
        <PlayoffMatchCard key={index} match={match} />
      ))}
    </SimpleGrid>
  </Stack>
));

const UpcomingPlayoffMatches = memo(({ matches }: { matches: PlayoffMatch[] }) => (
  <Stack gap={16}>
    <Title order={2} size="h2">Aankomende Play-Off Wedstrijden</Title>
    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md" style={{ maxWidth: 900, margin: '0 auto' }}>
      {matches.map((match, index) => (
        <Card key={index} shadow="sm" radius="md" p="md" withBorder>
          <CardSection>
            <Group justify="space-between" mb={4}>
              <MantineBadge color="grape" variant="light">{match.playoff}</MantineBadge>
              <Text size="sm" c="dimmed">{match.matchday}</Text>
            </Group>
            <Title order={4} size="h4">
              <Group justify="space-between" align="center">
                <span>{match.date}</span>
                {match.time && (
                  <Text c="green" fw={500}>{match.time}</Text>
                )}
              </Group>
            </Title>
            <Text size="sm" c="dimmed">{match.location}</Text>
          </CardSection>
          <CardSection>
            <Group justify="space-between" py={8}>
              <Box style={{ maxWidth: '47%' }}>
                <AutoFitText 
                  text={match.home}
                  maxFontSize={16}
                  minFontSize={7}
                  className="font-medium"
                  style={{ textAlign: 'left' }}
                />
              </Box>
              <Box px={12} py={4} bg="gray.1" style={{ borderRadius: 8, fontWeight: 500 }}>
                VS
              </Box>
              <Box style={{ maxWidth: '47%' }}>
                <AutoFitText 
                  text={match.away}
                  maxFontSize={16}
                  minFontSize={7}
                  className="font-medium"
                  style={{ textAlign: 'right' }}
                />
              </Box>
            </Group>
          </CardSection>
        </Card>
      ))}
    </SimpleGrid>
  </Stack>
));

const PlayoffEmptyState = memo(() => (
  <Alert
    icon={<Trophy size={24} />}
    title="Geen Play-Off Data"
    color="gray"
    radius="md"
    withCloseButton={false}
    style={{ textAlign: 'center', marginBottom: 16 }}
  >
    <Text size="sm">Er zijn momenteel geen play-off gegevens beschikbaar.</Text>
  </Alert>
));

const PlayoffContent = memo(({ 
  teams, 
  matches, 
  upcomingMatches 
}: { 
  teams: Team[]; 
  matches: PlayoffMatch[]; 
  upcomingMatches: PlayoffMatch[]; 
}) => (
  <Stack gap={32}>
    <Group justify="space-between" align="center">
      <Title order={2} size="h2">Eindklassement</Title>
      <MantineBadge color="grape" variant="light" size="lg">Seizoen 2025-2026</MantineBadge>
    </Group>
    <PlayoffStandingsSection teams={teams} />
    {matches.length > 0 && <PlayoffMatchesSection matches={matches} />}
    {upcomingMatches.length > 0 && <UpcomingPlayoffMatches matches={upcomingMatches} />}
  </Stack>
));

const PlayOffTab: React.FC = () => {
  const { teams, matches, upcomingMatches, isLoading, error, refetch } = usePlayoffData();

  if (isLoading) {
    return <PlayoffLoading />;
  }
  if (error) {
    return <PlayoffError error={error} onRetry={() => refetch()} />;
  }
  if (!teams || teams.length === 0) {
    return <PlayoffEmptyState />;
  }
  return (
    <PlayoffContent 
      teams={teams} 
      matches={matches} 
      upcomingMatches={upcomingMatches} 
    />
  );
};

StandingsTableSkeleton.displayName = 'StandingsTableSkeleton';
PlayoffMatchSkeleton.displayName = 'PlayoffMatchSkeleton';
PlayoffMatchesSkeleton.displayName = 'PlayoffMatchesSkeleton';
PlayoffLoading.displayName = 'PlayoffLoading';
PlayoffError.displayName = 'PlayoffError';
PlayoffStandingsSection.displayName = 'PlayoffStandingsSection';
PlayoffMatchCard.displayName = 'PlayoffMatchCard';
PlayoffMatchesSection.displayName = 'PlayoffMatchesSection';
UpcomingPlayoffMatches.displayName = 'UpcomingPlayoffMatches';
PlayoffEmptyState.displayName = 'PlayoffEmptyState';
PlayoffContent.displayName = 'PlayoffContent';

export default memo(PlayOffTab);
