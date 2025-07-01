
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/components/ui/tabs";
import PlayersTab from "./tabs/PlayersTab";
import AdminSettingsPanel from "@features/admin/AdminSettingsPanel";
import { useAuth } from "@features/auth/AuthProvider";
import TeamDashboard from "@features/teams/TeamDashboard";
import { MOCK_TEAMS } from "@shared/constants/mockData";
import CompetitionManagementTab from "@features/admin/tabs/CompetitionManagementTab";
import { MatchFormTab } from "@features/teams/MatchFormTab";

const UserDashboard = () => {
  const {
    user
  } = useAuth();
  const [activeTab, setActiveTab] = useState("match-forms");
  const isAdmin = user?.role === "admin";
  const isReferee = user?.role === "referee";
  const isTeamManager = user?.role === "player_manager";

  // Find team data if user is a team role
  const teamData = user?.teamId ? MOCK_TEAMS.find(team => team.id === user.teamId) : null;

  // If it's a team manager, show the team dashboard instead
  if (isTeamManager && teamData) {
    return <TeamDashboard user={user} />;
  }
  return <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex mb-6 sm:mb-8 overflow-x-auto scrollbar-hide min-h-[40px] sm:min-h-[44px] p-1 bg-transparent ">
          {/* Base tabs for all authenticated users */}
          <TabsTrigger value="match-forms" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3">
            Wedstrijdformulieren
          </TabsTrigger>
          <TabsTrigger value="players" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3">
            Spelerslijst
          </TabsTrigger>
          
          {/* Admin-only tabs */}
          {isAdmin && <>
              <TabsTrigger value="competition" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3">
                Competitiebeheer
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3">
                Instellingen
              </TabsTrigger>
            </>}
        </TabsList>

        <div className="animate-fade-in">
          {/* Base tabs content */}
          <TabsContent value="match-forms" className="mt-0">
            <MatchFormTab teamId={user?.teamId?.toString() || "0"} />
          </TabsContent>
          
          <TabsContent value="players" className="mt-0">
            <PlayersTab />
          </TabsContent>
          
          {/* Admin-only content */}
          {isAdmin && <>
              <TabsContent value="competition" className="mt-0">
                <CompetitionManagementTab />
              </TabsContent>
              <TabsContent value="settings" className="mt-0">
                <AdminSettingsPanel />
              </TabsContent>
            </>}
        </div>
      </Tabs>
    </div>;
};

export default UserDashboard;
