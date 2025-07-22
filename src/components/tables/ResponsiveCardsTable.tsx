
import React from "react";
import { Table, Badge } from "@mantine/core";
import { AlertTriangle } from "lucide-react";

interface PlayerCardSummary {
  playerId: number;
  playerName: string;
  teamName: string;
  yellowCards: number;
  redCards: number;
  totalCards: number;
  isSuspended: boolean;
  suspensionReason?: string;
  cards: {
    matchDate: string;
    cardType: 'yellow' | 'red';
    uniqueNumber: string;
  }[];
}

interface ResponsiveCardsTableProps {
  playerSummaries: PlayerCardSummary[];
}

const ResponsiveCardsTable: React.FC<ResponsiveCardsTableProps> = ({ playerSummaries }) => {
  return (
    <div style={{ overflowX: 'auto' }}>
      <Table striped highlightOnHover withTableBorder withColumnBorders>
        <Table.Thead>
          <Table.Tr>
            <Table.Th style={{ left: 0, minWidth: 120, position: 'sticky', background: '#fafafa', zIndex: 2 }}>Speler</Table.Th>
            <Table.Th style={{ left: 120, minWidth: 120, position: 'sticky', background: '#fafafa', zIndex: 2 }}>Team</Table.Th>
            <Table.Th style={{ textAlign: 'center', width: 96 }}>Geel</Table.Th>
            <Table.Th style={{ textAlign: 'center', width: 96 }}>Rood</Table.Th>
            <Table.Th style={{ textAlign: 'center', width: 80 }}>Tot</Table.Th>
            <Table.Th style={{ textAlign: 'center', width: 96 }}>Status</Table.Th>
            <Table.Th style={{ minWidth: 120 }}>Laatste</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {playerSummaries.map((summary) => (
            <Table.Tr key={`${summary.playerId}-${summary.playerName}`}>
              <Table.Td style={{ position: 'sticky', left: 0, background: '#fafafa', fontWeight: 500 }}>{summary.playerName}</Table.Td>
              <Table.Td style={{ position: 'sticky', left: 120, background: '#fafafa', fontWeight: 500 }}>{summary.teamName}</Table.Td>
              <Table.Td style={{ textAlign: 'center' }}>
                {summary.yellowCards > 0 && (
                  <Badge color="yellow" variant="light">{summary.yellowCards}</Badge>
                )}
              </Table.Td>
              <Table.Td style={{ textAlign: 'center' }}>
                {summary.redCards > 0 && (
                  <Badge color="red" variant="light">{summary.redCards}</Badge>
                )}
              </Table.Td>
              <Table.Td style={{ textAlign: 'center', fontWeight: 700 }}>{summary.totalCards}</Table.Td>
              <Table.Td style={{ textAlign: 'center' }}>
                {summary.isSuspended ? (
                  <Badge color="red" variant="filled" leftSection={<AlertTriangle size={12} style={{ marginRight: 4 }} />}>Geschorst</Badge>
                ) : (
                  <Badge color="green" variant="light">Actief</Badge>
                )}
              </Table.Td>
              <Table.Td>
                {summary.cards.length > 0 && (
                  <div style={{ fontSize: 13 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 4, background: summary.cards[0].cardType === 'yellow' ? '#fde047' : '#f87171' }}></div>
                      <span>{summary.cards[0].matchDate}</span>
                      <Badge color="gray" variant="light" size="xs">{summary.cards[0].uniqueNumber}</Badge>
                    </div>
                  </div>
                )}
              </Table.Td>
            </Table.Tr>
          ))}
          {playerSummaries.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={7} style={{ height: 96, textAlign: 'center' }}>
                Geen kaarten gevonden met de huidige filters.
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </div>
  );
};

export default ResponsiveCardsTable;
