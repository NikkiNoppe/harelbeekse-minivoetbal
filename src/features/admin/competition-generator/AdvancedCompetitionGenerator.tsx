
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdvancedCompetitionGenerator } from "./useAdvancedCompetitionGenerator";
import AIGenerationCombinedTab from "./advanced-tabs/AIGenerationCombinedTab";
import PreviewImportTab from "./advanced-tabs/PreviewImportTab";

const AdvancedCompetitionGenerator: React.FC = () => {
  const {
    config,
    setConfig,
    selectedTeams,
    setSelectedTeams,
    teamPreferences,
    setTeamPreferences,
    vacationPeriods,
    setVacationPeriods,
    generatedSchedule,
    setGeneratedSchedule,
    isGenerating,
    activeTab,
    setActiveTab,
    handleGenerateWithAI,
    handleSaveCompetition,
    teams
  } = useAdvancedCompetitionGenerator();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Geavanceerde Competitiegenerator</CardTitle>
          <CardDescription>
            Genereer een competitieschema met AI-ondersteuning en geavanceerde configuratie
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ai-generation">1. AI Generator</TabsTrigger>
              <TabsTrigger value="preview">2. Voorvertoning</TabsTrigger>
            </TabsList>
            
            <TabsContent value="ai-generation" className="space-y-4">
              <AIGenerationCombinedTab
                config={config}
                setConfig={setConfig}
                selectedTeams={selectedTeams}
                setSelectedTeams={setSelectedTeams}
                teamPreferences={teamPreferences}
                setTeamPreferences={setTeamPreferences}
                vacationPeriods={vacationPeriods}
                setVacationPeriods={setVacationPeriods}
                isGenerating={isGenerating}
                onGenerate={handleGenerateWithAI}
                onNext={() => setActiveTab("preview")}
                onPrevious={() => {}}
                generatedSchedule={generatedSchedule}
              />
            </TabsContent>
            
            <TabsContent value="preview" className="space-y-4">
              <PreviewImportTab
                aiGeneratedSchedule={generatedSchedule}
                config={config}
                selectedTeams={selectedTeams}
                onImport={handleSaveCompetition}
                onPrevious={() => setActiveTab("ai-generation")}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedCompetitionGenerator;
