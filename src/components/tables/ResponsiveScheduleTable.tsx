
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
    <div className="w-full overflow-x-auto">
      <div className="min-w-[900px] sm:min-w-[1000px] md:min-w-[1100px] lg:min-w-[1200px]">
        <Table className="table w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="w-32 text-left whitespace-nowrap">Speeldag</TableHead>
              <TableHead className="min-w-[180px] sm:min-w-[220px] md:min-w-[260px] text-center whitespace-nowrap">Wedstrijd</TableHead>
            <TableHead className="w-24 text-left whitespace-nowrap">Datum</TableHead>
            <TableHead className="w-20 text-left whitespace-nowrap">Tijd</TableHead>
            <TableHead className="min-w-[140px] text-left whitespace-nowrap">Locatie</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches.map(match => (
            <TableRow key={match.matchId}>
              <TableCell className="text-left whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="whitespace-nowrap">{match.matchday}</span>
                </div>
              </TableCell>
                <TableCell className="min-w-[180px] sm:min-w-[220px] md:min-w-[260px] text-center">
                <div className="flex items-center justify-between w-full">
                    <span className="font-medium flex-1 text-left truncate max-w-[48%] sm:max-w-[46%] md:max-w-[45%]">
                    {match.homeTeamName}
                  </span>
                  {match.isCompleted && match.homeScore !== undefined && match.awayScore !== undefined ? (
                    <span className="font-bold px-2 whitespace-nowrap">
                      {match.homeScore} - {match.awayScore}
                    </span>
                  ) : (
                    <span className="px-2 whitespace-nowrap">vs</span>
                  )}
                    <span className="font-medium flex-1 text-right truncate max-w-[48%] sm:max-w-[46%] md:max-w-[45%]">
                    {match.awayTeamName}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-left whitespace-nowrap">{match.date}</TableCell>
              <TableCell className="text-left whitespace-nowrap">{match.time}</TableCell>
              <TableCell className="text-left whitespace-nowrap truncate max-w-[160px]">{match.location}</TableCell>
            </TableRow>
          ))}
          {matches.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                Geen wedstrijden gevonden.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ResponsiveScheduleTable;
