
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import ResponsiveTable, { TableColumn } from "./ResponsiveTable";

interface Team {
  id: number;
  name: string;
  played: number;
  won: number;
  draw: number;
  lost: number;
  goalDiff: number;
  points: number;
}

interface ResponsiveStandingsTableProps {
  teams?: Team[];
  isLoading?: boolean;
  showPlayoff?: boolean;
}

const ResponsiveStandingsTable: React.FC<ResponsiveStandingsTableProps> = ({ teams, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-3" role="status" aria-live="polite" aria-busy="true">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-4 space-y-2 animate-pulse">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-8 bg-muted" />
              <Skeleton className="h-5 w-32 bg-muted" />
              <Skeleton className="h-6 w-12 bg-muted" />
            </div>
            <div className="flex items-center gap-4 pt-2 border-t border-border">
              <Skeleton className="h-4 w-16 bg-muted" />
              <Skeleton className="h-4 w-16 bg-muted" />
              <Skeleton className="h-4 w-16 bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!teams) return null;

  const columns: TableColumn<Team>[] = [
    {
      key: "position",
      header: "Pos",
      accessor: (_, index) => <span className="font-medium">{index + 1}</span>,
      className: "num",
      mobilePriority: "primary",
      mobileLabel: "Positie",
    },
    {
      key: "name",
      header: "Team",
      accessor: (team) => <span className="font-medium">{team.name}</span>,
      className: "left",
      mobilePriority: "primary",
      mobileLabel: "Team",
    },
    {
      key: "points",
      header: "Ptn",
      accessor: (team) => <span className="font-bold">{team.points}</span>,
      mobilePriority: "primary",
      mobileLabel: "Punten",
    },
    {
      key: "played",
      header: "Wed",
      accessor: (team) => team.played,
      mobilePriority: "secondary",
      mobileLabel: "Gespeeld",
    },
    {
      key: "won",
      header: "W",
      accessor: (team) => <span className="text-green-600 font-medium">{team.won}</span>,
      mobilePriority: "secondary",
      mobileLabel: "Gewonnen",
    },
    {
      key: "draw",
      header: "G",
      accessor: (team) => <span className="text-yellow-600 font-medium">{team.draw}</span>,
      mobilePriority: "secondary",
      mobileLabel: "Gelijk",
    },
    {
      key: "lost",
      header: "V",
      accessor: (team) => <span className="text-red-600 font-medium">{team.lost}</span>,
      mobilePriority: "secondary",
      mobileLabel: "Verloren",
    },
    {
      key: "goalDiff",
      header: "+/-",
      accessor: (team) => (
        <span
          className={
            team.goalDiff > 0
              ? "text-green-600 font-medium"
              : team.goalDiff < 0
              ? "text-red-600 font-medium"
              : ""
          }
        >
          {team.goalDiff > 0 ? "+" : ""}
          {team.goalDiff}
        </span>
      ),
      mobilePriority: "secondary",
      mobileLabel: "Doelsaldo",
    },
  ];

  return (
    <ResponsiveTable
      data={teams}
      columns={columns}
      keyExtractor={(team) => team.id}
      isLoading={isLoading}
      emptyMessage="Geen teams gevonden"
      ariaLabel="Competitie standen"
    />
  );
};

export default ResponsiveStandingsTable;
