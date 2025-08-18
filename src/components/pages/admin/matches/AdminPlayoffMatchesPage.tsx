import React, { useState, useMemo, useCallback } from "react";
import { useAuth } from "@/components/pages/login/AuthProvider";
import { useMatchFormsData, MatchFormsFilters } from "@/hooks/useMatchFormsData";
import { MatchFormData } from "./types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Target, AlertCircle, Inbox } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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

      <Tabs defaultValue="playoffs" className="w-full">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="playoffs" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Playoffs
            <Badge variant="secondary" className="ml-2">
              {matchFormsData.statistics.totalPlayoffMatches}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="playoffs" className="space-y-4">
          {playoffData.matches.length === 0 ? (
            <EmptyState message="Geen playoff wedstrijden beschikbaar" />
          ) : (
            <div className="space-y-4">
              {playoffData.matches.map((match) => (
                <div
                  key={match.matchId}
                  className="p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleMatchSelect(match)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">
                        {match.homeTeamName} vs {match.awayTeamName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {match.date} - {match.time} | {match.location}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {match.matchday}
                      </p>
                    </div>
                    <div className="text-right">
                      {match.isCompleted ? (
                        <div className="text-lg font-bold">
                          {match.homeScore} - {match.awayScore}
                        </div>
                      ) : (
                        <Badge variant="outline">Te spelen</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Match Form Modal */}
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