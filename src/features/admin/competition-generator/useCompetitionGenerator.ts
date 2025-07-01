
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Team, AvailableDate, GeneratedMatch, CompetitionGeneratorState, CompetitionGeneratorActions } from "./types";
import { generateRoundRobinSchedule } from "./scheduleGenerator";
import { generateCupSchedule } from "./advancedScheduleGenerator";
import { predefinedFormats, findFormatById } from "./competitionFormats";
import { saveCompetitionToDatabase } from "./competitionService";
import { assignMatchDetails, calculateRequiredMatchdays } from "./matchAssignmentUtils";

export const useCompetitionGenerator = (): CompetitionGeneratorState & 
  CompetitionGeneratorActions & {
    availableDates: AvailableDate[] | undefined;
    loadingDates: boolean;
    competitionFormats: typeof predefinedFormats;
    loadingFormats: boolean;
    teams: Team[] | undefined;
    loadingTeams: boolean;
  } => {
  const { toast } = useToast();
  const [selectedDates, setSelectedDates] = useState<number[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [generatedMatches, setGeneratedMatches] = useState<GeneratedMatch[]>([]);
  const [competitionName, setCompetitionName] = useState("Competitie 2025-2026");
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState("format");
  const [minimumDatesRequired, setMinimumDatesRequired] = useState(0);
  
  // Fetch available dates from the database
  const { data: availableDates, isLoading: loadingDates } = useQuery({
    queryKey: ['availableDates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('available_dates')
        .select('*')
        .order('available_date');
      
      if (error) throw error;
      return data as AvailableDate[];
    }
  });

  // Fetch teams from the database
  const { data: teams, isLoading: loadingTeams } = useQuery({
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

  // Generate schedule based on the selected format
  const generateSchedule = async () => {
    if (!teams || teams.length < 2) {
      toast({
        title: "Niet genoeg teams beschikbaar",
        description: "Er zijn niet genoeg teams om een schema te genereren",
        variant: "destructive"
      });
      return;
    }

    const format = findFormatById(selectedFormat);
    
    if (!format) {
      toast({
        title: "Geen competitieformat geselecteerd",
        description: "Selecteer een competitieformat om door te gaan",
        variant: "destructive"
      });
      return;
    }

    let matches: GeneratedMatch[] = [];

    if (format.isCup) {
      matches = generateCupSchedule(teams);
    } else {
      matches = generateRoundRobinSchedule(teams, format);
      // We don't generate the playoff matches yet, they will be created after the regular season
    }

    // Assign unique codes, locations and times
    const selectedDatesObjects = availableDates?.filter(d => selectedDates.includes(d.date_id)) || [];
    matches = await assignMatchDetails(matches, selectedDatesObjects);
    
    setGeneratedMatches(matches);
    
    // Calculate required matchdays
    const requiredMatchdays = calculateRequiredMatchdays(matches.length);
    setMinimumDatesRequired(requiredMatchdays);
    
    toast({
      title: "Competitieschema gegenereerd",
      description: `${matches.length} wedstrijden zijn gegenereerd voor ${teams.length} teams`,
    });

    // Auto navigate to preview if enough dates are selected
    if (selectedDates.length >= requiredMatchdays) {
      setActiveTab("preview");
    }
  };

  // Update minimum required dates when matches are generated
  useEffect(() => {
    if (generatedMatches.length > 0) {
      const requiredMatchdays = calculateRequiredMatchdays(generatedMatches.length);
      setMinimumDatesRequired(requiredMatchdays);
    }
  }, [generatedMatches]);

  // Save the competition to the database
  const saveCompetition = async () => {
    if (selectedDates.length < minimumDatesRequired) {
      toast({
        title: "Niet genoeg speeldagen geselecteerd",
        description: `Selecteer ten minste ${minimumDatesRequired} speeldagen om alle wedstrijden in te plannen`,
        variant: "destructive"
      });
      return;
    }
    
    setIsCreating(true);

    try {
      const success = await saveCompetitionToDatabase(
        generatedMatches,
        competitionName,
        selectedDates,
        availableDates,
        selectedFormat,
        toast
      );
      
      if (success) {
        // Reset form
        setGeneratedMatches([]);
        setSelectedDates([]);
        setSelectedFormat(null);
        setActiveTab("format");
      }
      
    } finally {
      setIsCreating(false);
    }
  };

  // Toggle a date in the selected dates
  const toggleDate = (dateId: number) => {
    setSelectedDates(prev => 
      prev.includes(dateId) 
        ? prev.filter(id => id !== dateId) 
        : [...prev, dateId]
    );
  };

  return {
    availableDates,
    loadingDates,
    competitionFormats: predefinedFormats,
    loadingFormats: false,
    teams,
    loadingTeams,
    selectedDates,
    selectedFormat,
    generatedMatches,
    competitionName,
    isCreating,
    minimumDatesRequired,
    activeTab,
    setActiveTab,
    setSelectedFormat,
    setCompetitionName,
    toggleDate,
    generateSchedule,
    saveCompetition
  };
};
