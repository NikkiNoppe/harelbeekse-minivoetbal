import React, { memo, useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Shield, Trophy, Users } from "lucide-react";
import { useSuspensionsData, type Suspension, type PlayerCard } from "@/domains/cards-suspensions";
import { useAuth } from "@/hooks/useAuth";

// Loading skeleton components
const SuspensionsTableSkeleton = memo(() => (
  <Table>
    <TableHeader>
      <TableRow className="table-header-row">
        <TableHead>Speler</TableHead>
        <TableHead>Reden</TableHead>
        <TableHead>Aantal Wedstrijden</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Volgende Speeldag</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {[...Array(5)].map((_, i) => (
        <TableRow key={i}>
          <TableCell className="table-skeleton-cell"><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell className="table-skeleton-cell"><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell className="table-skeleton-cell"><Skeleton className="h-4 w-8" /></TableCell>
          <TableCell className="table-skeleton-cell"><Skeleton className="h-6 w-16" /></TableCell>
          <TableCell className="table-skeleton-cell"><Skeleton className="h-4 w-20" /></TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
));

const PlayerCardsTableSkeleton = memo(() => (
  <Table>
    <TableHeader>
      <TableRow className="table-header-row">
        <TableHead>Speler</TableHead>
        <TableHead>Geel</TableHead>
        <TableHead>Rood</TableHead>
        <TableHead>Status</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {[...Array(5)].map((_, i) => (
        <TableRow key={i}>
          <TableCell className="table-skeleton-cell"><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell className="table-skeleton-cell"><Skeleton className="h-4 w-8" /></TableCell>
          <TableCell className="table-skeleton-cell"><Skeleton className="h-4 w-8" /></TableCell>
          <TableCell className="table-skeleton-cell"><Skeleton className="h-6 w-16" /></TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
));

const SchorsingenPage: React.FC = memo(() => {
  const { user } = useAuth();
  const { 
    suspensions, 
    playerCards, 
    isLoading, 
    playerCardsError,
    suspensionsError,
    refetchPlayerCards,
    refetchSuspensions
  } = useSuspensionsData();

  // Filter data for current team manager's team only
  const teamSuspensions = useMemo(() => {
    if (!user?.teamId || !suspensions) return [];
    return suspensions.filter(suspension => suspension.teamName === user.teamId?.toString());
  }, [suspensions, user?.teamId]);

  const teamPlayerCards = useMemo(() => {
    if (!user?.teamId || !playerCards) return [];
    return playerCards.filter(card => card.teamName === user.teamId?.toString());
  }, [playerCards, user?.teamId]);

  // Get suspension status badge  
  const getSuspensionStatusBadge = (suspension: Suspension) => {
    // Since Suspension interface doesn't have startDate/endDate, use status
    if (suspension.status === 'pending') {
      return <Badge variant="secondary">Nog niet actief</Badge>;
    } else if (suspension.status === 'active') {
      return <Badge variant="destructive">Actief</Badge>;
    } else {
      return <Badge variant="outline">Voltooid</Badge>;
    }
  };

  // Get card status badge
  const getCardStatusBadge = (card: PlayerCard) => {
    if (card.yellowCards >= 5) {
      return <Badge variant="destructive">Schorsing</Badge>;
    } else if (card.yellowCards >= 3) {
      return <Badge variant="secondary">Waarschuwing</Badge>;
    } else {
      return <Badge variant="outline">OK</Badge>;
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Get next match date (simplified - you might want to implement proper logic)
  const getNextMatchDate = (suspension: Suspension) => {
    // This is a placeholder - you'd need to implement logic to get the next match date
    // based on your competition schedule
    return "Te bepalen";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Schorsingen - Mijn Team
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Overzicht van schorsingen en kaarten voor jouw team
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Actieve Schorsingen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SuspensionsTableSkeleton />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Kaarten Overzicht
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PlayerCardsTableSkeleton />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (playerCardsError || suspensionsError) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Schorsingen - Mijn Team
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Overzicht van schorsingen en kaarten voor jouw team
            </p>
          </div>
        </div>

        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800">
            Er is een fout opgetreden bij het laden van de schorsingen: {(playerCardsError || suspensionsError)?.message}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                refetchPlayerCards();
                refetchSuspensions();
              }} 
              className="ml-4"
            >
              Opnieuw proberen
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Schorsingen - Mijn Team
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Overzicht van schorsingen en kaarten voor jouw team
          </p>
        </div>
        <Button variant="outline" onClick={() => {
          refetchPlayerCards();
          refetchSuspensions();
        }}>
          Vernieuwen
        </Button>
      </div>

      {/* Active Suspensions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Actieve Schorsingen
          </CardTitle>
        </CardHeader>
        <CardContent>
          {teamSuspensions.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Geen actieve schorsingen</h3>
              <p className="text-muted-foreground">Alle spelers van jouw team kunnen spelen.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="table-header-row">
                    <TableHead>Speler</TableHead>
                    <TableHead>Reden</TableHead>
                    <TableHead>Aantal Wedstrijden</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Volgende Speeldag</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamSuspensions.map((suspension) => (
                    <TableRow key={suspension.playerId}>
                      <TableCell className="font-medium">
                        {suspension.playerName}
                      </TableCell>
                      <TableCell>{suspension.reason}</TableCell>
                      <TableCell>{suspension.matches}</TableCell>
                      <TableCell>{getSuspensionStatusBadge(suspension)}</TableCell>
                      <TableCell>N/A</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Player Cards Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Kaarten Overzicht
          </CardTitle>
        </CardHeader>
        <CardContent>
          {teamPlayerCards.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Geen kaarten data</h3>
              <p className="text-muted-foreground">Er zijn nog geen kaarten geregistreerd voor jouw team.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="table-header-row">
                    <TableHead>Speler</TableHead>
                    <TableHead>Geel</TableHead>
                    <TableHead>Rood</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamPlayerCards.map((card) => (
                    <TableRow key={card.playerId}>
                      <TableCell className="font-medium">
                        {card.playerName}
                      </TableCell>
                      <TableCell>
                        <Badge variant={card.yellowCards >= 3 ? "secondary" : "outline"}>
                          {card.yellowCards}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={card.redCards > 0 ? "destructive" : "outline"}>
                          {card.redCards}
                        </Badge>
                      </TableCell>
                      <TableCell>{getCardStatusBadge(card)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

SchorsingenPage.displayName = 'SchorsingenPage';

export default SchorsingenPage;
