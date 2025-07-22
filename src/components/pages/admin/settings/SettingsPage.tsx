import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TabVisibilitySettingsUpdated from "@/components/pages/admin/settings/components/TabVisibilitySettingsUpdated";
import CompetitionDataSettings from "@/components/pages/admin/settings/components/CompetitionDataSettings";
import { SuspensionRulesSettings } from "@/components/pages/admin/settings/components/SuspensionRulesSettings";
import { Settings } from "lucide-react";

const AdminSettingsPage: React.FC = () => {
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
            <TabsTrigger value="competition-data">Competitiedata</TabsTrigger>
            <TabsTrigger value="suspension-rules">Schorsingsregels</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tab-visibility">
            <TabVisibilitySettingsUpdated />
          </TabsContent>
          
          <TabsContent value="competition-data">
            <CompetitionDataSettings />
          </TabsContent>
          
          <TabsContent value="suspension-rules">
            <SuspensionRulesSettings />
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
};

export default AdminSettingsPage;