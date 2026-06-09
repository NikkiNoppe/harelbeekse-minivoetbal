import { supabase } from "@/integrations/supabase/client";
import { getRpcSessionArgs } from "@/lib/authSession";
import {
  fetchMonthlyPollsForSession,
  fetchScheidsScheduleForMonth,
} from "@/services/scheidsrechter/scheidsSessionFetch";
import {
  addPollMatchDateForSession,
  createPollForSession,
  deletePollForSession,
  removePollMatchDateForSession,
  updatePollForSession,
} from "@/services/scheidsrechter/pollSessionManage";
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

      const existingPolls = await fetchMonthlyPollsForSession();
      if ((existingPolls as MonthlyPoll[]).some((p) => p.poll_month === input.poll_month)) {
        return { success: false, error: `Poll voor ${input.poll_month} bestaat al` };
      }

      const created = await createPollForSession(input, userId);
      if (!created.success || !created.pollId) {
        return { success: false, error: created.error || 'Kon poll niet aanmaken' };
      }

      const poll = (await fetchMonthlyPollsForSession()).find(
        (p) => (p as MonthlyPoll).id === created.pollId,
      ) as MonthlyPoll | undefined;

      return { success: true, poll };
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
      const polls = (await fetchMonthlyPollsForSession()) as MonthlyPoll[];
      const openPolls = polls
        .filter((p) => p.status === 'open')
        .sort((a, b) => b.poll_month.localeCompare(a.poll_month));
      return openPolls[0] ?? null;
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
      const polls = await fetchMonthlyPollsForSession();
      const poll = (polls as MonthlyPoll[]).find((p) => p.id === pollId);
      if (!poll) return null;
      return poll;
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
      const polls = await fetchMonthlyPollsForSession();
      const poll = (polls as MonthlyPoll[]).find((p) => p.poll_month === month);
      if (!poll) return null;
      return poll;
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
      const data = await fetchMonthlyPollsForSession();
      return (data as MonthlyPoll[]) ?? [];
    } catch (error) {
      console.error('Error fetching all polls:', error);
      return [];
    }
  },

  /**
   * Update poll status
   */
  async updatePollStatus(pollId: number, status: PollStatus): Promise<boolean> {
    try {
      return updatePollForSession(pollId, { status });
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
      const now = new Date().toISOString();
      const polls = (await fetchMonthlyPollsForSession()) as MonthlyPoll[];
      const expired = polls.filter(
        (p) => p.status === 'open' && p.deadline && p.deadline < now,
      );
      let closed = 0;
      for (const poll of expired) {
        if (await updatePollForSession(poll.id, { status: 'closed' })) {
          closed += 1;
        }
      }
      return closed;
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
      const { data, error } = await supabase.rpc('get_poll_dates_for_session', {
        ...getRpcSessionArgs(),
        p_poll_id: pollId,
      });
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
   * Haal de wedstrijden op die horen bij een poll (gegroepeerd per poll_group_id)
   * Geeft per group_id de lijst wedstrijden + thuis/uit teamnamen terug.
   */
  async getMatchesForPoll(pollMonth: string): Promise<Map<string, Array<{
    match_id: number;
    match_date: string;
    location: string | null;
    home_team_name: string;
    away_team_name: string;
  }>>> {
    try {
      const schedule = await fetchScheidsScheduleForMonth(pollMonth);
      const grouped = new Map<string, Array<any>>();
      schedule.forEach((m) => {
        const gid = m.poll_group_id;
        if (!gid) return;
        if (!grouped.has(gid)) grouped.set(gid, []);
        grouped.get(gid)!.push({
          match_id: m.match_id,
          match_date: m.match_date,
          location: m.location,
          home_team_name: m.home_team_name || 'Onbekend',
          away_team_name: m.away_team_name || 'Onbekend',
        });
      });

      // Sort each group by date
      grouped.forEach((arr) => arr.sort((a, b) => a.match_date.localeCompare(b.match_date)));
      return grouped;
    } catch (e) {
      console.error('Error in getMatchesForPoll:', e);
      return new Map();
    }
  },
  async addMatchDates(pollId: number, matchDates: PollMatchDateInput[]): Promise<boolean> {
    try {
      for (const md of matchDates) {
        const ok = await addPollMatchDateForSession(pollId, md);
        if (!ok) return false;
      }
      return true;
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
      return removePollMatchDateForSession(matchDateId);
    } catch (error) {
      console.error('Error in removeMatchDate:', error);
      return false;
    }
  },

  /**
   * Verwijder een poll volledig (incl. match dates en availability records)
   * Alleen toegestaan voor draft of closed polls.
   */
  async deletePoll(pollId: number): Promise<{ success: boolean; error?: string }> {
    try {
      return deletePollForSession(pollId);
    } catch (error) {
      console.error('Error in deletePoll:', error);
      return { success: false, error: 'Onverwachte fout bij verwijderen' };
    }
  },

  /**
   * Haal poll summary op (voor admin dashboard)
   */
  async getPollSummary(pollId: number): Promise<PollSummary | null> {
    try {
      const { fetchScheidsPollOverview } = await import('@/services/scheidsrechter/scheidsSessionFetch');
      const overview = await fetchScheidsPollOverview(pollId);
      if (!overview) return null;

      const poll: MonthlyPoll = {
        id: overview.poll_id,
        poll_month: overview.poll_month,
        deadline: overview.deadline,
        status: overview.status as PollStatus,
        created_by: overview.created_by,
        created_at: overview.created_at,
        updated_at: overview.updated_at,
        notes: overview.notes,
      };

      return {
        poll,
        match_dates_count: overview.match_dates_count,
        referees_responded: overview.referees_responded,
        referees_total: overview.referees_total,
        matches_assigned: overview.matches_assigned,
        matches_total: overview.matches_total,
      };
    } catch (error) {
      console.error('Error in getPollSummary:', error);
      return null;
    }
  }
};
