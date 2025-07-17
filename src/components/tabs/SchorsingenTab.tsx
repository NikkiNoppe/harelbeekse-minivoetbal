import React, { memo, useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Shield, Trophy } from "lucide-react";
import { useSuspensionsData } from "@/hooks/useSuspensionsData";
import type { Suspension, PlayerCard } from "@/services";

// Loading skeleton components
const SuspensionsTableSkeleton = memo(() => (
  <Table>
    <TableHeader>
      <TableRow className="bg-muted/50">
        <TableHead>Speler</TableHead>
        <TableHead>Team</TableHead>
        <TableHead>Reden</TableHead>
        <TableHead>Aantal Wedstrijden</TableHead>
        <TableHead>Status</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {[...Array(5)].map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-8" /></TableCell>
          <TableCell><Skeleton className="h-6 w-16" /></TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
));

const PlayerCardsTableSkeleton = memo(() => (
  <Table>
    <TableHeader>
      <TableRow className="bg-muted/30">
        <TableHead>Speler</TableHead>
        <TableHead>Team</TableHead>
        <TableHead className="text-center">Geel</TableHead>
        <TableHead className="text-center">Rood</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {[...Array(5)].map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell className="text-center"><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
          <TableCell className="text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
));

SuspensionsTableSkeleton.displayName = 'SuspensionsTableSkeleton';
PlayerCardsTableSkeleton.displayName = 'PlayerCardsTableSkeleton';

// Status badge component
const StatusBadge = memo(({ status }: { status: 'active' | 'pending' | 'completed' }) => {
  const badgeProps = useMemo(() => {
    switch (status) {
      case 'active':
        return { children: 'Actief', className: 'bg-red-100 text-red-800 hover:bg-red-200' };
      case 'pending':
        return { children: 'In afwachting', className: 'bg-orange-100 text-orange-800 hover:bg-orange-200' };
      case 'completed':
        return { children: 'Afgerond', className: 'bg-green-100 text-green-800 hover:bg-green-200' };
      default:
        return { children: 'Onbekend', className: 'bg-gray-100 text-gray-800 hover:bg-gray-200' };
    }
  }, [status]);

  return <Badge {...badgeProps} />;
});

StatusBadge.displayName = 'StatusBadge';

// Card display component
const CardDisplay = memo(({ count, color }: { count: number; color: string }) => {
  const cardElements = useMemo(() => 
    [...Array(count)].map((_, i) => (
      <div key={i} className={`h-5 w-3 ${color} rounded-sm`} />
    )), [count, color]);

  return (
    <div className="flex items-center justify-center space-x-1">
      {cardElements}
    </div>
  );
});

CardDisplay.displayName = 'CardDisplay';

// Active suspensions table
const ActiveSuspensionsTable = memo(({ suspensions }: { suspensions: Suspension[] }) => {
  const suspensionRows = useMemo(() => 
    suspensions.map((suspension, index) => (
      <TableRow key={`${suspension.playerId}-${index}`} className="hover:bg-muted/30">
        <TableCell className="font-medium">{suspension.playerName}</TableCell>
        <TableCell>{suspension.teamName}</TableCell>
        <TableCell>{suspension.reason}</TableCell>
        <TableCell className="text-center">{suspension.matches}</TableCell>
        <TableCell>
          <StatusBadge status={suspension.status} />
        </TableCell>
      </TableRow>
    )), [suspensions]);

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/50">
          <TableHead>Speler</TableHead>
          <TableHead>Team</TableHead>
          <TableHead>Reden</TableHead>
          <TableHead>Aantal Wedstrijden</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {suspensionRows.length > 0 ? suspensionRows : (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
              <div className="flex flex-col items-center space-y-2">
                <Shield className="h-8 w-8 text-green-500" />
                <span>Geen actieve schorsingen</span>
              </div>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
});

ActiveSuspensionsTable.displayName = 'ActiveSuspensionsTable';

// Player cards table
const PlayerCardsTable = memo(({ players }: { players: PlayerCard[] }) => {
  const playerRows = useMemo(() => 
    players.map(player => (
      <TableRow key={player.playerId} className="hover:bg-muted/20">
        <TableCell>{player.playerName}</TableCell>
        <TableCell>{player.teamName}</TableCell>
        <TableCell className="text-center">
          <CardDisplay count={player.yellowCards} color="bg-yellow-400" />
        </TableCell>
        <TableCell className="text-center">
          <CardDisplay count={player.redCards} color="bg-red-500" />
        </TableCell>
      </TableRow>
    )), [players]);

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/30">
          <TableHead>Speler</TableHead>
          <TableHead>Team</TableHead>
          <TableHead className="text-center">Geel</TableHead>
          <TableHead className="text-center">Rood</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {playerRows.length > 0 ? playerRows : (
          <TableRow>
            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
              <div className="flex flex-col items-center space-y-2">
                <Trophy className="h-8 w-8 text-blue-500" />
                <span>Geen kaarten geregistreerd</span>
              </div>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
});

PlayerCardsTable.displayName = 'PlayerCardsTable';

// Dynamic Suspension Rules component
const SuspensionRules = memo(() => {
  const [rules, setRules] = useState<any>(null);
  
  useEffect(() => {
    const loadRules = async () => {
      try {
        const { suspensionRulesService } = await import("@/services/suspensionRulesService");
        const suspensionRules = await suspensionRulesService.getSuspensionRules();
        setRules(suspensionRules);
      } catch (error) {
        console.error('Failed to load suspension rules:', error);
      }
    };
    
    loadRules();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Huidige Schorsingsregels</CardTitle>
      </CardHeader>
      <CardContent className="text-sm space-y-3">
        <div className="space-y-1">
          <h4 className="font-medium">Gele Kaarten</h4>
          <p className="text-muted-foreground">
            Schorsingen na gele kaarten:
          </p>
          <ul className="list-disc pl-5 text-muted-foreground space-y-1">
            {rules?.yellow_card_rules?.map((rule: any, index: number) => (
              <li key={index}>
                {rule.min_cards === rule.max_cards 
                  ? `${rule.min_cards} gele kaarten` 
                  : `${rule.min_cards}-${rule.max_cards} gele kaarten`}: {rule.suspension_matches} wedstrijd{rule.suspension_matches > 1 ? 'en' : ''}
              </li>
            )) || (
              <>
                <li>2-3 gele kaarten: 1 wedstrijd schorsing</li>
                <li>4-5 gele kaarten: 2 opeenvolgende wedstrijden</li>
                <li>6+ gele kaarten: 3 opeenvolgende wedstrijden</li>
              </>
            )}
          </ul>
        </div>
        
        <div className="space-y-1">
          <h4 className="font-medium">Rode Kaarten</h4>
          <ul className="list-disc pl-5 text-muted-foreground">
            <li>Rode kaart: onmiddellijke uitsluiting ZONDER vervanging</li>
            <li>Minimum schorsing: {rules?.red_card_rules?.default_suspension_matches || 1} wedstrijd{(rules?.red_card_rules?.default_suspension_matches || 1) > 1 ? 'en' : ''}</li>
            {rules?.red_card_rules?.admin_can_modify && (
              <li>Admin kan schorsing aanpassen (max {rules.red_card_rules.max_suspension_matches} wedstrijden)</li>
            )}
          </ul>
        </div>
        
        <div className="space-y-1">
          <h4 className="font-medium">Beroepsprocedure</h4>
          <p className="text-muted-foreground">
            Clubs kunnen binnen 7 werkdagen na de wedstrijd beroep aantekenen tegen een rode kaart.
          </p>
          <p className="text-muted-foreground">
            Dit gebeurd schriftelijk via noppe.nikki@icloud.com.
          </p>
        </div>
      </CardContent>
    </Card>
  );
});

SuspensionRules.displayName = 'SuspensionRules';

// Error state component
const ErrorState = memo(({ onRetry }: { onRetry: () => void }) => (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription className="flex items-center justify-between">
      <span>Er is een fout opgetreden bij het laden van de schorsingsgegevens.</span>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onRetry}
        className="ml-2"
      >
        Probeer opnieuw
      </Button>
    </AlertDescription>
  </Alert>
));

ErrorState.displayName = 'ErrorState';

// Main component
const SchorsingenTab: React.FC = () => {
  const {
    suspensions,
    topYellowCardPlayers,
    isLoading,
    hasError,
    refetchPlayerCards,
    refetchSuspensions
  } = useSuspensionsData();

  const handleRetry = () => {
    refetchPlayerCards();
    refetchSuspensions();
  };

  // Show error state
  if (hasError) {
    return (
      <div className="space-y-8 animate-slide-up">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Actuele Schorsingen</h2>
        </div>
        <ErrorState onRetry={handleRetry} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Actuele Schorsingen</h2>
      </div>



      {/* Active Suspensions Table */}
      <section>
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            {isLoading ? (
              <SuspensionsTableSkeleton />
            ) : (
              <ActiveSuspensionsTable suspensions={suspensions || []} />
            )}
          </CardContent>
        </Card>
      </section>

      {/* Player Cards Section */}
      <section>
        <h2 className="text-2xl font-semibold mt-8">Gele Kaarten Register</h2>
        <div className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Spelers met Meeste Gele Kaarten</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <PlayerCardsTableSkeleton />
                ) : (
                  <PlayerCardsTable players={topYellowCardPlayers} />
                )}
              </CardContent>
            </Card>

            <SuspensionRules />
          </div>
        </div>
      </section>
    </div>
  );
};

export default SchorsingenTab; 