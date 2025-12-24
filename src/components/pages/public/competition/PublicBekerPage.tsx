import React, { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Award, AlertCircle } from "lucide-react";
import MatchesCupCard from "../../admin/matches/components/MatchesCupCard";
import { useCupData, CupMatchDisplay } from "@/hooks/useCupData";
import { PageHeader } from "@/components/layout";
import { useIsMobile } from "@/hooks/use-mobile";
// Skeleton loading components
const MatchCardSkeleton = memo(() => <Card className="w-full">
    <CardHeader className="pb-3">
      <div className="flex justify-between items-start mb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-5 w-32" />
    </CardHeader>
    <CardContent className="">
      <div className="flex justify-between items-center py-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-6 w-12" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-3 w-24 mt-2" />
    </CardContent>
  </Card>);
const TournamentRoundSkeleton = memo(({
  title,
  cardCount
}: {
  title: string;
  cardCount: number;
}) => {
  const headingId = React.useId();
  return (
    <section role="region" aria-labelledby={headingId}>
      <Card>
        <CardHeader className="">
          <CardTitle id={headingId}>{title}</CardTitle>
        </CardHeader>
        <CardContent className="">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(cardCount)].map((_, index) => <MatchCardSkeleton key={index} />)}
          </div>
        </CardContent>
      </Card>
    </section>
  );
});

// Reusable tournament round component
const TournamentRound = memo(({
  title,
  matches,
  emptyMessage,
  gridCols = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  roundName
}: {
  title: string;
  matches: CupMatchDisplay[];
  emptyMessage: string;
  gridCols?: string;
  roundName: string;
}) => {
  const headingId = React.useId();
  return (
    <section role="region" aria-labelledby={headingId}>
      <Card>
        <CardHeader className="">
          <CardTitle id={headingId}>{title}</CardTitle>
        </CardHeader>
        <CardContent className="">
          {matches.length > 0 ? <div className={`grid ${gridCols} gap-4`}>
              {matches.map(match => <MatchesCupCard key={match.id} id={match.id} home={match.home} away={match.away} homeScore={match.homeScore} awayScore={match.awayScore} date={match.date} time={match.time} location={match.location} nextMatch={match.nextMatch} tournamentRound={roundName} />)}
            </div> : <p className="text-center text-muted-foreground py-8 text-card-foreground">{emptyMessage}</p>}
        </CardContent>
      </Card>
    </section>
  );
});

// Tournament info component
const TournamentInfo = memo(() => {
  const headingId = React.useId();
  return (
    <section role="region" aria-labelledby={headingId}>
      <h2 id={headingId} className="sr-only">Toernooi Informatie</h2>
      <Card>
        <CardContent className="">
          {/* Tournament info content can be added here */}
        </CardContent>
      </Card>
    </section>
  );
});

// Loading component
const TournamentLoading = memo(() => {
  const isMobile = useIsMobile();
  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header - PageHeader on mobile, inline header on desktop */}
      {isMobile ? (
        <PageHeader 
          title="Beker" 
          subtitle="Seizoen 2025/2026"
        />
      ) : (
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold flex items-center gap-2 text-foreground">
            <Award className="h-5 w-5" />
            Beker 2025/2026
          </h2>
        </div>
      )}
      <TournamentRoundSkeleton title="Achtste Finales" cardCount={8} />
      <TournamentRoundSkeleton title="Kwart Finales" cardCount={4} />
      <TournamentRoundSkeleton title="Halve Finales" cardCount={2} />
      <TournamentRoundSkeleton title="Finale" cardCount={1} />
    </div>
  );
});

// Error component
const TournamentError = memo(({
  error,
  onRetry
}: {
  error: Error;
  onRetry: () => void;
}) => {
  const isMobile = useIsMobile();
  return (
    <div className="space-y-6 animate-slide-up">
      {isMobile ? (
        <PageHeader 
          title="Beker" 
          subtitle="Seizoen 2025/2026"
        />
      ) : (
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold flex items-center gap-2 text-foreground">
            <Award className="h-5 w-5" />
            Beker 2025/2026
          </h2>
        </div>
      )}
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-semibold mb-2 text-foreground">Fout bij laden</h3>
            <p className="text-muted-foreground mb-4">
              Kon toernooigegevens niet laden
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

// Empty state component
const TournamentEmpty = memo(() => {
  const isMobile = useIsMobile();
  return (
    <div className="space-y-6 animate-slide-up">
      {isMobile ? (
        <PageHeader 
          title="Beker" 
          subtitle="Seizoen 2025/2026"
        />
      ) : (
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold flex items-center gap-2 text-foreground">
            <Award className="h-5 w-5" />
            Beker 2025/2026
          </h2>
        </div>
      )}
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <Trophy className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2 text-foreground">Geen Toernooi Actief</h3>
            <p className="text-muted-foreground">
              Er is momenteel geen bekertoernooi actief. Neem contact op met de beheerder om een toernooi aan te maken.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

// Tournament content component
const TournamentContent = memo(({
  bracketData
}: {
  bracketData: NonNullable<ReturnType<typeof useCupData>['bracketData']>;
}) => {
  const isMobile = useIsMobile();
  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header - PageHeader on mobile, inline header on desktop */}
      {isMobile ? (
        <PageHeader 
          title="Beker" 
          subtitle="Seizoen 2025/2026"
        />
      ) : (
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold flex items-center gap-2 text-foreground">
            <Award className="h-5 w-5" />
            Beker 2025/2026
          </h2>
        </div>
      )}

      <TournamentRound title="Achtste Finales" matches={bracketData.eighthfinals} emptyMessage="Geen achtste finales beschikbaar" roundName="Achtste Finale" />

      <TournamentRound title="Kwart Finales" matches={bracketData.quarterfinals} emptyMessage="Geen kwart finales beschikbaar" roundName="Kwart Finale" />

      <TournamentRound title="Halve Finales" matches={bracketData.semifinals} emptyMessage="Geen halve finales beschikbaar" gridCols="grid-cols-1 md:grid-cols-2" roundName="Halve Finale" />

      <section role="region" aria-labelledby="finale-heading">
        <Card>
          <CardHeader className="">
            <CardTitle id="finale-heading" className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Finale
            </CardTitle>
          </CardHeader>
          <CardContent className="">
            {bracketData.final ? <div className="max-w-md mx-auto">
                <MatchesCupCard id={bracketData.final.id} home={bracketData.final.home} away={bracketData.final.away} homeScore={bracketData.final.homeScore} awayScore={bracketData.final.awayScore} date={bracketData.final.date} time={bracketData.final.time} location={bracketData.final.location} tournamentRound="Finale" />
              </div> : <p className="text-center text-muted-foreground py-8 text-card-foreground">
                Finale nog niet beschikbaar
              </p>}
          </CardContent>
        </Card>
      </section>

      <TournamentInfo />
    </div>
  );
});

// Main component
const PublicBekerPage: React.FC = () => {
  const {
    isLoading,
    error,
    bracketData,
    hasData,
    refetch
  } = useCupData();
  if (isLoading) {
    return <TournamentLoading />;
  }
  if (error) {
    return <TournamentError error={error} onRetry={() => refetch()} />;
  }
  if (!hasData || !bracketData) {
    return <TournamentEmpty />;
  }
  return <div className="space-y-6 animate-slide-up">
      <TournamentContent bracketData={bracketData} />
    </div>;
};

// Set display names for better debugging
MatchCardSkeleton.displayName = 'MatchCardSkeleton';
TournamentRoundSkeleton.displayName = 'TournamentRoundSkeleton';
TournamentRound.displayName = 'TournamentRound';
TournamentInfo.displayName = 'TournamentInfo';
TournamentLoading.displayName = 'TournamentLoading';
TournamentError.displayName = 'TournamentError';
TournamentEmpty.displayName = 'TournamentEmpty';
TournamentContent.displayName = 'TournamentContent';
export default memo(PublicBekerPage);