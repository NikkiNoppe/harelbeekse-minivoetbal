import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/components/ui/card";
import { User } from "@shared/types/auth";
import { 
  FileText, 
  Users, 
  Settings, 
  Shield, 
  Trophy, 
  DollarSign,
  Calendar,
  UserCog
} from "lucide-react";

// Import admin tabs
import MatchFormTab from "@features/teams/MatchFormTab";
import TeamsTab from "./tabs/TeamsTab";
import UserManagementTab from "./tabs/UserManagementTab";
import SettingsTabUpdated from "./tabs/SettingsTabUpdated";
import FinancialTabUpdated from "./tabs/FinancialTabUpdated";
import CompetitionManagementTab from "./tabs/CompetitionManagementTab";

// Import user dashboard tabs
import PlayersTabUpdated from "@features/dashboard/user/tabs/PlayersTabUpdated";
import MatchTab from "@features/dashboard/user/tabs/MatchTab";

interface AdminDashboardProps {
  user: User | null;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState("matchforms");

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-purple-600" />
              <div>
                <CardTitle className="text-2xl text-purple-800">
                  Admin Dashboard
                </CardTitle>
                <p className="text-gray-600 mt-1">
                  Beheer je competitie, teams en gebruikers
                </p>
              </div>
            </div>
            <div className="text-left md:text-right">
              <p className="text-sm text-gray-500">Welkom terug</p>
              <p className="font-semibold text-purple-800">{user?.username}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Admin Interface */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-8 h-auto p-2 bg-gray-50 rounded-none border-b">
              <TabsTrigger 
                value="matchforms" 
                className="flex flex-col gap-1 p-3 text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white hover:bg-purple-100 transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>Matchforms</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="players" 
                className="flex flex-col gap-1 p-3 text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white hover:bg-purple-100 transition-colors"
              >
                <Users className="w-4 h-4" />
                <span>Players</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="teams" 
                className="flex flex-col gap-1 p-3 text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white hover:bg-purple-100 transition-colors"
              >
                <Shield className="w-4 h-4" />
                <span>Teams</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="users" 
                className="flex flex-col gap-1 p-3 text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white hover:bg-purple-100 transition-colors"
              >
                <UserCog className="w-4 h-4" />
                <span>Users</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="matches" 
                className="flex flex-col gap-1 p-3 text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white hover:bg-purple-100 transition-colors"
              >
                <Trophy className="w-4 h-4" />
                <span>Matches</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="competition" 
                className="flex flex-col gap-1 p-3 text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white hover:bg-purple-100 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                <span>Competition</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="financial" 
                className="flex flex-col gap-1 p-3 text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white hover:bg-purple-100 transition-colors"
              >
                <DollarSign className="w-4 h-4" />
                <span>Financial</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="settings" 
                className="flex flex-col gap-1 p-3 text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white hover:bg-purple-100 transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </TabsTrigger>
            </TabsList>

            <div className="p-4 md:p-6">
              <TabsContent value="matchforms" className="mt-0">
                <MatchFormTab teamId={user?.teamId?.toString() || "1"} />
              </TabsContent>

              <TabsContent value="players" className="mt-0">
                <PlayersTabUpdated />
              </TabsContent>

              <TabsContent value="teams" className="mt-0">
                <TeamsTab />
              </TabsContent>

              <TabsContent value="users" className="mt-0">
                <UserManagementTab />
              </TabsContent>

              <TabsContent value="matches" className="mt-0">
                <MatchTab />
              </TabsContent>

              <TabsContent value="competition" className="mt-0">
                <CompetitionManagementTab />
              </TabsContent>

              <TabsContent value="financial" className="mt-0">
                <FinancialTabUpdated />
              </TabsContent>

              <TabsContent value="settings" className="mt-0">
                <SettingsTabUpdated />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard; 