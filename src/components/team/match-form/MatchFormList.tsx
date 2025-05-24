
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Users, User } from "lucide-react";
import { MatchFormData } from "./types";

interface MatchFormListProps {
  matches: MatchFormData[];
  isLoading: boolean;
  onSelectMatch: (match: MatchFormData) => void;
  searchTerm: string;
  dateFilter: string;
  locationFilter: string;
  hasElevatedPermissions?: boolean;
}

const MatchFormList: React.FC<MatchFormListProps> = ({
  matches,
  isLoading,
  onSelectMatch,
  searchTerm,
  dateFilter,
  locationFilter,
  hasElevatedPermissions = false
}) => {
  // Filter matches based on search criteria
  const filteredMatches = matches.filter(match => {
    const matchesSearch = searchTerm === "" || 
      match.uniqueNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.homeTeamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.awayTeamName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = dateFilter === "" || match.date === dateFilter;
    
    const matchesLocation = locationFilter === "" || 
      match.location.toLowerCase().includes(locationFilter.toLowerCase());
    
    return matchesSearch && matchesDate && matchesLocation;
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Wedstrijden laden...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (filteredMatches.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Geen wedstrijden gevonden</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {filteredMatches.map((match) => (
        <Card key={match.matchId} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-primary text-white">
                {match.uniqueNumber}
              </Badge>
              {match.isCompleted ? (
                <Badge variant="secondary">Afgerond</Badge>
              ) : (
                <Badge variant="outline">Te spelen</Badge>
              )}
              {hasElevatedPermissions && (
                <Badge variant="outline" className="bg-orange-100 text-orange-800">
                  Admin/Scheidsrechter
                </Badge>
              )}
            </div>
            
            <CardTitle className="text-lg flex items-center justify-between">
              <span>{match.homeTeamName} vs {match.awayTeamName}</span>
              {(match.homeScore !== undefined && match.awayScore !== undefined) && (
                <span className="text-xl font-bold text-primary">
                  {match.homeScore} - {match.awayScore}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{match.date} om {match.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{match.location}</span>
              </div>
              {match.matchday && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{match.matchday}</span>
                </div>
              )}
              {match.referee && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{match.referee}</span>
                </div>
              )}
            </div>
            
            <div className="flex justify-end">
              <Button 
                onClick={() => onSelectMatch(match)}
                variant={match.isCompleted ? "outline" : "default"}
              >
                {match.isCompleted ? "Bekijken" : "Invullen"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MatchFormList;
