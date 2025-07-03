import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TabVisibilitySettingsUpdated from "../settings/TabVisibilitySettingsUpdated";
import { Settings } from "lucide-react";

const SettingsTabUpdated: React.FC = () => {
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
          <TabsContent value="tab-visibility">
            <TabVisibilitySettingsUpdated />
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
};
export default SettingsTabUpdated;