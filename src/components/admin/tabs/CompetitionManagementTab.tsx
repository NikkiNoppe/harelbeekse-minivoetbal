
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdvancedCompetitionGenerator from "../competition-generator/AdvancedCompetitionGenerator";
import ManualSchemaTabWrapper from "./ManualSchemaTab";

const CompetitionManagementTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState("advanced");

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="advanced">AI Generator</TabsTrigger>
          <TabsTrigger value="manual-schema">Handmatig Schema</TabsTrigger>
        </TabsList>
        
        <TabsContent value="advanced" className="space-y-4 mt-6">
          <AdvancedCompetitionGenerator />
        </TabsContent>
        
        <TabsContent value="manual-schema" className="space-y-4 mt-6">
          <ManualSchemaTabWrapper />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompetitionManagementTab;
