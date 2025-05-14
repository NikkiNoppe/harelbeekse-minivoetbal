
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CompetitionGenerator from "../CompetitionGenerator";

const CompetitionManagementTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Competitiebeheer</h1>
      
      <Tabs defaultValue="generator">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generator">Competitie Generator</TabsTrigger>
          <TabsTrigger value="management">Beheer Competities</TabsTrigger>
        </TabsList>
        
        <TabsContent value="generator" className="space-y-4 mt-4">
          <CompetitionGenerator />
        </TabsContent>
        
        <TabsContent value="management" className="space-y-4 mt-4">
          <div className="p-4 border rounded-md">
            <p className="text-muted-foreground">
              Functionaliteit voor het beheren van bestaande competities komt hier.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompetitionManagementTab;
