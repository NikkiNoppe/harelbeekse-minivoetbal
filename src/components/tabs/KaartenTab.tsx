import React, { useState } from "react";
import {
  Card,
  CardSection,
  Title,
  Text,
  Group,
  Badge as MantineBadge,
  Button as MantineButton,
  Input as MantineInput,
  Select as MantineSelect,
  Loader as MantineLoader,
  SimpleGrid,
  Stack,
  Box
} from "@mantine/core";
import { Search, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchAllCards, CardData } from "@/services/match";
import { sortDatesDesc } from "@/lib/dateUtils";
import ResponsiveCardsTable from "../tables/ResponsiveCardsTable";

interface PlayerCardSummary {
  playerId: number;
  playerName: string;
  teamName: string;
  yellowCards: number;
  redCards: number;
  totalCards: number;
  isSuspended: boolean;
  suspensionReason?: string;
  cards: CardData[];
}

const KaartenTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [cardTypeFilter, setCardTypeFilter] = useState("");

  const { data: allCards, isLoading } = useQuery({
    queryKey: ['allCards'],
    queryFn: fetchAllCards
  });

  const playerCardSummaries: PlayerCardSummary[] = React.useMemo(() => {
    if (!allCards) return [];
    const playerGroups = allCards.reduce((acc, card) => {
      const key = `${card.playerId}-${card.playerName}`;
      if (!acc[key]) {
        acc[key] = {
          playerId: card.playerId,
          playerName: card.playerName,
          teamName: card.teamName,
          cards: []
        };
      }
      acc[key].cards.push(card);
      return acc;
    }, {} as Record<string, { playerId: number; playerName: string; teamName: string; cards: CardData[] }>);
    return Object.values(playerGroups).map(group => {
      const yellowCards = group.cards.filter(card => card.cardType === 'yellow').length;
      const redCards = group.cards.filter(card => card.cardType === 'red').length;
      let isSuspended = false;
      let suspensionReason = "";
      if (redCards > 0) {
        isSuspended = true;
        suspensionReason = `${redCards} rode kaart${redCards > 1 ? 'en' : ''}`;
      } else if (yellowCards >= 2) {
        isSuspended = true;
        suspensionReason = `${yellowCards} gele kaarten`;
      }
      return {
        playerId: group.playerId,
        playerName: group.playerName,
        teamName: group.teamName,
        yellowCards,
        redCards,
        totalCards: yellowCards + redCards,
        isSuspended,
        suspensionReason,
        cards: group.cards.sort((a, b) => sortDatesDesc(a.matchDate, b.matchDate))
      };
    }).sort((a, b) => b.totalCards - a.totalCards);
  }, [allCards]);

  const teamNames = [...new Set(allCards?.map(card => card.teamName) || [])];

  const filteredSummaries = playerCardSummaries.filter(summary => {
    if (searchTerm && !summary.playerName.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !summary.teamName.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (teamFilter && summary.teamName !== teamFilter) {
      return false;
    }
    if (cardTypeFilter === 'yellow' && summary.yellowCards === 0) {
      return false;
    }
    if (cardTypeFilter === 'red' && summary.redCards === 0) {
      return false;
    }
    if (cardTypeFilter === 'suspended' && !summary.isSuspended) {
      return false;
    }
    return true;
  });

  const totalYellowCards = allCards?.filter(card => card.cardType === 'yellow').length || 0;
  const totalRedCards = allCards?.filter(card => card.cardType === 'red').length || 0;
  const suspendedPlayers = playerCardSummaries.filter(p => p.isSuspended).length;

  return (
    <Stack gap={24}>
      <SimpleGrid cols={{ base: 1, md: 4 }} spacing="md">
        <Card shadow="sm" radius="md" p="md" withBorder>
          <CardSection>
            <Group gap={8}>
              <Box w={12} h={12} bg="yellow.5" style={{ borderRadius: 999 }} />
              <Box>
                <Title order={3} size="h3">{totalYellowCards}</Title>
                <Text size="sm" c="dimmed">Gele Kaarten</Text>
              </Box>
            </Group>
          </CardSection>
        </Card>
        <Card shadow="sm" radius="md" p="md" withBorder>
          <CardSection>
            <Group gap={8}>
              <Box w={12} h={12} bg="red.6" style={{ borderRadius: 999 }} />
              <Box>
                <Title order={3} size="h3">{totalRedCards}</Title>
                <Text size="sm" c="dimmed">Rode Kaarten</Text>
              </Box>
            </Group>
          </CardSection>
        </Card>
        <Card shadow="sm" radius="md" p="md" withBorder>
          <CardSection>
            <Group gap={8}>
              <AlertTriangle size={16} color="#f59e42" />
              <Box>
                <Title order={3} size="h3">{suspendedPlayers}</Title>
                <Text size="sm" c="dimmed">Geschorst</Text>
              </Box>
            </Group>
          </CardSection>
        </Card>
        <Card shadow="sm" radius="md" p="md" withBorder>
          <CardSection>
            <Group gap={8}>
              <Box w={12} h={12} bg="gray.6" style={{ borderRadius: 999 }} />
              <Box>
                <Title order={3} size="h3">{totalYellowCards + totalRedCards}</Title>
                <Text size="sm" c="dimmed">Totaal Kaarten</Text>
              </Box>
            </Group>
          </CardSection>
        </Card>
      </SimpleGrid>
      <Card shadow="sm" radius="md" p="md" withBorder>
        <CardSection>
          <Title order={2} size="h2">Kaarten Overzicht</Title>
          <Text size="sm" c="dimmed">Alle gele en rode kaarten uit wedstrijdformulieren</Text>
          <SimpleGrid cols={{ base: 1, md: 4 }} spacing="md" mt={16}>
            <Box>
              <Text size="sm" fw={500} mb={4}>Zoeken</Text>
              <MantineInput
                leftSection={<Search size={16} color="var(--mantine-color-grape-6)" />}
                placeholder="Speler of team..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.currentTarget.value)}
              />
            </Box>
            <Box>
              <Text size="sm" fw={500} mb={4}>Team</Text>
              <MantineSelect
                value={teamFilter}
                onChange={setTeamFilter}
                placeholder="Alle teams"
                data={[{ value: "", label: "Alle teams" }, ...teamNames.map(team => ({ value: team, label: team }))]}
              />
            </Box>
            <Box>
              <Text size="sm" fw={500} mb={4}>Kaarttype</Text>
              <MantineSelect
                value={cardTypeFilter}
                onChange={setCardTypeFilter}
                placeholder="Alle kaarten"
                data={[
                  { value: "", label: "Alle kaarten" },
                  { value: "yellow", label: "Gele kaarten" },
                  { value: "red", label: "Rode kaarten" },
                  { value: "suspended", label: "Geschorste spelers" }
                ]}
              />
            </Box>
            <Box display="flex" style={{ alignItems: 'flex-end' }}>
              <MantineButton
                variant="outline"
                color="grape"
                onClick={() => {
                  setSearchTerm("");
                  setTeamFilter("");
                  setCardTypeFilter("");
                }}
                w="100%"
              >
                Filters wissen
              </MantineButton>
            </Box>
          </SimpleGrid>
        </CardSection>
        <CardSection>
          {isLoading ? (
            <Group justify="center" align="center" h={128}>
              <MantineLoader size={32} color="grape" />
              <Text ml={8}>Kaarten laden...</Text>
            </Group>
          ) : (
            <ResponsiveCardsTable playerSummaries={filteredSummaries} />
          )}
        </CardSection>
      </Card>
    </Stack>
  );
};

export default KaartenTab; 