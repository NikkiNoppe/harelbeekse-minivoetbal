import React, { useState, memo, useMemo, useCallback, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
// Tabs UI removed (sidebar controls type)
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Trophy, Calendar, AlertCircle, Target } from "lucide-react";
import { useMatchFormsData, type MatchFormsFilters } from "@/hooks/useMatchFormsData";
import { MatchFormData } from "./types";
import MatchesFormFilter from "./MatchesFormFilter";
import { useTeam } from "@/hooks/useTeams";
import MatchesFormList from "./MatchesFormList";
import { WedstrijdformulierModal } from "@/components/modals";
import { useUserProfile } from "@/hooks/useUserProfile";

interface MatchFormTabProps {
  teamId: number;
  teamName: string;
  initialTab?: 'league' | 'cup' | 'playoff';
}

const TabContentSkeleton = memo(() => (
  <Card>
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
  tabType: 'league' | 'cup' | 'playoff';
  hasTeam: boolean;
  hasPermissions: boolean;
}) => {
  const isCup = tabType === 'cup';
  const isPlayoff = tabType === 'playoff';
  const icon = isCup ? <Trophy className="h-12 w-12 text-muted-foreground" /> : 
               isPlayoff ? <Target className="h-12 w-12 text-muted-foreground" /> : 
               <Calendar className="h-12 w-12 text-muted-foreground" />;
  const typeName = isCup ? 'beker' : isPlayoff ? 'playoff' : 'competitie';
  
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
  teamId,
  effectiveTeamId,
  filters,
  onFiltersChange,
  onSelectMatch
}: {
  tabType: 'league' | 'cup' | 'playoff';
  tabData: any;
  hasElevatedPermissions: boolean;
  teamName: string;
  user: any;
  teamId: number;
  effectiveTeamId: number;
  filters: MatchFormsFilters;
  onFiltersChange: (filters: MatchFormsFilters) => void;
  onSelectMatch: (match: MatchFormData) => void;
}) => {
  // Use the effectiveTeamId passed from parent (which includes profileData fallback)
  const hasTeam = !!effectiveTeamId;
  
  // Debug logging
  console.log('🔍 TabContent - TeamId check:', {
    userTeamId: user?.teamId,
    propTeamId: teamId,
    effectiveTeamId,
    hasTeam,
    userRole: user?.role
  });
  const isEmpty = !tabData.isLoading && tabData.matches.length === 0;
  const isCup = tabType === 'cup';
  const isPlayoff = tabType === 'playoff';
  const typeName = isCup ? 'Beker' : isPlayoff ? 'Playoff' : 'Competitie';
  
  const title = `${typeName}wedstrijden`;
    
  const description = isEmpty && hasTeam 
    ? `Geen ${typeName.toLowerCase()}wedstrijden gevonden.`
    : !hasTeam && !hasElevatedPermissions
    ? "Je account is momenteel niet gekoppeld aan een team."
    : `${tabData.matches.length} van ${tabData.allMatches.length} wedstrijden weergegeven`;

  const teamOptions = useMemo(() => {
    const set = new Set<string>();
    (tabData.allMatches || []).forEach((m: MatchFormData) => {
      if (m.homeTeamName) set.add(m.homeTeamName);
      if (m.awayTeamName) set.add(m.awayTeamName);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [tabData.allMatches]);

  const managerTeamId = !hasElevatedPermissions ? effectiveTeamId : 0;
  const { data: managerTeam } = useTeam(managerTeamId);

  return (
    <Card>
      <CardContent className="p-0">
        {/* Always show filters, even when empty */}
        {(!hasTeam && !hasElevatedPermissions) ? (
          <EmptyState 
            tabType={tabType}
            hasTeam={hasTeam}
            hasPermissions={hasElevatedPermissions}
          />
        ) : (
          <div>
            <div className="px-0 py-4 border-b">
              <MatchesFormFilter 
                dateFilter={filters.dateFilter}
                onDateChange={(value) => onFiltersChange({ ...filters, dateFilter: value })}
                teamFilter={filters.teamFilter}
                onTeamChange={(value) => onFiltersChange({ ...filters, teamFilter: value })}
                teamOptions={teamOptions}
                sortBy={filters.sortBy}
                onSortChange={(value) => onFiltersChange({ ...filters, sortBy: value })}
                sortOrder={filters.sortOrder}
                onSortOrderChange={(value) => onFiltersChange({ ...filters, sortOrder: value })}
                hideCompletedMatches={filters.hideCompletedMatches}
                onHideCompletedChange={(value) => onFiltersChange({ ...filters, hideCompletedMatches: value })}
                isTeamManager={!hasElevatedPermissions}
                selfTeamToggle={!hasElevatedPermissions && !!managerTeam?.team_name}
                selfTeamName={managerTeam?.team_name}
                onClearFilters={() => onFiltersChange({
                  searchTerm: "",
                  dateFilter: "",
                  matchdayFilter: "",
                  teamFilter: "",
                  sortBy: "matchday",
                  sortOrder: "asc",
                  hideCompletedMatches: false
                })}
              />
            </div>
            {isEmpty ? (
              <EmptyState 
                tabType={tabType}
                hasTeam={hasTeam}
                hasPermissions={hasElevatedPermissions}
              />
            ) : (
              <MatchesFormList 
                matches={tabData.matches}
                isLoading={tabData.isLoading}
                onSelectMatch={onSelectMatch}
                searchTerm={filters.searchTerm}
                dateFilter={filters.dateFilter}
                matchdayFilter={filters.matchdayFilter}
                teamFilter={filters.teamFilter}
                sortBy={filters.sortBy}
                hasElevatedPermissions={hasElevatedPermissions}
                userRole={user?.role}
                teamId={effectiveTeamId}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

TabContent.displayName = 'TabContent';

const MatchFormTab: React.FC<MatchFormTabProps> = ({ teamId, teamName, initialTab }) => {
  const { user } = useAuth();
  const { profileData } = useUserProfile();
  const [selectedMatchForm, setSelectedMatchForm] = useState<MatchFormData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab ?? "league");
  
  // Ensure page starts at top when match forms view loads
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    } catch (_) {}
  }, []);
  
  const [filters, setFilters] = useState<MatchFormsFilters>({
    searchTerm: "",
    dateFilter: "",
    matchdayFilter: "",
    teamFilter: "",
    sortBy: "matchday",
    sortOrder: "asc",
    hideCompletedMatches: false
  });

  const hasElevatedPermissions = user?.role === "admin" || user?.role === "referee";
  const isAdmin = user?.role === "admin";
  const isReferee = user?.role === "referee";
  
  // Get teamId from multiple sources: prop, user.teamId, or profileData
  const effectiveTeamId = useMemo(() => {
    const fromProp = teamId && teamId > 0 ? teamId : 0;
    const fromUser = user?.teamId || 0;
    const fromProfile = profileData?.teams?.[0]?.team_id || 0;
    
    const result = fromProp || fromUser || fromProfile;
    
    // Debug logging
    console.log('🔍 MatchFormTab - TeamId resolution:', {
      fromProp,
      fromUser,
      fromProfile,
      result,
      hasProfileData: !!profileData,
      teamsCount: profileData?.teams?.length || 0,
      userRole: user?.role,
      profileTeams: profileData?.teams
    });
    
    return result;
  }, [teamId, user?.teamId, profileData?.teams]);
  
  // Update localStorage with teamId from profileData if found
  useEffect(() => {
    if (profileData?.teams?.[0]?.team_id && !user?.teamId && user?.role === 'player_manager') {
      const foundTeamId = profileData.teams[0].team_id;
      console.log('🔄 Found teamId in profileData, updating localStorage:', foundTeamId);
      
      // Update localStorage for future sessions
      const storedAuth = localStorage.getItem('auth_data');
      if (storedAuth && user) {
        try {
          const authData = JSON.parse(storedAuth);
          authData.user = { ...user, teamId: foundTeamId };
          localStorage.setItem('auth_data', JSON.stringify(authData));
          console.log('✅ Updated localStorage with teamId');
        } catch (e) {
          console.warn('Could not update localStorage:', e);
        }
      }
    }
  }, [profileData?.teams, user]);

  const {
    leagueMatches,
    cupMatches,
    playoffMatches,
    isLoading,
    hasError,
    getTabData,
    refreshInstantly,
    refetchAll
  } = useMatchFormsData(effectiveTeamId, hasElevatedPermissions);

  const leagueTabData = useMemo(() => 
    getTabData('league', filters), 
    [getTabData, filters]
  );
  
  const cupTabData = useMemo(() => 
    getTabData('cup', filters), 
    [getTabData, filters]
  );

  const playoffTabData = useMemo(() => 
    getTabData('playoff', filters), 
    [getTabData, filters]
  );

  const handleSelectMatch = useCallback((match: MatchFormData) => {
    setSelectedMatchForm(match);
    setIsDialogOpen(true);
  }, []);

  const handleDialogClose = useCallback((shouldRefresh: boolean = false) => {
    setIsDialogOpen(false);
    setSelectedMatchForm(null);
    if (shouldRefresh) {
      refreshInstantly();
    }
  }, [refreshInstantly]);

  const handleFormComplete = useCallback(() => {
    handleDialogClose(true);
  }, [handleDialogClose]);

  const handleRetry = useCallback(() => {
    refetchAll();
  }, [refetchAll]);

  const currentType = (activeTab === "cup" ? "cup" : activeTab === "playoff" ? "playoff" : "league") as "league" | "cup" | "playoff";
  const currentData = currentType === "cup" ? cupTabData : currentType === "playoff" ? playoffTabData : leagueTabData;

  if (hasError) {
    return (
      <div className="space-y-8 animate-slide-up">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold flex items-center gap-2" style={{ color: 'var(--primary)' }}>
            <FileText className="h-5 w-5" />
            Competitieformulieren
          </h2>
        </div>
        <ErrorState onRetry={handleRetry} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold flex items-center gap-2" style={{ color: 'var(--primary)' }}>
          <FileText className="h-5 w-5" />
          Competitieformulieren
        </h2>
      </div>

      <section>
        {isLoading ? (
          <TabContentSkeleton />
        ) : (
          <TabContent
            tabType={currentType}
            tabData={currentData}
            hasElevatedPermissions={hasElevatedPermissions}
            teamName={teamName}
            user={user}
            teamId={teamId}
            effectiveTeamId={effectiveTeamId}
            filters={filters}
            onFiltersChange={setFilters}
            onSelectMatch={handleSelectMatch}
          />
        )}
      </section>
      
      {selectedMatchForm && (
        <WedstrijdformulierModal
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              // Closed without save → do not refresh or show toast
              handleDialogClose(false);
            }
          }}
          match={selectedMatchForm}
          isAdmin={isAdmin}
          isReferee={isReferee}
          teamId={effectiveTeamId}
          onComplete={handleFormComplete}
        />
      )}
    </div>
  );
};

export default memo(MatchFormTab);
