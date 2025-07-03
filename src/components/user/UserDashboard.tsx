import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PlayersTab from "./tabs/PlayersTab";
import AdminSettingsPanel from "@/components/admin/AdminSettingsPanel";
import { useAuth } from "@/components/auth/AuthProvider";
import TeamDashboard from "@/components/team/TeamDashboard";

import CompetitionManagementTab from "@/components/admin/tabs/CompetitionManagementTab";
import MatchFormTab from "@/components/team/MatchFormTab";
const UserDashboard = () => {
  const {
    user
  } = useAuth();
  const [activeTab, setActiveTab] = useState("match-forms");
  const isAdmin = user?.role === "admin";
  const isReferee = user?.role === "referee";
  const isTeamManager = user?.role === "player_manager";

  // Find team data if user is a team role
  // Team data will be fetched from actual database when needed

  // If it's a team manager, show the team dashboard instead
  // Note: teamData will need to be fetched from database when this feature is needed
  // if (isTeamManager && teamData) {
  //   return <TeamDashboard user={user} teamData={teamData} />;
  // }
    return <div className="w-full">
      {/* Modern Full-Width Tabs */}
      <div className="w-full bg-white border-b border-purple-200 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="custom-tabs-list">
              <div className="custom-tabs-container">
                {/* Base tabs for all authenticated users */}
                <TabsTrigger value="match-forms" className="custom-tab-trigger">
                  Wedstrijdformulieren
                </TabsTrigger>
                <TabsTrigger value="players" className="custom-tab-trigger">
                  Spelerslijst
                </TabsTrigger>
                
                {/* Admin-only tabs */}
                {isAdmin && <>
                    <TabsTrigger value="competition" className="custom-tab-trigger">
                      Competitiebeheer
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="custom-tab-trigger">
                      Instellingen
                    </TabsTrigger>
                  </>}
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
              <MatchFormTab teamId={user?.teamId || 0} teamName="Admin" />
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
      </div>
    </div>;
};
export default UserDashboard;