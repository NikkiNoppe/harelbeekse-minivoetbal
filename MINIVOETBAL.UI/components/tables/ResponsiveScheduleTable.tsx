
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../MINIVOETBAL.UI/components/ui/table";
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
    <div className="responsive-schedule-table">
      <Table stickyColumns={2}>
        <TableHeader>
          <TableRow>
            <TableHead sticky stickyLeft={0} className="w-32">
              Speeldag
            </TableHead>
            <TableHead sticky stickyLeft={128} className="min-w-[200px]">
              Wedstrijd
            </TableHead>
            <TableHead className="w-24">Datum</TableHead>
            <TableHead className="w-20">Tijd</TableHead>
            <TableHead className="min-w-[120px]">Locatie</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches.map(match => (
            <TableRow key={match.matchId}>
              <TableCell sticky stickyLeft={0}>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">{match.matchday}</span>
                </div>
              </TableCell>
              <TableCell sticky stickyLeft={128} className="min-w-[200px]">
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-2 w-full">
                    <span className="font-medium text-sm flex-1 text-left">{match.homeTeamName}</span>
                    {match.isCompleted && match.homeScore !== undefined && match.awayScore !== undefined ? (
                      <span className="font-bold text-sm px-2">
                        {match.homeScore} - {match.awayScore}
                      </span>
                    ) : (
                      <span className="text-sm px-2">vs</span>
                    )}
                    <span className="font-medium text-sm flex-1 text-right">{match.awayTeamName}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-sm">{match.date}</TableCell>
              <TableCell className="text-sm">{match.time}</TableCell>
              <TableCell className="text-sm">{match.location}</TableCell>
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
