
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
    <div className="table">
      <Table stickyColumns={2}>
        <TableHeader>
          <TableRow>
            <TableHead sticky stickyLeft={0} className="w-32 text-left">
              Speeldag
            </TableHead>
            <TableHead sticky stickyLeft={128} className="min-w-[200px] text-center">
              Wedstrijd
            </TableHead>
            <TableHead className="w-24 text-left">Datum</TableHead>
            <TableHead className="w-20 text-left">Tijd</TableHead>
            <TableHead className="min-w-[120px] text-left">Locatie</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches.map(match => (
            <TableRow key={match.matchId}>
              <TableCell sticky stickyLeft={0} className="text-left">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{match.matchday}</span>
                </div>
              </TableCell>
              <TableCell sticky stickyLeft={128} className="min-w-[200px] text-center">
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium flex-1 text-left">{match.homeTeamName}</span>
                  {match.isCompleted && match.homeScore !== undefined && match.awayScore !== undefined ? (
                    <span className="font-bold px-2">
                      {match.homeScore} - {match.awayScore}
                    </span>
                  ) : (
                    <span className="px-2">vs</span>
                  )}
                  <span className="font-medium flex-1 text-right">{match.awayTeamName}</span>
                </div>
              </TableCell>
              <TableCell className="text-left">{match.date}</TableCell>
              <TableCell className="text-left">{match.time}</TableCell>
              <TableCell className="text-left">{match.location}</TableCell>
            </TableRow>
          ))}
          {matches.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                Geen wedstrijden gevonden met de huidige filters.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ResponsiveScheduleTable;
