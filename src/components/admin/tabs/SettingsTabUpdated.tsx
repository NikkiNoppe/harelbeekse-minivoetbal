import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TabVisibilitySettingsUpdated from "../settings/TabVisibilitySettingsUpdated";
const SettingsTabUpdated: React.FC = () => {
  const [activeTab, setActiveTab] = useState("tab-visibility");
  return <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        
        
        <TabsContent value="tab-visibility">
          <TabVisibilitySettingsUpdated />
        </TabsContent>
      </Tabs>
    </div>;
};
export default SettingsTabUpdated;