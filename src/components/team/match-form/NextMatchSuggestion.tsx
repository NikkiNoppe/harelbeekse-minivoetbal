
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarCheck } from "lucide-react";
import { MatchFormData } from "./types";

interface NextMatchSuggestionProps {
  nextMatch: MatchFormData | null;
  onSelectMatch: (match: MatchFormData) => void;
}

const NextMatchSuggestion: React.FC<NextMatchSuggestionProps> = ({ 
  nextMatch, 
  onSelectMatch 
}) => {
  if (!nextMatch) return null;
  
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarCheck className="h-5 w-5 text-primary" />
          Eerstvolgende Wedstrijd
        </CardTitle>
        <CardDescription>
          Selecteer deze wedstrijd om direct naar het formulier te gaan
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div 
          className="border rounded-lg p-4 hover:bg-accent transition-colors cursor-pointer"
          onClick={() => onSelectMatch(nextMatch)}
        >
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div>
              <p className="font-medium text-lg">{nextMatch.homeTeamName} vs {nextMatch.awayTeamName}</p>
              <p className="text-sm text-muted-foreground">
                {nextMatch.date} om {nextMatch.time} - {nextMatch.location}
              </p>
            </div>
            <div>
              <Badge variant="outline" className="bg-primary text-white">
                {nextMatch.uniqueNumber}
              </Badge>
              <p className="text-xs mt-1 text-muted-foreground">
                {nextMatch.isHomeTeam ? "Thuiswedstrijd" : "Uitwedstrijd"}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NextMatchSuggestion;
