import React from "react";
import { Clock, MapPin, CheckCircle } from "lucide-react";
import AutoFitText from "@/components/ui/auto-fit-text";
import { formatDateWithDay } from "@/lib/dateUtils";


export type MatchCardStatus = 'completed' | 'upcoming' | 'pending';

interface MatchCardProps {
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
  badgeSlot?: React.ReactNode;
}

const getStatusBadge = (status: MatchCardStatus, nextMatch?: string) => {
  switch (status) {
    case "completed":
      return { label: "Afgerond", color: "bg-green-500", icon: CheckCircle };
    case "upcoming":
      return { label: nextMatch ? `→ ${nextMatch}` : "Aankomend", color: "bg-orange-400", icon: Clock };
    case "pending":
      return { label: "In afwachting", color: "bg-gray-400", icon: Clock };
    default:
      return { label: "Onbekend", color: "bg-gray-400", icon: Clock };
  }
};

const MatchCard: React.FC<MatchCardProps> = ({
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
  badgeSlot
}) => {
  const badge = getStatusBadge(status, nextMatch);
  const StatusIcon = badge.icon;
  return (
    <div className="match-card">
      <div className="match-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
        {badgeSlot ? badgeSlot : (
          <span className={`match-card-status-badge ${badge.color} text-white text-xs px-2 py-0.5 rounded font-semibold flex items-center gap-1`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {badge.label}
          </span>
        )}
      </div>
      <div className="match-card-teams">
        <div className="team-name-container text-right" style={{ maxWidth: '47%' }}>
          <AutoFitText 
            text={home}
            maxFontSize={16}
            minFontSize={7}
            className="text-responsive-team font-medium"
            style={{ textAlign: 'right' }}
          />
        </div>
        <span className="text-xs mx-1" style={{ minWidth: 20, textAlign: 'center' }}>vs</span>
        <div className="team-name-container text-left" style={{ maxWidth: '47%' }}>
          <AutoFitText 
            text={away}
            maxFontSize={16}
            minFontSize={7}
            className="text-responsive-team font-medium"
            style={{ textAlign: 'left' }}
          />
        </div>
      </div>
      <div className="match-card-score">
        {homeScore !== undefined && awayScore !== undefined && homeScore !== null && awayScore !== null
          ? `${homeScore} - ${awayScore}`
          : "-"}
      </div>
      <div className="match-card-meta">
        <span className="text-responsive-small"><Clock className="inline h-3 w-3 mr-1" />{date ? formatDateWithDay(date) : date}</span>
        <span className="text-responsive-small">{time}</span>
      </div>
      <div className="match-card-location">
        <MapPin className="inline h-3 w-3 mr-1" />
        <span className="text-responsive-small">{location}</span>
      </div>
    </div>
  );
};

export default React.memo(MatchCard); 