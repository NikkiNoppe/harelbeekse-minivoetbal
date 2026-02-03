import { supabase } from "@/integrations/supabase/client";
import { withUserContext } from "@/lib/supabaseUtils";
import type { 
  RefereeAvailabilityRecord, 
  AvailabilityInput,
  RefereeWithAvailability 
} from "./types";

/**
 * Service voor scheidsrechter beschikbaarheid
 */
export const refereeAvailabilityService = {
  /**
   * Dien beschikbaarheid in voor meerdere wedstrijden/poll groups
   */
  async submitAvailability(
    refereeId: number,
    pollMonth: string,
    availabilities: AvailabilityInput[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Valideer dat poll open is
      const { data: poll } = await supabase
        .from('monthly_polls' as any)
        .select('status')
        .eq('poll_month', pollMonth)
        .single();

      const pollData = poll as any;
      if (pollData && pollData.status !== 'open') {
        return { success: false, error: 'Poll is niet meer open voor indiening' };
      }

      return await withUserContext(async () => {
        // Bereid data voor voor upsert
        const dataToUpsert = availabilities.map(avail => ({
          user_id: refereeId,
          poll_month: pollMonth,
          match_id: avail.match_id || null,
          poll_group_id: avail.poll_group_id || `${pollMonth}_${avail.match_id || 'general'}`,
          is_available: avail.is_available,
          notes: avail.notes || null
        }));

        const { error } = await supabase
          .from('referee_availability')
          .upsert(dataToUpsert as any, {
            onConflict: 'user_id,poll_group_id,poll_month'
          } as any);

        if (error) {
          console.error('Error submitting availability:', error);
          return { success: false, error: 'Kon beschikbaarheid niet opslaan' };
        }

        return { success: true };
      });
    } catch (error) {
      console.error('Error in submitAvailability:', error);
      return { success: false, error: 'Onverwachte fout' };
    }
  },

  /**
   * Haal alle beschikbaarheid op voor een poll maand
   */
  async getAvailabilityForPoll(pollMonth: string): Promise<RefereeWithAvailability[]> {
    try {
      // Haal alle referees op
      const { data: referees, error: refError } = await supabase
        .from('users')
        .select('user_id, username, email')
        .eq('role', 'referee');

      if (refError || !referees) return [];

      // Haal beschikbaarheid op voor deze maand
      const { data: availability, error: availError } = await supabase
        .from('referee_availability')
        .select('*')
        .eq('poll_month', pollMonth);

      if (availError) {
        console.error('Error fetching availability:', availError);
      }

      // Combineer data
      return referees.map(referee => {
        const refAvailability = (availability || [])
          .filter(a => a.user_id === referee.user_id)
          .map(a => ({
            match_id: a.match_id || undefined,
            poll_group_id: a.poll_group_id,
            is_available: a.is_available,
            notes: (a as any).notes || undefined
          }));

        return {
          user_id: referee.user_id,
          username: referee.username,
          email: referee.email || undefined,
          availability: refAvailability
        };
      });
    } catch (error) {
      console.error('Error in getAvailabilityForPoll:', error);
      return [];
    }
  },

  /**
   * Haal beschikbaarheid op voor een specifieke scheidsrechter
   */
  async getRefereeAvailability(
    refereeId: number, 
    pollMonth: string
  ): Promise<AvailabilityInput[]> {
    try {
      const { data, error } = await supabase
        .from('referee_availability')
        .select('match_id, poll_group_id, is_available, notes')
        .eq('user_id', refereeId)
        .eq('poll_month', pollMonth);

      if (error) {
        console.error('Error fetching referee availability:', error);
        return [];
      }

      return (data || []).map(a => ({
        match_id: a.match_id || undefined,
        poll_group_id: a.poll_group_id,
        is_available: a.is_available,
        notes: (a as any).notes || undefined
      }));
    } catch (error) {
      console.error('Error in getRefereeAvailability:', error);
      return [];
    }
  },

  /**
   * Update beschikbaarheid voor een specifiek record
   */
  async updateAvailability(
    refereeId: number,
    matchId: number | null,
    pollGroupId: string,
    pollMonth: string,
    isAvailable: boolean,
    notes?: string
  ): Promise<boolean> {
    try {
      // Check of poll nog open is
      const { data: poll } = await supabase
        .from('monthly_polls' as any)
        .select('status')
        .eq('poll_month', pollMonth)
        .single();

      const pollData = poll as any;
      if (pollData && pollData.status !== 'open') {
        console.error('Poll is not open for updates');
        return false;
      }

      return await withUserContext(async () => {
        const { error } = await supabase
          .from('referee_availability')
          .upsert({
            user_id: refereeId,
            match_id: matchId,
            poll_group_id: pollGroupId,
            poll_month: pollMonth,
            is_available: isAvailable,
            notes: notes || null
          } as any);

        if (error) {
          console.error('Error updating availability:', error);
          return false;
        }
        return true;
      });
    } catch (error) {
      console.error('Error in updateAvailability:', error);
      return false;
    }
  },

  /**
   * Haal beschikbaarheid op voor specifieke wedstrijden (bulk)
   */
  async getAvailabilityForMatches(
    refereeId: number,
    matchIds: number[]
  ): Promise<Map<number, boolean>> {
    try {
      if (matchIds.length === 0) return new Map();

      const { data, error } = await supabase
        .from('referee_availability')
        .select('match_id, is_available')
        .eq('user_id', refereeId)
        .in('match_id', matchIds);

      if (error) {
        console.error('Error fetching match availability:', error);
        return new Map();
      }

      const availabilityMap = new Map<number, boolean>();
      (data || []).forEach(item => {
        if (item.match_id) {
          availabilityMap.set(item.match_id, item.is_available);
        }
      });

      return availabilityMap;
    } catch (error) {
      console.error('Error in getAvailabilityForMatches:', error);
      return new Map();
    }
  },

  /**
   * Verwijder alle beschikbaarheid voor een scheidsrechter in een maand
   */
  async clearAvailability(refereeId: number, pollMonth: string): Promise<boolean> {
    try {
      return await withUserContext(async () => {
        const { error } = await supabase
          .from('referee_availability')
          .delete()
          .eq('user_id', refereeId)
          .eq('poll_month', pollMonth);

        if (error) {
          console.error('Error clearing availability:', error);
          return false;
        }
        return true;
      });
    } catch (error) {
      console.error('Error in clearAvailability:', error);
      return false;
    }
  },

  /**
   * Haal statistieken op voor beschikbaarheid
   */
  async getAvailabilityStats(pollMonth: string): Promise<{
    total_referees: number;
    responded_count: number;
    available_by_date: Record<string, number>;
  }> {
    try {
      // Tel totaal aantal referees
      const { count: totalReferees } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'referee');

      // Haal alle beschikbaarheid op
      const { data: availability } = await supabase
        .from('referee_availability')
        .select('user_id, poll_group_id, is_available')
        .eq('poll_month', pollMonth);

      // Tel unieke respondenten
      const uniqueRespondents = new Set(
        (availability || []).map(a => a.user_id)
      );

      // Tel beschikbaarheid per poll_group (datum/locatie)
      const availableByDate: Record<string, number> = {};
      (availability || []).forEach(a => {
        if (a.is_available && a.poll_group_id) {
          availableByDate[a.poll_group_id] = (availableByDate[a.poll_group_id] || 0) + 1;
        }
      });

      return {
        total_referees: totalReferees || 0,
        responded_count: uniqueRespondents.size,
        available_by_date: availableByDate
      };
    } catch (error) {
      console.error('Error in getAvailabilityStats:', error);
      return {
        total_referees: 0,
        responded_count: 0,
        available_by_date: {}
      };
    }
  }
};
