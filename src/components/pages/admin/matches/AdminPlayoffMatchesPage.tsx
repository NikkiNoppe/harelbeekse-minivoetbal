import React, { useState, useMemo, useCallback } from "react";
import { useAuth } from "@/components/pages/login/AuthProvider";
import { useMatchFormsData, MatchFormsFilters } from "@/hooks/useMatchFormsData";
import { MatchFormData } from "./types";
import { Target, AlertCircle, Inbox } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import MatchesFormFilter from "./MatchesFormFilter";
import MatchesFormList from "./MatchesFormList";
import MatchesFormModal from "./MatchesFormModal";

// Simple components for loading, error, and empty states
const TabContentSkeleton = React.memo(() => (
  <div className="space-y-4 animate-pulse">
    <Skeleton className="h-8 w-full" />
    <Skeleton className="h-8 w-full" />
    <Skeleton className="h-8 w-full" />
  </div>
));

const ErrorState = React.memo(({ error, onRetry }: { error: any; onRetry: () => void }) => (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription className="flex items-center justify-between">
      <span>Er is een fout opgetreden: {error?.message || 'Onbekende fout'}</span>
      <Button variant="outline" size="sm" onClick={onRetry}>Probeer opnieuw</Button>
    </AlertDescription>
  </Alert>
));

const EmptyState = React.memo(({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
    <Inbox className="h-12 w-12 mb-4" />
    <p>{message}</p>
  </div>
));

const AdminPlayoffMatchesPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isReferee = user?.role === "referee";
  const teamId = user?.teamId || 0;

  // Filters state
  const [filters, setFilters] = useState<MatchFormsFilters>({
    searchTerm: "",
    dateFilter: "",
    matchdayFilter: "",
    teamFilter: "",
    sortBy: "date",
    sortOrder: "asc"
  });

  // Selected match for modal
  const [selectedMatch, setSelectedMatch] = useState<MatchFormData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch playoff matches data
  const matchFormsData = useMatchFormsData(teamId, isAdmin || isReferee);

  // Get filtered playoff matches
  const playoffData = useMemo(() => 
    matchFormsData.getTabData('playoff', filters), 
    [matchFormsData, filters]
  );

  // Handlers
  const handleFilterChange = useCallback((newFilters: Partial<MatchFormsFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const handleMatchSelect = useCallback((match: MatchFormData) => {
    setSelectedMatch(match);
    setIsModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedMatch(null);
  }, []);

  const handleMatchComplete = useCallback(() => {
    matchFormsData.refreshInstantly();
    handleModalClose();
  }, [matchFormsData, handleModalClose]);

  // Loading state
  if (matchFormsData.isLoading) {
    return <TabContentSkeleton />;
  }

  // Error state
  if (playoffData.isError) {
    return <ErrorState error={playoffData.error} onRetry={() => matchFormsData.refetchPlayoff()} />;
  }

  // No team selected for non-admin users
  if (!isAdmin && !teamId) {
    return <EmptyState message="Geen team toegewezen" />;
  }

  const hasElevatedPermissions = isAdmin || isReferee;

  const teamOptions = useMemo(() => {
    const set = new Set<string>();
    (playoffData.allMatches || []).forEach((m: MatchFormData) => {
      if (m.homeTeamName) set.add(m.homeTeamName);
      if (m.awayTeamName) set.add(m.awayTeamName);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [playoffData.allMatches]);

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            Playoff Wedstrijdformulieren
          </h2>
          <p className="text-muted-foreground">
            Beheer playoff wedstrijdformulieren - invullen van spelers, scores en wedstrijdgegevens
          </p>
        </div>
      </div>

      <section>
        {playoffData.isLoading ? (
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-96" />
                </div>
                <Skeleton className="h-10 w-32" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-4 border-b">
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-3 p-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Playoffwedstrijden
                  </CardTitle>
                  <CardDescription>
                    {playoffData.matches.length} van {playoffData.allMatches.length} wedstrijden weergegeven
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {(!teamId && !hasElevatedPermissions) || playoffData.matches.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="flex flex-col items-center space-y-4">
                    <Inbox className="h-12 w-12 text-muted-foreground" />
                    <div className="space-y-2">
                      <h3 className="font-semibold">Geen playoffwedstrijden</h3>
                      <p className="text-muted-foreground">Er zijn momenteel geen playoffwedstrijden beschikbaar.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="p-4 border-b">
                    <MatchesFormFilter
                      dateFilter={filters.dateFilter}
                      onDateChange={(value) => handleFilterChange({ dateFilter: value })}
                      teamFilter={filters.teamFilter}
                      onTeamChange={(value) => handleFilterChange({ teamFilter: value })}
                      teamOptions={teamOptions}
                      sortBy={filters.sortBy}
                      onSortChange={(value) => handleFilterChange({ sortBy: value })}
                      sortOrder={filters.sortOrder}
                      onSortOrderChange={(value) => handleFilterChange({ sortOrder: value })}
                      onClearFilters={() => handleFilterChange({
                        searchTerm: "",
                        dateFilter: "",
                        matchdayFilter: "",
                        teamFilter: "",
                        sortBy: "date",
                        sortOrder: "asc"
                      } as MatchFormsFilters)}
                    />
                  </div>
                  <MatchesFormList
                    matches={playoffData.matches}
                    isLoading={playoffData.isLoading}
                    onSelectMatch={handleMatchSelect}
                    searchTerm={filters.searchTerm}
                    dateFilter={filters.dateFilter}
                    matchdayFilter={filters.matchdayFilter}
                    sortBy={filters.sortBy}
                    hasElevatedPermissions={hasElevatedPermissions}
                    userRole={user?.role}
                    teamId={teamId}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </section>

      {selectedMatch && (
        <MatchesFormModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          match={selectedMatch}
          isAdmin={isAdmin}
          isReferee={isReferee}
          teamId={teamId}
          onComplete={handleMatchComplete}
        />
      )}
    </div>
  );
};

export default React.memo(AdminPlayoffMatchesPage);