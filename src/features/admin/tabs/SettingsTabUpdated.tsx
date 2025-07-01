
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/components/ui/tabs";
import TabVisibilitySettingsUpdated from "../settings/TabVisibilitySettingsUpdated";

const SettingsTabUpdated: React.FC = () => {
  const [activeTab, setActiveTab] = useState("tab-visibility");

  const defaultTabs = [
    { id: 'algemeen', label: 'Algemeen' },
    { id: 'competitie', label: 'Competitie' },
    { id: 'playoff', label: 'Playoff' },
    { id: 'beker', label: 'Beker' },
    { id: 'schorsingen', label: 'Schorsingen' },
    { id: 'reglement', label: 'Reglement' },
  ];

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsContent value="tab-visibility">
          <TabVisibilitySettingsUpdated tabs={defaultTabs} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsTabUpdated;
