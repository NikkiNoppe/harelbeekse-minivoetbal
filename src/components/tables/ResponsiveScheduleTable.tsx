
import React from "react";
import { Table } from "@mantine/core";
import { Calendar } from "lucide-react";

interface MatchData {
  matchId: number;
  matchday: string;
  date: string;
  time: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore?: number;
  awayScore?: number;
  location: string;
  isCompleted?: boolean;
}

interface ResponsiveScheduleTableProps {
  matches: MatchData[];
}

const ResponsiveScheduleTable: React.FC<ResponsiveScheduleTableProps> = ({ matches }) => {
  return (
    <div style={{ overflowX: 'auto' }}>
      <Table striped highlightOnHover withTableBorder withColumnBorders>
        <Table.Thead>
          <Table.Tr>
            <Table.Th style={{ left: 0, width: 128, position: 'sticky', background: '#fafafa', zIndex: 2 }}>Speeldag</Table.Th>
            <Table.Th style={{ left: 128, minWidth: 200, position: 'sticky', background: '#fafafa', zIndex: 2 }}>Wedstrijd</Table.Th>
            <Table.Th>Datum</Table.Th>
            <Table.Th>Tijd</Table.Th>
            <Table.Th>Locatie</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {matches.map(match => (
            <Table.Tr key={match.matchId}>
              <Table.Td style={{ left: 0, position: 'sticky', background: '#fafafa' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Calendar size={16} />
                  <span style={{ fontSize: 14 }}>{match.matchday}</span>
                </div>
              </Table.Td>
              <Table.Td style={{ left: 128, position: 'sticky', background: '#fafafa' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                    <span style={{ fontWeight: 500, fontSize: 14, flex: 1, textAlign: 'left' }}>{match.homeTeamName}</span>
                    {match.isCompleted && match.homeScore !== undefined && match.awayScore !== undefined ? (
                      <span style={{ fontWeight: 700, fontSize: 14, padding: '0 8px' }}>
                        {match.homeScore} - {match.awayScore}
                      </span>
                    ) : (
                      <span style={{ fontSize: 14, padding: '0 8px' }}>vs</span>
                    )}
                    <span style={{ fontWeight: 500, fontSize: 14, flex: 1, textAlign: 'right' }}>{match.awayTeamName}</span>
                  </div>
                </div>
              </Table.Td>
              <Table.Td style={{ fontSize: 14 }}>{match.date}</Table.Td>
              <Table.Td style={{ fontSize: 14 }}>{match.time}</Table.Td>
              <Table.Td style={{ fontSize: 14 }}>{match.location}</Table.Td>
            </Table.Tr>
          ))}
          {matches.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={5} style={{ height: 96, textAlign: 'center' }}>
                Geen wedstrijden gevonden met de huidige filters.
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </div>
  );
};

export default ResponsiveScheduleTable;
