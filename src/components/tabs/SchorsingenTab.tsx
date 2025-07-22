import React, { memo, useMemo, useState, useEffect } from "react";
import {
  Card,
  CardSection,
  Title,
  Text,
  Group,
  Badge as MantineBadge,
  Button as MantineButton,
  Skeleton as MantineSkeleton,
  Table as MantineTable,
  Stack,
  Box,
  Alert as MantineAlert
} from "@mantine/core";
import { AlertCircle, Shield, Trophy } from "lucide-react";
import { useSuspensionsData } from "@/hooks/useSuspensionsData";
import type { Suspension, PlayerCard } from "@/services";

const SuspensionsTableSkeleton = memo(() => (
  <MantineTable>
    <thead>
      <tr>
        <th>Speler</th>
        <th>Team</th>
        <th>Reden</th>
        <th>Aantal Wedstrijden</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      {[...Array(5)].map((_, i) => (
        <tr key={i}>
          <td><MantineSkeleton height={16} width={96} radius="sm" /></td>
          <td><MantineSkeleton height={16} width={80} radius="sm" /></td>
          <td><MantineSkeleton height={16} width={128} radius="sm" /></td>
          <td><MantineSkeleton height={16} width={32} radius="sm" /></td>
          <td><MantineSkeleton height={24} width={64} radius="sm" /></td>
        </tr>
      ))}
    </tbody>
  </MantineTable>
));

const PlayerCardsTableSkeleton = memo(() => (
  <MantineTable>
    <thead>
      <tr>
        <th>Speler</th>
        <th>Team</th>
        <th>Geel</th>
        <th>Rood</th>
      </tr>
    </thead>
    <tbody>
      {[...Array(5)].map((_, i) => (
        <tr key={i}>
          <td><MantineSkeleton height={16} width={96} radius="sm" /></td>
          <td><MantineSkeleton height={16} width={80} radius="sm" /></td>
          <td><MantineSkeleton height={16} width={48} radius="sm" /></td>
          <td><MantineSkeleton height={16} width={32} radius="sm" /></td>
        </tr>
      ))}
    </tbody>
  </MantineTable>
));

const StatusBadge = memo(({ status }: { status: 'active' | 'pending' | 'completed' }) => {
  const badgeProps = useMemo(() => {
    switch (status) {
      case 'active':
        return { children: 'Actief', color: 'red', variant: 'light' };
      case 'pending':
        return { children: 'In afwachting', color: 'yellow', variant: 'light' };
      case 'completed':
        return { children: 'Afgerond', color: 'green', variant: 'light' };
      default:
        return { children: 'Onbekend', color: 'gray', variant: 'light' };
    }
  }, [status]);
  return <MantineBadge {...badgeProps} />;
});

const CardDisplay = memo(({ count, color }: { count: number; color: string }) => (
  <Group gap={2} justify="center">
    {[...Array(count)].map((_, i) => (
      <Box key={i} w={12} h={20} bg={color} style={{ borderRadius: 4 }} />
    ))}
  </Group>
));

const ActiveSuspensionsTable = memo(({ suspensions }: { suspensions: Suspension[] }) => {
  const suspensionRows = useMemo(() =>
    suspensions.map((suspension, index) => (
      <tr key={`${suspension.playerId}-${index}`}>
        <td><Text fw={500}>{suspension.playerName}</Text></td>
        <td>{suspension.teamName}</td>
        <td>{suspension.reason}</td>
        <td style={{ textAlign: 'center' }}>{suspension.matches}</td>
        <td><StatusBadge status={suspension.status} /></td>
      </tr>
    )), [suspensions]);
  return (
    <MantineTable striped highlightOnHover>
      <thead>
        <tr>
          <th>Speler</th>
          <th>Team</th>
          <th>Reden</th>
          <th>Aantal Wedstrijden</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {suspensionRows.length > 0 ? suspensionRows : (
          <tr>
            <td colSpan={5} style={{ textAlign: 'center', padding: 32 }}>
              <Stack align="center" gap={8}>
                <Shield size={32} color="#22c55e" />
                <Text c="dimmed">Geen actieve schorsingen</Text>
              </Stack>
            </td>
          </tr>
        )}
      </tbody>
    </MantineTable>
  );
});

const PlayerCardsTable = memo(({ players }: { players: PlayerCard[] }) => {
  const playerRows = useMemo(() =>
    players.map(player => (
      <tr key={player.playerId}>
        <td>{player.playerName}</td>
        <td>{player.teamName}</td>
        <td style={{ textAlign: 'center' }}><CardDisplay count={player.yellowCards} color="yellow.5" /></td>
        <td style={{ textAlign: 'center' }}><CardDisplay count={player.redCards} color="red.6" /></td>
      </tr>
    )), [players]);
  return (
    <MantineTable striped highlightOnHover>
      <thead>
        <tr>
          <th>Speler</th>
          <th>Team</th>
          <th>Geel</th>
          <th>Rood</th>
        </tr>
      </thead>
      <tbody>
        {playerRows.length > 0 ? playerRows : (
          <tr>
            <td colSpan={4} style={{ textAlign: 'center', padding: 32 }}>
              <Stack align="center" gap={8}>
                <Trophy size={32} color="#3b82f6" />
                <Text c="dimmed">Geen kaarten geregistreerd</Text>
              </Stack>
            </td>
          </tr>
        )}
      </tbody>
    </MantineTable>
  );
});

const SuspensionRules = memo(() => {
  const [rules, setRules] = useState<any>(null);
  useEffect(() => {
    const loadRules = async () => {
      try {
        const { suspensionRulesService } = await import("@/services/suspensionRulesService");
        const suspensionRules = await suspensionRulesService.getSuspensionRules();
        setRules(suspensionRules);
      } catch (error) {
        console.error('Failed to load suspension rules:', error);
      }
    };
    loadRules();
  }, []);
  return (
    <Card shadow="sm" radius="md" p="md" withBorder>
      <CardSection>
        <Title order={4} size="h4">Huidige Schorsingsregels</Title>
      </CardSection>
      <CardSection>
        <Stack gap={8}>
          <Text fw={600}>Gele Kaarten</Text>
          <Text c="dimmed">Schorsingen na gele kaarten:</Text>
          <ul style={{ paddingLeft: 20, color: 'var(--mantine-color-dimmed)' }}>
            {rules?.yellow_card_rules?.map((rule: any, index: number) => (
              <li key={index}>
                {rule.min_cards === rule.max_cards
                  ? `${rule.min_cards} gele kaarten`
                  : `${rule.min_cards}-${rule.max_cards} gele kaarten`}: {rule.suspension_matches} wedstrijd{rule.suspension_matches > 1 ? 'en' : ''}
              </li>
            )) || (
              <>
                <li>2-3 gele kaarten: 1 wedstrijd schorsing</li>
                <li>4-5 gele kaarten: 2 opeenvolgende wedstrijden</li>
                <li>6+ gele kaarten: 3 opeenvolgende wedstrijden</li>
              </>
            )}
          </ul>
          <Text fw={600} mt={8}>Rode Kaarten</Text>
          <ul style={{ paddingLeft: 20, color: 'var(--mantine-color-dimmed)' }}>
            <li>Rode kaart: onmiddellijke uitsluiting ZONDER vervanging</li>
            <li>Minimum schorsing: {rules?.red_card_rules?.default_suspension_matches || 1} wedstrijd{(rules?.red_card_rules?.default_suspension_matches || 1) > 1 ? 'en' : ''}</li>
            {rules?.red_card_rules?.admin_can_modify && (
              <li>Admin kan schorsing aanpassen (max {rules.red_card_rules.max_suspension_matches} wedstrijden)</li>
            )}
          </ul>
          <Text fw={600} mt={8}>Beroepsprocedure</Text>
          <Text c="dimmed">Clubs kunnen binnen 7 werkdagen na de wedstrijd beroep aantekenen tegen een rode kaart.</Text>
          <Text c="dimmed">Dit gebeurd schriftelijk via noppe.nikki@icloud.com.</Text>
        </Stack>
      </CardSection>
    </Card>
  );
});

const ErrorState = memo(({ onRetry }: { onRetry: () => void }) => (
  <MantineAlert color="red" title="Fout bij laden" icon={<AlertCircle size={20} />}>
    <Group justify="space-between" align="center">
      <Text>Er is een fout opgetreden bij het laden van de schorsingsgegevens.</Text>
      <MantineButton variant="outline" size="sm" onClick={onRetry} color="red">
        Probeer opnieuw
      </MantineButton>
    </Group>
  </MantineAlert>
));

const SchorsingenTab: React.FC = () => {
  const {
    suspensions,
    topYellowCardPlayers,
    isLoading,
    hasError,
    refetchPlayerCards,
    refetchSuspensions
  } = useSuspensionsData();
  const handleRetry = () => {
    refetchPlayerCards();
    refetchSuspensions();
  };
  if (hasError) {
    return (
      <Stack gap={32}>
        <Group justify="space-between" align="center">
          <Title order={2} size="h2">Actuele Schorsingen</Title>
        </Group>
        <ErrorState onRetry={handleRetry} />
      </Stack>
    );
  }
  return (
    <Stack gap={32}>
      <Group justify="space-between" align="center">
        <Title order={2} size="h2">Actuele Schorsingen</Title>
      </Group>
      <Card shadow="sm" radius="md" p="md" withBorder>
        <CardSection>
          {isLoading ? (
            <SuspensionsTableSkeleton />
          ) : (
            <ActiveSuspensionsTable suspensions={suspensions || []} />
          )}
        </CardSection>
      </Card>
      <Title order={2} size="h2">Gele Kaarten Register</Title>
      <Group align="flex-start" gap={24}>
        <Card shadow="sm" radius="md" p="md" withBorder style={{ flex: 1 }}>
          <CardSection>
            <Title order={4} size="h4">Spelers met Meeste Gele Kaarten</Title>
          </CardSection>
          <CardSection>
            {isLoading ? (
              <PlayerCardsTableSkeleton />
            ) : (
              <PlayerCardsTable players={topYellowCardPlayers} />
            )}
          </CardSection>
        </Card>
        <Box style={{ flex: 1 }}>
          <SuspensionRules />
        </Box>
      </Group>
    </Stack>
  );
};

export default SchorsingenTab; 