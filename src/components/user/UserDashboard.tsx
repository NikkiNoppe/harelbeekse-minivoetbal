
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PlayersTab from "./tabs/PlayersTab";
import AdminSettingsPanel from "@/components/admin/AdminSettingsPanel";
import { useAuth } from "@/components/auth/AuthProvider";
import TeamDashboard from "@/components/team/TeamDashboard";
import { MOCK_TEAMS } from "@/data/mockData";
import CompetitionManagementTab from "@/components/admin/tabs/CompetitionManagementTab";
import MatchFormTab from "@/components/team/MatchFormTab";

const UserDashboard = () => {
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

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex mb-8 overflow-x-auto">
          {/* Base tabs for all authenticated users */}
          <TabsTrigger value="match-forms">Wedstrijdformulieren</TabsTrigger>
          <TabsTrigger value="players">Spelerslijst</TabsTrigger>
          
          {/* Admin-only tabs */}
          {isAdmin && (
            <>
              <TabsTrigger value="competition">Competitiebeheer</TabsTrigger>
              <TabsTrigger value="settings">Instellingen</TabsTrigger>
            </>
          )}
        </TabsList>

        <div className="animate-fade-in">
          {/* Base tabs content */}
          <TabsContent value="match-forms">
            <MatchFormTab
              teamId={user?.teamId || 0}
              teamName={teamData?.name || "Admin"}
            />
          </TabsContent>
          
          <TabsContent value="players">
            <PlayersTab />
          </TabsContent>
          
          {/* Admin-only content */}
          {isAdmin && (
            <>
              <TabsContent value="competition">
                <CompetitionManagementTab />
              </TabsContent>
              <TabsContent value="settings">
                <AdminSettingsPanel />
              </TabsContent>
            </>
          )}
        </div>
      </Tabs>
    </div>
  );
};

export default UserDashboard;
