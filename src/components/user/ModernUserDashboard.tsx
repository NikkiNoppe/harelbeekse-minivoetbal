
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PlayersTab from "./tabs/PlayersTab";
import AdminSettingsPanel from "@/components/admin/AdminSettingsPanel";
import { useAuth } from "@/components/auth/AuthProvider";
import TeamDashboard from "@/components/team/TeamDashboard";
import { MOCK_TEAMS } from "@/data/mockData";
import CompetitionManagementTab from "@/components/admin/tabs/CompetitionManagementTab";
import MatchFormTab from "@/components/team/MatchFormTab";
import UserManagementTab from "@/components/admin/tabs/UserManagementTab";
import TeamsTab from "@/components/admin/tabs/TeamsTab";
import FinancialTabUpdated from "@/components/admin/tabs/FinancialTabUpdated";
import { FileText, Users, Shield, UserCheck, Trophy, Euro } from "lucide-react";

const ModernUserDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("match-forms");
  const isAdmin = user?.role === "admin";
  const isReferee = user?.role === "referee";
  const isTeamManager = user?.role === "player_manager";

  // Find team data if user is a team role
  const teamData = user?.teamId ? MOCK_TEAMS.find(team => team.id === user.teamId) : null;

  // If it's a team manager, show the team dashboard instead
  if (isTeamManager && teamData) {
    return <TeamDashboard user={user} teamData={teamData} />;
  }

  // Define tabs based on user role
  const baseTabs = [
    { value: "match-forms", label: "Wedstrijdformulieren", icon: FileText },
    { value: "players", label: "Spelers", icon: Users }
  ];

  const adminTabs = [
    { value: "teams", label: "Teams", icon: Shield },
    { value: "users", label: "Gebruikers", icon: UserCheck },
    { value: "competition", label: "Competitiebeheer", icon: Trophy },
    { value: "financial", label: "Financieel", icon: Euro }
  ];

  const allTabs = isAdmin ? [...baseTabs, ...adminTabs] : baseTabs;

  return (
    <div className="w-full">
      {/* Modern Full-Width Tabs */}
      <div className="w-full bg-white border-b border-purple-200 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full h-16 bg-transparent border-0 rounded-none p-0 flex justify-center">
              <div className="flex space-x-0 bg-purple-50 rounded-xl p-1 border border-purple-200">
                {allTabs.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg border-0 bg-transparent text-purple-700 hover:bg-purple-100 data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
                  >
                    <tab.icon size={16} />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                  </TabsTrigger>
                ))}
              </div>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="animate-fade-in">
            {/* Base tabs content */}
            <TabsContent value="match-forms" className="mt-0">
              <MatchFormTab teamId={user?.teamId || 0} teamName={teamData?.name || "Admin"} />
            </TabsContent>
            
            <TabsContent value="players" className="mt-0">
              <PlayersTab />
            </TabsContent>
            
            {/* Admin-only content */}
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
                
                <TabsContent value="financial" className="mt-0">
                  <FinancialTabUpdated />
                </TabsContent>
              </>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default ModernUserDashboard;
