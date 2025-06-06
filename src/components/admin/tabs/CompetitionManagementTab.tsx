
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CompetitionGenerator from "../CompetitionGenerator";
import ManualSchemaTabWrapper from "./ManualSchemaTab";

const CompetitionManagementTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState("generator");

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generator">Competitiegenerator</TabsTrigger>
          <TabsTrigger value="manual-schema">Handmatig Schema</TabsTrigger>
        </TabsList>
        
        <TabsContent value="generator" className="space-y-4 mt-6">
          <CompetitionGenerator />
        </TabsContent>
        
        <TabsContent value="manual-schema" className="space-y-4 mt-6">
          <ManualSchemaTabWrapper />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompetitionManagementTab;
