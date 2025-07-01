
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Badge } from "@shared/components/ui/badge";
import { Button } from "@shared/components/ui/button";
import { Calendar, MapPin, Clock } from "lucide-react";

interface Match {
  match_id: number;
  unique_number: string;
  match_date: string;
  location: string;
  home_team_id: number;
  away_team_id: number;
}

interface MatchFormListProps {
  teamId: string;
  matches: Match[];
  loading: boolean;
}

const MatchFormList: React.FC<MatchFormListProps> = ({ teamId, matches, loading }) => {
  if (loading) {
    return <div className="text-center py-8">Loading matches...</div>;
  }

  if (matches.length === 0) {
    return <div className="text-center py-8">No matches found.</div>;
  }

  return (
    <div className="space-y-4">
      {matches.map((match) => (
        <Card key={match.match_id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Badge variant="outline">{match.unique_number}</Badge>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {new Date(match.match_date).toLocaleDateString()}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{match.location}</span>
              </div>
              <Button variant="outline" size="sm">
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MatchFormList;
