
import { supabase } from "@/integrations/supabase/client";
import { CompetitionType, GeneratedMatch, AvailableDate } from "./types";
import { useToast } from "@/hooks/use-toast";
import { findFormatById } from "./competitionFormats";

export const saveCompetitionToDatabase = async (
  generatedMatches: GeneratedMatch[],
  competitionName: string,
  selectedDates: number[],
  availableDates: AvailableDate[] | undefined,
  selectedFormat: string | null,
  toast: ReturnType<typeof useToast>["toast"]
): Promise<boolean> => {
  if (generatedMatches.length === 0) {
    toast({
      title: "Geen wedstrijden om op te slaan",
      description: "Genereer eerst een competitieschema",
      variant: "destructive"
    });
    return false;
  }

  const format = findFormatById(selectedFormat);
  
  try {
    // Get the selected dates objects with venue information
    const { data: selectedDatesWithVenues } = await supabase
      .from('available_dates')
      .select(`
        *,
        venues (
          venue_id,
          name
        )
      `)
      .in('date_id', selectedDates)
      .order('available_date');
    
    const startDate = selectedDatesWithVenues?.length > 0 ? 
      selectedDatesWithVenues[0].available_date : 
      new Date().toISOString().split('T')[0];
    const endDate = selectedDatesWithVenues?.length > 0 ? 
      selectedDatesWithVenues[selectedDatesWithVenues.length - 1].available_date : 
      new Date().toISOString().split('T')[0];
    
    // 1. Create a new competition
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
    const uniqueDates = [...new Set(selectedDatesWithVenues?.map(d => d.available_date))];
    const matchdaysToCreate = uniqueDates.map((date, index) => ({
      competition_id: competitionId,
      name: `Speeldag ${index + 1}`,
      matchday_date: date,
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
    
    return true;
    
  } catch (error: any) {
    console.error("Error creating competition:", error);
    toast({
      title: "Fout bij aanmaken competitie",
      description: error.message || "Er is een fout opgetreden bij het aanmaken van de competitie",
      variant: "destructive"
    });
    return false;
  }
};
