
import React, { useState } from "react";
import { Bot } from "lucide-react";
import { AdvancedCompetitionConfig, TeamPreference, VacationPeriod, AIGeneratedSchedule } from "../types-advanced";
import FormatConfigurationCard from "./components/FormatConfigurationCard";
import VenuesCard from "./components/VenuesCard";
import TimeslotsCard from "./components/TimeslotsCard";
import VacationPeriodsCard from "./components/VacationPeriodsCard";
import TeamSelectionCard from "./components/TeamSelectionCard";
import TeamPreferencesCard from "./components/TeamPreferencesCard";
import AIProviderCard from "./components/AIProviderCard";
import GenerationActionsCard from "./components/GenerationActionsCard";

interface AIGenerationCombinedTabProps {
  config: AdvancedCompetitionConfig;
  setConfig: (config: AdvancedCompetitionConfig) => void;
  selectedTeams: number[];
  setSelectedTeams: (teams: number[]) => void;
  teamPreferences: TeamPreference[];
  setTeamPreferences: (preferences: TeamPreference[]) => void;
  vacationPeriods: VacationPeriod[];
  setVacationPeriods: (periods: VacationPeriod[]) => void;
  isGenerating: boolean;
  onGenerate: (provider: 'openai' | 'abacus') => void;
  onNext: () => void;
  onPrevious: () => void;
  generatedSchedule?: AIGeneratedSchedule | null;
}

const AIGenerationCombinedTab: React.FC<AIGenerationCombinedTabProps> = ({
  config,
  setConfig,
  selectedTeams,
  setSelectedTeams,
  teamPreferences,
  setTeamPreferences,
  vacationPeriods,
  setVacationPeriods,
  isGenerating,
  onGenerate,
  onNext,
  onPrevious,
  generatedSchedule
}) => {
  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'abacus' | null>(null);

  const handleGenerate = () => {
    if (selectedProvider) {
      onGenerate(selectedProvider);
    }
  };

  const isValid = selectedTeams.length >= 2 && config.name.trim() !== '';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Bot className="w-5 h-5" />
        <h3 className="text-lg font-semibold">AI Competitie Generator</h3>
      </div>

      <FormatConfigurationCard 
        config={config} 
        setConfig={setConfig} 
      />

      <VenuesCard />
      
      <TimeslotsCard />

      <VacationPeriodsCard 
        vacationPeriods={vacationPeriods}
        setVacationPeriods={setVacationPeriods}
      />

      <TeamSelectionCard
        selectedTeams={selectedTeams}
        setSelectedTeams={setSelectedTeams}
        teamPreferences={teamPreferences}
        setTeamPreferences={setTeamPreferences}
      />

      <TeamPreferencesCard
        selectedTeams={selectedTeams}
        teamPreferences={teamPreferences}
        setTeamPreferences={setTeamPreferences}
      />

      <AIProviderCard
        selectedProvider={selectedProvider}
        setSelectedProvider={setSelectedProvider}
      />

      <GenerationActionsCard
        selectedProvider={selectedProvider}
        isValid={isValid}
        isGenerating={isGenerating}
        onGenerate={handleGenerate}
        onNext={onNext}
        generatedSchedule={generatedSchedule}
      />
    </div>
  );
};

export default AIGenerationCombinedTab;
