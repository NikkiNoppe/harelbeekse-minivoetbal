
import React from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/components/auth/AuthProvider";
import PlayersTab from "./tabs/PlayersTab";
import AdminSettingsPanel from "@/components/admin/AdminSettingsPanel";
import CompetitionManagementTab from "@/components/admin/tabs/CompetitionManagementTab";
import FinancialPage from "@/components/admin/tabs/FinancialTabUpdated";
import UserManagementTab from "@/components/admin/tabs/UserManagementTab";
import TeamsTab from "@/components/admin/tabs/TeamsTab";
import MatchFormTab from "@/components/team/MatchFormTab";
import CupTournamentManager from "@/components/admin/CupTournamentManager";
import PlayoffManagementTab from "@/components/admin/tabs/PlayoffManagementTab";

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
              <PlayersTab />
            </TabsContent>
            
            {isAdmin && (
              <>
                <TabsContent value="teams" className="mt-0">
                  <TeamsTab />
                </TabsContent>
                
                <TabsContent value="users" className="mt-0">
                  <UserManagementTab />
                </TabsContent>
                
                <TabsContent value="competition" className="mt-0">
                  <CompetitionManagementTab />
                </TabsContent>
                
                <TabsContent value="playoffs" className="mt-0">
                  <PlayoffManagementTab />
                </TabsContent>
                
                <TabsContent value="cup" className="mt-0">
                  <CupTournamentManager />
                </TabsContent>
                
                <TabsContent value="financial" className="mt-0">
                  <FinancialPage />
                </TabsContent>
                
                <TabsContent value="settings" className="mt-0">
                  <AdminSettingsPanel />
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
