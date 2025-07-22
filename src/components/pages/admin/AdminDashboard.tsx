
import React from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/components/auth/AuthProvider";
import PlayerPage from "@/components/pages/admin/players/PlayerPage";
import AdminSettingsPanel from "@/components/admin/AdminSettingsPanel";
import AdminCompetitionPage from "@/components/pages/admin/AdminCompetitionPage";
import AdminFinancialPage from "@/components/pages/admin/AdminFinancialPage";
import AdminUserPage from "@/components/pages/admin/AdminUserPage";
import AdminTeamPage from "@/components/pages/admin/AdminTeamPage";
import MatchFormTab from "@/components/pages/admin/matches/MatchFormTab";
import CupTournamentManager from "@/components/admin/CupTournamentManager";
import AdminPlayoffPage from "@/components/pages/admin/AdminPlayoffPage";
import AdminSettingsPage from "@/components/pages/admin/AdminSettingsPage";

type TabName = "match-forms" | "players" | "teams" | "users" | "competition" | "playoffs" | "financial" | "settings" | "cup";

interface AdminDashboardProps {
  activeTab: TabName;
  setActiveTab: (tab: TabName) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <div className="w-full">
      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabName)} className="w-full">
          <div className="animate-fade-in">
            <TabsContent value="match-forms" className="mt-0">
              <MatchFormTab teamId={user?.teamId || 0} teamName="Admin" />
            </TabsContent>
            
            <TabsContent value="players" className="mt-0">
              <PlayerPage />
            </TabsContent>
            
            {isAdmin && (
              <>
                <TabsContent value="teams" className="mt-0">
                  <AdminTeamPage />
                </TabsContent>
                
                <TabsContent value="users" className="mt-0">
                  <AdminUserPage />
                </TabsContent>
                
                <TabsContent value="competition" className="mt-0">
                  <AdminCompetitionPage />
                </TabsContent>
                
                <TabsContent value="playoffs" className="mt-0">
                  <AdminPlayoffPage />
                </TabsContent>
                
                <TabsContent value="financial" className="mt-0">
                  <AdminFinancialPage />
                </TabsContent>
                
                <TabsContent value="settings" className="mt-0">
                  <AdminSettingsPage />
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
