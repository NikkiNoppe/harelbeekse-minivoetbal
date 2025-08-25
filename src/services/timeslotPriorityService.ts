import { supabase } from "@/integrations/supabase/client";
import { localDateTimeToISO } from "@/lib/dateUtils";

export interface PrioritizedTimeslot {
  timeslot_id: number;
  venue_id: number;
  venue_name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  priority: number;
}

export interface PriorityOrderItem {
  priority: number;
  venue_id: number;
  day_of_week: number;
  start_time: string;
  description: string;
}

export const timeslotPriorityService = {
  /**
   * Get prioritized timeslots from season_data with priority information
   */
  async getPrioritizedTimeslots(): Promise<PrioritizedTimeslot[]> {
    try {
      const { data } = await supabase
        .from('application_settings')
        .select('setting_value')
        .eq('setting_category', 'season_data')
        .eq('setting_name', 'main_config')
        .eq('is_active', true)
        .single();

      if (!data?.setting_value) return [];

      const settingValue = data.setting_value as any;
      const venues = settingValue.venues || [];
      const venue_timeslots = settingValue.venue_timeslots || [];
      
      // Create timeslots with venue info and sort by priority
      const timeslots = venue_timeslots
        .map((slot: any) => {
          const venue = venues.find((v: any) => v.venue_id === slot.venue_id);
          return { 
            ...slot, 
            venue_name: slot.venue_name || venue?.name || 'Unknown',
            priority: slot.priority || 999 // Default to low priority if not set
          };
        })
        .sort((a: any, b: any) => a.priority - b.priority);

      return timeslots;
    } catch (error) {
      console.error('Error fetching timeslots:', error);
      return [];
    }
  },

  /**
   * Get priority order from season_data
   */
  async getPriorityOrder(): Promise<PriorityOrderItem[]> {
    try {
      const { data } = await supabase
        .from('application_settings')
        .select('setting_value')
        .eq('setting_category', 'season_data')
        .eq('setting_name', 'main_config')
        .eq('is_active', true)
        .single();

      if (!data?.setting_value) return [];

      const settingValue = data.setting_value as any;
      return settingValue.priority_order || [];
    } catch (error) {
      console.error('Error fetching priority order:', error);
      return [];
    }
  },

  /**
   * Get match details for a specific match index and date
   */
  async getMatchDetails(matchIndex: number, totalMatches: number, dateStr?: string): Promise<{
    time: string;
    venue: string;
    timeslot: PrioritizedTimeslot | null;
  }> {
    const allTimeslots = await this.getPrioritizedTimeslots();
    let availableSlots = allTimeslots.slice(0, Math.min(totalMatches, 7));
    
    // Filter by day if date provided
    if (dateStr) {
      const date = new Date(dateStr);
      const targetDay = date.getDay() === 0 ? 7 : date.getDay();
      availableSlots = availableSlots.filter(slot => slot.day_of_week === targetDay);
    }
    
    if (availableSlots.length === 0) {
      return { time: '19:00', venue: 'Venue TBD', timeslot: null };
    }

    const selectedSlot = availableSlots[matchIndex % availableSlots.length];
    
    return {
      time: selectedSlot.start_time,
      venue: selectedSlot.venue_name,
      timeslot: selectedSlot
    };
  },

  /**
   * Format match date with time
   */
  async formatMatchDateTime(date: string, matchIndex: number, totalMatches: number): Promise<string> {
    const { time } = await this.getMatchDetails(matchIndex, totalMatches, date);
    return localDateTimeToISO(date, time);
  },

  /**
   * Show priority order for debugging
   */
  async showPriorityOrder(): Promise<void> {
    const priorityOrder = await this.getPriorityOrder();
    console.log('🎯 Prioriteitsvolgorde:');
    priorityOrder.forEach((slot) => {
      const dayName = slot.day_of_week === 1 ? 'Maandag' : 'Dinsdag';
      console.log(`${slot.priority}. ${slot.description} (${dayName} ${slot.start_time})`);
    });
  },

  /**
   * Get fast priority order for quick loading
   */
  async getFastPriorityOrder(): Promise<PriorityOrderItem[]> {
    try {
      // Try to get from localStorage first for speed
      const cached = localStorage.getItem('priorityOrder');
      if (cached) {
        return JSON.parse(cached);
      }

      // Fallback to database
      const priorityOrder = await this.getPriorityOrder();
      localStorage.setItem('priorityOrder', JSON.stringify(priorityOrder));
      return priorityOrder;
    } catch (error) {
      console.error('Error getting fast priority order:', error);
      return [];
    }
  }
}; 