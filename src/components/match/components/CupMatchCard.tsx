import React from "react";
import { Clock, MapPin, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MatchCard from "./MatchCard";

interface CupMatchCardProps {
  id?: string;
  home: string;
  away: string;
  homeScore?: number | null;
  awayScore?: number | null;
  date?: string;
  time?: string;
  location?: string;
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
  nextMatch,
  onEditMatch,
  canEdit = false,
  tournamentRound
}) => {

  return (
    <div className="relative">
      <div className="pt-14">
        <MatchCard
          id={id}
          home={home}
          away={away}
          homeScore={homeScore}
          awayScore={awayScore}
          date={date}
          time={time}
          location={location}
          status={undefined}
          nextMatch={nextMatch}
          badgeSlot={<div></div>}
        />
      </div>
      
      {/* Tournament round badge - positioned absolutely at top right */}
      {tournamentRound && (
        <div className="absolute top-16 right-3">
          <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700 border-purple-300 shadow-sm">
            {tournamentRound}
          </Badge>
        </div>
      )}
      
      {/* Next match badge - positioned below tournament round */}
      {nextMatch && (
        <div className="absolute top-2 right-1">
          <Badge variant="secondary" className="text-xs">
            <ArrowRight className="h-3 w-3 mr-1" />
            {nextMatch}
          </Badge>
        </div>
      )}
      
      {canEdit && id && onEditMatch && (
        <div className="absolute top-1 right-1">
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
    </div>
  );
};

export default CupMatchCard; 