
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MatchFormData } from "./types";

interface MatchFormHeaderProps {
  selectedMatch: MatchFormData;
  onBackToOverview: () => void;
}

const MatchFormHeader: React.FC<MatchFormHeaderProps> = ({
  selectedMatch,
  onBackToOverview
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-medium">Wedstrijdformulier</h2>
        <Button variant="ghost" onClick={onBackToOverview}>
          Terug naar overzicht
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <Badge variant="outline" className="w-fit bg-primary text-white">
            {selectedMatch.uniqueNumber}
          </Badge>
          <CardTitle className="mt-2">
            {selectedMatch.homeTeamName} vs {selectedMatch.awayTeamName}
          </CardTitle>
          <CardDescription>
            {selectedMatch.date} om {selectedMatch.time} - {selectedMatch.location}
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
};

export default MatchFormHeader;
