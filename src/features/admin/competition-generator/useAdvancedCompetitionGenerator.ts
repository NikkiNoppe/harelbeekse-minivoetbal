
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
  const [vacationPeriods, setVacationPeriods] = useState<VacationPeriod[]>([]);
  const [generatedSchedule, setGeneratedSchedule] = useState<AIGeneratedSchedule | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("ai-generation");

  // Fetch vacation periods from the consolidated table
  const { data: vacationPeriodsData = [] } = useQuery({
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

  // Update vacation periods when data changes
  useEffect(() => {
    setVacationPeriods([]);
  }, [vacationPeriodsData]);

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

  const handleGenerateWithAI = async (aiProvider: 'openai' | 'abacus') => {
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

      setGeneratedSchedule(data as AIGeneratedSchedule);
      setActiveTab("preview");
      
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

  const handleSaveCompetition = async () => {
    if (!generatedSchedule) return;

    try {
      // Save configuration first
      const { data: savedConfig, error: configError } = await supabase
        .from('competition_configs')
        .insert(config)
        .select()
        .single();

      if (configError) throw configError;

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
      setGeneratedSchedule(null);
      setActiveTab("ai-generation");
      
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
    setVacationPeriods,
    generatedSchedule,
    setGeneratedSchedule,
    isGenerating,
    activeTab,
    setActiveTab,
    handleGenerateWithAI,
    handleSaveCompetition,
    teams
  };
};
