import React, { memo, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Trophy } from "lucide-react";
import { usePublicPlayoffData, PlayoffTeam, PlayoffMatchData } from "@/hooks/usePublicPlayoffData";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ResponsiveScheduleTable from "@/components/tables/ResponsiveScheduleTable";
import { PageHeader } from "@/components/layout";
import { useIsMobile } from "@/hooks/use-mobile";

// Skeleton components
const StandingsTableSkeleton = memo(() => <div className="space-y-4">
    {[...Array(8)].map((_, index) => <div key={index} className="flex justify-between items-center p-3">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex space-x-6">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-8" />
        </div>
      </div>)}
  </div>);
StandingsTableSkeleton.displayName = 'StandingsTableSkeleton';
const PlayoffLoading = memo(() => {
  const isMobile = useIsMobile();
  return (
    <div className="space-y-6 animate-slide-up">
      {isMobile ? (
        <PageHeader 
          title="Play-Off Klassement" 
          subtitle="Seizoen 2025-2026"
        />
      ) : (
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Play-Off Klassement</h2>
          <Badge variant="secondary">Seizoen 2025-2026</Badge>
        </div>
      )}
      <Card>
        <CardContent className="p-0 overflow-x-auto bg-transparent">
          <StandingsTableSkeleton />
        </CardContent>
      </Card>
    </div>
  );
});
PlayoffLoading.displayName = 'PlayoffLoading';
const PlayoffError = memo(({
  onRetry
}: {
  onRetry: () => void;
}) => {
  const isMobile = useIsMobile();
  return (
    <div className="space-y-6 animate-slide-up">
      {isMobile ? (
        <PageHeader 
          title="Play-Off Klassement" 
          subtitle="Seizoen 2025-2026"
        />
      ) : (
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Play-Off Klassement</h2>
          <Badge variant="secondary">Seizoen 2025-2026</Badge>
        </div>
      )}
      <Card>
        <CardContent className="py-12 bg-transparent">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-semibold mb-2">Fout bij laden</h3>
            <p className="text-muted-foreground mb-4">
              Kon playoff gegevens niet laden
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
PlayoffError.displayName = 'PlayoffError';
const PlayoffEmptyState = memo(() => {
  const isMobile = useIsMobile();
  return (
    <div className="space-y-6 animate-slide-up">
      {isMobile ? (
        <PageHeader 
          title="Play-Off Klassement" 
          subtitle="Seizoen 2025-2026"
        />
      ) : (
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Play-Off Klassement</h2>
          <Badge variant="secondary">Seizoen 2025-2026</Badge>
        </div>
      )}
      <Card>
        <CardContent className="py-12 bg-transparent">
          <div className="text-center">
            <Trophy className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Geen Play-Off Data</h3>
            <p className="text-muted-foreground">
              Er zijn momenteel geen play-off gegevens beschikbaar.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
PlayoffEmptyState.displayName = 'PlayoffEmptyState';

// Playoff standings table component
const PlayoffStandingsTable = memo(({
  teams,
  title
}: {
  teams: PlayoffTeam[];
  title: string;
}) => {
  if (!teams || teams.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">
        Geen teams beschikbaar
      </div>;
  }
  return <div className="overflow-x-auto">
      <Table className="table">
        <TableHeader>
          <TableRow className="table-header-row">
            <TableHead className="num w-10">Pos</TableHead>
            <TableHead className="left">Team</TableHead>
            <TableHead className="w-12 text-center" title="Playoff wedstrijden">​Wed</TableHead>
            <TableHead className="w-10 text-center" title="Gewonnen">W</TableHead>
            <TableHead className="w-10 text-center" title="Gelijk">G</TableHead>
            <TableHead className="w-10 text-center" title="Verloren">V</TableHead>
            <TableHead className="w-12 text-center" title="Doelsaldo">+/-</TableHead>
            <TableHead className="w-14 text-center" title="Reguliere punten">Reg  </TableHead>
            <TableHead className="w-14 text-center" title="Playoff punten">PO</TableHead>
            <TableHead className="w-14 text-center font-bold" title="Totaal punten">Tot</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams.map((team, index) => <TableRow key={team.team_id}>
              <TableCell className="num font-medium">{index + 1}</TableCell>
              <TableCell className="left font-medium">{team.team_name}</TableCell>
              <TableCell className="text-center">{team.playoff_played}</TableCell>
              <TableCell className="text-center text-green-600 font-medium">{team.playoff_wins}</TableCell>
              <TableCell className="text-center text-muted-foreground">{team.playoff_draws}</TableCell>
              <TableCell className="text-center text-red-600 font-medium">{team.playoff_losses}</TableCell>
              <TableCell className="text-center">
                <span className={team.playoff_goal_diff > 0 ? "text-green-600 font-medium" : team.playoff_goal_diff < 0 ? "text-red-600 font-medium" : ""}>
                  {team.playoff_goal_diff > 0 ? "+" : ""}{team.playoff_goal_diff}
                </span>
              </TableCell>
              <TableCell className="text-center text-muted-foreground">{team.regular_points}</TableCell>
              <TableCell className="text-center text-primary font-medium">{team.playoff_points}</TableCell>
              <TableCell className="text-center font-bold text-lg">{team.total_points}</TableCell>
            </TableRow>)}
        </TableBody>
      </Table>
    </div>;
});
PlayoffStandingsTable.displayName = 'PlayoffStandingsTable';

// Main component
const PlayOffPage: React.FC = () => {
  const {
    data,
    isLoading,
    error,
    refetch
  } = usePublicPlayoffData();
  const [selectedDivision, setSelectedDivision] = useState<string>("all");
  const [selectedSpeeldag, setSelectedSpeeldag] = useState<string>("all");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const isMobile = useIsMobile();

  // Convert matches to schedule table format
  const scheduleMatches = useMemo(() => {
    if (!data?.allMatches) return [];
    return data.allMatches.map(match => {
      const matchDate = new Date(match.match_date);
      const dateStr = matchDate.toLocaleDateString('nl-BE', {
        day: 'numeric',
        month: 'short'
      });
      const poLabel = match.playoff_type === 'top' ? 'PO1' : 'PO2';
      // Remove "Playoff " prefix if present
      const speeldagClean = match.speeldag ? match.speeldag.replace(/^Playoff\s+/i, '') : null;
      const matchday = speeldagClean ? `${speeldagClean} - ${poLabel}` : poLabel;
      return {
        matchId: match.match_id,
        matchday,
        playoffType: poLabel,
        speeldagNumber: speeldagClean,
        date: dateStr,
        time: match.time,
        homeTeamName: match.home_team_name,
        awayTeamName: match.away_team_name,
        homeScore: match.home_score ?? undefined,
        awayScore: match.away_score ?? undefined,
        location: match.location,
        isCompleted: match.is_completed
      };
    });
  }, [data?.allMatches]);

  // Get unique team names for filter (numerically sorted for position-based names)
  const teamNames = useMemo(() => {
    const names = new Set<string>();
    scheduleMatches.forEach(m => {
      if (m.homeTeamName) names.add(m.homeTeamName);
      if (m.awayTeamName) names.add(m.awayTeamName);
    });
    return Array.from(names).sort((a, b) => {
      const posA = a.match(/Team pos\. (\d+)/);
      const posB = b.match(/Team pos\. (\d+)/);
      if (posA && posB) return parseInt(posA[1]) - parseInt(posB[1]);
      if (posA) return -1;
      if (posB) return 1;
      return a.localeCompare(b, 'nl');
    });
  }, [scheduleMatches]);

  // Get unique speeldagen for filter (numerically sorted)
  const speeldagen = useMemo(() => {
    const uniqueSpeeldagen = new Set<string>();
    scheduleMatches.forEach(m => {
      if (m.speeldagNumber) uniqueSpeeldagen.add(m.speeldagNumber);
    });
    return Array.from(uniqueSpeeldagen).sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || '0');
      const numB = parseInt(b.match(/\d+/)?.[0] || '0');
      return numA - numB;
    });
  }, [scheduleMatches]);

  // Filter matches
  const filteredMatches = useMemo(() => {
    return scheduleMatches.filter(m => {
      if (selectedDivision !== "all" && m.playoffType !== selectedDivision) return false;
      if (selectedSpeeldag !== "all" && m.speeldagNumber !== selectedSpeeldag) return false;
      if (selectedTeam !== "all" && m.homeTeamName !== selectedTeam && m.awayTeamName !== selectedTeam) return false;
      return true;
    });
  }, [scheduleMatches, selectedDivision, selectedSpeeldag, selectedTeam]);
  if (isLoading) {
    return <PlayoffLoading />;
  }
  if (error) {
    return <PlayoffError onRetry={() => refetch()} />;
  }
  if (!data?.hasData) {
    return <PlayoffEmptyState />;
  }
  const {
    po1Teams,
    po2Teams
  } = data;
  return <div className="space-y-6 animate-slide-up">
      {/* Header - PageHeader on mobile, inline header on desktop */}
      {isMobile ? (
        <PageHeader 
          title="Play-Off Klassement" 
          subtitle="Seizoen 2025-2026"
        />
      ) : (
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Play-Off Klassement</h2>
          <Badge variant="secondary">Seizoen 2025-2026</Badge>
        </div>
      )}

      {/* Play-Off 1 Standings */}
      <section role="region" aria-labelledby="po1-heading">
        <Card>
          <CardHeader className="pb-2 bg-transparent">
            <CardTitle id="po1-heading" className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Play-Off 1 
            </CardTitle>
          </CardHeader>
        <CardContent className="p-4 pt-0 bg-transparent">
          <PlayoffStandingsTable teams={po1Teams} title="Play-Off 1" />
        </CardContent>
      </Card>
      </section>

      {/* Play-Off 2 Standings */}
      <section role="region" aria-labelledby="po2-heading">
        <Card>
          <CardHeader className="pb-2 bg-transparent">
            <CardTitle id="po2-heading">Play-Off 2 </CardTitle>
          </CardHeader>
        <CardContent className="p-4 pt-0 bg-transparent">
          <PlayoffStandingsTable teams={po2Teams} title="Play-Off 2" />
        </CardContent>
      </Card>
      </section>

      {/* Legend */}
      <div className="text-xs text-muted-foreground px-2">
        <span className="mr-4">PO = Playoff punten</span>
        <span className="mr-4">Reg = Reguliere competitie punten</span>
        <span>Tot = Totaal punten (Reg + PO)</span>
      </div>

      {/* Schedule */}
      <section role="region" aria-labelledby="schedule-heading">
        <Card>
          <CardHeader className="bg-transparent">
            <CardTitle id="schedule-heading">Speelschema</CardTitle>
            <CardDescription>Volledig overzicht van alle play-off wedstrijden</CardDescription>
          </CardHeader>
        <CardContent className="bg-transparent">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label className="mb-2 block">Speeldag</Label>
              <Select value={selectedSpeeldag} onValueChange={setSelectedSpeeldag}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle speeldagen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle speeldagen</SelectItem>
                  {speeldagen.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Divisie</Label>
              <Select value={selectedDivision} onValueChange={setSelectedDivision}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle divisies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle divisies</SelectItem>
                  <SelectItem value="PO1">Play-Off 1 (Top 8)</SelectItem>
                  <SelectItem value="PO2">Play-Off 2 (Bottom 7)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Team</Label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle teams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle teams</SelectItem>
                  {teamNames.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {filteredMatches.length > 0 ? <ResponsiveScheduleTable matches={filteredMatches} /> : <div className="text-center py-8 text-muted-foreground">
              Geen wedstrijden gevonden met de huidige filters
            </div>}
        </CardContent>
      </Card>
      </section>
    </div>;
};
export default PlayOffPage;