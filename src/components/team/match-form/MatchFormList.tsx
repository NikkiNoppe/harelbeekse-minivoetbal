
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Lock, CheckCircle, AlertCircle } from "lucide-react";
import { MatchFormData } from "./types";

interface MatchFormListProps {
  matches: MatchFormData[];
  isLoading: boolean;
  onSelectMatch: (match: MatchFormData) => void;
  searchTerm: string;
  dateFilter: string;
  locationFilter: string;
  hasElevatedPermissions?: boolean;
  userRole?: string;
  teamId?: number;
}

const MatchFormList: React.FC<MatchFormListProps> = ({
  matches,
  isLoading,
  onSelectMatch,
  searchTerm,
  dateFilter,
  locationFilter,
  hasElevatedPermissions = false,
  userRole,
  teamId
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

  // Group matches by matchday
  const groupedMatches = filteredMatches.reduce((groups, match) => {
    const matchday = match.matchday || "Geen speeldag";
    if (!groups[matchday]) {
      groups[matchday] = [];
    }
    groups[matchday].push(match);
    return groups;
  }, {} as Record<string, MatchFormData[]>);

  const getMatchStatus = (match: MatchFormData) => {
    if (match.isLocked) {
      return { label: "Vergrendeld", color: "bg-gray-500", icon: Lock };
    }
    if (match.isCompleted) {
      return { label: "Afgerond", color: "bg-green-500", icon: CheckCircle };
    }
    if (match.playersSubmitted) {
      return { label: "Klaar voor score", color: "bg-blue-500", icon: AlertCircle };
    }
    return { label: "Te spelen", color: "bg-orange-500", icon: Clock };
  };

  const canUserEdit = (match: MatchFormData): boolean => {
    if (userRole === "admin") return true;
    if (match.isLocked && userRole !== "admin") return false;
    
    if (userRole === "referee") {
      return match.playersSubmitted || match.isCompleted;
    }
    
    // Team manager - fix the permission check
    const isTeamMatch = match.homeTeamId === teamId || match.awayTeamId === teamId;
    const isFutureMatch = new Date(match.date) > new Date();
    return isTeamMatch && isFutureMatch && !match.isCompleted && !match.isLocked;
  };

  const getButtonText = (match: MatchFormData): string => {
    if (!canUserEdit(match)) return "Bekijken";
    
    if (userRole === "admin") return "Bewerken";
    if (userRole === "referee") return "Score invoeren";
    
    return "Spelers selecteren";
  };

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
    <div className="space-y-6">
      {Object.entries(groupedMatches)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([matchday, dayMatches]) => (
        <Card key={matchday}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{matchday}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {dayMatches.map((match) => {
              const status = getMatchStatus(match);
              const StatusIcon = status.icon;
              const canEdit = canUserEdit(match);
              
              return (
                <div key={match.matchId} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="bg-primary text-white text-xs">
                        {match.uniqueNumber}
                      </Badge>
                      <Badge variant="outline" className={`${status.color} text-white text-xs`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </Badge>
                      {match.isLocked && (
                        <Lock className="h-4 w-4 text-gray-500" />
                      )}
                    </div>
                    
                    <div className="font-medium text-sm mb-1">
                      {match.homeTeamName} vs {match.awayTeamName}
                      {(match.homeScore !== undefined && match.awayScore !== undefined) && (
                        <span className="ml-2 font-bold text-primary">
                          {match.homeScore} - {match.awayScore}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{match.date} {match.time}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{match.location}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => onSelectMatch(match)}
                    variant={canEdit ? "default" : "outline"}
                    size="sm"
                  >
                    {getButtonText(match)}
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MatchFormList;
