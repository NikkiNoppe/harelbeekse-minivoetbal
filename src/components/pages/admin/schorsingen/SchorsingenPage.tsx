import React, { memo, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Shield, Trophy, Users, RefreshCw, Plus } from "lucide-react";
import { useSuspensionsData } from "@/domains/cards-suspensions";
import { useAuth } from "@/hooks/useAuth";
import { useTeam } from "@/hooks/useTeams";
import { PageHeader } from "@/components/layout";
import { 
  PlayerCardsTable, 
  SuspensionsTable, 
  AddSuspensionModal, 
  SuspensionFilters 
} from "./components";

// Admin View Component
const AdminView: React.FC = memo(() => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [teamFilter, setTeamFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const { 
    suspensions, 
    playerCards, 
    isLoading, 
    playerCardsError,
    suspensionsError,
    refetchPlayerCards,
    refetchSuspensions
  } = useSuspensionsData();

  // Filter data based on selected filters
  const filteredSuspensions = useMemo(() => {
    if (!suspensions) return [];
    return suspensions.filter(s => {
      const teamMatch = teamFilter === 'all' || s.teamName === teamFilter;
      const statusMatch = statusFilter === 'all' || s.status === statusFilter;
      return teamMatch && statusMatch;
    });
  }, [suspensions, teamFilter, statusFilter]);

  const filteredPlayerCards = useMemo(() => {
    if (!playerCards) return [];
    let filtered = playerCards.filter(c => c.yellowCards > 0 || c.redCards > 0);
    if (teamFilter !== 'all') {
      filtered = filtered.filter(c => c.teamName === teamFilter);
    }
    return filtered;
  }, [playerCards, teamFilter]);

  const handleRefresh = () => {
    refetchPlayerCards();
    refetchSuspensions();
  };

  if (playerCardsError || suspensionsError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Er is een fout opgetreden bij het laden van de schorsingen.
          <Button variant="outline" size="sm" onClick={handleRefresh} className="ml-4">
            Opnieuw proberen
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <PageHeader 
        title="Schorsingen & Kaarten"
        subtitle="Beheer alle schorsingen en bekijk kaartenstatistieken"
      />

      {/* Filters */}
      <div className="mb-6 space-y-3">
        <SuspensionFilters
          selectedTeam={teamFilter}
          onTeamChange={setTeamFilter}
          selectedStatus={statusFilter}
          onStatusChange={setStatusFilter}
        />
        <Button 
          onClick={() => setShowAddModal(true)}
          className="btn btn--primary min-h-[44px] w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Schorsing Toevoegen</span>
          <span className="sm:hidden">Toevoegen</span>
        </Button>
      </div>

      {/* Active Suspensions */}
      <section role="region" aria-labelledby="suspensions-heading" className="mb-6">
        <Card className="border border-[var(--color-200)]">
          <CardHeader>
            <CardTitle id="suspensions-heading" className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Actieve Schorsingen
            </CardTitle>
            <CardDescription>
              Overzicht van alle actieve en wachtende schorsingen
            </CardDescription>
          </CardHeader>
          <CardContent className="p-[12px] bg-transparent">
            {filteredSuspensions.length === 0 && !isLoading ? (
              <div className="text-center py-12 px-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">Geen actieve schorsingen</h3>
                <p className="text-sm text-muted-foreground">Alle spelers kunnen deelnemen aan wedstrijden.</p>
              </div>
            ) : (
              <SuspensionsTable 
                suspensions={filteredSuspensions}
                showTeam={true}
                showActions={false}
                isLoading={isLoading}
              />
            )}
          </CardContent>
        </Card>
      </section>

      {/* Player Cards Overview */}
      <section role="region" aria-labelledby="cards-heading">
        <Card className="border border-[var(--color-200)]">
          <CardHeader>
            <CardTitle id="cards-heading" className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Kaarten Overzicht
            </CardTitle>
            <CardDescription>
              Alle spelers met gele of rode kaarten
            </CardDescription>
          </CardHeader>
          <CardContent className="p-[12px] bg-transparent">
            {filteredPlayerCards.length === 0 && !isLoading ? (
              <div className="text-center py-12 px-4">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">Geen kaarten geregistreerd</h3>
                <p className="text-sm text-muted-foreground">Er zijn nog geen gele of rode kaarten uitgedeeld.</p>
              </div>
            ) : (
              <PlayerCardsTable 
                playerCards={filteredPlayerCards}
                showTeam={true}
                isLoading={isLoading}
              />
            )}
          </CardContent>
        </Card>
      </section>

      <AddSuspensionModal 
        open={showAddModal} 
        onOpenChange={setShowAddModal} 
      />
    </>
  );
});

AdminView.displayName = 'AdminView';

// Team Manager View Component
const TeamManagerView: React.FC<{ teamIds: number[] }> = memo(({ teamIds }) => {
  const teamId = teamIds[0]; // Use first team ID
  const { data: team } = useTeam(teamId);
  
  const { 
    suspensions, 
    playerCards, 
    isLoading, 
    playerCardsError,
    suspensionsError,
    refetchPlayerCards,
    refetchSuspensions
  } = useSuspensionsData();

  // Filter data for current team only
  const teamSuspensions = useMemo(() => {
    if (!suspensions || !team) return [];
    return suspensions.filter(s => s.teamName === team.team_name);
  }, [suspensions, team]);

  const teamPlayerCards = useMemo(() => {
    if (!playerCards || !team) return [];
    return playerCards.filter(c => 
      c.teamName === team.team_name && 
      (c.yellowCards > 0 || c.redCards > 0)
    );
  }, [playerCards, team]);

  const handleRefresh = () => {
    refetchPlayerCards();
    refetchSuspensions();
  };

  if (playerCardsError || suspensionsError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Er is een fout opgetreden bij het laden van de schorsingen.
          <Button variant="outline" size="sm" onClick={handleRefresh} className="ml-4">
            Opnieuw proberen
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const teamName = team?.team_name || 'Jouw team';

  return (
    <>
      <PageHeader 
        title={`Schorsingen & Kaarten – ${teamName}`}
        subtitle="Overzicht van schorsingen en kaarten voor jouw team"
        rightAction={
          <Button 
            variant="outline" 
            onClick={handleRefresh} 
            className="btn btn--outline min-h-[44px] w-full sm:w-auto"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Vernieuwen</span>
            <span className="sm:hidden">Vernieuw</span>
          </Button>
        }
      />

      {/* Active Suspensions */}
      <section role="region" aria-labelledby="team-suspensions-heading" className="mb-6">
        <Card className="border border-[var(--color-200)]">
          <CardHeader>
            <CardTitle id="team-suspensions-heading" className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Actieve Schorsingen
            </CardTitle>
            <CardDescription>
              Schorsingen voor spelers van {teamName}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-[12px] bg-transparent">
            {teamSuspensions.length === 0 && !isLoading ? (
              <div className="text-center py-12 px-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">Geen actieve schorsingen</h3>
                <p className="text-sm text-muted-foreground">Alle spelers van jouw team kunnen deelnemen.</p>
              </div>
            ) : (
              <SuspensionsTable 
                suspensions={teamSuspensions}
                showTeam={false}
                showActions={false}
                isLoading={isLoading}
              />
            )}
          </CardContent>
        </Card>
      </section>

      {/* Player Cards Overview */}
      <section role="region" aria-labelledby="team-cards-heading">
        <Card className="border border-[var(--color-200)]">
          <CardHeader>
            <CardTitle id="team-cards-heading" className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Kaarten Overzicht
            </CardTitle>
            <CardDescription>
              Gele en rode kaarten voor spelers van {teamName}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-[12px] bg-transparent">
            {teamPlayerCards.length === 0 && !isLoading ? (
              <div className="text-center py-12 px-4">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">Geen kaarten</h3>
                <p className="text-sm text-muted-foreground">Er zijn nog geen kaarten geregistreerd voor jouw team.</p>
              </div>
            ) : (
              <PlayerCardsTable 
                playerCards={teamPlayerCards}
                showTeam={false}
                isLoading={isLoading}
              />
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
});

TeamManagerView.displayName = 'TeamManagerView';

// Main Page Component
const SchorsingenPage: React.FC = memo(() => {
  const { user } = useAuth();
  
  // Determine user role and access level
  const isAdmin = user?.role === 'admin';
  const isTeamManager = user?.role === 'player_manager' && user?.teamId;
  const teamIds = user?.teamId ? [user.teamId] : [];

  return (
    <div className="space-y-6 animate-slide-up">
      {isAdmin ? (
        <AdminView />
      ) : isTeamManager ? (
        <TeamManagerView teamIds={teamIds} />
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Je hebt geen toegang tot deze pagina. Neem contact op met een beheerder.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
});

SchorsingenPage.displayName = 'SchorsingenPage';

export default SchorsingenPage;
