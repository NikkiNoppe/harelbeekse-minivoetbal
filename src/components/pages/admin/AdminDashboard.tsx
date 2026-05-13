
import React, { useMemo } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import PlayerPage from "@/components/pages/admin/players/PlayerPage.tsx";
import SettingsPanel from "@/components/pages/admin/settings/components/SettingsPanel";
import CompetitionPage from "@/components/pages/admin/competition/CompetitionPage";
import FinancialPage from "@/components/pages/admin/financial/FinancialPage";
import UserPage from "@/components/pages/admin/users/UserPage";
import TeamsPage from "@/components/pages/admin/teams/TeamsPage";
import MatchesPage from "@/components/pages/admin/matches/MatchesPage";
import BekerPage from "@/components/pages/admin/beker/components/BekerPage";
import PlayoffPage from "@/components/pages/admin/AdminPlayoffPage";
import NotAvailable from "@/components/common/NotAvailable";
import AlgemeenPage from "@/components/pages/public/information/AlgemeenPage";
import { useTabVisibility } from "@/context/TabVisibilityContext";

import AdminPlayoffMatchesPage from "@/components/pages/admin/matches/AdminPlayoffMatchesPage";
import ScheidsrechtersPage from "@/components/pages/admin/scheidsrechter/ScheidsrechtersPage";
import BlogPage from "@/components/pages/admin/blog/BlogPage";
import NotificationPage from "@/components/pages/admin/notifications/NotificationPage";
import SchorsingenPage from "@/components/pages/admin/schorsingen/SchorsingenPage";
import { useSuspensionsData } from "@/domains/cards-suspensions";
import { formatDateForDisplay } from "@/lib/dateUtils";
import { Ban } from "lucide-react";

type TabName = "match-forms" | "match-forms-league" | "match-forms-cup" | "match-forms-playoffs" | "players" | "teams" | "users" | "competition" | "playoffs" | "financial" | "settings" | "cup" | "suspensions" | "schorsingen" | "polls" | "scheidsrechters" | "blog-management" | "notification";

interface AdminDashboardProps {
  activeTab: TabName;
  setActiveTab: (tab: TabName) => void;
}

const TeamManagerSuspensionNotice: React.FC = () => {
  const { user } = useAuth();
  const { suspensions, isLoading } = useSuspensionsData();

  const activeTeamSuspensions = useMemo(() => {
    if (!user?.teamId || !suspensions) return [];
    return suspensions
      .filter((suspension) => suspension.teamId === user.teamId && suspension.status === 'active')
      .sort((a, b) => {
        const dateA = a.suspendedForMatch?.date || a.endDate || a.cardDate || '';
        const dateB = b.suspendedForMatch?.date || b.endDate || b.cardDate || '';
        return dateA.localeCompare(dateB);
      });
  }, [suspensions, user?.teamId]);

  if (isLoading || activeTeamSuspensions.length === 0) return null;

  return (
    <Alert className="mb-4 border-destructive/30 bg-destructive/10">
      <Ban className="h-4 w-4 text-destructive" />
      <AlertTitle className="text-destructive">
        Speler geschorst voor komende wedstrijd
      </AlertTitle>
      <AlertDescription className="space-y-2">
        {activeTeamSuspensions.map((suspension) => (
          <div key={suspension.id} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="font-medium text-foreground">{suspension.playerName}</span>
              <span className="text-muted-foreground"> · {suspension.reason}</span>
              {suspension.suspendedForMatches && suspension.suspendedForMatches.length > 0 ? (
                <span className="text-muted-foreground">
                  {' '}· {suspension.suspendedForMatches.map((match) => `${formatDateForDisplay(match.date)} tegen ${match.opponent}`).join(' + ')}
                </span>
              ) : suspension.suspendedForMatch && (
                <span className="text-muted-foreground">
                  {' '}· {formatDateForDisplay(suspension.suspendedForMatch.date)} tegen {suspension.suspendedForMatch.opponent}
                </span>
              )}
              {suspension.notes && (
                <span className="block mt-1 text-sm text-foreground/90 border-l-2 border-primary/30 pl-2">
                  <span className="font-medium">Bericht: </span>
                  {suspension.notes}
                </span>
              )}
            </div>
            <Badge variant="destructive" className="w-fit">
              Niet speelgerechtigd
            </Badge>
          </div>
        ))}
      </AlertDescription>
    </Alert>
  );
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isTeamManager = user?.role === "player_manager";
  const { isTabVisible } = useTabVisibility();

  const canSeeLeagueForms = isTabVisible("match-forms-league");
  const canSeeCupForms = isTabVisible("match-forms-cup");
  const canSeePlayoffForms = isTabVisible("match-forms-playoffs");
  const canSeeAnyForms = canSeeLeagueForms || canSeeCupForms || canSeePlayoffForms;
  
  // For team managers, use their teamId; for admins/referees use 0
  const matchFormsTeamId = isTeamManager ? (user?.teamId || 0) : 0;
  const matchFormsTeamName = isTeamManager ? "Team" : "Admin";

  return (
    <div className="w-full admin-dashboard">
      {/* Tab Content */}
      <div className="container-adaptive px-4 sm:px-6 lg:px-8 py-8 w-full">
        {isTeamManager && <TeamManagerSuspensionNotice />}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabName)} className="w-full">
          <div className="animate-fade-in">
            <TabsContent value="match-forms" className="mt-0">
              {canSeeAnyForms ? (
                <MatchesPage teamId={matchFormsTeamId} teamName={matchFormsTeamName} />
              ) : (
                user?.role === 'referee' ? <AlgemeenPage /> : <NotAvailable />
              )}
            </TabsContent>
            
            <TabsContent value="match-forms-league" className="mt-0">
              {canSeeLeagueForms ? (
                <MatchesPage teamId={matchFormsTeamId} teamName={matchFormsTeamName} initialTab="league" />
              ) : (
                user?.role === 'referee' ? <AlgemeenPage /> : <NotAvailable />
              )}
            </TabsContent>
            
            <TabsContent value="match-forms-cup" className="mt-0">
              {canSeeCupForms ? (
                <MatchesPage teamId={matchFormsTeamId} teamName={matchFormsTeamName} initialTab="cup" />
              ) : (
                user?.role === 'referee' ? <AlgemeenPage /> : <NotAvailable />
              )}
            </TabsContent>
            
            <TabsContent value="match-forms-playoffs" className="mt-0">
              {canSeePlayoffForms ? (
                <AdminPlayoffMatchesPage />
              ) : (
                user?.role === 'referee' ? <AlgemeenPage /> : <NotAvailable />
              )}
            </TabsContent>
            
            <TabsContent value="players" className="mt-0">
              <PlayerPage />
            </TabsContent>
            
            {/* Teams page - visible based on tab visibility settings */}
            {isTabVisible("teams") && (
              <TabsContent value="teams" className="mt-0">
                <TeamsPage />
              </TabsContent>
            )}

            {isTeamManager && (
              <TabsContent value="schorsingen" className="mt-0">
                <SchorsingenPage />
              </TabsContent>
            )}
            
            {isAdmin && (
              <>
                <TabsContent value="suspensions" className="mt-0">
                  <SchorsingenPage />
                </TabsContent>
                
                <TabsContent value="schorsingen" className="mt-0">
                  <SchorsingenPage />
                </TabsContent>
                
                <TabsContent value="users" className="mt-0">
                  <UserPage />
                </TabsContent>
                
                <TabsContent value="competition" className="mt-0">
                  <CompetitionPage />
                </TabsContent>
                
                <TabsContent value="cup" className="mt-0">
                  <BekerPage />
                </TabsContent>
                
                <TabsContent value="playoffs" className="mt-0">
                  <PlayoffPage />
                </TabsContent>
                
                <TabsContent value="financial" className="mt-0">
                  <FinancialPage />
                </TabsContent>
                
                <TabsContent value="settings" className="mt-0">
                  <SettingsPanel />
                </TabsContent>
                
                
   <TabsContent value="polls" className="mt-0">
                  <ScheidsrechtersPage />
                </TabsContent>
              </>
            )}

            {/* Blog Management */}
            <TabsContent value="blog-management" className="mt-0">
              <BlogPage />
            </TabsContent>

            {/* Berichten Beheer */}
            <TabsContent value="notification" className="mt-0">
              <NotificationPage />
            </TabsContent>

            {/* Scheidsrechters tab - removed as it's now handled via main navigation */}
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
