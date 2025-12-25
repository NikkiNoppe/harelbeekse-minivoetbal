import React, { memo, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import MatchesCard from "../../admin/matches/components/MatchesCard";
import ResponsiveStandingsTable from "@/components/tables/ResponsiveStandingsTable";
import { useCompetitionData, Team, MatchData } from "@/hooks/useCompetitionData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/layout";
import { useIsMobile } from "@/hooks/use-mobile";
import { FilterSelect, FilterGroup } from "@/components/ui/filter-select";


// Uniform skeleton for standings table
const StandingsTableSkeleton = memo(() => (
  <Table className="table">
    <TableHeader>
      <TableRow className="table-header-row">
        <TableHead className="num">Pos</TableHead>
        <TableHead className="left">Team</TableHead>
        <TableHead>Wed</TableHead>
        <TableHead>W</TableHead>
        <TableHead>G</TableHead>
        <TableHead>V</TableHead>
        <TableHead>+/-</TableHead>
        <TableHead>Ptn</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {[...Array(6)].map((_, i) => (
        <TableRow key={i}>
          <TableCell className="table-skeleton-cell"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
          <TableCell className="table-skeleton-cell"><Skeleton className="h-4 w-32 mx-auto" /></TableCell>
          <TableCell className="table-skeleton-cell"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
          <TableCell className="table-skeleton-cell"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
          <TableCell className="table-skeleton-cell"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
          <TableCell className="table-skeleton-cell"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
          <TableCell className="table-skeleton-cell"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
          <TableCell className="table-skeleton-cell"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
));

// Uniform skeleton for schedule table (voorbeeld, pas kolommen aan indien nodig)
const ScheduleTableSkeleton = memo(() => (
  <Table className="table">
    <TableHeader>
      <TableRow className="table-header-row">
        <TableHead>Speeldag</TableHead>
        <TableHead>Wedstrijd</TableHead>
        <TableHead>Datum</TableHead>
        <TableHead>Tijd</TableHead>
        <TableHead>Locatie</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {[...Array(6)].map((_, i) => (
        <TableRow key={i}>
          <TableCell className="table-skeleton-cell"><Skeleton className="h-4 w-16 mx-auto" /></TableCell>
          <TableCell className="table-skeleton-cell"><Skeleton className="h-4 w-32 mx-auto" /></TableCell>
          <TableCell className="table-skeleton-cell"><Skeleton className="h-4 w-16 mx-auto" /></TableCell>
          <TableCell className="table-skeleton-cell"><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
          <TableCell className="table-skeleton-cell"><Skeleton className="h-4 w-24 mx-auto" /></TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
));

// Compact match list item - 2 lines max with perfect time centering
const MatchListItem = memo(({ match }: { match: MatchData }) => {
  const isCompleted = match.homeScore !== undefined && match.awayScore !== undefined;
  
  return (
    <div className="py-2.5 px-3 border-b last:border-0 hover:bg-muted/20 transition-colors" style={{ borderColor: 'var(--accent)' }}>
      {/* Line 1: Teams with scores - Grid layout */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center mb-1">
        {/* Home Team - Left aligned */}
        <div className="text-sm font-medium leading-tight text-left truncate">
          {match.homeTeamName}
        </div>
        
        {/* Center: VS + Scores */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isCompleted ? (
            <>
              <span className="text-base font-bold min-w-[20px] text-center">{match.homeScore}</span>
              <span className="text-xs" style={{ color: 'var(--accent)' }}>-</span>
              <span className="text-base font-bold min-w-[20px] text-center">{match.awayScore}</span>
            </>
          ) : (
            <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>vs</span>
          )}
        </div>
        
        {/* Away Team - Right aligned */}
        <div className="text-sm font-medium leading-tight text-right truncate">
          {match.awayTeamName}
        </div>
      </div>

      {/* Line 2: Date, time (perfect center), location (right) - Grid layout */}
      <div className="grid grid-cols-3 gap-2 text-xs" style={{ color: 'var(--accent)', fontSize: '11px' }}>
        <span className="text-left">{match.date}</span>
        <span className="text-center font-medium">{match.time || ''}</span>
        <span className="text-right">{match.location || ''}</span>
      </div>
    </div>
  );
});
MatchListItem.displayName = 'MatchListItem';

// Group matches by speeldag
const MatchGroup = memo(({ speeldag, matches }: { 
  speeldag: string; 
  matches: MatchData[];
}) => {
  return (
    <div className="mb-4">
      {/* Speeldag header */}
      <div className="flex items-center justify-between px-3 py-2 mb-2 rounded-lg" style={{ backgroundColor: 'var(--accent)' }}>
        <h4 className="text-sm font-semibold text-white">{speeldag}</h4>
      </div>
      
      {/* Matches */}
      <div className="rounded-lg overflow-hidden bg-card" style={{ backgroundColor: 'white' }}>
        {matches.map((match) => (
          <MatchListItem key={match.matchId} match={match} />
        ))}
      </div>
    </div>
  );
});
MatchGroup.displayName = 'MatchGroup';

// Memoized standings section
const StandingsSection = memo(({ 
  teams, 
  isLoading, 
  error, 
  onRetry 
}: { 
  teams?: Team[]; 
  isLoading: boolean; 
  error: Error | null; 
  onRetry: () => void; 
}) => (
  <section>
    <Card>
      <CardContent className="p-4">
        {isLoading ? (
          <StandingsTableSkeleton />
        ) : error ? (
          <div className="text-center p-4">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-semibold mb-2">Fout bij laden</h3>
            <p className="text-red-500 mb-4">
              Er is een fout opgetreden bij het laden van de competitiestand.
            </p>

          </div>
        ) : !teams || teams.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            <p className="mb-2">Nog geen competitiestand beschikbaar.</p>
            <p className="text-sm">Standings worden automatisch bijgewerkt wanneer wedstrijden worden ingediend.</p>
          </div>
        ) : (
          <ResponsiveStandingsTable teams={teams} />
        )}
      </CardContent>
    </Card>
  </section>
));

// Memoized matches section
const MatchesSection = memo(({ 
  title, 
  description, 
  matches, 
  isLoading 
}: { 
  title: string; 
  description: string; 
  matches: MatchData[]; 
  isLoading: boolean; 
}) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent className="p-4 pt-0">
      {isLoading ? (
        <ScheduleTableSkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {matches.map(match => (
            <MatchesCard
              key={match.matchId}
              id={match.uniqueNumber || `M${match.matchId}`}
              home={match.homeTeamName}
              away={match.awayTeamName}
              homeScore={match.homeScore}
              awayScore={match.awayScore}
              date={match.date}
              time={match.time}
              location={match.location}
              status={undefined}
              badgeSlot={<div></div>}
            />
          ))}
        </div>
      )}
    </CardContent>
  </Card>
));

// Main component
const CompetitiePage: React.FC = () => {
  const {
    teams,
    matches,
    matchdays,
    teamNames,
    standingsLoading,
    matchesLoading,
  } = useCompetitionData();

  const [selectedMatchday, setSelectedMatchday] = useState<string>("all");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const isMobile = useIsMobile();

  const filteredMatches = useMemo(() => {
    const filtered = matches.all.filter((m) => {
      if (selectedMatchday !== "all" && m.matchday !== selectedMatchday) return false;
      if (selectedTeam !== "all" && m.homeTeamName !== selectedTeam && m.awayTeamName !== selectedTeam) return false;
      return true;
    });
    return filtered.sort((a, b) => {
      const aKey = `${a.date}T${a.time}`;
      const bKey = `${b.date}T${b.time}`;
      return aKey.localeCompare(bKey);
    });
  }, [matches.all, selectedMatchday, selectedTeam]);

  // Group matches by speeldag
  const groupedMatches = useMemo(() => {
    const groups = new Map<string, MatchData[]>();
    filteredMatches.forEach(match => {
      const speeldag = match.matchday || 'Overige';
      if (!groups.has(speeldag)) {
        groups.set(speeldag, []);
      }
      groups.get(speeldag)!.push(match);
    });
    return Array.from(groups.entries()).sort(([a], [b]) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || '999');
      const numB = parseInt(b.match(/\d+/)?.[0] || '999');
      return numA - numB;
    });
  }, [filteredMatches]);

  // Format: MA 01-09-25
  const formatDutchDayShort = (dateStr: string): string => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      if (!y || !m || !d) return dateStr;
      const date = new Date(Date.UTC(y, m - 1, d));
      const days = ['ZO', 'MA', 'DI', 'WO', 'DO', 'VR', 'ZA'];
      const dayAbbr = days[date.getUTCDay()];
      const yy = String(y).slice(-2);
      const mm = String(m).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      return `${dayAbbr} ${dd}-${mm}-${yy}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header - PageHeader on mobile, inline header on desktop */}
      {isMobile ? (
        <PageHeader 
          title="Competitiestand" 
          subtitle="Seizoen 2025/2026"
        />
      ) : (
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold" style={{ color: 'var(--primary)' }}>Competitiestand 2025/2026</h2>
        </div>
      )}

      <section role="region" aria-labelledby="standings-heading">
        <h2 id="standings-heading" className="sr-only">Competitiestand</h2>
        <Card>
          <CardContent className="p-4">
            <ResponsiveStandingsTable teams={teams} isLoading={standingsLoading} />
          </CardContent>
        </Card>
      </section>



      <section role="region" aria-labelledby="schedule-heading">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle id="schedule-heading" className="text-lg">Speelschema</CardTitle>
          </CardHeader>
        <CardContent className="p-4 pt-0">
          {/* Filters - Mobile-first with automatic responsive layout */}
          <FilterGroup columns={1} className="mb-4">
            <FilterSelect
              label="Speeldag"
              value={selectedMatchday}
              onValueChange={setSelectedMatchday}
              placeholder="Alle speeldagen"
              options={[
                { value: "all", label: "Alle speeldagen" },
                ...matchdays.map(d => ({ value: d, label: d }))
              ]}
            />
            <FilterSelect
              label="Team"
              value={selectedTeam}
              onValueChange={setSelectedTeam}
              placeholder="Alle teams"
              options={[
                { value: "all", label: "Alle teams" },
                ...teamNames.map(t => ({ value: t, label: t }))
              ]}
            />
          </FilterGroup>

          {/* Grouped Matches */}
          {groupedMatches.length > 0 ? (
            <div>
              {groupedMatches.map(([speeldag, matches]) => (
                <MatchGroup 
                  key={speeldag}
                  speeldag={speeldag}
                  matches={matches.map((m) => ({
                    ...m,
                    date: formatDutchDayShort(m.date),
                  }))}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-sm" style={{ color: 'var(--accent)' }}>
              Geen wedstrijden gevonden met de huidige filters
            </div>
          )}
        </CardContent>
      </Card>
      </section>
    </div>
  );
};

// Set display names for better debugging
StandingsTableSkeleton.displayName = 'StandingsTableSkeleton';
ScheduleTableSkeleton.displayName = 'ScheduleTableSkeleton';
MatchesSection.displayName = 'MatchesSection';


export default CompetitiePage; 