
import React, { useState } from "react";
import { Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TabVisibilitySettingsUpdated from "@/components/admin/settings/TabVisibilitySettingsUpdated";
import PlayerListLockSettings from "@/components/admin/settings/PlayerListLockSettings";
import CompetitionDataSettings from "@/components/admin/settings/CompetitionDataSettings";


const AdminSettingsPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState("tab-visibility");

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Instellingen
        </h2>
      </div>

      <section>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="tab-visibility">Tab Zichtbaarheid</TabsTrigger>
            <TabsTrigger value="player-lock">Spelerslijst Vergrendeling</TabsTrigger>
            <TabsTrigger value="competition-data">Competitiedata</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tab-visibility">
            <TabVisibilitySettingsUpdated />
          </TabsContent>
          
          <TabsContent value="player-lock">
            <PlayerListLockSettings />
          </TabsContent>
          
          <TabsContent value="competition-data">
            <CompetitionDataSettings />
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
};

export default AdminSettingsPanel;
