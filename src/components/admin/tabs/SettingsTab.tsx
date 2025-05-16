
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TabVisibilitySettings from "../settings/TabVisibilitySettings";
import DateGeneratorTab from "../DateGeneratorTab";

const SettingsTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState("tab-visibility");

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="tab-visibility">Tab Zichtbaarheid</TabsTrigger>
          <TabsTrigger value="date-generator">Speeldata Generator</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tab-visibility">
          <TabVisibilitySettings />
        </TabsContent>
        
        <TabsContent value="date-generator">
          <DateGeneratorTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsTab;
