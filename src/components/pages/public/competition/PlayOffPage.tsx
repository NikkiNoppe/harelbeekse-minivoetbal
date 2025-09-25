import React, { memo, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Trophy } from "lucide-react";
import AutoFitText from "@/components/ui/auto-fit-text";
import ResponsiveStandingsTable from "@/components/tables/ResponsiveStandingsTable";
import ResponsiveScheduleTable from "@/components/tables/ResponsiveScheduleTable";
import { usePlayoffData, PlayoffMatch } from "@/hooks/usePlayoffData";
import { Team } from "@/hooks/useCompetitionData";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
// Skeleton loading components
const StandingsTableSkeleton = memo(() => (
  <div className="space-y-4">
    {[...Array(6)].map((_, index) => (
      <div key={index} className="flex justify-between items-center p-3">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex space-x-6">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-8" />
        </div>
      </div>
    ))}
  </div>
));

const PlayoffMatchSkeleton = memo(() => (
  <Card className="card-hover">
    <CardHeader className="pb-2">
      <div className="flex justify-between items-start mb-1">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-5 w-16" />
      <Skeleton className="h-4 w-24" />
    </CardHeader>
    <CardContent>
      <div className="flex justify-between items-center py-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-6 w-12" />
        <Skeleton className="h-4 w-20" />
      </div>
    </CardContent>
  </Card>
));

const PlayoffMatchesSkeleton = memo(({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto px-4">
    {[...Array(count)].map((_, index) => (
      <PlayoffMatchSkeleton key={index} />
    ))}
  </div>
));

// Loading component
const PlayoffLoading = memo(() => (
  <div className="space-y-8 animate-slide-up">
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-semibold">Eindklassement</h2>
      <Badge className="badge-purple">Seizoen 2025-2026</Badge>
    </div>

    <section>
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <StandingsTableSkeleton />
        </CardContent>
      </Card>
    </section>

    <section>
      <h2 className="text-2xl font-semibold">Uitslagen Play-Offs</h2>
      <PlayoffMatchesSkeleton count={9} />
    </section>
  </div>
));

// Error component
const PlayoffError = memo(({ error, onRetry }: { error: Error; onRetry: () => void }) => (
  <div className="space-y-8 animate-slide-up">
    <Card>
      <CardContent className="py-12">
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
));

// Memoized standings section
const PlayoffStandingsSection = memo(({ teams }: { teams: Team[] }) => (
  <section>
    <Card>
      <CardContent className="p-0 overflow-x-auto">
        <ResponsiveStandingsTable teams={teams} showPlayoff={true} />
      </CardContent>
    </Card>
  </section>
));

// Memoized match card component
const PlayoffMatchCard = memo(({ match }: { match: PlayoffMatch }) => (
  <Card className="card-hover">
    <CardHeader className="pb-2">
      <div className="flex justify-between items-start mb-1">
        <Badge className="badge-purple">
          {match.playoff}
        </Badge>
        <span className="text-sm text-muted-foreground">{match.matchday}</span>
      </div>
      <CardTitle className="text-lg">{match.date}</CardTitle>
      <p className="text-sm text-muted-foreground">{match.location}</p>
    </CardHeader>
    <CardContent>
      <div className="flex justify-between items-center py-2">
        <div className="team-name-container text-left" style={{ maxWidth: '47%' }}>
          <AutoFitText 
            text={match.home}
            maxFontSize={16}
            minFontSize={7}
            className="font-medium"
            style={{ textAlign: 'left' }}
          />
        </div>
        <div className="px-3 py-1 bg-muted rounded-lg font-bold">
          {match.result || 'VS'}
        </div>
        <div className="team-name-container text-right" style={{ maxWidth: '47%' }}>
          <AutoFitText 
            text={match.away}
            maxFontSize={16}
            minFontSize={7}
            className="font-medium"
            style={{ textAlign: 'right' }}
          />
        </div>
      </div>
    </CardContent>
  </Card>
));



// Memoized upcoming matches section (conditionally rendered)
const UpcomingPlayoffMatches = memo(({ matches }: { matches: PlayoffMatch[] }) => (
  <section>
    <h2 className="text-2xl font-semibold mb-4">Aankomende Play-Off Wedstrijden</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto px-4">
      {matches.map((match, index) => (
        <Card key={index} className="card-hover">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start mb-1">
              <Badge className="badge-purple">
                {match.playoff}
              </Badge>
              <span className="text-sm text-muted-foreground">{match.matchday}</span>
            </div>
            <CardTitle className="flex justify-between items-center text-lg">
              <span>{match.date}</span>
              {match.time && (
                <span className="text-soccer-green font-medium">{match.time}</span>
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{match.location}</p>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center py-2">
              <div className="team-name-container text-left" style={{ maxWidth: '47%' }}>
                <AutoFitText 
                  text={match.home}
                  maxFontSize={16}
                  minFontSize={7}
                  className="font-medium"
                  style={{ textAlign: 'left' }}
                />
              </div>
              <div className="px-3 py-1 bg-muted rounded-lg font-medium">VS</div>
              <div className="team-name-container text-right" style={{ maxWidth: '47%' }}>
                <AutoFitText 
                  text={match.away}
                  maxFontSize={16}
                  minFontSize={7}
                  className="font-medium"
                  style={{ textAlign: 'right' }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </section>
));

// Empty state component
const PlayoffEmptyState = memo(() => (
  <div className="space-y-8 animate-slide-up">
    <Card>
      <CardContent className="py-12">
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
));

// Main content component
const PlayoffContent = memo(({ 
  teams, 
  matches, 
  upcomingMatches 
}: { 
  teams: Team[]; 
  matches: PlayoffMatch[]; 
  upcomingMatches: PlayoffMatch[]; 
}) => (
  <div className="space-y-8 animate-slide-up">
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-semibold">Eindklassement</h2>
      <Badge className="badge-purple">Seizoen 2025-2026</Badge>
    </div>

    <PlayoffStandingsSection teams={teams} />
    
    {upcomingMatches.length > 0 && <UpcomingPlayoffMatches matches={upcomingMatches} />}
  </div>
));

// Main component
const PlayOffPage: React.FC = () => {
  const { teams, matches, upcomingMatches, isLoading, error, refetch } = usePlayoffData();

  const [selectedRound, setSelectedRound] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  // Convert PlayoffMatch to schedule table format
  const allMatches = useMemo(() => {
    const combined = [...matches, ...upcomingMatches];
    return combined.map((match, index) => ({
      matchId: index,
      matchday: match.playoff || '',
      date: match.date || '',
      time: match.time || '',
      homeTeamName: match.home,
      awayTeamName: match.away,
      homeScore: match.result ? parseInt(match.result.split('-')[0]) : undefined,
      awayScore: match.result ? parseInt(match.result.split('-')[1]) : undefined,
      location: match.location || '',
      isCompleted: !!match.result
    }));
  }, [matches, upcomingMatches]);

  const rounds = useMemo(() => {
    const uniqueRounds = [...new Set(allMatches.map(m => m.matchday))];
    return uniqueRounds.filter(Boolean).sort();
  }, [allMatches]);

  const teamNames = useMemo(() => {
    const names = new Set<string>();
    allMatches.forEach(m => {
      if (m.homeTeamName) names.add(m.homeTeamName);
      if (m.awayTeamName) names.add(m.awayTeamName);
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b, 'nl'));
  }, [allMatches]);

  const filteredMatches = useMemo(() => {
    return allMatches.filter((m) => {
      if (selectedRound && m.matchday !== selectedRound) return false;
      if (selectedTeam && m.homeTeamName !== selectedTeam && m.awayTeamName !== selectedTeam) return false;
      return true;
    });
  }, [allMatches, selectedRound, selectedTeam]);

  if (isLoading) {
    return <PlayoffLoading />;
  }

  if (error) {
    return <PlayoffError error={error} onRetry={() => refetch()} />;
  }

  if (!teams || teams.length === 0) {
    return <PlayoffEmptyState />;
  }

  return (
    <div className="space-y-8">
      <PlayoffContent 
        teams={teams} 
        matches={matches} 
        upcomingMatches={upcomingMatches} 
      />
      
      <Card>
        <CardHeader className="bg-transparent">
          <CardTitle>Speelschema</CardTitle>
          <CardDescription>Volledig overzicht van alle play-off wedstrijden</CardDescription>
        </CardHeader>
        <CardContent className="bg-transparent">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label className="mb-2 block">Ronde</Label>
              <Select value={selectedRound ?? "all"} onValueChange={(v) => setSelectedRound(v === "all" ? null : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle rondes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle rondes</SelectItem>
                  {rounds.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
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
          <ResponsiveScheduleTable matches={filteredMatches} />
        </CardContent>
      </Card>
    </div>
  );
};

// Set display names for better debugging
StandingsTableSkeleton.displayName = 'StandingsTableSkeleton';
PlayoffMatchSkeleton.displayName = 'PlayoffMatchSkeleton';
PlayoffMatchesSkeleton.displayName = 'PlayoffMatchesSkeleton';
PlayoffLoading.displayName = 'PlayoffLoading';
PlayoffError.displayName = 'PlayoffError';
PlayoffStandingsSection.displayName = 'PlayoffStandingsSection';
PlayoffMatchCard.displayName = 'PlayoffMatchCard';
UpcomingPlayoffMatches.displayName = 'UpcomingPlayoffMatches';
PlayoffEmptyState.displayName = 'PlayoffEmptyState';
PlayoffContent.displayName = 'PlayoffContent';

export default PlayOffPage;
