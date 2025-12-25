
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

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
          <div key={i} className="bg-card border border-border rounded-lg p-4 space-y-2 animate-pulse" style={{ backgroundColor: 'white' }}>
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

  if (!teams || teams.length === 0) {
    return (
      <div className="text-center py-8 text-sm" style={{ color: 'var(--accent)' }}>
        Geen teams beschikbaar
      </div>
    );
  }

  return (
    <div>
      {/* Table structure with header */}
      <div className="rounded-lg overflow-hidden">
        {/* Header Row - Light purple background with white text */}
        <div className="bg-primary/80">
          <div className="flex items-center px-3 py-2 gap-3" style={{ backgroundColor: 'var(--accent)' }}>
            {/* Pos column */}
            <div className="flex-shrink-0 w-7 text-center">
              <span className="text-xs font-semibold text-white">Pos</span>
            </div>

            {/* Team column */}
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-white">Team</span>
            </div>

            {/* Stats columns */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="text-center w-7">
                <span className="text-xs font-semibold text-white">W</span>
              </div>
              <div className="text-center w-7">
                <span className="text-xs font-semibold text-white">G</span>
              </div>
              <div className="text-center w-7">
                <span className="text-xs font-semibold text-white">V</span>
              </div>
              <div className="text-center w-9">
                <span className="text-xs font-semibold text-white">Ptn</span>
              </div>
            </div>
          </div>
        </div>

        {/* Data Rows */}
        {teams.map((team, index) => (
          <div 
            key={team.id}
            className="hover:bg-primary/5 transition-colors border-b last:border-b-0"
            style={{ borderColor: 'var(--accent)' }}
          >
            <div className="flex items-center p-3 gap-3" style={{ color: 'var(--accent)', borderColor: 'transparent', borderImage: 'none', boxSizing: 'content-box', borderStyle: 'none' }}>
              {/* Position Badge */}
              <div className="flex-shrink-0 w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--accent-foreground)' }}>{index + 1}</span>
              </div>

              {/* Team Name & Stats */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold leading-tight mb-1.5" style={{ color: 'var(--accent-foreground)' }}>
                  {team.name}
                </div>
                <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--accent)' }}>
                  {/* Wedstrijden - Fixed width for alignment */}
                  <div className="flex items-center gap-1 min-w-[48px]">
                    <span className="tabular-nums font-medium" style={{ color: 'var(--accent)' }}>{team.played}</span>
                    <span style={{ color: 'var(--accent)' }}>wed</span>
                  </div>
                  {/* Goal Difference - Fixed width for alignment */}
                  <div className="flex items-center gap-1 min-w-[56px]">
                    <span 
                      className="tabular-nums font-medium"
                      style={{ 
                        color: team.goalDiff > 0 ? 'rgb(22, 163, 74)' : 
                               team.goalDiff < 0 ? 'rgb(220, 38, 38)' : 
                               'var(--accent)'
                      }}
                    >
                      {team.goalDiff > 0 ? "+" : ""}{team.goalDiff}
                    </span>
                    <span style={{ color: 'var(--accent)' }}>saldo</span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-center w-7">
                  <div 
                    className="text-sm font-semibold tabular-nums" 
                    style={{ color: team.won > 0 ? 'rgb(22, 163, 74)' : 'var(--accent-foreground)' }}
                  >
                    {team.won}
                  </div>
                </div>
                <div className="text-center w-7">
                  <div 
                    className="text-sm font-medium tabular-nums" 
                    style={{ color: team.draw > 0 ? 'rgb(202, 138, 4)' : 'var(--accent-foreground)' }}
                  >
                    {team.draw}
                  </div>
                </div>
                <div className="text-center w-7">
                  <div 
                    className="text-sm font-semibold tabular-nums" 
                    style={{ color: team.lost > 0 ? 'rgb(220, 38, 38)' : 'var(--accent-foreground)' }}
                  >
                    {team.lost}
                  </div>
                </div>
                <div className="text-center w-9">
                  <div className="text-lg font-bold tabular-nums" style={{ color: 'var(--accent-foreground)' }}>{team.points}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-2 px-2 text-xs" style={{ color: 'var(--accent)', textAlign: 'center' }}>
        W = Winst • G = Gelijk • V = Verlies • Ptn = Totaal punten
      </div>
    </div>
  );
};

export default ResponsiveStandingsTable;
