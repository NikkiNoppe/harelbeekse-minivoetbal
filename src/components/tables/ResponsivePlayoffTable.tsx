
import React from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

interface PlayoffTeam {
  position: number;
  name: string;
  played: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
}

interface ResponsivePlayoffTableProps {
  teams: PlayoffTeam[];
}

const ResponsivePlayoffTable: React.FC<ResponsivePlayoffTableProps> = ({ teams }) => {
  return (
    <div className="w-full">
      <Table stickyFirstColumn={true} stickyHeader={true}>
        <TableHeader>
          <TableRow>
            <TableHead stickyLeft={true} className="min-w-[50px]">Pos</TableHead>
            <TableHead stickyLeft={true} className="min-w-[150px] left-[50px] sm:left-[66px]">Team</TableHead>
            <TableHead className="min-w-[60px]">Wed</TableHead>
            <TableHead className="min-w-[40px]">W</TableHead>
            <TableHead className="min-w-[40px]">G</TableHead>
            <TableHead className="min-w-[40px]">V</TableHead>
            <TableHead className="min-w-[80px]">Doelpunten</TableHead>
            <TableHead className="min-w-[60px]">Ptn</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams.map((team) => (
            <TableRow key={team.name} className="hover:bg-muted/30">
              <TableCell stickyLeft={true} className="font-bold text-center min-w-[50px]">
                {team.position}
              </TableCell>
              <TableCell stickyLeft={true} className="font-medium min-w-[150px] left-[50px] sm:left-[66px] truncate pr-2">
                <div className="max-w-[120px] sm:max-w-none truncate" title={team.name}>
                  {team.name}
                </div>
              </TableCell>
              <TableCell className="text-center">{team.played}</TableCell>
              <TableCell className="text-center">{team.won}</TableCell>
              <TableCell className="text-center">{team.draw}</TableCell>
              <TableCell className="text-center">{team.lost}</TableCell>
              <TableCell className="text-center">{team.goalsFor}-{team.goalsAgainst}</TableCell>
              <TableCell className="text-center font-medium">{team.points}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ResponsivePlayoffTable;
