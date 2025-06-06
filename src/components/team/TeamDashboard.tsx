
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import PlayersTab from "@/components/user/tabs/PlayersTab";
import { User, TeamData } from "@/types/auth";
import MatchFormTab from "./MatchFormTab";

interface TeamDashboardProps {
  user: User;
  teamData: TeamData;
}

const TeamDashboard: React.FC<TeamDashboardProps> = ({ user, teamData }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("match-forms");
  
  // All team managers have access to both capabilities
  const canManagePlayers = !!teamData.email;
  const canManageMatchForms = !!teamData.email;

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <div className="px-1">
        <h1 className="text-xl sm:text-2xl font-bold break-words">
          Team Dashboard: {teamData.name}
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 min-h-[40px] sm:min-h-[44px]">
          <TabsTrigger 
            value="match-forms" 
            disabled={!canManageMatchForms}
            className="text-xs sm:text-sm px-2 sm:px-4"
          >
            Wedstrijdformulieren
          </TabsTrigger>
          <TabsTrigger 
            value="players" 
            disabled={!canManagePlayers}
            className="text-xs sm:text-sm px-2 sm:px-4"
          >
            Spelerslijst
          </TabsTrigger>
        </TabsList>

        {canManageMatchForms && (
          <TabsContent value="match-forms" className="space-y-4 mt-4">
            <MatchFormTab
              teamId={user.teamId || 0}
              teamName={teamData.name}
            />
          </TabsContent>
        )}

        {canManagePlayers && (
          <TabsContent value="players" className="space-y-4 mt-4">
            <PlayersTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default TeamDashboard;
