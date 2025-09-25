
import React from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/components/pages/login/AuthProvider";
import PlayerPage from "@/components/pages/admin/players/PlayerPage.tsx";
import SettingsPanel from "@/components/pages/admin/settings/components/SettingsPanel";
import CompetitionPage from "@/components/pages/admin/competition/CompetitionPage";
import FinancialPage from "@/components/pages/admin/financial/FinancialPage";
import UserPage from "@/components/pages/admin/users/UserPage";
import TeamsPage from "@/components/pages/admin/teams/TeamsPage";
import MatchesPage from "@/components/pages/admin/matches/MatchesPage";
import BekerPage from "@/components/pages/admin/beker/components/BekerPage";
import PlayoffPage from "@/components/pages/admin/AdminPlayoffPage";
import SettingsPage from "@/components/pages/admin/settings/SettingsPage";
import NotAvailable from "@/components/common/NotAvailable";
import AlgemeenPage from "@/components/pages/AlgemeenPage";
import { useTabVisibility } from "@/context/TabVisibilityContext";

import AdminSuspensionsPage from "@/components/pages/admin/suspensions/AdminSuspensionsPage";
import AdminPlayoffMatchesPage from "@/components/pages/admin/matches/AdminPlayoffMatchesPage";
import AdminPollPage from "@/components/pages/admin/polls/AdminPollPage";

type TabName = "match-forms" | "match-forms-league" | "match-forms-cup" | "match-forms-playoffs" | "players" | "teams" | "users" | "competition" | "playoffs" | "financial" | "settings" | "cup" | "suspensions" | "polls";

interface AdminDashboardProps {
  activeTab: TabName;
  setActiveTab: (tab: TabName) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { isTabVisible } = useTabVisibility();

  const canSeeLeagueForms = isTabVisible("match-forms-league");
  const canSeeCupForms = isTabVisible("match-forms-cup");
  const canSeePlayoffForms = isTabVisible("match-forms-playoffs");
  const canSeeAnyForms = canSeeLeagueForms || canSeeCupForms || canSeePlayoffForms;

  return (
    <div className="w-full admin-dashboard">
      {/* Tab Content */}
      <div className="container-adaptive px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabName)} className="w-full">
          <div className="animate-fade-in">
            <TabsContent value="match-forms" className="mt-0">
              {canSeeAnyForms ? (
                <MatchesPage teamId={0} teamName="Admin" />
              ) : (
                user?.role === 'referee' ? <AlgemeenPage /> : <NotAvailable />
              )}
            </TabsContent>
            
            <TabsContent value="match-forms-league" className="mt-0">
              {canSeeLeagueForms ? (
                <MatchesPage teamId={0} teamName="Admin" initialTab="league" />
              ) : (
                user?.role === 'referee' ? <AlgemeenPage /> : <NotAvailable />
              )}
            </TabsContent>
            
            <TabsContent value="match-forms-cup" className="mt-0">
              {canSeeCupForms ? (
                <MatchesPage teamId={0} teamName="Admin" initialTab="cup" />
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
            
            {isAdmin && (
              <>
                <TabsContent value="teams" className="mt-0">
                  <TeamsPage />
                </TabsContent>
                
                <TabsContent value="suspensions" className="mt-0">
                  <AdminSuspensionsPage />
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
                  <SettingsPage />
                </TabsContent>
                
                <TabsContent value="polls" className="mt-0">
                  <AdminPollPage />
                </TabsContent>
              </>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
