
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TabVisibilitySettings from "../settings/TabVisibilitySettings";

const SettingsTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState("tab-visibility");

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="tab-visibility">Tab Zichtbaarheid</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tab-visibility">
          <TabVisibilitySettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsTab;
