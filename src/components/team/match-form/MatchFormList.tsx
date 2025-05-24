
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Users, User, Lock, CheckCircle, AlertCircle } from "lucide-react";
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
    
    // Team manager
    const isTeamMatch = match.homeTeamId === teamId || match.awayTeamId === teamId;
    const isFutureMatch = new Date(match.date) > new Date();
    return isTeamMatch && isFutureMatch && !match.isCompleted;
  };

  const getButtonText = (match: MatchFormData): string => {
    if (!canUserEdit(match)) return "Bekijken";
    
    if (userRole === "admin") return "Bewerken";
    if (userRole === "referee") return "Score invoeren";
    
    return match.isCompleted ? "Bekijken" : "Spelers selecteren";
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
    <div className="space-y-4">
      {filteredMatches.map((match) => {
        const status = getMatchStatus(match);
        const StatusIcon = status.icon;
        const canEdit = canUserEdit(match);
        
        return (
          <Card key={match.matchId} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-primary text-white">
                  {match.uniqueNumber}
                </Badge>
                <Badge variant="outline" className={`${status.color} text-white`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {status.label}
                </Badge>
                {hasElevatedPermissions && (
                  <Badge variant="outline" className="bg-purple-100 text-purple-800">
                    {userRole === "admin" ? "Admin" : "Scheidsrechter"}
                  </Badge>
                )}
                {match.playersSubmitted && !match.isCompleted && (
                  <Badge variant="outline" className="bg-blue-100 text-blue-800">
                    Spelers ingediend
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
              
              {match.refereeNotes && (userRole === "admin" || userRole === "referee") && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm font-medium text-yellow-800">Notities scheidsrechter:</p>
                  <p className="text-sm text-yellow-700">{match.refereeNotes}</p>
                </div>
              )}
              
              <div className="flex justify-end">
                <Button 
                  onClick={() => onSelectMatch(match)}
                  variant={canEdit ? "default" : "outline"}
                  disabled={!canEdit && userRole !== "admin"}
                >
                  {getButtonText(match)}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default MatchFormList;
