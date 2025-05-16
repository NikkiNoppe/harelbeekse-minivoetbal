
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TeamsTab from "./tabs/TeamsTab";
import MatchTab from "./tabs/MatchTab";
import PlayersTab from "./tabs/PlayersTab";
import AdminSettingsPanel from "@/components/admin/AdminSettingsPanel";
import { useAuth } from "@/components/auth/AuthProvider";
import TeamDashboard from "@/components/team/TeamDashboard";
import { MOCK_TEAMS } from "@/data/mockData";
import CompetitionManagementTab from "@/components/admin/tabs/CompetitionManagementTab";
import DateGeneratorTab from "@/components/admin/DateGeneratorTab";

const UserDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("teams");
  
  // Admin ziet gebruikersbeheer, team admin ziet team dashboard
  const isAdmin = user?.role === "admin";
  const isTeam = user?.role === "team";
  
  // Find team data if user is a team role
  const teamData = user?.teamId ? MOCK_TEAMS.find(team => team.id === user.teamId) : null;
  
  if (isTeam && teamData) {
    return <TeamDashboard user={user} teamData={teamData} />;
  }

  return (
    <div>
      {isAdmin ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full flex mb-8 overflow-x-auto">
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="players">Spelers</TabsTrigger>
            <TabsTrigger value="matches">Wedstrijden</TabsTrigger>
            <TabsTrigger value="competition">Competitie</TabsTrigger>
            <TabsTrigger value="date-generator">Speeldata Generator</TabsTrigger>
            <TabsTrigger value="settings">Instellingen</TabsTrigger>
          </TabsList>

          <div className="animate-fade-in">
            <TabsContent value="teams"><TeamsTab /></TabsContent>
            <TabsContent value="players"><PlayersTab /></TabsContent>
            <TabsContent value="matches"><MatchTab /></TabsContent>
            <TabsContent value="competition"><CompetitionManagementTab /></TabsContent>
            <TabsContent value="date-generator"><DateGeneratorTab /></TabsContent>
            <TabsContent value="settings"><AdminSettingsPanel /></TabsContent>
          </div>
        </Tabs>
      ) : (
        <div className="text-center">
          <p>U bent niet geautoriseerd om deze pagina te bekijken.</p>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
