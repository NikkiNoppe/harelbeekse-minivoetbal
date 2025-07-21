import React, { useState, memo, useMemo } from "react";
import { useAuth } from '../../components/auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../MINIVOETBAL.UI/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../MINIVOETBAL.UI/components/ui/tabs";
import { Skeleton } from "../../../MINIVOETBAL.UI/components/ui/skeleton";
import { Alert, AlertDescription } from "../../../MINIVOETBAL.UI/components/ui/alert";
import { Button } from "../../../MINIVOETBAL.UI/components/ui/button";
import { FileText, Trophy, Calendar, AlertCircle } from "lucide-react";
import { useMatchFormsData, type MatchFormsFilters } from "../../../MINIVOETBAL.UI/hooks/useMatchFormsData";
import { MatchFormData } from "./match-form/types";
import MatchFormFilter from "./match-form/MatchFormFilter";
import MatchFormList from "./match-form/MatchFormList";
import MatchFormDialog from "./match-form/MatchFormDialog";

interface MatchFormTabProps {
  teamId: number;
  teamName: string;
}

// Loading skeleton components
const TabContentSkeleton = memo(() => (
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
));

TabContentSkeleton.displayName = 'TabContentSkeleton';



// Error state component
const ErrorState = memo(({ onRetry }: { onRetry: () => void }) => (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription className="flex items-center justify-between">
      <span>Er is een fout opgetreden bij het laden van de wedstrijdformulieren.</span>

    </AlertDescription>
  </Alert>
));

ErrorState.displayName = 'ErrorState';

// Empty state component
const EmptyState = memo(({ tabType, hasTeam, hasPermissions }: { 
  tabType: 'league' | 'cup';
  hasTeam: boolean;
  hasPermissions: boolean;
}) => (
  <div className="p-12 text-center">
    <div className="flex flex-col items-center space-y-4">
      {tabType === 'cup' ? <Trophy className="h-12 w-12 text-muted-foreground" /> : <Calendar className="h-12 w-12 text-muted-foreground" />}
      <div className="space-y-2">
        <h3 className="font-semibold">
          {!hasTeam && !hasPermissions 
            ? "Geen team gekoppeld"
            : `Geen ${tabType === 'cup' ? 'beker' : 'competitie'}wedstrijden`
          }
        </h3>
        <p className="text-muted-foreground">
          {!hasTeam && !hasPermissions 
            ? "Je account is momenteel niet gekoppeld aan een team, waardoor je geen wedstrijdformulieren kunt bekijken."
            : `Er zijn momenteel geen ${tabType === 'cup' ? 'beker' : 'competitie'}wedstrijden beschikbaar.`
          }
        </p>
      </div>
    </div>
  </div>
));

EmptyState.displayName = 'EmptyState';

// Tab content component
const TabContent = memo(({ 
  tabType,
  tabData,
  hasElevatedPermissions,
  teamName,
  user,
  filters,
  onFiltersChange,
  onSelectMatch
}: {
  tabType: 'league' | 'cup';
  tabData: any;
  hasElevatedPermissions: boolean;
  teamName: string;
  user: any;
  filters: MatchFormsFilters;
  onFiltersChange: (filters: MatchFormsFilters) => void;
  onSelectMatch: (match: MatchFormData) => void;
}) => {
  const hasTeam = !!user?.teamId;
  const isEmpty = !tabData.isLoading && tabData.matches.length === 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {tabType === 'cup' ? <Trophy className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
                             {hasElevatedPermissions 
                 ? user?.role === "admin" 
                   ? `${tabType === 'cup' ? 'Beker' : 'Competitie'}wedstrijden`
                   : `${tabType === 'cup' ? 'Beker' : 'Competitie'}wedstrijden (Scheidsrechter)`
                 : `${tabType === 'cup' ? 'Beker' : 'Competitie'}wedstrijden voor ${teamName}`
               }
            </CardTitle>
            <CardDescription>
              {isEmpty && hasTeam 
                ? `Geen ${tabType === 'cup' ? 'beker' : 'competitie'}wedstrijden gevonden.`
                : !hasTeam && !hasElevatedPermissions
                ? "Je account is momenteel niet gekoppeld aan een team."
                : `${tabData.matches.length} van ${tabData.allMatches.length} wedstrijden weergegeven`
              }
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isEmpty || (!hasTeam && !hasElevatedPermissions) ? (
          <EmptyState 
            tabType={tabType}
            hasTeam={hasTeam}
            hasPermissions={hasElevatedPermissions}
          />
        ) : (
          <div>
            <div className="p-4 border-b">
              <MatchFormFilter 
                searchTerm={filters.searchTerm}
                onSearchChange={(value) => onFiltersChange({ ...filters, searchTerm: value })}
                dateFilter={filters.dateFilter}
                onDateChange={(value) => onFiltersChange({ ...filters, dateFilter: value })}
                matchdayFilter={filters.matchdayFilter}
                onMatchdayChange={(value) => onFiltersChange({ ...filters, matchdayFilter: value })}
                sortBy={filters.sortBy}
                onSortChange={(value) => onFiltersChange({ ...filters, sortBy: value })}
                sortOrder={filters.sortOrder}
                onSortOrderChange={(value) => onFiltersChange({ ...filters, sortOrder: value })}
                onClearFilters={() => onFiltersChange({
                  searchTerm: "",
                  dateFilter: "",
                  matchdayFilter: "",
                  sortBy: "date",
                  sortOrder: "asc"
                })}
              />
            </div>
            <MatchFormList 
              matches={tabData.matches}
              isLoading={tabData.isLoading}
              onSelectMatch={onSelectMatch}
              searchTerm={filters.searchTerm}
              dateFilter={filters.dateFilter}
              matchdayFilter={filters.matchdayFilter}
              hasElevatedPermissions={hasElevatedPermissions}
              userRole={user?.role}
              teamId={user?.teamId || 0}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
});

TabContent.displayName = 'TabContent';

// Main component
const MatchFormTab: React.FC<MatchFormTabProps> = ({ teamId, teamName }) => {
  const { user } = useAuth();
  const [selectedMatchForm, setSelectedMatchForm] = useState<MatchFormData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("league");
  
  // Filter states
  const [filters, setFilters] = useState<MatchFormsFilters>({
    searchTerm: "",
    dateFilter: "",
    matchdayFilter: "",
    sortBy: "date",
    sortOrder: "asc"
  });

  const hasElevatedPermissions = user?.role === "admin" || user?.role === "referee";
  const isAdmin = user?.role === "admin";
  const isReferee = user?.role === "referee";

  const {
    leagueMatches,
    cupMatches,
    isLoading,
    hasError,
    getTabData,
    refreshInstantly,
    refetchAll
  } = useMatchFormsData(teamId, hasElevatedPermissions);

  // Memoized tab data with filters
  const leagueTabData = useMemo(() => 
    getTabData('league', filters), 
    [getTabData, filters]
  );
  
  const cupTabData = useMemo(() => 
    getTabData('cup', filters), 
    [getTabData, filters]
  );

  const handleSelectMatch = (match: MatchFormData) => {
    setSelectedMatchForm(match);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedMatchForm(null);
    // Instant refresh after form changes
    refreshInstantly();
  };

  const handleFormComplete = () => {
    handleDialogClose();
  };

  const handleRetry = () => {
    refetchAll();
  };

  // Show error state
  if (hasError) {
    return (
      <div className="space-y-8 animate-slide-up">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Wedstrijdformulieren
          </h2>
        </div>
        <ErrorState onRetry={handleRetry} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Wedstrijdformulieren
        </h2>
      </div>



      <section>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="league" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Competitie
            </TabsTrigger>
            <TabsTrigger value="cup" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Beker
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="league" className="mt-6">
            {isLoading ? (
              <TabContentSkeleton />
            ) : (
              <TabContent
                tabType="league"
                tabData={leagueTabData}
                hasElevatedPermissions={hasElevatedPermissions}
                teamName={teamName}
                user={user}
                filters={filters}
                onFiltersChange={setFilters}
                onSelectMatch={handleSelectMatch}
              />
            )}
          </TabsContent>
          
          <TabsContent value="cup" className="mt-6">
            {isLoading ? (
              <TabContentSkeleton />
            ) : (
              <TabContent
                tabType="cup"
                tabData={cupTabData}
                hasElevatedPermissions={hasElevatedPermissions}
                teamName={teamName}
                user={user}
                filters={filters}
                onFiltersChange={setFilters}
                onSelectMatch={handleSelectMatch}
              />
            )}
          </TabsContent>
        </Tabs>
      </section>
      
      {selectedMatchForm && (
        <MatchFormDialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              handleDialogClose();
            }
          }}
          match={selectedMatchForm}
          isAdmin={isAdmin}
          isReferee={isReferee}
          teamId={teamId}
          onComplete={handleFormComplete}
        />
      )}
    </div>
  );
};

export default memo(MatchFormTab);
