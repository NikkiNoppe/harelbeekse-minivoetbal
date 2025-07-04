
import React from "react";
import { Calendar } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

interface ScheduleMatch {
  matchId: number;
  matchday: string;
  date: string;
  time: string;
  homeTeamName: string;
  awayTeamName: string;
  location: string;
  homeScore?: number;
  awayScore?: number;
  isCompleted: boolean;
}

interface ResponsiveScheduleTableProps {
  matches: ScheduleMatch[];
}

const ResponsiveScheduleTable: React.FC<ResponsiveScheduleTableProps> = ({ matches }) => {
  return (
    <div className="w-full">
      <Table stickyFirstColumn={true} stickyHeader={true}>
        <TableHeader>
          <TableRow>
            <TableHead stickyLeft={true} className="min-w-[100px]">Speeldag</TableHead>
            <TableHead className="min-w-[80px]">Datum</TableHead>
            <TableHead className="min-w-[60px]">Tijd</TableHead>
            <TableHead className="min-w-[200px]">Wedstrijd</TableHead>
            <TableHead className="min-w-[120px]">Locatie</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches.map((match) => (
            <TableRow key={match.matchId}>
              <TableCell stickyLeft={true} className="min-w-[100px]">
                <div className="flex items-center gap-1 sm:gap-2">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="text-xs sm:text-sm truncate">{match.matchday}</span>
                </div>
              </TableCell>
              <TableCell className="text-xs sm:text-sm">{match.date}</TableCell>
              <TableCell className="text-xs sm:text-sm">{match.time}</TableCell>
              <TableCell className="min-w-[200px]">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                    <span className="font-medium truncate flex-1" title={match.homeTeamName}>
                      {match.homeTeamName}
                    </span>
                    {match.isCompleted && match.homeScore !== undefined && match.awayScore !== undefined ? (
                      <span className="font-bold text-center px-2 py-1 bg-muted rounded text-xs">
                        {match.homeScore} - {match.awayScore}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs px-2">vs</span>
                    )}
                    <span className="font-medium truncate flex-1 text-right" title={match.awayTeamName}>
                      {match.awayTeamName}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-xs sm:text-sm truncate" title={match.location}>
                {match.location}
              </TableCell>
            </TableRow>
          ))}
          {matches.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
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
