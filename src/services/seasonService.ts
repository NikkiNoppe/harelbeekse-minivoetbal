import seasonConfig from '@/config/season2025-2026.json';
import { supabase } from '@/integrations/supabase/client';

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
  // Read season data from database with fallback to JSON file
  async getSeasonData(): Promise<SeasonData> {
    try {
      console.log('🔄 Loading season data...');
      
      // Try to fetch from database first
      const { data, error } = await supabase
        .from('application_settings')
        .select('setting_value')
        .eq('setting_category', 'season_data')
        .eq('setting_name', 'main_config')
        .eq('is_active', true)
        .single();

      if (error) {
        console.warn('⚠️ Could not fetch season data from database:', error);
        console.log('📁 Falling back to JSON file');
        return seasonConfig;
      }

      if (data?.setting_value) {
        console.log('✅ Season data loaded from database:', data.setting_value);
        // Store in localStorage for caching
        localStorage.setItem('seasonData', JSON.stringify(data.setting_value));
        return data.setting_value as unknown as SeasonData;
      }

      console.log('📁 No database data found, using JSON file');
      // Fallback to JSON file
      return seasonConfig;
    } catch (error) {
      console.error('❌ Error in getSeasonData:', error);
      console.log('📁 Falling back to JSON file');
      return seasonConfig;
    }
  },

  // Clear cached season data
  clearSeasonDataCache(): void {
    localStorage.removeItem('seasonData');
    console.log('🗑️ Season data cache cleared');
  },

  // Save season data to database and localStorage
  async saveSeasonData(data: SeasonData): Promise<{ success: boolean; message: string }> {
    try {
      console.log('💾 Saving season data:', data);
      
      // Store in localStorage for immediate persistence
      localStorage.setItem('seasonData', JSON.stringify(data));
      
      // Update the imported config object (this will persist for the current session)
      Object.assign(seasonConfig, data);
      
      // Save to database in application_settings table
      const { error: upsertError } = await supabase
        .from('application_settings')
        .upsert({
          setting_category: 'season_data',
          setting_name: 'main_config',
          setting_value: data as any,
          is_active: true
        }, {
          onConflict: 'setting_category,setting_name'
        });
      
      if (upsertError) {
        console.warn('⚠️ Could not save to database:', upsertError);
        return {
          success: true,
          message: "Seizoensdata opgeslagen (lokaal, database niet beschikbaar)"
        };
      }
      
      console.log('✅ Season data saved to database successfully');
      return {
        success: true,
        message: "Seizoensdata succesvol opgeslagen (lokaal en database)"
      };
    } catch (error) {
      console.error('❌ Error saving season data:', error);
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