
import React from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users, Shield, ClipboardCheck, Settings } from "lucide-react";
import MatchTab from "./tabs/MatchTab";
import PlayersTab from "./tabs/PlayersTab";
import TeamsTab from "./tabs/TeamsTab";
import UsersTab from "./tabs/UsersTab";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  if (!user) return null;
  
  // Define which tabs are available based on user role
  const isAdmin = user.role === "admin";
  const isReferee = user.role === "referee";
  const isTeam = user.role === "team";
  
  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <Tabs defaultValue="match" className="w-full">
        <TabsList className="w-full flex mb-8 bg-slate-800 p-1 overflow-x-auto">
          <TabItem 
            value="match" 
            icon={<Calendar />} 
            label="Wedstrijd" 
          />
          {(isAdmin || isTeam) && (
            <TabItem 
              value="players" 
              icon={<Users />} 
              label="Spelerslijst" 
            />
          )}
          {isAdmin && (
            <TabItem 
              value="teams" 
              icon={<Shield />} 
              label="Teams beheren" 
            />
          )}
          {isAdmin && (
            <TabItem 
              value="users" 
              icon={<Settings />} 
              label="Gebruikersbeheren" 
            />
          )}
        </TabsList>
        <div className="animate-fade-in">
          <TabsContent value="match">
            <MatchTab />
          </TabsContent>
          <TabsContent value="players">
            <PlayersTab />
          </TabsContent>
          <TabsContent value="teams">
            <TeamsTab />
          </TabsContent>
          <TabsContent value="users">
            <UsersTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

interface TabItemProps {
  value: string;
  icon: React.ReactNode;
  label: string;
}

const TabItem: React.FC<TabItemProps> = ({ value, icon, label }) => {
  return (
    <TabsTrigger 
      value={value} 
      className={cn(
        "flex-1 min-w-max flex items-center justify-center gap-2 px-4 py-2 font-medium",
        "data-[state=active]:bg-slate-700 data-[state=active]:text-orange-400 data-[state=active]:shadow-sm",
        "text-gray-400 transition-all"
      )}
    >
      {icon}
      <span>{label}</span>
    </TabsTrigger>
  );
};

export default UserDashboard;
