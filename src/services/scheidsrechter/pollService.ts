import { supabase } from "@/integrations/supabase/client";
import { withUserContext } from "@/lib/supabaseUtils";
import type { 
  MonthlyPoll, 
  CreatePollInput, 
  PollMatchDate, 
  PollMatchDateInput,
  PollStatus,
  PollSummary 
} from "./types";

/**
 * Service voor maandelijkse poll beheer
 */
export const pollService = {
  /**
   * Maak een nieuwe poll aan voor een specifieke maand
   */
  async createPoll(input: CreatePollInput): Promise<{ success: boolean; poll?: MonthlyPoll; error?: string }> {
    try {
      const userId = parseInt(localStorage.getItem('userId') || '0');
      if (!userId) {
        return { success: false, error: 'Niet ingelogd' };
      }

      return await withUserContext(async () => {
        // Check of poll voor deze maand al bestaat
        const { data: existing } = await supabase
          .from('monthly_polls' as any)
          .select('id')
          .eq('poll_month', input.poll_month)
          .single();

        if (existing) {
          return { success: false, error: `Poll voor ${input.poll_month} bestaat al` };
        }

        // Maak de poll aan
        const { data: poll, error: pollError } = await supabase
          .from('monthly_polls' as any)
          .insert({
            poll_month: input.poll_month,
            deadline: input.deadline || null,
            status: 'draft' as PollStatus,
            created_by: userId,
            notes: input.notes || null
          })
          .select()
          .single();

        if (pollError) {
          console.error('Error creating poll:', pollError);
          return { success: false, error: 'Kon poll niet aanmaken' };
        }

        // Voeg match dates toe als die zijn meegegeven
        if (input.match_dates && input.match_dates.length > 0 && poll) {
          const pollData = poll as any;
          const matchDatesWithPollId = input.match_dates.map(md => ({
            poll_id: pollData.id,
            match_date: md.match_date,
            location: md.location || null,
            time_slot: md.time_slot || null,
            match_count: md.match_count || 2
          }));

          await supabase
            .from('poll_match_dates' as any)
            .insert(matchDatesWithPollId);
        }

        return { success: true, poll: poll as unknown as MonthlyPoll };
      });
    } catch (error) {
      console.error('Error in createPoll:', error);
      return { success: false, error: 'Onverwachte fout bij aanmaken poll' };
    }
  },

  /**
   * Haal de actieve (open) poll op
   */
  async getActivePoll(): Promise<MonthlyPoll | null> {
    try {
      const { data, error } = await supabase
        .from('monthly_polls' as any)
        .select('*')
        .eq('status', 'open')
        .order('poll_month', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return null;
      return data as unknown as MonthlyPoll;
    } catch (error) {
      console.error('Error fetching active poll:', error);
      return null;
    }
  },

  /**
   * Haal poll op via ID
   */
  async getPollById(pollId: number): Promise<MonthlyPoll | null> {
    try {
      const { data, error } = await supabase
        .from('monthly_polls' as any)
        .select('*')
        .eq('id', pollId)
        .single();

      if (error || !data) return null;
      return data as unknown as MonthlyPoll;
    } catch (error) {
      console.error('Error fetching poll by ID:', error);
      return null;
    }
  },

  /**
   * Haal poll op voor een specifieke maand
   */
  async getPollForMonth(month: string): Promise<MonthlyPoll | null> {
    try {
      const { data, error } = await supabase
        .from('monthly_polls' as any)
        .select('*')
        .eq('poll_month', month)
        .single();

      if (error || !data) return null;
      return data as unknown as MonthlyPoll;
    } catch (error) {
      console.error('Error fetching poll for month:', error);
      return null;
    }
  },

  /**
   * Haal alle polls op (voor admin overzicht)
   */
  async getAllPolls(): Promise<MonthlyPoll[]> {
    try {
      return await withUserContext(async () => {
        const { data, error } = await supabase
          .from('monthly_polls' as any)
          .select('*')
          .order('poll_month', { ascending: false });

        if (error) {
          console.error('Error fetching all polls:', error);
          return [];
        }
        return (data || []) as unknown as MonthlyPoll[];
      });
    } catch (error) {
      console.error('Error in getAllPolls:', error);
      return [];
    }
  },

  /**
   * Update poll status
   */
  async updatePollStatus(pollId: number, status: PollStatus): Promise<boolean> {
    try {
      return await withUserContext(async () => {
        const { error } = await supabase
          .from('monthly_polls' as any)
          .update({ status })
          .eq('id', pollId);

        if (error) {
          console.error('Error updating poll status:', error);
          return false;
        }
        return true;
      });
    } catch (error) {
      console.error('Error in updatePollStatus:', error);
      return false;
    }
  },

  /**
   * Open een poll (status -> 'open')
   */
  async openPoll(pollId: number): Promise<boolean> {
    return this.updatePollStatus(pollId, 'open');
  },

  /**
   * Sluit een poll (status -> 'closed')
   */
  async closePoll(pollId: number): Promise<boolean> {
    return this.updatePollStatus(pollId, 'closed');
  },

  /**
   * Check en sluit automatisch verlopen polls
   */
  async autoCloseExpiredPolls(): Promise<number> {
    try {
      return await withUserContext(async () => {
        const now = new Date().toISOString();
        
        const { data: expiredPolls, error } = await supabase
          .from('monthly_polls' as any)
          .update({ status: 'closed' as PollStatus })
          .eq('status', 'open')
          .lt('deadline', now)
          .select('id');

        if (error) {
          console.error('Error auto-closing polls:', error);
          return 0;
        }
        return (expiredPolls as any[])?.length || 0;
      });
    } catch (error) {
      console.error('Error in autoCloseExpiredPolls:', error);
      return 0;
    }
  },

  /**
   * Haal match dates op voor een poll
   */
  async getPollMatchDates(pollId: number): Promise<PollMatchDate[]> {
    try {
      const { data, error } = await supabase
        .from('poll_match_dates' as any)
        .select('*')
        .eq('poll_id', pollId)
        .order('match_date', { ascending: true });

      if (error) {
        console.error('Error fetching poll match dates:', error);
        return [];
      }
      return (data || []) as unknown as PollMatchDate[];
    } catch (error) {
      console.error('Error in getPollMatchDates:', error);
      return [];
    }
  },

  /**
   * Voeg match dates toe aan een poll
   */
  async addMatchDates(pollId: number, matchDates: PollMatchDateInput[]): Promise<boolean> {
    try {
      return await withUserContext(async () => {
        const dataToInsert = matchDates.map(md => ({
          poll_id: pollId,
          match_date: md.match_date,
          location: md.location || null,
          time_slot: md.time_slot || null,
          match_count: md.match_count || 2
        }));

        const { error } = await supabase
          .from('poll_match_dates' as any)
          .insert(dataToInsert);

        if (error) {
          console.error('Error adding match dates:', error);
          return false;
        }
        return true;
      });
    } catch (error) {
      console.error('Error in addMatchDates:', error);
      return false;
    }
  },

  /**
   * Verwijder match date van een poll
   */
  async removeMatchDate(matchDateId: number): Promise<boolean> {
    try {
      return await withUserContext(async () => {
        const { error } = await supabase
          .from('poll_match_dates' as any)
          .delete()
          .eq('id', matchDateId);

        if (error) {
          console.error('Error removing match date:', error);
          return false;
        }
        return true;
      });
    } catch (error) {
      console.error('Error in removeMatchDate:', error);
      return false;
    }
  },

  /**
   * Haal poll summary op (voor admin dashboard)
   */
  async getPollSummary(pollId: number): Promise<PollSummary | null> {
    try {
      return await withUserContext(async () => {
        // Haal poll op
        const poll = await this.getPollById(pollId);
        if (!poll) return null;

        // Tel match dates
        const { count: matchDatesCount } = await supabase
          .from('poll_match_dates' as any)
          .select('*', { count: 'exact', head: true })
          .eq('poll_id', pollId);

        // Tel referees die gereageerd hebben
        const { data: respondedReferees } = await supabase
          .from('referee_availability')
          .select('user_id')
          .eq('poll_month', poll.poll_month);
        const uniqueResponded = new Set(respondedReferees?.map(r => r.user_id) || []);

        // Tel totaal aantal referees
        const { count: totalReferees } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'referee');

        // Tel toegewezen wedstrijden voor deze maand
        const { count: assignedMatches } = await supabase
          .from('referee_assignments' as any)
          .select('*', { count: 'exact', head: true })
          .not('status', 'in', '("declined","cancelled")');

        // Tel totaal wedstrijden deze maand
        const [year, month] = poll.poll_month.split('-').map(Number);
        const nextMonth = month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, '0')}`;
        
        const { count: totalMatches } = await supabase
          .from('matches')
          .select('*', { count: 'exact', head: true })
          .gte('match_date', `${poll.poll_month}-01`)
          .lt('match_date', `${nextMonth}-01`);

        return {
          poll,
          match_dates_count: matchDatesCount || 0,
          referees_responded: uniqueResponded.size,
          referees_total: totalReferees || 0,
          matches_assigned: assignedMatches || 0,
          matches_total: totalMatches || 0
        };
      });
    } catch (error) {
      console.error('Error in getPollSummary:', error);
      return null;
    }
  }
};
