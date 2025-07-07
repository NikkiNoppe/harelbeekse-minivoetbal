
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
    <div className="responsive-standings-table">
      <Table stickyColumns={2}>
        <TableHeader>
          <TableRow>
            <TableHead sticky stickyLeft={0} className="w-16 text-center bg-purple-600 z-20">
              Pos
            </TableHead>
            <TableHead sticky stickyLeft={64} className="min-w-[150px] text-left bg-purple-600 z-20">
              Team
            </TableHead>
            <TableHead className="text-center w-16 bg-purple-600">Wed</TableHead>
            <TableHead className="text-center w-12 bg-purple-600">W</TableHead>
            <TableHead className="text-center w-12 bg-purple-600">G</TableHead>
            <TableHead className="text-center w-12 bg-purple-600">V</TableHead>
            <TableHead className="text-center w-20 bg-purple-600">+/-</TableHead>
            <TableHead className="text-center w-16 bg-purple-600">Ptn</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams.map((team, index) => (
            <TableRow 
              key={team.id} 
              className={`hover:bg-purple-50 transition-colors ${index === 0 && !showPlayoff ? "bg-green-50 hover:bg-green-100" : ""}`}
            >
              <TableCell sticky stickyLeft={0} className="text-center font-medium bg-white z-10 border-r-2 border-purple-400">
                {index + 1}
              </TableCell>
              <TableCell sticky stickyLeft={64} className="font-medium min-w-[150px] bg-white z-10 border-r-2 border-purple-400">
                {team.name}
              </TableCell>
              <TableCell className="text-center">{team.played}</TableCell>
              <TableCell className="text-center text-green-600 font-medium">{team.won}</TableCell>
              <TableCell className="text-center text-yellow-600 font-medium">{team.draw}</TableCell>
              <TableCell className="text-center text-red-600 font-medium">{team.lost}</TableCell>
              <TableCell className="text-center">
                <span className={
                  team.goalDiff > 0 ? "text-green-600 font-medium" : 
                  team.goalDiff < 0 ? "text-red-600 font-medium" : ""
                }>
                  {team.goalDiff > 0 ? "+" : ""}{team.goalDiff}
                </span>
              </TableCell>
              <TableCell className="text-center font-bold text-lg">{team.points}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ResponsiveStandingsTable;
