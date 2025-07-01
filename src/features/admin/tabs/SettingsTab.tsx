
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/components/ui/tabs";
import TabVisibilitySettings from "../settings/TabVisibilitySettings";
import PlayerListLockSettings from "../settings/PlayerListLockSettings";

const SettingsTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState("tab-visibility");

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="tab-visibility">Tab Zichtbaarheid</TabsTrigger>
          <TabsTrigger value="player-list-lock">Spelerlijst Vergrendeling</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tab-visibility">
          <TabVisibilitySettings />
        </TabsContent>
        
        <TabsContent value="player-list-lock">
          <PlayerListLockSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsTab;
