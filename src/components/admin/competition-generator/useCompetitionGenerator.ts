
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Team, AvailableDate, CompetitionFormat, GeneratedMatch, CompetitionType } from "./types";
import { generateRoundRobinSchedule } from "./scheduleGenerator";
import { generateCupSchedule, generatePlayoffSchedule } from "./advancedScheduleGenerator";

export const useCompetitionGenerator = () => {
  const { toast } = useToast();
  const [selectedDates, setSelectedDates] = useState<number[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [generatedMatches, setGeneratedMatches] = useState<GeneratedMatch[]>([]);
  const [competitionName, setCompetitionName] = useState("Competitie 2025-2026");
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState("format");
  const [minimumDatesRequired, setMinimumDatesRequired] = useState(0);
  
  const predefinedFormats: CompetitionType[] = [
    {
      id: "regular-single",
      name: "Reguliere competitie (enkele ronde)",
      description: "Elke ploeg speelt één keer tegen elke andere ploeg",
      hasPlayoffs: false,
      regularRounds: 1,
    },
    {
      id: "regular-double",
      name: "Reguliere competitie (dubbele ronde)",
      description: "Elke ploeg speelt twee keer tegen elke andere ploeg (thuis en uit)",
      hasPlayoffs: false,
      regularRounds: 2,
    },
    {
      id: "playoff-top6-bottom6",
      name: "Competitie met Play-offs (Top 6 / Bottom 6)",
      description: "Reguliere competitie gevolgd door playoff tussen top 6 teams en degradatie playoff voor bottom 6 teams",
      hasPlayoffs: true,
      regularRounds: 1,
      playoffTeams: 6
    },
    {
      id: "playoff-top4",
      name: "Competitie met Play-offs (Top 4)",
      description: "Reguliere competitie gevolgd door playoff tussen top 4 teams",
      hasPlayoffs: true,
      regularRounds: 1,
      playoffTeams: 4
    },
    {
      id: "cup",
      name: "Beker competitie (knockout)",
      description: "Knock-out toernooi waarin elke ploeg één wedstrijd speelt en de winnaar doorgaat",
      hasPlayoffs: false,
      regularRounds: 0,
      isCup: true
    }
  ];

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
  const generateSchedule = () => {
    if (!teams || teams.length < 2) {
      toast({
        title: "Niet genoeg teams beschikbaar",
        description: "Er zijn niet genoeg teams om een schema te genereren",
        variant: "destructive"
      });
      return;
    }

    const format = competitionFormats?.find(f => f.id === selectedFormat);
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
    } else if (format.hasPlayoffs) {
      matches = generateRoundRobinSchedule(teams, format);
      // We don't generate the playoff matches yet, they will be created after the regular season
    } else {
      matches = generateRoundRobinSchedule(teams, format);
    }

    // Assign unique codes, locations and times
    const selectedDatesObjects = availableDates?.filter(d => selectedDates.includes(d.date_id)) || [];
    
    matches = matches.map((match, index) => {
      // Create unique code: matchday number (2 digits) + match number in that day (2 digits)
      const matchday = String(match.matchday).padStart(2, '0');
      const matchNumber = String((index % 9) + 1).padStart(2, '0');
      
      const dateIndex = Math.floor(index / 9) % selectedDatesObjects.length;
      const dateObj = selectedDatesObjects[dateIndex];
      
      // Alternate between venues and time slots
      const venues = ["Harelbeke - Dageraad", "Bavikhove - Vlasschaard"];
      const timeSlots = ["18:30", "19:30", "20:30"];
      
      const venueIndex = index % venues.length;
      const timeIndex = index % timeSlots.length;
      
      return {
        ...match,
        unique_code: `${matchday}${matchNumber}`,
        location: venues[venueIndex],
        match_time: timeSlots[timeIndex],
        match_date: dateObj ? dateObj.available_date : ''
      };
    });
    
    setGeneratedMatches(matches);
    
    // Calculate required matchdays
    const requiredMatchdays = Math.ceil(matches.length / 9); // Max 9 matches per matchday
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
      const requiredMatchdays = Math.ceil(generatedMatches.length / 9);
      setMinimumDatesRequired(requiredMatchdays);
    }
  }, [generatedMatches]);

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
      // Get the selected format
      const format = competitionFormats?.find(f => f.id === selectedFormat);
      
      // 1. Create a new competition
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

      // 2. Create matchdays for each selected date
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
      
      // 3. Assign matches to matchdays
      const matchDays = matchdayData || [];
      const matchesToCreate = generatedMatches.map((match, index) => {
        const matchdayIndex = Math.floor(index / 9) % matchDays.length; // Max 9 matches per matchday
        
        // Generate formatted match date with time
        const matchDate = new Date(matchDays[matchdayIndex].matchday_date);
        const [hours, minutes] = (match.match_time || "18:30").split(":");
        matchDate.setHours(parseInt(hours), parseInt(minutes));
        
        return {
          home_team_id: match.home_team_id,
          away_team_id: match.away_team_id,
          match_date: matchDate.toISOString(),
          matchday_id: matchDays[matchdayIndex].matchday_id,
          unique_number: match.unique_code,
          referee_cost: 25.00,
          field_cost: 50.00,
          is_cup_match: format?.isCup || false,
        };
      });
      
      const { error: matchesError } = await supabase
        .from('matches')
        .insert(matchesToCreate);
        
      if (matchesError) throw matchesError;

      toast({
        title: "Competitie aangemaakt",
        description: `De ${format?.isCup ? 'beker' : 'competitie'} '${competitionName}' is succesvol aangemaakt met ${generatedMatches.length} wedstrijden`,
      });
      
      // Reset form
      setGeneratedMatches([]);
      setSelectedDates([]);
      setSelectedFormat(null);
      setActiveTab("format");
      
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
