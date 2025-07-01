import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Lock, CheckCircle } from "lucide-react";
import { MatchFormData } from "./types";

interface MatchFormListProps {
  matches: MatchFormData[];
  isLoading: boolean;
  onSelectMatch: (match: MatchFormData) => void;
  searchTerm: string;
  dateFilter: string;
  matchdayFilter: string;
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
  matchdayFilter,
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
    
    const matchesMatchday = matchdayFilter === "" || 
      (match.matchday && match.matchday.toLowerCase().includes(matchdayFilter.toLowerCase()));
    
    return matchesSearch && matchesDate && matchesMatchday;
  });

  // Separate locked and unlocked matches
  const unlockedMatches = filteredMatches.filter(match => !match.isLocked);
  const lockedMatches = filteredMatches.filter(match => match.isLocked);

  // Group matches by matchday
  const groupByMatchday = (matches: MatchFormData[]) => {
    return matches.reduce((groups, match) => {
      const matchday = match.matchday || "Geen speeldag";
      if (!groups[matchday]) groups[matchday] = [];
      groups[matchday].push(match);
      return groups;
    }, {} as Record<string, MatchFormData[]>);
  };

  const unlockedGrouped = groupByMatchday(unlockedMatches);
  const lockedGrouped = groupByMatchday(lockedMatches);

  // Sort matchdays numerically
  const sortMatchdays = (matchdays: string[]) => {
    return matchdays.sort((a, b) => {
      const getMatchdayNumber = (str: string) => {
        const num = str.match(/\d+/);
        return num ? parseInt(num[0]) : 0;
      };
      return getMatchdayNumber(a) - getMatchdayNumber(b);
    });
  };

  const sortedUnlockedMatchdays = sortMatchdays(Object.keys(unlockedGrouped));
  const sortedLockedMatchdays = sortMatchdays(Object.keys(lockedGrouped));

  const getMatchStatus = (match: MatchFormData) => {
    if (match.isLocked) {
      return { label: "Vergrendeld", color: "bg-gray-400", icon: Lock };
    }
    if (match.isCompleted) {
      return { label: "Afgerond", color: "bg-green-500", icon: CheckCircle };
    }
    return { label: "Te spelen", color: "bg-orange-400", icon: Clock };
  };

  const canUserEdit = (match: MatchFormData): boolean => {
    if (userRole === "admin") return true;
    if (match.isLocked && userRole !== "admin") return false;
    
    if (userRole === "referee") {
      return match.isCompleted || !match.isLocked;
    }
    
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

  const renderMatchCard = (match: MatchFormData) => {
    const status = getMatchStatus(match);
    const StatusIcon = status.icon;
    const canEdit = canUserEdit(match);
    
    return (
      <div
        key={match.matchId}
        className="flex items-center justify-between p-3 border border-gray-100 rounded-lg bg-white/60 mb-1 hover:bg-gray-50 transition text-sm"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs font-semibold border-primary text-primary bg-transparent px-1.5 py-0">
              {match.uniqueNumber}
            </Badge>
            <Badge variant="outline" className={`${status.color} text-white text-xs px-2 py-0.5 shadow-sm`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.label}
            </Badge>
          </div>
          
          <div className="font-medium text-xs mb-0.5 truncate text-purple-dark">
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
              <span>{match.date} {match.time && <span>{match.time}</span>}</span>
            </div>
            <div className="flex items-center gap-1 truncate">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{match.location}</span>
            </div>
          </div>
        </div>
        
        <Button 
          onClick={() => onSelectMatch(match)}
          variant={canEdit ? "secondary" : "ghost"}
          size="sm"
          className="ml-3 text-xs px-3 py-1 rounded font-medium"
        >
          {getButtonText(match)}
        </Button>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl px-6 py-12 shadow text-center">
        <p className="text-muted-foreground">Wedstrijden laden...</p>
      </div>
    );
  }

  if (filteredMatches.length === 0) {
    return (
      <div className="bg-white rounded-xl px-6 py-12 shadow text-center">
        <p className="text-muted-foreground">Geen wedstrijden gevonden</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Unlocked matches first */}
      {sortedUnlockedMatchdays.map((matchday) => (
        <div key={`unlocked-${matchday}`} className="pt-0">
          <div className="flex items-center gap-2 mb-1 text-base text-purple-dark font-semibold pl-2">
            {matchday}
          </div>
          <div className="space-y-1">
            {unlockedGrouped[matchday].map(renderMatchCard)}
          </div>
        </div>
      ))}

      {/* Locked matches at the bottom */}
      {sortedLockedMatchdays.length > 0 && (
        <div className="pt-1 opacity-80">
          {sortedLockedMatchdays.map(matchday => (
            <div key={`locked-${matchday}`}>
              <div className="flex items-center gap-2 mb-1 text-base text-gray-400 font-semibold pl-2">
                <Lock className="h-4 w-4" />
                {matchday} (Vergrendeld)
              </div>
              <div className="space-y-1">
                {lockedGrouped[matchday].map(renderMatchCard)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MatchFormList;
