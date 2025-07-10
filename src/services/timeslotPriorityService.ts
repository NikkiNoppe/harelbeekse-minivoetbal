import { supabase } from "@/integrations/supabase/client";

export interface PrioritizedTimeslot {
  timeslot_id: number;
  venue_id: number;
  venue_name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  priority: number;
}

export const timeslotPriorityService = {
  /**
   * Get prioritized timeslots from application_settings database
   * Returns timeslots sorted by priority (best first)
   */
  async getPrioritizedTimeslots(): Promise<PrioritizedTimeslot[]> {
    try {
      // Fetch all timeslots and venues from application_settings
      const { data: seasonData } = await supabase
        .from('application_settings')
        .select('setting_value')
        .eq('setting_category', 'season_data')
        .eq('setting_name', 'main_config')
        .eq('is_active', true)
        .single();

      if (!seasonData?.setting_value) {
        console.warn('⚠️ No season data found in application_settings');
        return [];
      }

      const settingValue = seasonData.setting_value as any;
      const venues = settingValue.venues || [];
      const timeslots = settingValue.venue_timeslots || [];

      console.log('🏟️ Available venues:', venues);
      console.log('⏰ Available timeslots:', timeslots);

      // Create complete timeslot objects with venue info
      const allTimeslots = timeslots.map((slot: any) => {
        const venue = venues.find((v: any) => v.venue_id === slot.venue_id);
        return {
          ...slot,
          venue_name: venue?.name || 'Unknown Venue'
        };
      });

      // Custom prioritization using actual available timeslots
      // Priority: 1. Venue preference (Dageraad > Vlasschaard), 2. Day preference (Monday > Tuesday), 3. Time preference (later > earlier)
      
      const sortedTimeslots = allTimeslots.sort((a: any, b: any) => {
        // First priority: Venue preference (Dageraad has higher priority)
        const aIsDageraad = a.venue_name.includes('Dageraad');
        const bIsDageraad = b.venue_name.includes('Dageraad');
        
        if (aIsDageraad && !bIsDageraad) return -1; // a comes first (higher priority)
        if (!aIsDageraad && bIsDageraad) return 1;  // b comes first (higher priority)
        
        // Second priority: Day preference (Monday = 1 > Tuesday = 2)
        if (a.day_of_week !== b.day_of_week) {
          return a.day_of_week - b.day_of_week; // Lower number = higher priority
        }
        
        // Third priority: Time preference (later times are better for important matches)
        // Convert time to minutes for comparison
        const timeToMinutes = (time: string) => {
          const [hours, minutes] = time.split(':').map(Number);
          return hours * 60 + minutes;
        };
        
        const aMinutes = timeToMinutes(a.start_time);
        const bMinutes = timeToMinutes(b.start_time);
        
        return bMinutes - aMinutes; // Later times come first (higher priority)
      });

      // Add priority index to each timeslot
      const prioritizedTimeslots = sortedTimeslots.map((slot: any, index: number) => ({
        ...slot,
        priority: index + 1
      }));

      console.log('🎯 Prioritized timeslots loaded:', prioritizedTimeslots.length);

      return prioritizedTimeslots;

    } catch (error) {
      console.error('Error fetching prioritized timeslots:', error);
      return [];
    }
  },

  /**
   * Get optimal timeslots for a given number of matches
   * For <= 7 matches: use only the best timeslots
   * For > 7 matches: use all available timeslots
   */
  async getOptimalTimeslots(totalMatches: number): Promise<PrioritizedTimeslot[]> {
    const allTimeslots = await this.getPrioritizedTimeslots();
    
    if (totalMatches <= 7) {
      // Use only the top timeslots (best slots first)
      return allTimeslots.slice(0, Math.min(totalMatches, 7));
    } else {
      // Use all available slots
      return allTimeslots;
    }
  },

  /**
   * Get match details (time, venue) for a specific match index and date
   */
  async getMatchDetails(matchIndex: number, totalMatchesThisDay: number, dateStr?: string): Promise<{
    time: string;
    venue: string;
    timeslot: PrioritizedTimeslot | null;
  }> {
    let optimalSlots = await this.getOptimalTimeslots(totalMatchesThisDay);
    
    // If date is provided, filter by day of week
    if (dateStr) {
      const date = new Date(dateStr);
      const dayOfWeek = date.getDay();
      // Convert JavaScript day (0=Sunday, 1=Monday) to database day (1=Monday, 2=Tuesday)
      const targetDay = dayOfWeek === 0 ? 7 : dayOfWeek;
      
      console.log(`📅 Date: ${dateStr}, JavaScript day: ${dayOfWeek}, Target day: ${targetDay}`);
      
      // Filter slots for this specific day
      optimalSlots = optimalSlots.filter(slot => slot.day_of_week === targetDay);
      
      console.log(`📅 Found ${optimalSlots.length} timeslots for ${dateStr} (day ${targetDay})`);
      console.log('Available slots for this day:', optimalSlots);
    }
    
    if (optimalSlots.length === 0) {
      console.warn('⚠️ No timeslots found for this day, using fallback');
      return {
        time: '19:00',
        venue: 'Venue TBD',
        timeslot: null
      };
    }

    const selectedSlot = optimalSlots[matchIndex % optimalSlots.length];
    
    console.log(`🎯 Selected slot for match ${matchIndex}:`, selectedSlot);
    
    return {
      time: selectedSlot.start_time,
      venue: selectedSlot.venue_name,
      timeslot: selectedSlot
    };
  },

  /**
   * Format match date with prioritized time
   */
  async formatMatchDateTime(date: string, matchIndex: number, totalMatchesThisDay: number): Promise<string> {
    const { time } = await this.getMatchDetails(matchIndex, totalMatchesThisDay, date);
    return `${date}T${time}:00+02:00`;
  }
}; 