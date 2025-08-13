import React, { memo, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import MatchesCard from "./admin/matches/components/MatchesCard";
import ResponsiveStandingsTable from "../tables/ResponsiveStandingsTable";
import ResponsiveScheduleTable from "../tables/ResponsiveScheduleTable";
import { useCompetitionData, Team, MatchData } from "@/hooks/useCompetitionData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import MatchFilterPanel, { MatchFilterState } from "@/components/common/MatchFilterPanel";
import { format } from "date-fns";

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
      <CardContent className="bg-transparent">
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
    <CardHeader className="bg-transparent">
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent className="bg-transparent">
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

// Filters worden afgehandeld via de gedeelde MatchFilterPanel-component.


// Main component
const CompetitiePage: React.FC = () => {
  const [filterState, setFilterState] = useState<MatchFilterState>({
    search: "",
    selectedTeams: [],
    selectedDate: null,
    selectedWeek: null,
    selectedMatchday: null,
  });

  const {
    teams,
    matches,
    matchdays,
    teamNames,
    standingsLoading,
    matchesLoading,
    standingsError,
    refetchStandings
  } = useCompetitionData();

  // Memoized filtered matches
  const filteredMatches = useMemo(() => {
    const md = filterState.selectedMatchday || null;
    const teamsSel = filterState.selectedTeams || [];
    const search = (filterState.search || "").toLowerCase();
    const selectedDate = filterState.selectedDate;
    const selectedWeek = filterState.selectedWeek;

    return matches.all.filter((match) => {
      if (md && match.matchday !== md) return false;
      if (teamsSel.length > 0 && !teamsSel.includes(match.homeTeamName) && !teamsSel.includes(match.awayTeamName)) return false;
      
      // Date filter
      if (selectedDate) {
        try {
          const dayStr = format(selectedDate, "yyyy-MM-dd");
          if (match.date !== dayStr) return false;
        } catch {}
      }
      
      // Week filter
      if (selectedWeek) {
        try {
          const matchDate = new Date(match.date);
          const weekStart = new Date(selectedWeek);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Start of week (Monday)
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6); // End of week (Sunday)
          
          if (matchDate < weekStart || matchDate > weekEnd) return false;
        } catch {}
      }
      
      if (search) {
        const hay = `${match.homeTeamName} ${match.awayTeamName} ${match.matchday} ${match.uniqueNumber ?? ""}`.toLowerCase();
        if (!hay.includes(search)) return false;
      }
      return true;
    });
  }, [matches.all, filterState]);
  const filterSummary = useMemo(() => {
    const parts: string[] = [];
    if (filterState.selectedTeams.length) parts.push(`${filterState.selectedTeams.length} teams`);
    if (filterState.selectedDate) parts.push(`datum ${format(filterState.selectedDate, 'dd-MM-yyyy')}`);
    if (filterState.selectedMatchday) parts.push(`speeldag ${filterState.selectedMatchday}`);
    if (filterState.search) parts.push(`“${filterState.search}”`);
    return parts.length ? `— filters: ${parts.join(', ')}` : '';
  }, [filterState]);

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Competitiestand</h2>
        <Badge className="badge-purple">Seizoen 2025-2026</Badge>
      </div>

      <section>
        <Card>
          <CardContent className="bg-transparent">
            <ResponsiveStandingsTable teams={teams} isLoading={standingsLoading} />
          </CardContent>
        </Card>
      </section>

      <MatchesSection
        title="Aankomende Wedstrijden"
        description="Wedstrijden van de komende speeldag"
        matches={matches.upcoming}
        isLoading={matchesLoading}
      />

      <MatchesSection
        title="Afgelopen Wedstrijden"
        description="Resultaten van de laatst gespeelde speeldag"
        matches={matches.past}
        isLoading={matchesLoading}
      />

      <Card>
        <CardHeader className="bg-transparent">
          <CardTitle>Speelschema</CardTitle>
          <CardDescription>Volledig overzicht van alle wedstrijden</CardDescription>
        </CardHeader>
        <CardContent className="bg-transparent">
          <MatchFilterPanel
            teamNames={teamNames}
            showMatchday={true}
            matchdays={matchdays}
            onChange={setFilterState}
            title="Filters"
            description="Filter op datum, teams, speeldag en zoekterm"
          />
          <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
            <div>{filteredMatches.length} resultaten {filterSummary}</div>
          </div>
          <ResponsiveScheduleTable matches={filteredMatches} />
        </CardContent>
      </Card>
    </div>
  );
};

// Set display names for better debugging
StandingsTableSkeleton.displayName = 'StandingsTableSkeleton';
ScheduleTableSkeleton.displayName = 'ScheduleTableSkeleton';
MatchesSection.displayName = 'MatchesSection';


export default CompetitiePage; 