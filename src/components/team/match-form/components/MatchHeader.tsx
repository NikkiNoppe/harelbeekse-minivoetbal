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
    <Card className="border-2 border-purple-700 shadow-xl">
      <CardHeader className="pb-4 bg-purple-700 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-white text-purple-700 border-purple-300">
              {match.uniqueNumber}
            </Badge>
            {match.isLocked && <Lock className="h-4 w-4 text-purple-200" />}
          </div>
          <div className="text-sm text-purple-100">
            {match.date} om {match.time} - {match.location}
            {match.matchday && ` | ${match.matchday}`}
          </div>
        </div>
        <CardTitle className="text-lg text-white">
          {match.homeTeamName} vs {match.awayTeamName}
        </CardTitle>
      </CardHeader>
      {/* No CardContent here—keeps background clean */}
    </Card>
  );
};
