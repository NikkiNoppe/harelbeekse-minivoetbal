
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { MatchFormData } from "../types";

interface MatchHeaderProps {
  match: MatchFormData;
}

export const MatchHeader: React.FC<MatchHeaderProps> = ({ match }) => {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary text-white">
              {match.uniqueNumber}
            </Badge>
            {match.isLocked && <Lock className="h-4 w-4 text-gray-500" />}
          </div>
          <div className="text-sm text-muted-foreground">
            {match.date} om {match.time} - {match.location}
            {match.matchday && ` | ${match.matchday}`}
          </div>
        </div>
        <CardTitle className="text-lg">
          {match.homeTeamName} vs {match.awayTeamName}
        </CardTitle>
      </CardHeader>
    </Card>
  );
};
