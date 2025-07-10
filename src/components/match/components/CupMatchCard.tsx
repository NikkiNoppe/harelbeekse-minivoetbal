import React from "react";
import { Clock, MapPin, CheckCircle, Trophy, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MatchCard, { MatchCardStatus } from "./MatchCard";

interface CupMatchCardProps {
  id?: string;
  home: string;
  away: string;
  homeScore?: number | null;
  awayScore?: number | null;
  date?: string;
  time?: string;
  location?: string;
  status?: MatchCardStatus;
  nextMatch?: string;
  onEditMatch?: (matchId: string) => void;
  canEdit?: boolean;
  tournamentRound?: string;
}

const CupMatchCard: React.FC<CupMatchCardProps> = ({
  id,
  home,
  away,
  homeScore,
  awayScore,
  date,
  time,
  location,
  status = "pending",
  nextMatch,
  onEditMatch,
  canEdit = false,
  tournamentRound
}) => {
  const getWinner = () => {
    if (homeScore !== null && homeScore !== undefined && 
        awayScore !== null && awayScore !== undefined) {
      if (homeScore > awayScore) return home;
      if (awayScore > homeScore) return away;
      return "Gelijkspel";
    }
    return null;
  };

  const winner = getWinner();

  return (
    <div className="relative">
      <MatchCard
        id={id}
        home={home}
        away={away}
        homeScore={homeScore}
        awayScore={awayScore}
        date={date}
        time={time}
        location={location}
        status={status}
        nextMatch={nextMatch}
        badgeSlot={
          <div className="flex flex-col gap-1">
            {tournamentRound && (
              <Badge variant="outline" className="text-xs">
                {tournamentRound}
              </Badge>
            )}
            {winner && status === 'completed' && (
              <Badge variant="default" className="text-xs bg-green-600">
                <Trophy className="h-3 w-3 mr-1" />
                {winner}
              </Badge>
            )}
            {nextMatch && (
              <Badge variant="secondary" className="text-xs">
                <ArrowRight className="h-3 w-3 mr-1" />
                {nextMatch}
              </Badge>
            )}
          </div>
        }
      />
      
      {canEdit && id && onEditMatch && (
        <div className="absolute top-2 right-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEditMatch(id)}
            className="h-6 px-2 text-xs"
          >
            Bewerken
          </Button>
        </div>
      )}
      
      {status === 'completed' && winner && winner !== "Gelijkspel" && nextMatch && (
        <div className="mt-2 p-2 bg-green-50 rounded text-center text-sm text-green-700">
          <Trophy className="h-4 w-4 inline mr-1" />
          {winner} gaat door naar {nextMatch}
        </div>
      )}
    </div>
  );
};

export default CupMatchCard; 