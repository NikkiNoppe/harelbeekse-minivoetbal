import React, { memo, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import MatchesCard from "../../admin/matches/components/MatchesCard";
import ResponsiveStandingsTable from "@/components/tables/ResponsiveStandingsTable";
import ResponsiveScheduleTable from "@/components/tables/ResponsiveScheduleTable";
import { useCompetitionData, Team, MatchData } from "@/hooks/useCompetitionData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layout";
import { useIsMobile } from "@/hooks/use-mobile";


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
      <CardContent className="">
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
    <CardHeader className="">
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent className="">
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

  const [selectedMatchday, setSelectedMatchday] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const filteredMatches = useMemo(() => {
    const filtered = matches.all.filter((m) => {
      if (selectedMatchday && m.matchday !== selectedMatchday) return false;
      if (selectedTeam && m.homeTeamName !== selectedTeam && m.awayTeamName !== selectedTeam) return false;
      return true;
    });
    return filtered.sort((a, b) => {
      const aKey = `${a.date}T${a.time}`;
      const bKey = `${b.date}T${b.time}`;
      return aKey.localeCompare(bKey);
    });
  }, [matches.all, selectedMatchday, selectedTeam]);

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
          <CardContent className="">
            <ResponsiveStandingsTable teams={teams} isLoading={standingsLoading} />
          </CardContent>
        </Card>
      </section>



      <section role="region" aria-labelledby="schedule-heading">
        <Card>
          <CardHeader className="">
            <CardTitle id="schedule-heading">Speelschema</CardTitle>
            <CardDescription>Volledig overzicht van alle wedstrijden</CardDescription>
          </CardHeader>
        <CardContent className="">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label className="mb-2 block">Speeldag</Label>
              <Select value={selectedMatchday ?? "all"} onValueChange={(v) => setSelectedMatchday(v === "all" ? null : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle speeldagen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle speeldagen</SelectItem>
                  {matchdays.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Team</Label>
              <Select value={selectedTeam ?? "all"} onValueChange={(v) => setSelectedTeam(v === "all" ? null : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle teams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle teams</SelectItem>
                  {teamNames.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <ResponsiveScheduleTable
            matches={filteredMatches.map((m) => ({
              ...m,
              date: formatDutchDayShort(m.date),
            }))}
          />
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