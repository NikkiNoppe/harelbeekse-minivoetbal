import { supabase } from "@/integrations/supabase/client";
import { getRpcSessionArgs } from "@/lib/authSession";
import {
  insertApplicationSettingForSession,
  listApplicationSettingsForSession,
  updateApplicationSettingForSession,
} from "@/services/core/applicationSettingsSessionFetch";
import {
  fetchRefereeAvailabilityForSession,
  upsertRefereeAvailabilityForSession,
} from "@/services/scheidsrechter/refereeMatchesSession";
import { fetchScheidsScheduleForMonth } from "@/services/scheidsrechter/scheidsSessionFetch";

export interface PollGroup {
  poll_group_id: string;
  poll_month: string;
  location: string;
  time_slot: string;
  match_count: number;
  matches: PollMatch[];
  status: 'open' | 'closed' | 'confirmed';
}

export interface PollMatch {
  match_id: number;
  unique_number: string;
  match_date: string;
  home_team_name: string;
  away_team_name: string;
  location: string;
  assigned_referee_id?: number | null;
  assigned_referee_name?: string;
  referee?: string;
  poll_group_id?: string | null;
}

export interface RefereeAvailability {
  user_id: number;
  username: string;
  email?: string;
  availability: Record<string, boolean>; // poll_group_id -> available
}

export interface ActiveRange {
  month: string;
  start_date: string | null; // YYYY-MM-DD
  end_date: string | null;   // YYYY-MM-DD
  enabled: boolean;
}

export const scheidsrechterService = {
  // Check if month needs auto-grouping
  async needsAutoGrouping(month: string): Promise<boolean> {
    try {
      const schedule = await fetchScheidsScheduleForMonth(month);
      return schedule.some((m) => !m.poll_group_id);
    } catch (error) {
      console.error('Error checking auto-grouping need:', error);
      return false;
    }
  },

  // Auto-invoke generate-monthly-polls if needed
  async autoGenerateIfNeeded(month: string): Promise<boolean> {
    try {
      const needsGrouping = await this.needsAutoGrouping(month);
      if (!needsGrouping) return true;

      console.log(`Auto-generating poll groups for ${month}...`);
      const result = await this.generateMonthlyPolls(month);
      return result.success;
    } catch (error) {
      console.error('Error in auto-generate:', error);
      return false;
    }
  },

  // Update legacy referee text field
  async updateLegacyReferee(matchId: number, refereeText: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('update_match_for_session', {
        ...getRpcSessionArgs(),
        p_match_id: matchId,
        p_update_data: { referee: refereeText },
      });
      if (error) throw error;
      if ((data as { success?: boolean })?.success === false) return false;
      return true;
    } catch (error) {
      console.error('Error updating legacy referee:', error);
      return false;
    }
  },

  // Get legacy matches (without poll_group_id)
  async getLegacyMatches(month: string): Promise<PollMatch[]> {
    try {
      const schedule = await fetchScheidsScheduleForMonth(month);
      return schedule
        .filter((m) => !m.poll_group_id)
        .map((match) => ({
          match_id: match.match_id,
          unique_number: '',
          match_date: match.match_date,
          home_team_name: match.home_team_name || 'Onbekend',
          away_team_name: match.away_team_name || 'Onbekend',
          location: match.location || '',
          assigned_referee_id: match.assigned_referee_id,
          referee: match.referee,
        }));
    } catch (error) {
      console.error('Error fetching legacy matches:', error);
      return [];
    }
  },

  // Get poll system status
  async isPollSystemEnabled(): Promise<boolean> {
    try {
      const rows = await listApplicationSettingsForSession('referee_polls');
      const row = rows.find((r) => r.setting_name === 'system_enabled');
      if (!row) return false;
      const settingValue = row.setting_value as { enabled?: boolean };
      return settingValue?.enabled === true;
    } catch (error) {
      console.error('Error checking poll system status:', error);
      return false;
    }
  },

  // Generate poll groups for a month via Edge Function
  async generateMonthlyPolls(month: string): Promise<{ success: boolean; groups_created?: number; message?: string }> {
    try {
      const { getEdgeFunctionHeaders } = await import('@/lib/authSession');
      const { data, error } = await (supabase as any).functions.invoke('generate-monthly-polls', {
        body: { month },
        headers: getEdgeFunctionHeaders(),
      });
      if (error) {
        console.error('Error invoking generate-monthly-polls:', error);
        return { success: false };
      }
      return data ?? { success: true };
    } catch (error) {
      console.error('Error generating monthly polls:', error);
      return { success: false };
    }
  },

  // Active range get/set for a month
  async getActiveRange(month: string): Promise<ActiveRange | null> {
    try {
      const settingName = `active_range_${month}`;
      const rows = await listApplicationSettingsForSession('referee_polls');
      const row = rows.find((r) => r.setting_name === settingName);
      if (!row) return null;

      const val = row.setting_value as { start_date?: string; end_date?: string; enabled?: boolean };
      return {
        month,
        start_date: val?.start_date ?? null,
        end_date: val?.end_date ?? null,
        enabled: val?.enabled ?? false,
      };
    } catch (error) {
      console.error('Error fetching active range:', error);
      return null;
    }
  },

  async setActiveRange(month: string, range: ActiveRange): Promise<boolean> {
    try {
      const settingName = `active_range_${month}`;
      const rows = await listApplicationSettingsForSession('referee_polls');
      const existing = rows.find((r) => r.setting_name === settingName);
      const settingValue = {
        start_date: range.start_date,
        end_date: range.end_date,
        enabled: !!range.enabled,
      };
      if (existing) {
        await updateApplicationSettingForSession(existing.id, {
          setting_value: settingValue,
          setting_category: 'referee_polls',
        });
      } else {
        await insertApplicationSettingForSession({
          setting_category: 'referee_polls',
          setting_name: settingName,
          setting_value: settingValue,
        });
      }
      return true;
    } catch (error) {
      console.error('Error saving active range:', error);
      return false;
    }
  },

  // Toggle poll system
  async togglePollSystem(enabled: boolean): Promise<boolean> {
    try {
      const rows = await listApplicationSettingsForSession('referee_polls');
      const existing = rows.find((r) => r.setting_name === 'system_enabled');
      if (existing) {
        await updateApplicationSettingForSession(existing.id, {
          setting_value: { enabled },
          setting_category: 'referee_polls',
        });
      } else {
        await insertApplicationSettingForSession({
          setting_category: 'referee_polls',
          setting_name: 'system_enabled',
          setting_value: { enabled },
        });
      }
      return true;
    } catch (error) {
      console.error('Error toggling poll system:', error);
      return false;
    }
  },

  // Get monthly poll data
  async getMonthlyPollData(month: string): Promise<PollGroup[]> {
    try {
      const scheduleRows = await fetchScheidsScheduleForMonth(month);
      const matches = scheduleRows.map((m) => ({
        match_id: m.match_id,
        unique_number: '',
        match_date: m.match_date,
        location: m.location,
        assigned_referee_id: m.assigned_referee_id,
        referee: m.referee,
        home_team_id: m.home_team_id,
        away_team_id: m.away_team_id,
        teams_home: { team_name: m.home_team_name },
        teams_away: { team_name: m.away_team_name },
      }));

      if (!matches.length) return [];

      // Build clusters per day and location, grouping consecutive times
      type FlatMatch = {
        match_id: number;
        match_date: string;
        location: string;
        unique_number?: string;
        assigned_referee_id?: number | null;
        referee?: string | null;
        home_team_id?: number | null;
        away_team_id?: number | null;
        teams_home?: { team_name?: string } | null;
        teams_away?: { team_name?: string } | null;
        users?: { username?: string } | null;
      };

      // Group by date (YYYY-MM-DD) and location
      const byDateLoc = new Map<string, FlatMatch[]>();
      for (const m of matches as FlatMatch[]) {
        const day = new Date(m.match_date).toISOString().slice(0, 10);
        const loc = m.location || 'Onbekend';
        const key = `${day}__${loc}`;
        if (!byDateLoc.has(key)) byDateLoc.set(key, []);
        byDateLoc.get(key)!.push(m);
      }

      const groups: PollGroup[] = [];

      const toHHMM = (dateTime: string): string => {
        const sep = dateTime.includes('T') ? 'T' : ' ';
        const t = dateTime.split(sep)[1] || '';
        // t could be HH:MM:SS or HH:MM:SS+.. -> take first 5 chars
        return t.slice(0, 5);
      };
      const addMinutesHHMM = (hhmm: string, minutesToAdd: number): string => {
        const [hStr, mStr] = hhmm.split(':');
        let total = parseInt(hStr || '0', 10) * 60 + parseInt(mStr || '0', 10) + minutesToAdd;
        total = ((total % (24 * 60)) + (24 * 60)) % (24 * 60); // wrap around safely
        const h = Math.floor(total / 60);
        const m = total % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      };

      for (const [key, list] of byDateLoc.entries()) {
        // sort by time asc
        list.sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime());
        let cluster: FlatMatch[] = [];
        const pushCluster = () => {
          if (cluster.length === 0) return;
          const first = cluster[0];
          const last = cluster[cluster.length - 1];
          const startHHMM = toHHMM(first.match_date);
          const endHHMM = addMinutesHHMM(toHHMM(last.match_date), 60);
          const timeSlot = `${startHHMM}–${endHHMM}`;
          const groupId = `${key}__${startHHMM}`;
          const location = first.location || 'Onbekend';
          const group: PollGroup = {
            poll_group_id: groupId,
            poll_month: month,
            location,
            time_slot: timeSlot,
            match_count: cluster.length,
            matches: cluster.map(cm => ({
              match_id: cm.match_id,
              unique_number: cm.unique_number || '',
              match_date: cm.match_date,
              home_team_name: teamIdToName.get((cm as any).home_team_id) || 'Onbekend',
              away_team_name: teamIdToName.get((cm as any).away_team_id) || 'Onbekend',
              location,
              assigned_referee_id: cm.assigned_referee_id ?? undefined,
              assigned_referee_name: cm.referee || undefined,
              referee: cm.referee,
            })),
            status: cluster.every(c => c.assigned_referee_id) ? 'confirmed' : 'open',
          };
          groups.push(group);
        };

        for (let i = 0; i < list.length; i++) {
          const cur = list[i];
          if (cluster.length === 0) {
            cluster.push(cur);
            continue;
          }
          const prev = cluster[cluster.length - 1];
          const gapMin = (new Date(cur.match_date).getTime() - new Date(prev.match_date).getTime()) / 60000;
          // same location by construction; start new cluster if gap > 75 min
          if (gapMin > 75) {
            pushCluster();
            cluster = [cur];
          } else {
            cluster.push(cur);
          }
        }
        pushCluster();
      }

      // sort groups by first match date
      groups.sort((a, b) => new Date(a.matches[0]?.match_date || 0).getTime() - new Date(b.matches[0]?.match_date || 0).getTime());
      return groups;
    } catch (error) {
      console.error('Error fetching monthly poll data:', error);
      return [];
    }
  },

  // Get referee availability for a month
  async getRefereeAvailability(month: string): Promise<RefereeAvailability[]> {
    try {
      const { fetchRefereesForSession, fetchRefereeAvailabilityForSession } = await import(
        '@/services/scheidsrechter/scheidsSessionFetch'
      );
      const [referees, availability] = await Promise.all([
        fetchRefereesForSession(),
        fetchRefereeAvailabilityForSession(month),
      ]);

      return referees.map((referee) => {
        const refAvailability: Record<string, boolean> = {};
        availability.forEach((avail) => {
          if (avail.user_id === referee.user_id && avail.poll_group_id) {
            refAvailability[avail.poll_group_id] = avail.is_available;
          }
        });

        return {
          user_id: referee.user_id,
          username: referee.username,
          email: undefined,
          availability: refAvailability,
        };
      });
    } catch (error) {
      console.error('Error fetching referee availability:', error);
      return [];
    }
  },

  // Update referee availability
  async updateRefereeAvailability(
    userId: number,
    pollGroupId: string,
    month: string,
    isAvailable: boolean
  ): Promise<boolean> {
    try {
      return upsertRefereeAvailabilityForSession({
        refereeId: userId,
        pollGroupId,
        pollMonth: month,
        isAvailable,
      });
    } catch (error) {
      console.error('Error updating referee availability:', error);
      return false;
    }
  },

  // Get all matches for a specific month (no grouping)
  async getMonthMatches(month: string): Promise<PollMatch[]> {
    try {
      const { fetchScheidsScheduleForMonth } = await import(
        '@/services/scheidsrechter/scheidsSessionFetch'
      );
      const rows = await fetchScheidsScheduleForMonth(month);
      return rows.map((match) => ({
        match_id: match.match_id,
        unique_number: '',
        match_date: match.match_date,
        home_team_name: match.home_team_name || 'Onbekend',
        away_team_name: match.away_team_name || 'Onbekend',
        location: match.location || '',
        referee: null,
        assigned_referee_id: match.assigned_referee_id,
        poll_group_id: null,
      }));
    } catch (error) {
      console.error('Error fetching month matches:', error);
      return [];
    }
  },

  // Get match-level availability for a referee
  async getRefereeMatchAvailability(userId: number, matchIds: number[]): Promise<Map<number, boolean>> {
    const rows = await fetchRefereeAvailabilityForSession({
      refereeId: userId,
      matchIds,
    });

    const availabilityMap = new Map<number, boolean>();
    rows.forEach((item) => {
      if (item.match_id != null && item.is_available != null) {
        availabilityMap.set(item.match_id, item.is_available);
      }
    });

    return availabilityMap;
  },

  // Update match-level availability
  async updateMatchAvailability(userId: number, matchId: number, isAvailable: boolean, month: string): Promise<void> {
    const ok = await upsertRefereeAvailabilityForSession({
      refereeId: userId,
      matchId,
      pollMonth: month,
      isAvailable,
    });
    if (!ok) throw new Error('Beschikbaarheid niet opgeslagen');
  },

  // Assign referee to a specific match
  async assignRefereeToMatch(matchId: number, refereeId: number | null): Promise<boolean> {
    try {
      const { assignmentService } = await import('@/services/scheidsrechter/assignmentService');
      if (!refereeId) return false;
      const result = await assignmentService.assignReferee({
        match_id: matchId,
        referee_id: refereeId,
      });
      return result.success;
    } catch (error) {
      console.error('Error assigning referee to match:', error);
      return false;
    }
  },


  // Get latest announcements
  async getAnnouncements(limit: number = 5): Promise<{ message: string; type?: string }[]> {
    try {
      const rows = await listApplicationSettingsForSession('admin_notifications');
      return rows.slice(0, limit).map((row) => ({
        message: (row.setting_value as { message?: string })?.message || '',
        type: (row.setting_value as { type?: string })?.type,
      }));
    } catch (error) {
      console.error('Error fetching announcements:', error);
      return [];
    }
  },

  // Send notification
  async sendNotification(
    category: string,
    message: string,
    targetRoles: string[] = ['referee', 'admin']
  ): Promise<boolean> {
    try {
      await insertApplicationSettingForSession({
        setting_category: 'admin_notifications',
        setting_name: `notification_${Date.now()}`,
        setting_value: {
          message,
          target_roles: targetRoles,
          type: category,
        },
      });
      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }
};