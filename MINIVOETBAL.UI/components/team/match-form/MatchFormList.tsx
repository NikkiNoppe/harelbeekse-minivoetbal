import React from "react";
import MatchCard from "../../match/components/MatchCard";
import { Lock, CheckCircle, Clock } from "lucide-react";
import { MatchFormData } from "./types";
import { 
  sortMatchesByDateAndTime, 
  getCupRoundName, 
  sortMatchesWithinGroups, 
  sortGroupKeys 
} from '../../../lib/matchSortingUtils';

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

const getMatchStatus = (match: MatchFormData) => {
  const hasValidScore = (score: number | null | undefined): boolean => score !== null && score !== undefined;
  if (hasValidScore(match.homeScore) && hasValidScore(match.awayScore)) {
    return { label: "Gespeeld", color: "bg-green-500", icon: CheckCircle };
  }
  const now = new Date();
  const matchDateTime = new Date(`${match.date}T${match.time}`);
  const fiveMinutesBeforeMatch = new Date(matchDateTime.getTime() - 5 * 60 * 1000);
  const isMatchInPast = now >= matchDateTime;
  const shouldAutoLock = now >= fiveMinutesBeforeMatch;
  if (match.isLocked || shouldAutoLock || isMatchInPast) {
    return { label: "Gesloten", color: "bg-red-400", icon: Lock };
  }
  return { label: "Open", color: "bg-gray-400", icon: Clock };
};

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
  // Filtering (same as before)
  const filteredMatches = matches.filter(match => {
    const matchesSearch = searchTerm === "" || 
      match.uniqueNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.homeTeamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.awayTeamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (match.matchday && match.matchday.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDate = dateFilter === "" || match.date === dateFilter;
    return matchesSearch && matchesDate;
  });

  // Helper function to detect if matches are cup matches
  const isCupMatchList = filteredMatches.length > 0 && filteredMatches[0].matchday?.includes('🏆');

  // Group by matchday or cup round
  const groupMatches = (matches: MatchFormData[]) => {
    if (isCupMatchList) {
      // Group cup matches by round
      return matches.reduce((groups, match) => {
        const roundName = getCupRoundName(match.uniqueNumber);
        if (!groups[roundName]) groups[roundName] = [];
        groups[roundName].push(match);
        return groups;
      }, {} as Record<string, MatchFormData[]>);
    } else {
      // Group regular matches by matchday
      return matches.reduce((groups, match) => {
        const matchday = match.matchday || "Geen speeldag";
        if (!groups[matchday]) groups[matchday] = [];
        groups[matchday].push(match);
        return groups;
      }, {} as Record<string, MatchFormData[]>);
    }
  };

  const grouped = groupMatches(filteredMatches);
  
  // Sort matches within each group by date and time
  const sortedGroups = sortMatchesWithinGroups(grouped, isCupMatchList);
  
  // Sort group keys in the correct order
  const sortedGroupKeys = sortGroupKeys(Object.keys(sortedGroups), isCupMatchList);

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
    <div className="space-y-8">
      {sortedGroupKeys.map(groupKey => (
        <div key={groupKey}>
          <div className="flex items-center gap-2 mb-3 text-base text-purple-dark font-semibold pl-2">
            {groupKey}
          </div>
          <div className={`grid gap-4 ${
            isCupMatchList && groupKey === 'Achtste Finales' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4' 
                                        : isCupMatchList && groupKey === 'Kwart Finales'
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4'
              : isCupMatchList && groupKey === 'Halve Finales'
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2'
              : isCupMatchList && groupKey === 'Finale'
              ? 'grid-cols-1 max-w-md mx-auto'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          }`}>
            {sortedGroups[groupKey].map(match => {
              const status = getMatchStatus(match);
              const StatusIcon = status.icon;
              // Badge always right, keep color and content
              const badgeSlot = (
                <span className={`ml-auto flex items-center gap-2`}>
                  <span className="text-xs font-semibold bg-primary text-white px-1.5 py-0.5 rounded">
                    {match.uniqueNumber}
                  </span>
                  <span className={`${status.color} text-white text-xs px-2 py-0.5 shadow-sm rounded flex items-center gap-1`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {status.label}
                  </span>
                </span>
              );
              return (
                <button
                  key={match.matchId}
                  onClick={() => onSelectMatch(match)}
                  className="border-none bg-transparent p-0 hover:shadow-none hover:border-none hover:bg-transparent transition-all duration-200 text-left w-full group"
                >
                  <MatchCard
                    id={undefined}
                    home={match.homeTeamName}
                    away={match.awayTeamName}
                    homeScore={match.homeScore}
                    awayScore={match.awayScore}
                    date={match.date}
                    time={match.time}
                    location={match.location}
                    status={undefined}
                    badgeSlot={badgeSlot}
                  />
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MatchFormList;
