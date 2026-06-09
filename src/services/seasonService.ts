import {
  insertApplicationSettingForSession,
  listApplicationSettingsForSession,
  updateApplicationSettingForSession,
} from '@/services/core/applicationSettingsSessionFetch';
import {
  fetchPublicApplicationSettings,
  findPublicSetting,
} from '@/services/public/publicApplicationSettingsFetch';

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
      const rows = await fetchPublicApplicationSettings(['season_data']);
      const row = findPublicSetting(rows, 'season_data', 'main_config');

      if (!row?.setting_value) {
        throw new Error('Kon seizoensdata niet laden uit de database.');
      }

      console.log('✅ Season data loaded from database:', row.setting_value);
      localStorage.setItem('seasonData', JSON.stringify(row.setting_value));
      return row.setting_value as unknown as SeasonData;
    } catch (error) {
      console.error('❌ Error in getSeasonData:', error);
      throw error;
    }
  },

  // Get available days for team preferences
  async getAvailableDays(): Promise<string[]> {
    const seasonData = await this.getSeasonData();
    return seasonData.day_names || [];
  },

  // Get available timeslots for team preferences
  async getAvailableTimeslots(): Promise<Array<{ id: string; label: string }>> {
    const seasonData = await this.getSeasonData();
    const timeslots = seasonData.venue_timeslots || [];
    // Map naar string en id
    const slotObjects = timeslots.map((ts: any) => {
      const label = ts.start_time && ts.end_time
        ? `${ts.start_time} - ${ts.end_time}`
        : ts.timeslot_id || ts.start_time || 'Onbekend';
      const id = ts.timeslot_id ? String(ts.timeslot_id) : label;
      return { id, label };
    });
    // Uniek maken op basis van id
    const uniqueMap = new Map();
    slotObjects.forEach(obj => {
      if (!uniqueMap.has(obj.id)) {
        uniqueMap.set(obj.id, obj);
      }
    });
    return Array.from(uniqueMap.values());
  },

  // Get available venues for team preferences
  async getAvailableVenues(): Promise<Array<{venue_id: number; name: string; address: string}>> {
    const seasonData = await this.getSeasonData();
    const venues = seasonData.venues || [];
    
    // Ensure venues have the correct structure
    return venues.map((venue: any) => ({
      venue_id: venue.venue_id || venue.id || 0,
      name: venue.name || venue.venue_name || 'Onbekende locatie',
      address: venue.address || venue.venue_address || ''
    }));
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

      const rows = await listApplicationSettingsForSession('season_data');
      const existing = rows.find((row) => row.setting_name === 'main_config');

      if (existing?.id) {
        await updateApplicationSettingForSession(existing.id, {
          setting_value: data,
          setting_category: 'season_data',
        });
      } else {
        await insertApplicationSettingForSession({
          setting_category: 'season_data',
          setting_name: 'main_config',
          setting_value: data,
        });
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