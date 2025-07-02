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
      match.awayTeamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (match.matchday && match.matchday.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDate = dateFilter === "" || match.date === dateFilter;
    
    return matchesSearch && matchesDate;
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
    // 1. Gespeeld - als score is ingevuld (niet null, niet undefined)
    const hasValidScore = (score: number | null | undefined): boolean => {
      return score !== null && score !== undefined;
    };
    
    if (hasValidScore(match.homeScore) && hasValidScore(match.awayScore)) {
      return { label: "Gespeeld", color: "bg-green-500", icon: CheckCircle };
    }
    
    // 2. Gesloten - als expliciet vergrendeld OF 5 min voor aanvang
    const now = new Date();
    const matchDateTime = new Date(`${match.date}T${match.time}`);
    const fiveMinutesBeforeMatch = new Date(matchDateTime.getTime() - 5 * 60 * 1000);
    
    if (match.isLocked || now >= fiveMinutesBeforeMatch) {
      return { label: "Gesloten", color: "bg-purple-900", icon: Lock };
    }
    
    // Helper functies voor team status
    const hasTeamData = (players: PlayerSelection[]) => {
      const validPlayers = players?.filter(p => p.playerId !== null && p.playerId !== undefined) || [];
      const hasCaptain = players?.some(p => p.isCaptain) || false;
      const hasJerseyNumbers = validPlayers.every(p => p.jerseyNumber && p.jerseyNumber.trim() !== '');
      return validPlayers.length > 0 && hasCaptain && hasJerseyNumbers;
    };
    
    const homeTeamComplete = hasTeamData(match.homePlayers || []);
    const awayTeamComplete = hasTeamData(match.awayPlayers || []);
    
    // 3. Teams ✅✅ - beide teams compleet
    if (homeTeamComplete && awayTeamComplete) {
      return { label: "Teams ✅✅", color: "bg-purple-600", icon: CheckCircle };
    }
    
    // 4. Home ✅ - alleen home team compleet
    if (homeTeamComplete && !awayTeamComplete) {
      return { label: "Home ✅", color: "bg-purple-400", icon: CheckCircle };
    }
    
    // 5. Away ✅ - alleen away team compleet  
    if (!homeTeamComplete && awayTeamComplete) {
      return { label: "Away ✅", color: "bg-purple-400", icon: CheckCircle };
    }
    
    // 6. Open - nog niets ingevuld
    return { label: "Open", color: "bg-gray-400", icon: Clock };
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
      <button
        key={match.matchId}
        onClick={() => onSelectMatch(match)}
        className="bg-white border border-purple-dark rounded-lg p-3 hover:shadow-md hover:border-purple-dark hover:bg-purple-dark transition-all duration-200 text-left w-full group"
      >
        <div className="space-y-3">
          {/* Header met badges */}
          <div className="flex items-center justify-between">
            <Badge className="text-xs font-semibold bg-primary text-white px-1.5 py-0.5 group-hover:bg-white group-hover:text-purple-600">
              {match.uniqueNumber}
            </Badge>
            <Badge className={`${status.color} text-white text-xs px-2 py-0.5 shadow-sm group-hover:bg-white group-hover:text-purple-600`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.label}
            </Badge>
          </div>
          
          {/* Teams op één lijn */}
          <div className="font-medium text-sm text-purple-dark group-hover:text-white transition-colors">
            <div className="flex items-center justify-center gap-2">
              <span className="truncate flex-1 text-right">{match.homeTeamName}</span>
              <span className="text-xs text-gray-500 group-hover:text-white/70 px-1">vs</span>
              <span className="truncate flex-1 text-left">{match.awayTeamName}</span>
            </div>
          </div>
          
          {/* Score centraal */}
          <div className="text-center font-bold text-primary group-hover:text-white text-xl py-1">
            {(match.homeScore !== undefined && match.homeScore !== null && match.awayScore !== undefined && match.awayScore !== null) 
              ? `${match.homeScore} - ${match.awayScore}`
              : "  -  "
            }
          </div>
          
          {/* Datum links, tijd rechts */}
          <div className="flex items-center justify-between text-xs text-muted-foreground group-hover:text-white/80">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{match.date}</span>
            </div>
            <span className="font-medium">{match.time}</span>
          </div>
          
          {/* Locatie centraal */}
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground group-hover:text-white/80">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate text-center">{match.location}</span>
          </div>
        </div>
      </button>
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
          <div className="flex items-center gap-2 mb-3 text-base text-purple-dark font-semibold pl-2">
            {matchday}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {unlockedGrouped[matchday].map(renderMatchCard)}
          </div>
        </div>
      ))}

      {/* Locked matches at the bottom */}
      {sortedLockedMatchdays.length > 0 && (
        <div className="pt-1 opacity-80">
          {sortedLockedMatchdays.map(matchday => (
            <div key={`locked-${matchday}`}>
              <div className="flex items-center gap-2 mb-3 text-base text-gray-400 font-semibold pl-2">
                <Lock className="h-4 w-4" />
                {matchday} (Vergrendeld)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
