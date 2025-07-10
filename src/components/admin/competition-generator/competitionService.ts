import { supabase } from "@/integrations/supabase/client";
import { CompetitionType, GeneratedMatch, AvailableDate } from "./types";
import { useToast } from "@/hooks/use-toast";
import { findFormatById } from "./competitionFormats";
import { getCurrentDate } from "@/lib/dateUtils";
import { competitionDataService } from "@/services/competitionDataService";

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
    // Use hardcoded venue data
    const selectedDatesWithVenues = selectedDates.map(dateId => ({
      date_id: dateId,
      available_date: getCurrentDate(),
      venues: { name: "Sporthal De Horizon" }
    }));
    
    const startDate = selectedDatesWithVenues?.length > 0 ? 
      selectedDatesWithVenues[0].available_date : 
      getCurrentDate();
    const endDate = selectedDatesWithVenues?.length > 0 ? 
      selectedDatesWithVenues[selectedDatesWithVenues.length - 1].available_date : 
      getCurrentDate();
    
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

    // 2. Create matches directly with speeldag instead of using matchdays
    const uniqueDates = [...new Set(selectedDatesWithVenues?.map(d => d.available_date))];
    
    // 3. Create matches with speeldag column
    const matchesToCreate = generatedMatches.map((match, index) => {
      const matchdayIndex = Math.floor(index / 9) % uniqueDates.length; // Max 9 matches per matchday
      
      // Generate formatted match date with time
      const matchDate = new Date(uniqueDates[matchdayIndex]);
      const [hours, minutes] = (match.match_time || "18:30").split(":");
      matchDate.setHours(parseInt(hours), parseInt(minutes));
      
      return {
        home_team_id: match.home_team_id,
        away_team_id: match.away_team_id,
        match_date: matchDate.toISOString(),
        speeldag: `Speeldag ${matchdayIndex + 1}`, // Use speeldag directly instead of matchday_id
        unique_number: match.unique_code,
        referee_cost: 25.00,
        field_cost: 50.00,
        is_cup_match: format?.isCup || false,
        location: competitionDataService.getVenues()[0]?.name || 'Te bepalen'
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
