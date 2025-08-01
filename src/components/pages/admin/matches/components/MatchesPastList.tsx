
import React from "react";
import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { PastMatch } from '../types/matchesTypes';

interface PastMatchesListProps {
  matches: PastMatch[];
}

export const MatchesPastList: React.FC<PastMatchesListProps> = ({ matches }) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Datum</TableHead>
            <TableHead>Wedstrijd</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Locatie</TableHead>
            <TableHead>Scheidsrechter</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches.map((match) => (
            <TableRow key={match.id}>
              <TableCell>
                {match.uniqueNumber ? (
                  <Badge variant="outline" className="bg-primary text-white">
                    {match.uniqueNumber}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground text-sm">-</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {match.date}
                </div>
              </TableCell>
              <TableCell>
                {match.homeTeam} vs {match.awayTeam}
              </TableCell>
              <TableCell className="font-bold">
                {match.homeScore} - {match.awayScore}
              </TableCell>
              <TableCell>{match.location}</TableCell>
              <TableCell>{match.referee}</TableCell>
            </TableRow>
          ))}
          {matches.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                Geen wedstrijden gevonden.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
