import React from 'react';
import { 
  Stack, 
  Group, 
  Text, 
  Table, 
  Badge,
  ActionIcon,
  Tabs
} from '@mantine/core';
import { MantineCard } from '@/components/mantine/MantineCard';
import { MantineButton } from '@/components/mantine/MantineButton';
import { Settings, Users, Trophy, Calendar } from 'lucide-react';

export const MantineDemo: React.FC = () => {
  const tableData = [
    { team: 'Team A', points: 24, matches: 8, goals: '15:3' },
    { team: 'Team B', points: 21, matches: 8, goals: '12:4' },
    { team: 'Team C', points: 18, matches: 8, goals: '10:6' },
  ];

  return (
    <Stack gap="lg" p="md">
      <Text size="xl" fw={600} c="purple.7">
        Mantine Design System Demo
      </Text>
      
      {/* Color Palette Demo */}
      <MantineCard>
        <Stack gap="md">
          <Text fw={500}>Kleurenpalet</Text>
          <Group gap="sm">
            <div style={{ 
              width: 60, 
              height: 60, 
              backgroundColor: '#e9e0ff',
              borderRadius: 8,
              border: '2px solid #ab86dd'
            }}>
              <Text size="xs" ta="center" mt="sm" c="purple.7">#e9e0ff</Text>
            </div>
            <div style={{ 
              width: 60, 
              height: 60, 
              backgroundColor: '#ab86dd',
              borderRadius: 8,
              border: '2px solid #60368c'
            }}>
              <Text size="xs" ta="center" mt="sm" c="white">#ab86dd</Text>
            </div>
            <div style={{ 
              width: 60, 
              height: 60, 
              backgroundColor: '#60368c',
              borderRadius: 8,
              border: '2px solid #ab86dd'
            }}>
              <Text size="xs" ta="center" mt="sm" c="white">#60368c</Text>
            </div>
          </Group>
        </Stack>
      </MantineCard>

      {/* Buttons Demo */}
      <MantineCard>
        <Stack gap="md">
          <Text fw={500}>Knoppen</Text>
          <Group gap="sm">
            <MantineButton variant="filled" color="purple">Primair</MantineButton>
            <MantineButton variant="outline" color="purple">Outline</MantineButton>
            <MantineButton variant="light" color="purple">Light</MantineButton>
            <ActionIcon variant="filled" color="purple" size="lg">
              <Settings size={16} />
            </ActionIcon>
          </Group>
        </Stack>
      </MantineCard>

      {/* Table Demo */}
      <MantineCard>
        <Stack gap="md">
          <Text fw={500}>Tabel Voorbeeld</Text>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Team</Table.Th>
                <Table.Th>Punten</Table.Th>
                <Table.Th>Wedstrijden</Table.Th>
                <Table.Th>Doelsaldo</Table.Th>
                <Table.Th>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {tableData.map((row, index) => (
                <Table.Tr key={row.team}>
                  <Table.Td>{row.team}</Table.Td>
                  <Table.Td>{row.points}</Table.Td>
                  <Table.Td>{row.matches}</Table.Td>
                  <Table.Td>{row.goals}</Table.Td>
                  <Table.Td>
                    <Badge 
                      color={index === 0 ? 'purple' : index === 1 ? 'blue' : 'gray'}
                      variant="light"
                    >
                      {index === 0 ? 'Leider' : index === 1 ? 'Top 3' : 'Actief'}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Stack>
      </MantineCard>

      {/* Tabs Demo */}
      <MantineCard>
        <Tabs defaultValue="algemeen" color="purple">
          <Tabs.List>
            <Tabs.Tab value="algemeen" leftSection={<Users size={16} />}>
              Algemeen
            </Tabs.Tab>
            <Tabs.Tab value="competitie" leftSection={<Trophy size={16} />}>
              Competitie
            </Tabs.Tab>
            <Tabs.Tab value="kalender" leftSection={<Calendar size={16} />}>
              Kalender
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="algemeen" pt="md">
            <Text>Algemene informatie over de voetbalcompetitie.</Text>
          </Tabs.Panel>
          
          <Tabs.Panel value="competitie" pt="md">
            <Text>Competitie standings en resultaten.</Text>
          </Tabs.Panel>
          
          <Tabs.Panel value="kalender" pt="md">
            <Text>Wedstrijdkalender en belangrijke data.</Text>
          </Tabs.Panel>
        </Tabs>
      </MantineCard>
    </Stack>
  );
};