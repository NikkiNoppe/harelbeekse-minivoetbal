
import React from "react";
import { Table } from "@mantine/core";

interface Team {
  id: number;
  name: string;
  played: number;
  won: number;
  draw: number;
  lost: number;
  goalDiff: number;
  points: number;
}

interface ResponsiveStandingsTableProps {
  teams: Team[];
  showPlayoff?: boolean;
}

const ResponsiveStandingsTable: React.FC<ResponsiveStandingsTableProps> = ({ 
  teams, 
  showPlayoff = false 
}) => {
  return (
    <div style={{ overflowX: 'auto' }}>
      <Table striped highlightOnHover withTableBorder withColumnBorders>
        <Table.Thead>
          <Table.Tr>
            <Table.Th style={{ left: 0, width: 64, position: 'sticky', background: '#fafafa', zIndex: 2 }}>Pos</Table.Th>
            <Table.Th style={{ left: 64, minWidth: 150, position: 'sticky', background: '#fafafa', zIndex: 2 }}>Team</Table.Th>
            <Table.Th>Wed</Table.Th>
            <Table.Th>W</Table.Th>
            <Table.Th>G</Table.Th>
            <Table.Th>V</Table.Th>
            <Table.Th>+/-</Table.Th>
            <Table.Th>Ptn</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {teams.map((team, index) => (
            <Table.Tr 
              key={team.id} 
              style={index === 0 && !showPlayoff ? { background: '#ede9fe' } : {}}
            >
              <Table.Td style={{ left: 0, position: 'sticky', background: '#fafafa', fontWeight: 500 }}>{index + 1}</Table.Td>
              <Table.Td style={{ left: 64, position: 'sticky', background: '#fafafa', fontWeight: 500 }}>{team.name}</Table.Td>
              <Table.Td>{team.played}</Table.Td>
              <Table.Td style={{ color: '#16a34a', fontWeight: 500 }}>{team.won}</Table.Td>
              <Table.Td style={{ color: '#ca8a04', fontWeight: 500 }}>{team.draw}</Table.Td>
              <Table.Td style={{ color: '#dc2626', fontWeight: 500 }}>{team.lost}</Table.Td>
              <Table.Td>
                <span style={{ color: team.goalDiff > 0 ? '#16a34a' : team.goalDiff < 0 ? '#dc2626' : undefined, fontWeight: 500 }}>
                  {team.goalDiff > 0 ? "+" : ""}{team.goalDiff}
                </span>
              </Table.Td>
              <Table.Td style={{ fontWeight: 700 }}>{team.points}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </div>
  );
};

export default ResponsiveStandingsTable;
