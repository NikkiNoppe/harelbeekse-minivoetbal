
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TabVisibilitySettings from "../settings/TabVisibilitySettings";
import PlayerListLockSettings from "../settings/PlayerListLockSettings";

const SettingsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="tab-visibility" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tab-visibility">Tab Zichtbaarheid</TabsTrigger>
          <TabsTrigger value="player-lock">Spelerslijst Lock</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tab-visibility" className="space-y-4 mt-6">
          <TabVisibilitySettings />
        </TabsContent>
        
        <TabsContent value="player-lock" className="space-y-4 mt-6">
          <PlayerListLockSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsTab;
