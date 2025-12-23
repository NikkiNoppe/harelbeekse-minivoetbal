
import React from "react";
import { Calendar, MapPin, Clock } from "lucide-react";
import ResponsiveTable, { TableColumn } from "./ResponsiveTable";

interface MatchData {
  matchId: number;
  matchday: string;
  date: string;
  time: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore?: number;
  awayScore?: number;
  location: string;
  isCompleted?: boolean;
}

interface ResponsiveScheduleTableProps {
  matches: MatchData[];
  onMatchClick?: (match: MatchData) => void;
}

const ResponsiveScheduleTable: React.FC<ResponsiveScheduleTableProps> = ({ matches, onMatchClick }) => {
  const columns: TableColumn<MatchData>[] = [
    {
      key: "matchday",
      header: "Speeldag",
      accessor: (match) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span className="whitespace-nowrap">{match.matchday}</span>
        </div>
      ),
      className: "w-32 text-left whitespace-nowrap",
      mobilePriority: "secondary",
      mobileLabel: "Speeldag",
    },
    {
      key: "match",
      header: "Wedstrijd",
      accessor: (match) => (
        <div className="flex items-center justify-between w-full min-w-[180px] sm:min-w-[220px] md:min-w-[260px]">
          <span className="font-medium flex-1 text-left truncate max-w-[48%] sm:max-w-[46%] md:max-w-[45%]">
            {match.homeTeamName}
          </span>
          {match.isCompleted && match.homeScore !== undefined && match.awayScore !== undefined ? (
            <span className="font-bold px-2 whitespace-nowrap text-heading">
              {match.homeScore} - {match.awayScore}
            </span>
          ) : (
            <span className="px-2 whitespace-nowrap text-muted-foreground">vs</span>
          )}
          <span className="font-medium flex-1 text-right truncate max-w-[48%] sm:max-w-[46%] md:max-w-[45%]">
            {match.awayTeamName}
          </span>
        </div>
      ),
      className: "min-w-[180px] sm:min-w-[220px] md:min-w-[260px] text-center",
      mobilePriority: "primary",
      mobileLabel: "Wedstrijd",
    },
    {
      key: "date",
      header: "Datum",
      accessor: (match) => (
        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap">{match.date}</span>
        </div>
      ),
      className: "w-24 text-left whitespace-nowrap",
      mobilePriority: "primary",
      mobileLabel: "Datum",
    },
    {
      key: "time",
      header: "Tijd",
      accessor: (match) => (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span className="whitespace-nowrap">{match.time}</span>
        </div>
      ),
      className: "w-20 text-left whitespace-nowrap",
      mobilePriority: "primary",
      mobileLabel: "Tijd",
    },
    {
      key: "location",
      header: "Locatie",
      accessor: (match) => (
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span className="truncate max-w-[160px]">{match.location}</span>
        </div>
      ),
      className: "min-w-[140px] text-left whitespace-nowrap",
      mobilePriority: "secondary",
      mobileLabel: "Locatie",
    },
  ];

  return (
    <ResponsiveTable
      data={matches}
      columns={columns}
      keyExtractor={(match) => match.matchId}
      emptyMessage="Geen wedstrijden gevonden"
      onRowClick={onMatchClick}
      ariaLabel="Wedstrijdschema"
    />
  );
};

export default ResponsiveScheduleTable;
