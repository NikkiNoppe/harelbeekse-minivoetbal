
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SettingsTab from "@/components/admin/tabs/SettingsTab";
import UserManagementTab from "@/components/admin/tabs/UserManagementTab";
import { Settings, Users } from "lucide-react";

const AdminSettingsPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState("settings");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Instellingen</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Instellingen</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Gebruikers</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="settings" className="mt-4">
          <SettingsTab />
        </TabsContent>
        
        <TabsContent value="users" className="mt-4">
          <UserManagementTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettingsPanel;
