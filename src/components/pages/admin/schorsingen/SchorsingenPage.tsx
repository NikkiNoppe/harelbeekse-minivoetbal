import React, { memo, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Shield, Trophy, Users, RefreshCw, Plus, ChevronDown } from "lucide-react";
import { useSuspensionsData } from "@/domains/cards-suspensions";
import { useAuth } from "@/hooks/useAuth";
import { ADMIN_ROUTES } from "@/config/routes";
import { PageHeader } from "@/components/layout";
import { SuspensionRulesSettings } from "@/components/pages/admin/settings/components/SuspensionRulesSettings";
import type { Suspension } from "@/domains/cards-suspensions";
import { SectionCollapsibleCard } from "@/components/layout";
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
        <SectionCollapsibleCard
          title="Kaarten context"
          icon={Trophy}
          open={showCardsOverview}
          onOpenChange={setShowCardsOverview}
          badge={
            <span className="text-xs font-normal text-muted-foreground">
              ({filteredPlayerCards.length})
            </span>
          }
        >
          <p className="text-sm text-muted-foreground mb-4" id="cards-heading">
            Compact overzicht van kaarten uit alle ingediende competitie-, beker- en playoffwedstrijden
          </p>
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
        </SectionCollapsibleCard>
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

const SchorsingenPage: React.FC = memo(() => {
  const { user } = useAuth();
  
  const isAdmin = user?.role === 'admin';
  const isTeamManager = user?.role === 'player_manager' && user?.teamId;

  if (isTeamManager) {
    return <Navigate to={`${ADMIN_ROUTES.profile}#schorsingen`} replace />;
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {isAdmin ? (
        <AdminView />
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
