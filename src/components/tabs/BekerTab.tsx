import React, { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Award, AlertCircle } from "lucide-react";
import CupMatchCard from "../match/components/CupMatchCard";
import { useCupData, CupMatchDisplay } from "@/hooks/useCupData";

// Skeleton loading components
const MatchCardSkeleton = memo(() => (
  <Card className="w-full">
    <CardHeader className="pb-3">
      <div className="flex justify-between items-start mb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-5 w-32" />
    </CardHeader>
    <CardContent>
      <div className="flex justify-between items-center py-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-6 w-12" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-3 w-24 mt-2" />
    </CardContent>
  </Card>
));

const TournamentRoundSkeleton = memo(({ title, cardCount }: { title: string; cardCount: number }) => (
  <section>
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(cardCount)].map((_, index) => (
            <MatchCardSkeleton key={index} />
          ))}
        </div>
      </CardContent>
    </Card>
  </section>
));

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
}) => (
  <section>
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {matches.length > 0 ? (
          <div className={`grid ${gridCols} gap-4`}>
            {matches.map(match => (
              <CupMatchCard
                key={match.id}
                id={match.id}
                home={match.home}
                away={match.away}
                homeScore={match.homeScore}
                awayScore={match.awayScore}
                date={match.date}
                time={match.time}
                location={match.location}
                nextMatch={match.nextMatch}
                tournamentRound={roundName}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">{emptyMessage}</p>
        )}
      </CardContent>
    </Card>
  </section>
));

// Tournament info component
const TournamentInfo = memo(() => (
  <section>
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Toernooiinformatie</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              Finaleinfo
            </h4>
            <div className="space-y-2 text-sm">
              <div><strong>Datum:</strong> nog te bepalen</div>
              <div><strong>Locatie:</strong> Dageraad Harelbeke</div>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="font-medium">Toernooiformat</h4>
            <div className="space-y-2 text-sm">
              <div>• Knock-out systeem</div>
              <div>• Geen verlenging</div>
              <div>• Direct naar strafschoppen</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </section>
));

// Loading component
const TournamentLoading = memo(() => (
  <div className="space-y-8 animate-slide-up">
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-semibold flex items-center gap-2">
        <Award className="h-5 w-5" />
        Beker 2025/2026
      </h2>
    </div>
    <TournamentRoundSkeleton title="Achtste Finales" cardCount={8} />
    <TournamentRoundSkeleton title="Kwart Finales" cardCount={4} />
    <TournamentRoundSkeleton title="Halve Finales" cardCount={2} />
    <TournamentRoundSkeleton title="Finale" cardCount={1} />
  </div>
));

// Error component
const TournamentError = memo(({ error, onRetry }: { error: Error; onRetry: () => void }) => (
  <div className="space-y-8 animate-slide-up">
    <Card>
      <CardContent className="py-12">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
          <h3 className="text-lg font-semibold mb-2">Fout bij laden</h3>
          <p className="text-muted-foreground mb-4">
            Kon toernooigegevens niet laden
          </p>

        </div>
      </CardContent>
    </Card>
  </div>
));

// Empty state component
const TournamentEmpty = memo(() => (
  <div className="space-y-8 animate-slide-up">
    <Card>
      <CardContent className="py-12">
        <div className="text-center">
          <Trophy className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Geen Toernooi Actief</h3>
          <p className="text-muted-foreground">
            Er is momenteel geen bekertoernooi actief. Neem contact op met de beheerder om een toernooi aan te maken.
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
));

// Tournament content component
const TournamentContent = memo(({ bracketData }: { bracketData: NonNullable<ReturnType<typeof useCupData>['bracketData']> }) => (
  <div className="space-y-8 animate-slide-up">
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-semibold flex items-center gap-2">
        <Award className="h-5 w-5" />
        Beker 2025/2026
      </h2>
    </div>

    <TournamentRound
      title="Achtste Finales"
      matches={bracketData.eighthfinals}
      emptyMessage="Geen achtste finales beschikbaar"
      roundName="Achtste Finale"
    />

    <TournamentRound
      title="Kwart Finales"
      matches={bracketData.quarterfinals}
      emptyMessage="Geen kwart finales beschikbaar"
      roundName="Kwart Finale"
    />

    <TournamentRound
      title="Halve Finales"
      matches={bracketData.semifinals}
      emptyMessage="Geen halve finales beschikbaar"
      gridCols="grid-cols-1 md:grid-cols-2"
      roundName="Halve Finale"
    />

    <section>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Finale
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bracketData.final ? (
            <div className="max-w-md mx-auto">
              <CupMatchCard
                id={bracketData.final.id}
                home={bracketData.final.home}
                away={bracketData.final.away}
                homeScore={bracketData.final.homeScore}
                awayScore={bracketData.final.awayScore}
                date={bracketData.final.date}
                time={bracketData.final.time}
                location={bracketData.final.location}
                tournamentRound="Finale"
              />
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Finale nog niet beschikbaar
            </p>
          )}
        </CardContent>
      </Card>
    </section>

    <TournamentInfo />
  </div>
));

// Main component
const BekerTab: React.FC = () => {
  const { isLoading, error, bracketData, hasData, refetch } = useCupData();

  if (isLoading) {
    return <TournamentLoading />;
  }

  if (error) {
    return <TournamentError error={error} onRetry={() => refetch()} />;
  }

  if (!hasData) {
    return <TournamentEmpty />;
  }

  return <TournamentContent bracketData={bracketData!} />;
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

export default memo(BekerTab); 