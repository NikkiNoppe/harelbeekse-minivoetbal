import React, { memo } from "react";
import {
  Card,
  CardSection,
  Title,
  Text,
  Group,
  Button as MantineButton,
  Skeleton as MantineSkeleton,
  Alert,
  Container,
  Stack,
  Box,
  SimpleGrid
} from "@mantine/core";
import { Trophy, Award, AlertCircle } from "lucide-react";
import CupMatchCard from "../match/components/CupMatchCard";
import { useCupData, CupMatchDisplay } from "@/hooks/useCupData";

const MatchCardSkeleton = memo(() => (
  <Card shadow="sm" radius="md" p="md" withBorder>
    <CardSection>
      <Group justify="space-between" mb="xs">
        <MantineSkeleton height={16} width={96} radius="sm" />
        <MantineSkeleton height={16} width={64} radius="sm" />
      </Group>
      <MantineSkeleton height={20} width={128} radius="sm" />
    </CardSection>
    <CardSection>
      <Group justify="space-between" py={8}>
        <MantineSkeleton height={16} width={80} radius="sm" />
        <MantineSkeleton height={24} width={48} radius="sm" />
        <MantineSkeleton height={16} width={80} radius="sm" />
      </Group>
      <MantineSkeleton height={12} width={96} mt={8} radius="sm" />
    </CardSection>
  </Card>
));

const TournamentRoundSkeleton = memo(({ title, cardCount }: { title: string; cardCount: number }) => (
  <section>
    <Card shadow="sm" radius="md" p="md" withBorder>
      <CardSection>
        <Title order={4} size="h4">{title}</Title>
      </CardSection>
      <CardSection>
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="md">
          {[...Array(cardCount)].map((_, index) => (
            <MatchCardSkeleton key={index} />
          ))}
        </SimpleGrid>
      </CardSection>
    </Card>
  </section>
));

const TournamentRound = memo(({ 
  title, 
  matches, 
  emptyMessage, 
  gridCols = { base: 1, sm: 2, lg: 3, xl: 4 },
  roundName 
}: {
  title: string;
  matches: CupMatchDisplay[];
  emptyMessage: string;
  gridCols?: any;
  roundName: string;
}) => (
  <section>
    <Card shadow="sm" radius="md" p="md" withBorder>
      <CardSection>
        <Title order={4} size="h4">{title}</Title>
      </CardSection>
      <CardSection>
        {matches.length > 0 ? (
          <SimpleGrid cols={gridCols} spacing="md">
            {matches.map(match => (
              <CupMatchCard
                key={match.id}
                id={match.id}
                home={match.home}
                away={match.away}
                homeScore={match.homeScore}
                awayScore={match.awayScore}
                date={match.date}
                time={match.time}
                location={match.location}
                nextMatch={match.nextMatch}
                tournamentRound={roundName}
              />
            ))}
          </SimpleGrid>
        ) : (
          <Text ta="center" c="dimmed" my={32}>{emptyMessage}</Text>
        )}
      </CardSection>
    </Card>
  </section>
));

const TournamentInfo = memo(() => (
  <section>
    <Card shadow="sm" radius="md" p="md" withBorder>
      <CardSection>
        <Title order={4} size="h4">Toernooiinformatie</Title>
      </CardSection>
      <CardSection>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          <Box>
            <Group gap={8} mb={4}>
              <Trophy size={16} color="var(--mantine-color-grape-6)" />
              <Text fw={500}>Finaleinfo</Text>
            </Group>
            <Stack gap={2}>
              <Text size="sm"><strong>Datum:</strong> nog te bepalen</Text>
              <Text size="sm"><strong>Locatie:</strong> Dageraad Harelbeke</Text>
            </Stack>
          </Box>
          <Box>
            <Text fw={500} mb={4}>Toernooiformat</Text>
            <Stack gap={2}>
              <Text size="sm">• Knock-out systeem</Text>
              <Text size="sm">• Geen verlenging</Text>
              <Text size="sm">• Direct naar strafschoppen</Text>
            </Stack>
          </Box>
        </SimpleGrid>
      </CardSection>
    </Card>
  </section>
));

const TournamentLoading = memo(() => (
  <Container size="md" py="xl">
    <Stack gap={32}>
      <Group justify="space-between" align="center">
        <Title order={2} size="h2">
          <Group gap={8}>
            <Award size={20} />
            Beker 2025/2026
          </Group>
        </Title>
      </Group>
      <TournamentRoundSkeleton title="Achtste Finales" cardCount={8} />
      <TournamentRoundSkeleton title="Kwart Finales" cardCount={4} />
      <TournamentRoundSkeleton title="Halve Finales" cardCount={2} />
      <TournamentRoundSkeleton title="Finale" cardCount={1} />
    </Stack>
  </Container>
));

const TournamentError = memo(({ error, onRetry }: { error: Error; onRetry: () => void }) => (
  <Container size="md" py="xl">
    <Alert
      icon={<AlertCircle size={24} />}
      title="Fout bij laden"
      color="red"
      radius="md"
      withCloseButton={false}
      style={{ textAlign: 'center', marginBottom: 16 }}
    >
      <Text mb={8}>Kon toernooigegevens niet laden</Text>
      <MantineButton onClick={onRetry} color="grape" variant="filled">
        Opnieuw proberen
      </MantineButton>
    </Alert>
  </Container>
));

const TournamentEmpty = memo(() => (
  <Container size="md" py="xl">
    <Alert
      icon={<Trophy size={24} />}
      title="Geen Toernooi Actief"
      color="gray"
      radius="md"
      withCloseButton={false}
      style={{ textAlign: 'center', marginBottom: 16 }}
    >
      <Text size="sm">Er is momenteel geen bekertoernooi actief. Neem contact op met de beheerder om een toernooi aan te maken.</Text>
    </Alert>
  </Container>
));

const TournamentContent = memo(({ bracketData }: { bracketData: NonNullable<ReturnType<typeof useCupData>['bracketData']> }) => (
  <Container size="md" py="xl">
    <Stack gap={32}>
      <Group justify="space-between" align="center">
        <Title order={2} size="h2">
          <Group gap={8}>
            <Award size={20} />
            Beker 2025/2026
          </Group>
        </Title>
      </Group>
      <TournamentRound
        title="Achtste Finales"
        matches={bracketData.eighthfinals}
        emptyMessage="Geen achtste finales beschikbaar"
        roundName="Achtste Finale"
      />
      <TournamentRound
        title="Kwart Finales"
        matches={bracketData.quarterfinals}
        emptyMessage="Geen kwart finales beschikbaar"
        roundName="Kwart Finale"
      />
      <TournamentRound
        title="Halve Finales"
        matches={bracketData.semifinals}
        emptyMessage="Geen halve finales beschikbaar"
        gridCols={{ base: 1, md: 2 }}
        roundName="Halve Finale"
      />
      <section>
        <Card shadow="sm" radius="md" p="md" withBorder>
          <CardSection>
            <Title order={4} size="h4">
              <Group gap={8}>
                <Trophy size={20} />
                Finale
              </Group>
            </Title>
          </CardSection>
          <CardSection>
            {bracketData.final ? (
              <Box mx="auto" style={{ maxWidth: 400 }}>
                <CupMatchCard
                  id={bracketData.final.id}
                  home={bracketData.final.home}
                  away={bracketData.final.away}
                  homeScore={bracketData.final.homeScore}
                  awayScore={bracketData.final.awayScore}
                  date={bracketData.final.date}
                  time={bracketData.final.time}
                  location={bracketData.final.location}
                  tournamentRound="Finale"
                />
              </Box>
            ) : (
              <Text ta="center" c="dimmed" my={32}>
                Finale nog niet beschikbaar
              </Text>
            )}
          </CardSection>
        </Card>
      </section>
      <TournamentInfo />
    </Stack>
  </Container>
));

const BekerTab: React.FC = () => {
  const { isLoading, error, bracketData, hasData, refetch } = useCupData();

  if (isLoading) {
    return <TournamentLoading />;
  }
  if (error) {
    return <TournamentError error={error} onRetry={() => refetch()} />;
  }
  if (!hasData) {
    return <TournamentEmpty />;
  }
  return <TournamentContent bracketData={bracketData!} />;
};

MatchCardSkeleton.displayName = 'MatchCardSkeleton';
TournamentRoundSkeleton.displayName = 'TournamentRoundSkeleton';
TournamentRound.displayName = 'TournamentRound';
TournamentInfo.displayName = 'TournamentInfo';
TournamentLoading.displayName = 'TournamentLoading';
TournamentError.displayName = 'TournamentError';
TournamentEmpty.displayName = 'TournamentEmpty';
TournamentContent.displayName = 'TournamentContent';

export default memo(BekerTab); 