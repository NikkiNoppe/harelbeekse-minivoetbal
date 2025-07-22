
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
    <div className="responsive-table-container">
      <div className="competitie-standings-table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="competitie-header competitie-sticky-column" style={{ left: 0, width: '64px' }}>
                Pos
              </TableHead>
              <TableHead className="competitie-header competitie-sticky-column text-left" style={{ left: '64px', minWidth: '150px' }}>
                Team
              </TableHead>
              <TableHead className="competitie-header">Wed</TableHead>
              <TableHead className="competitie-header">W</TableHead>
              <TableHead className="competitie-header">G</TableHead>
              <TableHead className="competitie-header">V</TableHead>
              <TableHead className="competitie-header">+/-</TableHead>
              <TableHead className="competitie-header">Ptn</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.map((team, index) => (
              <TableRow 
                key={team.id} 
                className={`competitie-row ${index === 0 && !showPlayoff ? "first-position" : ""}`}
              >
                <TableCell className="competitie-cell competitie-sticky-column font-medium" style={{ left: 0 }}>
                  {index + 1}
                </TableCell>
                <TableCell className="competitie-cell competitie-sticky-column font-medium text-left" style={{ left: '64px' }}>
                  {team.name}
                </TableCell>
                <TableCell className="competitie-cell">{team.played}</TableCell>
                <TableCell className="competitie-cell text-green-600 font-medium">{team.won}</TableCell>
                <TableCell className="competitie-cell text-yellow-600 font-medium">{team.draw}</TableCell>
                <TableCell className="competitie-cell text-red-600 font-medium">{team.lost}</TableCell>
                <TableCell className="competitie-cell">
                  <span className={
                    team.goalDiff > 0 ? "text-green-600 font-medium" : 
                    team.goalDiff < 0 ? "text-red-600 font-medium" : ""
                  }>
                    {team.goalDiff > 0 ? "+" : ""}{team.goalDiff}
                  </span>
                </TableCell>
                <TableCell className="competitie-cell font-bold">{team.points}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ResponsiveStandingsTable;
