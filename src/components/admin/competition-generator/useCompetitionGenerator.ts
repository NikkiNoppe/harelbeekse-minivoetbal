
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Team, AvailableDate, CompetitionFormat, GeneratedMatch } from "./types";
import { generateRoundRobinSchedule } from "./scheduleGenerator";

export const useCompetitionGenerator = () => {
  const { toast } = useToast();
  const [selectedDates, setSelectedDates] = useState<number[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<number | null>(null);
  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
  const [generatedMatches, setGeneratedMatches] = useState<GeneratedMatch[]>([]);
  const [competitionName, setCompetitionName] = useState("Competitie 2025-2026");
  const [isCreating, setIsCreating] = useState(false);

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

  // Fetch competition formats from the database
  const { data: competitionFormats, isLoading: loadingFormats } = useQuery({
    queryKey: ['competitionFormats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competition_formats')
        .select('*');
      
      if (error) throw error;
      return data as CompetitionFormat[];
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

  // Generate a competition schedule
  const generateSchedule = () => {
    if (!teams || teams.length < 2 || selectedTeams.length < 2) {
      toast({
        title: "Niet genoeg teams geselecteerd",
        description: "Selecteer ten minste 2 teams om een schema te genereren",
        variant: "destructive"
      });
      return;
    }

    const format = competitionFormats?.find(f => f.format_id === selectedFormat);
    if (!format) {
      toast({
        title: "Geen competitieformat geselecteerd",
        description: "Selecteer een competitieformat om door te gaan",
        variant: "destructive"
      });
      return;
    }

    const filteredTeams = teams.filter(team => selectedTeams.includes(team.team_id));
    const matches = generateRoundRobinSchedule(filteredTeams, format);
    setGeneratedMatches(matches);
    
    toast({
      title: "Competitieschema gegenereerd",
      description: `${matches.length} wedstrijden zijn gegenereerd voor ${filteredTeams.length} teams`,
    });
  };

  // Save the competition to the database
  const saveCompetition = async () => {
    if (generatedMatches.length === 0) {
      toast({
        title: "Geen wedstrijden om op te slaan",
        description: "Genereer eerst een competitieschema",
        variant: "destructive"
      });
      return;
    }

    if (selectedDates.length < Math.ceil(generatedMatches.length / 3)) {
      toast({
        title: "Niet genoeg speeldagen geselecteerd",
        description: "Selecteer meer speeldagen om alle wedstrijden in te plannen",
        variant: "destructive"
      });
      return;
    }
    
    setIsCreating(true);

    try {
      // 1. Maak eerst een nieuwe competitie aan
      const selectedDatesObjects = availableDates?.filter(d => selectedDates.includes(d.date_id)) || [];
      const startDate = selectedDatesObjects.length > 0 ? selectedDatesObjects[0].available_date : new Date().toISOString().split('T')[0];
      const endDate = selectedDatesObjects.length > 0 ? 
        selectedDatesObjects[selectedDatesObjects.length - 1].available_date : 
        new Date().toISOString().split('T')[0];
      
      const { data: compData, error: compError } = await supabase
        .from('competitions')
        .insert([
          { 
            name: competitionName, 
            start_date: startDate, 
            end_date: endDate, 
            is_playoff: false 
          }
        ])
        .select();
      
      if (compError) throw compError;
      
      const competitionId = compData[0].competition_id;

      // 2. Maak matchdays aan voor elke geselecteerde datum
      const matchdaysToCreate = selectedDatesObjects.map((date, index) => ({
        competition_id: competitionId,
        name: `Speeldag ${index + 1}`,
        matchday_date: date.available_date,
        is_playoff: false
      }));

      const { data: matchdayData, error: matchdayError } = await supabase
        .from('matchdays')
        .insert(matchdaysToCreate)
        .select();
        
      if (matchdayError) throw matchdayError;
      
      // 3. Wijs wedstrijden toe aan matchdays
      const matchDays = matchdayData || [];
      const matchesToCreate = generatedMatches.map((match, index) => {
        const matchdayIndex = Math.floor(index / 3) % matchDays.length; // Maximaal 3 wedstrijden per speeldag
        return {
          home_team_id: match.home_team_id,
          away_team_id: match.away_team_id,
          match_date: matchDays[matchdayIndex].matchday_date,
          matchday_id: matchDays[matchdayIndex].matchday_id,
          referee_cost: 25.00,  // Default waarden
          field_cost: 50.00,    // Default waarden
        };
      });
      
      const { error: matchesError } = await supabase
        .from('matches')
        .insert(matchesToCreate);
        
      if (matchesError) throw matchesError;

      toast({
        title: "Competitie aangemaakt",
        description: `De competitie '${competitionName}' is succesvol aangemaakt met ${generatedMatches.length} wedstrijden`,
      });
      
      // Reset form
      setGeneratedMatches([]);
      setSelectedDates([]);
      setSelectedFormat(null);
      
    } catch (error: any) {
      console.error("Error creating competition:", error);
      toast({
        title: "Fout bij aanmaken competitie",
        description: error.message || "Er is een fout opgetreden bij het aanmaken van de competitie",
        variant: "destructive"
      });
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

  // Toggle a team in the selected teams
  const toggleTeam = (teamId: number) => {
    setSelectedTeams(prev => 
      prev.includes(teamId) 
        ? prev.filter(id => id !== teamId) 
        : [...prev, teamId]
    );
  };

  // Select all teams
  const selectAllTeams = () => {
    if (teams) {
      setSelectedTeams(teams.map(team => team.team_id));
    }
  };

  // Deselect all teams
  const deselectAllTeams = () => {
    setSelectedTeams([]);
  };

  return {
    availableDates,
    loadingDates,
    competitionFormats,
    loadingFormats,
    teams,
    loadingTeams,
    selectedDates,
    selectedFormat,
    selectedTeams,
    generatedMatches,
    competitionName,
    isCreating,
    setSelectedFormat,
    setCompetitionName,
    toggleDate,
    toggleTeam,
    selectAllTeams,
    deselectAllTeams,
    generateSchedule,
    saveCompetition
  };
};
