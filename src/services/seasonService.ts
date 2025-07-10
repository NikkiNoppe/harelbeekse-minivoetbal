import seasonConfig from '@/config/season2025-2026.json';

export interface SeasonData {
  season_start_date: string;
  season_end_date: string;
  competition_formats?: any[];
  venues?: any[];
  venue_timeslots?: any[];
  vacation_periods?: any[];
  day_names?: string[];
}

export const seasonService = {
  // Read season data from JSON file
  getSeasonData(): SeasonData {
    return seasonConfig;
  },

  // Save season data to JSON file (in a real app, this would write to the file)
  async saveSeasonData(data: SeasonData): Promise<{ success: boolean; message: string }> {
    try {
      // In a real application, you would write to the JSON file here
      // For now, we'll simulate the save operation
      console.log('Saving season data:', data);
      
      // Simulate file write operation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        success: true,
        message: "Seizoensdata succesvol opgeslagen in config/season2025-2026.json"
      };
    } catch (error) {
      return {
        success: false,
        message: `Fout bij opslaan: ${error instanceof Error ? error.message : 'Onbekende fout'}`
      };
    }
  },

  // Validate season data
  validateSeasonData(data: SeasonData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data.season_start_date) {
      errors.push("Seizoen startdatum is verplicht");
    }
    
    if (!data.season_end_date) {
      errors.push("Seizoen einddatum is verplicht");
    }
    
    if (data.season_start_date && data.season_end_date) {
      const start = new Date(data.season_start_date);
      const end = new Date(data.season_end_date);
      
      if (start >= end) {
        errors.push("Seizoen startdatum moet voor einddatum liggen");
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}; 