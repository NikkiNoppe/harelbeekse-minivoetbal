import { supabase } from "@/integrations/supabase/client";
import { withUserContext } from "@/lib/supabaseUtils";
import type { 
  AvailabilityInput,
  RefereeWithAvailability 
} from "./types";

/**
 * Service voor scheidsrechter beschikbaarheid
 * Werkt op de samengevoegde tabel `referee_matches`.
 */
const TABLE = 'referee_matches' as any;

export const refereeAvailabilityService = {
  async submitAvailability(
    refereeId: number,
    pollMonth: string,
    availabilities: AvailabilityInput[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      return await withUserContext(async () => {
        // Per item: bepaal conflict-key en gebruik passende upsert
        for (const avail of availabilities) {
          const matchId = avail.match_id || null;
          const pollGroupId = avail.poll_group_id || `${pollMonth}_${matchId || 'general'}`;
          const row: any = {
            referee_id: refereeId,
            match_id: matchId,
            poll_group_id: pollGroupId,
            poll_month: pollMonth,
            is_available: avail.is_available,
            availability_notes: avail.notes || null,
          };

          const { error } = await supabase
            .from(TABLE)
            .upsert(row, {
              onConflict: matchId ? 'referee_id,match_id' : 'referee_id,poll_group_id,poll_month',
            } as any);

          if (error) {
            console.error('Error submitting availability:', error);
            return { success: false, error: 'Kon beschikbaarheid niet opslaan' };
          }
        }
        return { success: true };
      });
    } catch (error) {
      console.error('Error in submitAvailability:', error);
      return { success: false, error: 'Onverwachte fout' };
    }
  },

  async getAvailabilityForPoll(pollMonth: string): Promise<RefereeWithAvailability[]> {
    try {
      const { data: referees, error: refError } = await supabase
        .from('users')
        .select('user_id, username, email')
        .eq('role', 'referee');

      if (refError || !referees) return [];

      const { data: availability, error: availError } = await supabase
        .from(TABLE)
        .select('referee_id, match_id, poll_group_id, is_available')
        .eq('poll_month', pollMonth)
        .not('is_available', 'is', null);

      if (availError) {
        console.error('Error fetching availability:', availError);
      }

      return referees.map(referee => {
        const refAvailability = ((availability as any[]) || [])
          .filter(a => a.referee_id === referee.user_id)
          .map(a => ({
            match_id: a.match_id || undefined,
            poll_group_id: a.poll_group_id,
            is_available: a.is_available,
,
          }));

        return {
          user_id: referee.user_id,
          username: referee.username,
          email: referee.email || undefined,
          availability: refAvailability,
        };
      });
    } catch (error) {
      console.error('Error in getAvailabilityForPoll:', error);
      return [];
    }
  },

  async getRefereeAvailability(
    refereeId: number, 
    pollMonth: string
  ): Promise<AvailabilityInput[]> {
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select('match_id, poll_group_id, is_available')
        .eq('referee_id', refereeId)
        .eq('poll_month', pollMonth)
        .not('is_available', 'is', null);

      if (error) {
        console.error('Error fetching referee availability:', error);
        return [];
      }

      return ((data as any[]) || []).map(a => ({
        match_id: a.match_id || undefined,
        poll_group_id: a.poll_group_id,
        is_available: a.is_available,
,
      }));
    } catch (error) {
      console.error('Error in getRefereeAvailability:', error);
      return [];
    }
  },

  async updateAvailability(
    refereeId: number,
    matchId: number | null,
    pollGroupId: string,
    pollMonth: string,
    isAvailable: boolean,
    notes?: string
  ): Promise<boolean> {
    try {
      return await withUserContext(async () => {
        const { error } = await supabase
          .from(TABLE)
          .upsert({
            referee_id: refereeId,
            match_id: matchId,
            poll_group_id: pollGroupId,
            poll_month: pollMonth,
            is_available: isAvailable,
            availability_notes: notes || null,
          } as any, {
            onConflict: matchId ? 'referee_id,match_id' : 'referee_id,poll_group_id,poll_month',
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

  async getAvailabilityForMatches(
    refereeId: number,
    matchIds: number[]
  ): Promise<Map<number, boolean>> {
    try {
      if (matchIds.length === 0) return new Map();

      const { data, error } = await supabase
        .from(TABLE)
        .select('match_id, is_available')
        .eq('referee_id', refereeId)
        .in('match_id', matchIds)
        .not('is_available', 'is', null);

      if (error) {
        console.error('Error fetching match availability:', error);
        return new Map();
      }

      const availabilityMap = new Map<number, boolean>();
      ((data as any[]) || []).forEach(item => {
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
   * Wis alle beschikbaarheid voor een scheidsrechter in een maand.
   * Behoudt rij als er een toewijzing aan hangt; wist enkel de availability-velden.
   */
  async clearAvailability(refereeId: number, pollMonth: string): Promise<boolean> {
    try {
      return await withUserContext(async () => {
        // Wis availability-velden
        const { error: updateErr } = await supabase
          .from(TABLE)
          .update({ is_available: null} as any)
          .eq('referee_id', refereeId)
          .eq('poll_month', pollMonth);

        if (updateErr) {
          console.error('Error clearing availability:', updateErr);
          return false;
        }

        // Verwijder rijen die nu helemaal leeg zijn (geen status, geen availability)
        await supabase
          .from(TABLE)
          .delete()
          .eq('referee_id', refereeId)
          .eq('poll_month', pollMonth)
          .is('is_available', null)
          .is('status', null);

        return true;
      });
    } catch (error) {
      console.error('Error in clearAvailability:', error);
      return false;
    }
  },

  async getAvailabilityStats(pollMonth: string): Promise<{
    total_referees: number;
    responded_count: number;
    available_by_date: Record<string, number>;
  }> {
    try {
      const { count: totalReferees } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'referee');

      const { data: availability } = await supabase
        .from(TABLE)
        .select('referee_id, poll_group_id, is_available')
        .eq('poll_month', pollMonth)
        .not('is_available', 'is', null);

      const uniqueRespondents = new Set(
        ((availability as any[]) || []).map(a => a.referee_id)
      );

      const availableByDate: Record<string, number> = {};
      ((availability as any[]) || []).forEach(a => {
        if (a.is_available && a.poll_group_id) {
          availableByDate[a.poll_group_id] = (availableByDate[a.poll_group_id] || 0) + 1;
        }
      });

      return {
        total_referees: totalReferees || 0,
        responded_count: uniqueRespondents.size,
        available_by_date: availableByDate,
      };
    } catch (error) {
      console.error('Error in getAvailabilityStats:', error);
      return {
        total_referees: 0,
        responded_count: 0,
        available_by_date: {},
      };
    }
  },
};
