import React, { memo, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Shield, Trophy, Users, RefreshCw, Plus, ChevronDown } from "lucide-react";
import { useSuspensionsData } from "@/domains/cards-suspensions";
import { useAuth } from "@/hooks/useAuth";
import { useTeam } from "@/hooks/useTeams";
import { PageHeader } from "@/components/layout";
import { SuspensionRulesSettings } from "@/components/pages/admin/settings/components/SuspensionRulesSettings";
import type { Suspension } from "@/domains/cards-suspensions";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { 
  PlayerCardsTable, 
  SuspensionsTable, 
  AddSuspensionModal, 
  EditSuspensionModal,
  SuspensionFilters 
} from "./components";

// Admin View Component
const AdminView: React.FC = memo(() => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editSuspension, setEditSuspension] = useState<Suspension | null>(null);
  const [teamFilter, setTeamFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCardsOverview, setShowCardsOverview] = useState(false);
  
  const { 
    suspensions, 
    playerCards, 
    isLoading, 
    playerCardsError,
    suspensionsError,
    refetchPlayerCards,
    refetchSuspensions
  } = useSuspensionsData();

  const filteredSuspensions = useMemo(() => {
    if (!suspensions) return [];
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return suspensions.filter(s => {
      const matchesTeam = teamFilter === 'all' || String(s.teamId) === teamFilter;
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      const matchesSource = sourceFilter === 'all' || s.source === sourceFilter;
      const matchesSearch = !normalizedSearch ||
        s.playerName.toLowerCase().includes(normalizedSearch) ||
        s.teamName.toLowerCase().includes(normalizedSearch) ||
        s.reason.toLowerCase().includes(normalizedSearch);

      return matchesTeam && matchesStatus && matchesSource && matchesSearch;
    });
  }, [suspensions, teamFilter, statusFilter, sourceFilter, searchTerm]);

  const filteredPlayerCards = useMemo(() => {
    if (!playerCards) return [];
    let filtered = playerCards.filter(c => c.yellowCards > 0 || c.redCards > 0);
    if (teamFilter !== 'all') {
      filtered = filtered.filter(c => String(c.teamId) === teamFilter);
    }
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (normalizedSearch) {
      filtered = filtered.filter(c =>
        c.playerName.toLowerCase().includes(normalizedSearch) ||
        c.teamName.toLowerCase().includes(normalizedSearch)
      );
    }
    return filtered;
  }, [playerCards, teamFilter, searchTerm]);

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
        title="Schorsingen Beheer"
        subtitle="Beheer actieve schorsingen en gebruik kaarten als context"
      />

      <SuspensionRulesSettings />

      {/* Filters */}
      <div className="mb-6">
        <SuspensionFilters
          selectedTeam={teamFilter}
          onTeamChange={setTeamFilter}
          selectedStatus={statusFilter}
          onStatusChange={setStatusFilter}
          selectedSource={sourceFilter}
          onSourceChange={setSourceFilter}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
      </div>

      {/* Schorsingen */}
      <section role="region" aria-labelledby="suspensions-heading" className="mb-6">
        <Card className="border border-border">
          <CardHeader className="space-y-0 p-4 sm:p-5 pb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="min-w-0 space-y-1.5">
                <CardTitle id="suspensions-heading" className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
                  Actieve schorsingen
                </CardTitle>
                <CardDescription>
                  Eén overzicht van handmatige schorsingen en automatische kaartschorsingen
                </CardDescription>
              </div>
              <Button
                type="button"
                size="sm"
                variant="default"
                onClick={() => setShowAddModal(true)}
                aria-label="Handmatige schorsing toevoegen"
                className={cn(
                  "gap-2 self-stretch sm:self-auto sm:shrink-0",
                  "shadow-sm shadow-primary/10 ring-1 ring-primary/20",
                  "transition-[box-shadow,transform,background-color] duration-150 ease-out",
                  "hover:shadow-md hover:shadow-primary/15 hover:ring-primary/25",
                  "active:scale-[0.98]"
                )}
              >
                <Plus className="h-4 w-4 shrink-0" aria-hidden />
                <span className="hidden sm:inline">Schorsing toevoegen</span>
                <span className="sm:hidden">Toevoegen</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0 sm:px-5 sm:pb-5 bg-transparent">
            {filteredSuspensions.length === 0 && !isLoading ? (
              <div className="text-center py-12 px-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">Geen schorsingen gevonden</h3>
                <p className="text-sm text-muted-foreground">
                  Er zijn geen schorsingen die passen bij de huidige filters.
                </p>
              </div>
            ) : (
              <SuspensionsTable 
                suspensions={filteredSuspensions}
                showTeam={true}
                showActions={true}
                isLoading={isLoading}
                onEdit={setEditSuspension}
              />
            )}
          </CardContent>
        </Card>
      </section>

      {/* Kaarten context */}
      <section role="region" aria-labelledby="cards-heading">
        <Collapsible open={showCardsOverview} onOpenChange={setShowCardsOverview}>
          <Card className="border border-border">
            <CardHeader className="pb-3">
              <CardTitle className="mb-2">
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="flex flex-wrap items-center gap-2 text-2xl font-semibold leading-none tracking-tight text-left text-inherit hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md -m-1 p-1 w-fit max-w-full"
                    aria-expanded={showCardsOverview}
                    aria-controls="cards-context-panel"
                    id="cards-context-trigger"
                  >
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200",
                        showCardsOverview ? "rotate-0" : "-rotate-90"
                      )}
                      aria-hidden
                    />
                    <Trophy className="h-5 w-5 shrink-0" />
                    <span id="cards-heading">Kaarten Context</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      ({filteredPlayerCards.length})
                    </span>
                  </button>
                </CollapsibleTrigger>
              </CardTitle>
              <CardDescription className="pl-0 sm:pl-9 text-left">
                Compact overzicht van kaarten uit alle ingediende competitie-, beker- en playoffwedstrijden
              </CardDescription>
            </CardHeader>
            <CollapsibleContent
              id="cards-context-panel"
              role="region"
              aria-labelledby="cards-context-trigger"
            >
              <CardContent className="p-3 sm:p-5 pt-0 bg-transparent">
                {filteredPlayerCards.length === 0 && !isLoading ? (
                  <div className="text-center py-12 px-4">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-foreground">Geen kaarten geregistreerd</h3>
                    <p className="text-sm text-muted-foreground">
                      Er zijn geen kaarten die passen bij de huidige filters.
                    </p>
                  </div>
                ) : (
                  <PlayerCardsTable
                    playerCards={filteredPlayerCards}
                    suspensions={suspensions || []}
                    showTeam={true}
                    isLoading={isLoading}
                  />
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </section>

      <AddSuspensionModal open={showAddModal} onOpenChange={setShowAddModal} />
      <EditSuspensionModal 
        open={!!editSuspension} 
        onOpenChange={(open) => !open && setEditSuspension(null)} 
        suspension={editSuspension} 
      />
    </>
  );
});

AdminView.displayName = 'AdminView';

// Team Manager View Component
const TeamManagerView: React.FC<{ teamIds: number[] }> = memo(({ teamIds }) => {
  const teamId = teamIds[0];
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

      <section role="region" aria-labelledby="team-suspensions-heading" className="mb-6">
        <Card className="border border-border">
          <CardHeader>
            <CardTitle id="team-suspensions-heading" className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Schorsingen
            </CardTitle>
            <CardDescription>
              Schorsingen voor spelers van {teamName}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 bg-transparent">
            {teamSuspensions.length === 0 && !isLoading ? (
              <div className="text-center py-12 px-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">Geen schorsingen</h3>
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

      <section role="region" aria-labelledby="team-cards-heading">
        <Card className="border border-border">
          <CardHeader>
            <CardTitle id="team-cards-heading" className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Kaarten Overzicht
            </CardTitle>
            <CardDescription>
              Gele en rode kaarten voor spelers van {teamName}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 bg-transparent">
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
                suspensions={teamSuspensions}
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

const SchorsingenPage: React.FC = memo(() => {
  const { user } = useAuth();
  
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
