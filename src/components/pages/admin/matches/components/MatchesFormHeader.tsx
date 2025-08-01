
import React, { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { MatchFormData } from "../types";

interface MatchesFormHeaderProps {
  match: MatchFormData;
}

const MatchesFormHeader: React.FC<MatchesFormHeaderProps> = ({ match }) => {
  // Memoize the match title to prevent unnecessary re-renders
  const matchTitle = useMemo(() => {
    return `${match.homeTeamName} vs ${match.awayTeamName}`;
  }, [match.homeTeamName, match.awayTeamName]);

  // Memoize the match date to prevent unnecessary re-renders
  const formattedDate = useMemo(() => {
    if (!match.date) return "";
    return new Date(match.date).toLocaleDateString('nl-NL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, [match.date]);

  return (
    <div className="text-center space-y-2 mb-6">
      <h1 className="text-3xl font-bold text-purple-light">
        {matchTitle}
      </h1>
      {formattedDate && (
        <p className="text-lg text-purple-600">
          {formattedDate}
        </p>
      )}
      {match.location && (
        <p className="text-md text-purple-500">
          📍 {match.location}
        </p>
      )}
    </div>
  );
};

export default React.memo(MatchesFormHeader);
