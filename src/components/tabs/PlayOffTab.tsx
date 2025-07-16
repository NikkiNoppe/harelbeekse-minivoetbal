import React, { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Trophy } from "lucide-react";
import AutoFitText from "@/components/ui/auto-fit-text";
import ResponsiveStandingsTable from "../tables/ResponsiveStandingsTable";
import { useCompetitionStandings } from "@/hooks/useCompetitionData";
import { usePlayoffMatches } from "@/hooks/usePlayoffData";

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
const PlayoffStandingsSection = memo(({ teams }: { teams: any[] }) => (
  <section>
    <Card>
      <CardContent className="p-0 overflow-x-auto">
        <ResponsiveStandingsTable teams={teams} showPlayoff={true} />
      </CardContent>
    </Card>
  </section>
));

// Memoized match card component
const PlayoffMatchCard = memo(({ match }: { match: any }) => (
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

// Memoized matches section
const PlayoffMatchesSection = memo(({ matches }: { matches: any[] }) => (
  <section>
    <h2 className="text-2xl font-semibold">Uitslagen Play-Offs</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto px-4">
      {matches.map((match, index) => (
        <PlayoffMatchCard key={index} match={match} />
      ))}
    </div>
  </section>
));

// Memoized upcoming matches section (conditionally rendered)
const UpcomingPlayoffMatches = memo(({ matches }: { matches: any[] }) => (
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
  teams: any[]; 
  matches: any[]; 
  upcomingMatches: any[]; 
}) => (
  <div className="space-y-8 animate-slide-up">
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-semibold">Eindklassement</h2>
      <Badge className="badge-purple">Seizoen 2025-2026</Badge>
    </div>

    <PlayoffStandingsSection teams={teams} />
    
    {matches.length > 0 && <PlayoffMatchesSection matches={matches} />}
    
    {upcomingMatches.length > 0 && <UpcomingPlayoffMatches matches={upcomingMatches} />}
  </div>
));

// Main component
const PlayOffTab: React.FC = () => {
  // Haal de eindstand van de reguliere competitie op (startpunt playoff)
  const { data: standings, isLoading: standingsLoading, error: standingsError } = useCompetitionStandings();
  // Haal alle playoff-wedstrijden op
  const { data: playoffMatches, isLoading: matchesLoading, error: matchesError } = usePlayoffMatches();

  if (standingsLoading || matchesLoading) {
    return <PlayoffLoading />;
  }
  if (standingsError || matchesError) {
    return <PlayoffError error={standingsError || matchesError} onRetry={() => window.location.reload()} />;
  }
  if (!standings || standings.length === 0) {
    return <PlayoffEmptyState />;
  }
  // Splits teams in top/bottom
  const total = standings.length;
  const topCount = Math.ceil(total / 2);
  const bottomCount = Math.floor(total / 2);
  const topTeams = standings.slice(0, topCount);
  const bottomTeams = standings.slice(topCount);
  const topTeamIds = new Set(topTeams.map(t => t.id));
  const bottomTeamIds = new Set(bottomTeams.map(t => t.id));
  // Filter playoff-wedstrijden per groep
  const getTeamId = (m, type) => m[type + '_team_id'] ?? m[type + 'TeamId'];
  const topPlayoffMatches = (playoffMatches || []).filter(m => getTeamId(m, 'home') && getTeamId(m, 'away') && topTeamIds.has(getTeamId(m, 'home')) && topTeamIds.has(getTeamId(m, 'away')));
  const bottomPlayoffMatches = (playoffMatches || []).filter(m => getTeamId(m, 'home') && getTeamId(m, 'away') && bottomTeamIds.has(getTeamId(m, 'home')) && bottomTeamIds.has(getTeamId(m, 'away')));

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Play-Off Standen & Wedstrijden</h2>
        <Badge className="badge-purple">Seizoen 2025-2026</Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Top Teams */}
        <div>
          <h3 className="font-semibold mb-2">Top Teams</h3>
          <PlayoffStandingsSection teams={topTeams} />
          <PlayoffMatchesSection matches={topPlayoffMatches} />
        </div>
        {/* Bottom Teams */}
        <div>
          <h3 className="font-semibold mb-2">Bottom Teams</h3>
          <PlayoffStandingsSection teams={bottomTeams} />
          <PlayoffMatchesSection matches={bottomPlayoffMatches} />
        </div>
      </div>
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
PlayoffMatchesSection.displayName = 'PlayoffMatchesSection';
UpcomingPlayoffMatches.displayName = 'UpcomingPlayoffMatches';
PlayoffEmptyState.displayName = 'PlayoffEmptyState';
PlayoffContent.displayName = 'PlayoffContent';

export default memo(PlayOffTab);
