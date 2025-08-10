import React, { useState, memo, useMemo, useCallback } from "react";
import { useAuth } from "@/components/pages/login/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Trophy, Calendar, AlertCircle } from "lucide-react";
import { useMatchFormsData, type MatchFormsFilters } from "@/hooks/useMatchFormsData";
import { MatchFormData } from "./types";
import MatchesFormFilter from "./MatchesFormFilter";
import MatchesFormList from "./MatchesFormList";
import MatchesFormModal from "./MatchesFormModal";

interface MatchFormTabProps {
  teamId: number;
  teamName: string;
}

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

const ErrorState = memo(({ onRetry }: { onRetry: () => void }) => (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription className="flex items-center justify-between">
      <span>Er is een fout opgetreden bij het laden van de wedstrijdformulieren.</span>
    </AlertDescription>
  </Alert>
));

ErrorState.displayName = 'ErrorState';

const EmptyState = memo(({ tabType, hasTeam, hasPermissions }: { 
  tabType: 'league' | 'cup';
  hasTeam: boolean;
  hasPermissions: boolean;
}) => {
  const isCup = tabType === 'cup';
  const icon = isCup ? <Trophy className="h-12 w-12 text-muted-foreground" /> : <Calendar className="h-12 w-12 text-muted-foreground" />;
  const typeName = isCup ? 'beker' : 'competitie';
  
  const title = !hasTeam && !hasPermissions 
    ? "Geen team gekoppeld"
    : `Geen ${typeName}wedstrijden`;
    
  const description = !hasTeam && !hasPermissions 
    ? "Je account is momenteel niet gekoppeld aan een team, waardoor je geen wedstrijdformulieren kunt bekijken."
    : `Er zijn momenteel geen ${typeName}wedstrijden beschikbaar.`;

  return (
    <div className="p-12 text-center">
      <div className="flex flex-col items-center space-y-4">
        {icon}
        <div className="space-y-2">
          <h3 className="font-semibold">{title}</h3>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
});

EmptyState.displayName = 'EmptyState';

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
  const isCup = tabType === 'cup';
  const typeName = isCup ? 'Beker' : 'Competitie';
  
  const title = hasElevatedPermissions 
    ? user?.role === "admin" 
      ? `${typeName}wedstrijden`
      : `${typeName}wedstrijden (Scheidsrechter)`
    : `${typeName}wedstrijden voor ${teamName}`;
    
  const description = isEmpty && hasTeam 
    ? `Geen ${typeName.toLowerCase()}wedstrijden gevonden.`
    : !hasTeam && !hasElevatedPermissions
    ? "Je account is momenteel niet gekoppeld aan een team."
    : `${tabData.matches.length} van ${tabData.allMatches.length} wedstrijden weergegeven`;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {isCup ? <Trophy className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
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
              <MatchesFormFilter 
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
            <MatchesFormList 
              matches={tabData.matches}
              isLoading={tabData.isLoading}
              onSelectMatch={onSelectMatch}
              searchTerm={filters.searchTerm}
              dateFilter={filters.dateFilter}
              matchdayFilter={filters.matchdayFilter}
              sortBy={filters.sortBy}
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

const MatchFormTab: React.FC<MatchFormTabProps> = ({ teamId, teamName }) => {
  const { user } = useAuth();
  const [selectedMatchForm, setSelectedMatchForm] = useState<MatchFormData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("league");
  
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

  const leagueTabData = useMemo(() => 
    getTabData('league', filters), 
    [getTabData, filters]
  );
  
  const cupTabData = useMemo(() => 
    getTabData('cup', filters), 
    [getTabData, filters]
  );

  const handleSelectMatch = useCallback((match: MatchFormData) => {
    setSelectedMatchForm(match);
    setIsDialogOpen(true);
  }, []);

  const handleDialogClose = useCallback(() => {
    setIsDialogOpen(false);
    setSelectedMatchForm(null);
    refreshInstantly();
  }, [refreshInstantly]);

  const handleFormComplete = useCallback(() => {
    handleDialogClose();
  }, [handleDialogClose]);

  const handleRetry = useCallback(() => {
    refetchAll();
  }, [refetchAll]);

  const tabConfigs = useMemo(() => [
    { value: "league", data: leagueTabData, type: "league" as const },
    { value: "cup", data: cupTabData, type: "cup" as const }
  ], [leagueTabData, cupTabData]);

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
          
          {tabConfigs.map(({ value, data, type }) => (
            <TabsContent key={value} value={value} className="mt-6">
              {isLoading ? (
                <TabContentSkeleton />
              ) : (
                <TabContent
                  tabType={type}
                  tabData={data}
                  hasElevatedPermissions={hasElevatedPermissions}
                  teamName={teamName}
                  user={user}
                  filters={filters}
                  onFiltersChange={setFilters}
                  onSelectMatch={handleSelectMatch}
                />
              )}
            </TabsContent>
          ))}
        </Tabs>
      </section>
      
      {selectedMatchForm && (
        <MatchesFormModal
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
