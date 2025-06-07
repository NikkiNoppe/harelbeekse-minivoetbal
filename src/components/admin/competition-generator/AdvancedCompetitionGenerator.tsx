
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import FormatConfigTab from "./advanced-tabs/FormatConfigTab";
import DurationTab from "./advanced-tabs/DurationTab";
import TeamsPreferencesTab from "./advanced-tabs/TeamsPreferencesTab";
import AIGenerationTab from "./advanced-tabs/AIGenerationTab";
import PreviewImportTab from "./advanced-tabs/PreviewImportTab";
import { useAdvancedCompetitionGenerator } from "./useAdvancedCompetitionGenerator";

const AdvancedCompetitionGenerator: React.FC = () => {
  const {
    config,
    setConfig,
    selectedTeams,
    setSelectedTeams,
    teamPreferences,
    setTeamPreferences,
    vacationPeriods,
    aiGeneratedSchedule,
    isGenerating,
    currentStep,
    setCurrentStep,
    generateWithAI,
    importSchedule,
    validateConfig,
    getStepStatus
  } = useAdvancedCompetitionGenerator();

  const steps = [
    { id: "format", label: "1. Format", description: "Competitieformat en regels" },
    { id: "duration", label: "2. Planning", description: "Duur en verlofperiodes" },
    { id: "teams", label: "3. Teams", description: "Teams en voorkeuren" },
    { id: "generate", label: "4. AI Generatie", description: "Schema laten genereren" },
    { id: "preview", label: "5. Voorvertoning", description: "Bekijken en importeren" }
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  const progressPercentage = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Geavanceerde Competitiegenerator</CardTitle>
          <CardDescription>
            Configureer een competitie en laat AI een optimaal schema genereren
          </CardDescription>
          
          {/* Progress indicator */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Voortgang</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="w-full" />
            <div className="flex gap-2 flex-wrap">
              {steps.map((step, index) => (
                <Badge 
                  key={step.id}
                  variant={index <= currentStepIndex ? "default" : "outline"}
                  className="text-xs"
                >
                  {step.label}
                </Badge>
              ))}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs value={currentStep} onValueChange={setCurrentStep} className="space-y-6">
            <TabsList className="grid grid-cols-5 w-full">
              {steps.map((step) => (
                <TabsTrigger 
                  key={step.id} 
                  value={step.id}
                  className="text-xs"
                  disabled={getStepStatus(step.id) === 'disabled'}
                >
                  {step.label}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <TabsContent value="format" className="space-y-4">
              <FormatConfigTab
                config={config}
                setConfig={setConfig}
                onNext={() => setCurrentStep("duration")}
              />
            </TabsContent>
            
            <TabsContent value="duration" className="space-y-4">
              <DurationTab
                config={config}
                setConfig={setConfig}
                vacationPeriods={vacationPeriods}
                onNext={() => setCurrentStep("teams")}
                onPrevious={() => setCurrentStep("format")}
              />
            </TabsContent>
            
            <TabsContent value="teams" className="space-y-4">
              <TeamsPreferencesTab
                selectedTeams={selectedTeams}
                setSelectedTeams={setSelectedTeams}
                teamPreferences={teamPreferences}
                setTeamPreferences={setTeamPreferences}
                onNext={() => setCurrentStep("generate")}
                onPrevious={() => setCurrentStep("duration")}
              />
            </TabsContent>
            
            <TabsContent value="generate" className="space-y-4">
              <AIGenerationTab
                config={config}
                selectedTeams={selectedTeams}
                teamPreferences={teamPreferences}
                vacationPeriods={vacationPeriods}
                isGenerating={isGenerating}
                onGenerate={generateWithAI}
                onNext={() => setCurrentStep("preview")}
                onPrevious={() => setCurrentStep("teams")}
              />
            </TabsContent>
            
            <TabsContent value="preview" className="space-y-4">
              <PreviewImportTab
                aiGeneratedSchedule={aiGeneratedSchedule}
                config={config}
                onImport={importSchedule}
                onPrevious={() => setCurrentStep("generate")}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedCompetitionGenerator;
