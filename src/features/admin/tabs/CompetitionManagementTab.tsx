import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/components/ui/tabs";
import CompetitionGenerator from "../CompetitionGenerator";
import AdvancedCompetitionGenerator from "../competition-generator/AdvancedCompetitionGenerator";
import { Trophy, Zap } from "lucide-react";

const CompetitionManagementTab: React.FC = () => {
  return (
    <div className="w-full">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList>
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Basic
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Advanced
          </TabsTrigger>
        </TabsList>
        <TabsContent value="basic">
          <CompetitionGenerator />
        </TabsContent>
        <TabsContent value="advanced">
          <AdvancedCompetitionGenerator />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompetitionManagementTab;
