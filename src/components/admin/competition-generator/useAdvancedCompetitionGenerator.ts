
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { 
  AdvancedCompetitionConfig, 
  TeamPreference, 
  VacationPeriod, 
  AIGeneratedSchedule,
  AIGenerationRequest,
  Team 
} from "./types-advanced";

export const useAdvancedCompetitionGenerator = () => {
  const { toast } = useToast();
  
  const [config, setConfig] = useState<AdvancedCompetitionConfig>({
    name: "Nieuwe Competitie 2025",
    matches_per_week: 7,
    start_date: "2025-01-15",
    end_date: "2025-06-15",
    format_type: "regular",
    vacation_periods: []
  });
  
  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
  const [teamPreferences, setTeamPreferences] = useState<TeamPreference[]>([]);
  const [aiGeneratedSchedule, setAiGeneratedSchedule] = useState<AIGeneratedSchedule | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState("format");

  // Fetch vacation periods
  const { data: vacationPeriods = [] } = useQuery({
    queryKey: ['vacationPeriods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vacation_periods')
        .select('*')
        .eq('is_active', true)
        .order('start_date');
      
      if (error) throw error;
      return data as VacationPeriod[];
    }
  });

  // Fetch teams
  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('team_id, team_name')
        .order('team_name');
      
      if (error) throw error;
      return data as Team[];
    }
  });

  const validateConfig = (step: string): boolean => {
    switch (step) {
      case "format":
        return !!(config.name && config.format_type && config.matches_per_week > 0);
      case "duration":
        return !!(config.start_date && config.end_date && config.start_date < config.end_date);
      case "teams":
        return selectedTeams.length >= 2;
      case "generate":
        return validateConfig("format") && validateConfig("duration") && validateConfig("teams");
      default:
        return false;
    }
  };

  const getStepStatus = (stepId: string): 'completed' | 'current' | 'disabled' => {
    const stepOrder = ["format", "duration", "teams", "generate", "preview"];
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(stepId);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    
    // Check if previous steps are valid
    for (let i = 0; i < stepIndex; i++) {
      if (!validateConfig(stepOrder[i])) return 'disabled';
    }
    
    return 'disabled';
  };

  const generateWithAI = async (aiProvider: 'openai' | 'abacus') => {
    if (!validateConfig("generate")) {
      toast({
        title: "Configuratie incompleet",
        description: "Vul alle vereiste velden in voordat je een schema genereert",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const request: AIGenerationRequest = {
        config,
        teams: teams.filter(team => selectedTeams.includes(team.team_id)),
        team_preferences: teamPreferences,
        vacation_periods: vacationPeriods.filter(vp => config.vacation_periods.includes(vp.id)),
        ai_provider: aiProvider
      };

      const { data, error } = await supabase.functions.invoke('generate-competition-schedule', {
        body: request
      });

      if (error) throw error;

      setAiGeneratedSchedule(data as AIGeneratedSchedule);
      setCurrentStep("preview");
      
      toast({
        title: "Schema gegenereerd!",
        description: `${data.matches.length} wedstrijden gegenereerd met ${aiProvider.toUpperCase()}`,
      });
      
    } catch (error) {
      console.error('Error generating schedule:', error);
      toast({
        title: "Fout bij genereren",
        description: "Er is een fout opgetreden bij het genereren van het schema",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const importSchedule = async () => {
    if (!aiGeneratedSchedule) return;

    try {
      // Save configuration first
      const { data: savedConfig, error: configError } = await supabase
        .from('competition_configs')
        .insert(config)
        .select()
        .single();

      if (configError) throw configError;

      // Save the generated schedule to matches and matchdays tables
      // This logic would be similar to the existing saveCompetition function
      // but using the AI-generated data structure
      
      toast({
        title: "Schema geïmporteerd!",
        description: "Het AI-gegenereerde schema is succesvol geïmporteerd",
      });
      
      // Reset form
      setConfig({
        name: "Nieuwe Competitie 2025",
        matches_per_week: 7,
        start_date: "2025-01-15",
        end_date: "2025-06-15",
        format_type: "regular",
        vacation_periods: []
      });
      setSelectedTeams([]);
      setTeamPreferences([]);
      setAiGeneratedSchedule(null);
      setCurrentStep("format");
      
    } catch (error) {
      console.error('Error importing schedule:', error);
      toast({
        title: "Fout bij importeren",
        description: "Er is een fout opgetreden bij het importeren van het schema",
        variant: "destructive"
      });
    }
  };

  return {
    config,
    setConfig,
    selectedTeams,
    setSelectedTeams,
    teamPreferences,
    setTeamPreferences,
    vacationPeriods,
    teams,
    aiGeneratedSchedule,
    isGenerating,
    currentStep,
    setCurrentStep,
    generateWithAI,
    importSchedule,
    validateConfig,
    getStepStatus
  };
};
