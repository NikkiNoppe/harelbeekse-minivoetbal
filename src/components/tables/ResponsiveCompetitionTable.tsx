
import React from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

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

interface ResponsiveCompetitionTableProps {
  teams: Team[];
}

const ResponsiveCompetitionTable: React.FC<ResponsiveCompetitionTableProps> = ({ teams }) => {
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
            <TableHead className="min-w-[80px]">+/-</TableHead>
            <TableHead className="min-w-[60px]">Ptn</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams.map((team, index) => (
            <TableRow key={team.id} className={index === 0 ? "bg-green-50" : ""}>
              <TableCell stickyLeft={true} className="font-bold text-center min-w-[50px]">
                {index + 1}
              </TableCell>
              <TableCell stickyLeft={true} className="font-medium min-w-[150px] left-[50px] sm:left-[66px] truncate pr-2">
                <div className="max-w-[120px] sm:max-w-none truncate" title={team.name}>
                  {team.name}
                </div>
              </TableCell>
              <TableCell className="text-center">{team.played}</TableCell>
              <TableCell className="text-center text-green-600 font-medium">{team.won}</TableCell>
              <TableCell className="text-center text-yellow-600 font-medium">{team.draw}</TableCell>
              <TableCell className="text-center text-red-600 font-medium">{team.lost}</TableCell>
              <TableCell className="text-center">
                <span className={team.goalDiff > 0 ? "text-green-600 font-medium" : team.goalDiff < 0 ? "text-red-600 font-medium" : ""}>
                  {team.goalDiff > 0 ? "+" : ""}{team.goalDiff}
                </span>
              </TableCell>
              <TableCell className="text-center font-bold text-base sm:text-lg">{team.points}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ResponsiveCompetitionTable;
