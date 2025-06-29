
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SettingsTabUpdated from "@/components/admin/tabs/SettingsTabUpdated";
import UserManagementTab from "@/components/admin/tabs/UserManagementTab";
import FinancialTabUpdated from "@/components/admin/tabs/FinancialTabUpdated";
import TeamsTab from "@/components/admin/tabs/TeamsTab";
import { Settings, Users, DollarSign, Shield } from "lucide-react";

const AdminSettingsPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState("settings");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Instellingen</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 bg-transparent">
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Instellingen</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Gebruikers</span>
          </TabsTrigger>
          <TabsTrigger value="teams" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Teams</span>
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span>Financieel</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="settings" className="mt-4">
          <SettingsTabUpdated />
        </TabsContent>
        
        <TabsContent value="users" className="mt-4">
          <UserManagementTab />
        </TabsContent>
        
        <TabsContent value="teams" className="mt-4">
          <TeamsTab />
        </TabsContent>
        
        <TabsContent value="financial" className="mt-4">
          <FinancialTabUpdated />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettingsPanel;
