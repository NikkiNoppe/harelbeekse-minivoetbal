
import React from "react";
import { Badge } from "../../../MINIVOETBAL.UI/components/ui/badge";
import { Card, CardHeader, CardTitle } from "../../../MINIVOETBAL.UI/components/ui/card";
import { Lock } from "lucide-react";
import { MatchFormData } from "../types";

interface MatchHeaderProps {
  match: MatchFormData;
}

export const MatchHeader: React.FC<MatchHeaderProps> = ({ match }) => {
  return (
    <Card className="border-2" style={{ borderColor: "var(--purple-200)" }}>
      <CardHeader className="pb-4" style={{ background: "var(--main-color-dark)", borderTopLeftRadius: "0.5rem", borderTopRightRadius: "0.5rem" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" style={{ background: "var(--purple-200)", color: "var(--main-color-dark)", borderColor: "var(--purple-200)" }}>
              {match.uniqueNumber}
            </Badge>
            {match.isLocked && <Lock className="h-4 w-4 text-white opacity-50" />}
          </div>
          <div className="text-sm text-white">
            {match.date} om {match.time} - {match.location}
            {match.matchday && ` | ${match.matchday}`}
          </div>
        </div>
        <CardTitle className="text-lg text-white font-semibold">
          {match.homeTeamName} vs {match.awayTeamName}
        </CardTitle>
      </CardHeader>
    </Card>
  );
};
