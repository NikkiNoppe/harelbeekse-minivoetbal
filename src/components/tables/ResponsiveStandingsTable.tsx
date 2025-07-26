
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

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
  teams?: Team[];
  isLoading?: boolean;
}

const ResponsiveStandingsTable: React.FC<ResponsiveStandingsTableProps> = ({ teams, isLoading }) => {
  if (isLoading) {
    return (
      <Table className="table">
        <TableHeader>
          <TableRow className="table-header-row">
            <TableHead>Pos</TableHead>
            <TableHead>Team</TableHead>
            <TableHead>Wed</TableHead>
            <TableHead>W</TableHead>
            <TableHead>G</TableHead>
            <TableHead>V</TableHead>
            <TableHead>+/-</TableHead>
            <TableHead>Ptn</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, i) => (
            <TableRow key={i}>
              <TableCell className="table-skeleton-cell"><Skeleton className="h-4 w-8" /></TableCell>
              <TableCell className="table-skeleton-cell"><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell className="table-skeleton-cell"><Skeleton className="h-4 w-8" /></TableCell>
              <TableCell className="table-skeleton-cell"><Skeleton className="h-4 w-8" /></TableCell>
              <TableCell className="table-skeleton-cell"><Skeleton className="h-4 w-8" /></TableCell>
              <TableCell className="table-skeleton-cell"><Skeleton className="h-4 w-8" /></TableCell>
              <TableCell className="table-skeleton-cell"><Skeleton className="h-4 w-8" /></TableCell>
              <TableCell className="table-skeleton-cell"><Skeleton className="h-4 w-8" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  if (!teams) return null;

  return (
    <Table className="table">
      <TableHeader>
        <TableRow className="table-header-row">
          <TableHead className="num">Pos</TableHead>
          <TableHead className="left">Team</TableHead>
          <TableHead>Wed</TableHead>
          <TableHead>W</TableHead>
          <TableHead>G</TableHead>
          <TableHead>V</TableHead>
          <TableHead>+/-</TableHead>
          <TableHead>Ptn</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {teams.map((team, index) => (
          <TableRow key={team.id}>
            <TableCell className="num font-medium">{index + 1}</TableCell>
            <TableCell className="left font-medium">{team.name}</TableCell>
            <TableCell>{team.played}</TableCell>
            <TableCell className="text-green-600 font-medium">{team.won}</TableCell>
            <TableCell className="text-yellow-600 font-medium">{team.draw}</TableCell>
            <TableCell className="text-red-600 font-medium">{team.lost}</TableCell>
            <TableCell>
              <span className={
                team.goalDiff > 0 ? "text-green-600 font-medium" : 
                team.goalDiff < 0 ? "text-red-600 font-medium" : ""
              }>
                {team.goalDiff > 0 ? "+" : ""}{team.goalDiff}
              </span>
            </TableCell>
            <TableCell className="font-bold">{team.points}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ResponsiveStandingsTable;
