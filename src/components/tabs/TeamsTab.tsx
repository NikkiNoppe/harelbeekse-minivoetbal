import React from "react";
import {
  Card,
  CardSection,
  Title,
  Text,
  Group,
  Badge as MantineBadge,
  Skeleton as MantineSkeleton,
  SimpleGrid,
  Stack,
  Box
} from "@mantine/core";
import { Users, Phone, Mail, Palette, Shield } from "lucide-react";
import { useTeams } from "@/hooks/useTeams";

const TeamsTab: React.FC = () => {
  const { data: teams, isLoading, error, refetch } = useTeams();

  const LoadingSkeleton = () => (
    <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md" data-testid="team-skeleton">
      {[...Array(6)].map((_, i) => (
        <Card key={i} shadow="sm" radius="md" p="md" withBorder>
          <CardSection>
            <Group gap={8}>
              <MantineSkeleton height={32} width={32} radius={16} />
              <MantineSkeleton height={20} width={120} radius="sm" />
            </Group>
            <MantineSkeleton height={16} width={80} mt={8} radius="sm" />
            <MantineSkeleton height={16} width={120} mt={8} radius="sm" />
            <MantineSkeleton height={16} width={120} mt={8} radius="sm" />
          </CardSection>
        </Card>
      ))}
    </SimpleGrid>
  );

  const ErrorState = () => (
    <Card shadow="sm" radius="md" p="md" withBorder>
      <CardSection>
        <Stack align="center" gap={8}>
          <Shield size={32} color="#ef4444" />
          <Title order={4} size="h4" c="red">Fout bij laden</Title>
          <Text c="red" size="sm">{error?.message || 'Er is een fout opgetreden bij het laden van teams'}</Text>
          <MantineBadge color="red" variant="light" size="md" onClick={() => refetch()} style={{ cursor: 'pointer' }}>
            Opnieuw proberen
          </MantineBadge>
        </Stack>
      </CardSection>
    </Card>
  );

  function getBadgeColorClass(clubColor: string) {
    if (!clubColor) return 'gray.2';
    const key = clubColor.trim().toLowerCase();
    const colorMap: Record<string, string> = {
      'lichtblauw': 'blue.1',
      'blauw': 'blue.6',
      'muntgroen': 'green.2',
      'groen': 'green.6',
      'rood': 'red.6',
      'geel': 'yellow.4',
      'paars': 'grape.6',
      'oranje': 'orange.4',
      'zwart': 'dark.8',
      'wit': 'gray.1',
    };
    if (colorMap[key]) return colorMap[key];
    for (const k in colorMap) {
      if (key.includes(k)) return colorMap[k];
    }
    return 'gray.2';
  }

  const TeamCard = React.memo(({ team }: { team: any }) => {
    return (
      <Card shadow="sm" radius="md" p="md" withBorder>
        <CardSection>
          <Group justify="space-between" align="center">
            <Group gap={8}>
              <Box w={32} h={32} bg="grape.1" style={{ borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={16} color="#a21caf" />
              </Box>
              <Title order={4} size="h4">{team.team_name}</Title>
            </Group>
            {team.club_colors && (
              <MantineBadge color={getBadgeColorClass(team.club_colors)} variant="light" size="sm" leftSection={<Palette size={12} style={{ marginRight: 4 }} />}>
                {team.club_colors}
              </MantineBadge>
            )}
          </Group>
          <Stack gap={4} mt={8}>
            <Group gap={8}>
              <Users size={14} color="#a21caf" />
              <Text size="sm">{team.contact_person || <span style={{ color: '#aaa' }}>-</span>}</Text>
            </Group>
            <Group gap={8}>
              <Phone size={14} color="#22c55e" />
              <Text size="sm">{team.contact_phone || <span style={{ color: '#aaa' }}>-</span>}</Text>
            </Group>
            <Group gap={8}>
              <Mail size={14} color="#3b82f6" />
              <Text size="sm">{team.contact_email || <span style={{ color: '#aaa' }}>-</span>}</Text>
            </Group>
          </Stack>
        </CardSection>
      </Card>
    );
  });

  TeamCard.displayName = 'TeamCard';

  const Header = () => (
    <Group justify="space-between" align="center">
      <Title order={2} size="h2">
        <Group gap={8}>
          <Shield size={24} color="#a21caf" />
          Teams
        </Group>
      </Title>
    </Group>
  );

  if (isLoading) {
    return (
      <Stack gap={24}>
        <Header />
        <LoadingSkeleton />
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack gap={24}>
        <Header />
        <ErrorState />
      </Stack>
    );
  }

  return (
    <Stack gap={24}>
      <Header />
      <Box>
        {!teams || teams.length === 0 ? (
          <Card shadow="sm" radius="md" p="md" withBorder>
            <CardSection>
              <Stack align="center" gap={8}>
                <Box w={64} h={64} bg="grape.1" style={{ borderRadius: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={32} color="#a21caf" />
                </Box>
                <Title order={4} size="h4" c="grape.8">Geen teams gevonden</Title>
                <Text c="grape.6">Er zijn momenteel geen teams geregistreerd.</Text>
              </Stack>
            </CardSection>
          </Card>
        ) : (
          <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
            {teams.map((team) => (
              <TeamCard key={team.team_id} team={team} />
            ))}
          </SimpleGrid>
        )}
      </Box>
    </Stack>
  );
};

export default TeamsTab; 