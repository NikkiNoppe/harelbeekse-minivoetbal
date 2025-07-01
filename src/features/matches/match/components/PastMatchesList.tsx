
import React from "react";
import { PastMatch } from "../types";
import { Card, CardContent } from "@shared/components/ui/card";
import { Badge } from "@shared/components/ui/badge";
import { Calendar, MapPin, User } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/components/ui/table";

interface PastMatchesListProps {
  matches: PastMatch[];
}

export const PastMatchesList: React.FC<PastMatchesListProps> = ({ matches }) => {
  return (
    <div className="space-y-4">
      {matches.map((match) => (
        <Card key={match.id} className="p-4">
          <CardContent className="p-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {match.uniqueNumber && (
                  <Badge variant="outline">
                    {match.uniqueNumber}
                  </Badge>
                )}
                <span className="font-medium">
                  {match.homeTeam} vs {match.awayTeam}
                </span>
              </div>
              <div className="text-lg font-bold">
                {match.homeScore} - {match.awayScore}
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{match.date}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{match.location}</span>
              </div>
              {match.referee && (
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{match.referee}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
