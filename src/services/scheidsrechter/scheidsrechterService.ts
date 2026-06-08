import { supabase } from "@/integrations/supabase/client";
import { applicationSettingInsert } from "@/services/applicationSettingsUtils";

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
      const { data, error } = await supabase
        .from('matches')
        .select('match_id')
        .eq('poll_month', month)
        .is('poll_group_id', null)
        .limit(1);

      if (error) throw error;
      return (data && data.length > 0) || false;
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
      const { error } = await supabase
        .from('matches')
        .update({ referee: refereeText })
        .eq('match_id', matchId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating legacy referee:', error);
      return false;
    }
  },

  // Get legacy matches (without poll_group_id)
  async getLegacyMatches(month: string): Promise<PollMatch[]> {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          match_id,
          unique_number,
          match_date,
          location,
          home_team_id,
          away_team_id,
          referee,
          assigned_referee_id
        `)
        .eq('poll_month', month)
        .is('poll_group_id', null)
        .order('match_date', { ascending: true });

      if (error) throw error;

      return (data || []).map((match: any) => ({
        match_id: match.match_id,
        unique_number: match.unique_number || '',
        match_date: match.match_date,
        home_team_name: `Team ${match.home_team_id}`,
        away_team_name: `Team ${match.away_team_id}`,
        location: match.location || '',
        assigned_referee_id: match.assigned_referee_id,
        referee: match.referee
      }));
    } catch (error) {
      console.error('Error fetching legacy matches:', error);
      return [];
    }
  },

  // Get poll system status
  async isPollSystemEnabled(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('application_settings')
        .select('setting_value')
        .eq('setting_category', 'referee_polls')
        .eq('setting_name', 'system_enabled')
        .single();

      if (error || !data) return false;
      const settingValue = data.setting_value as { enabled?: boolean };
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
      const { data, error } = await supabase
        .from('application_settings')
        .select('setting_value')
        .eq('setting_category', 'referee_polls')
        .eq('setting_name', settingName)
        .single();

      if (error || !data) {
        return null;
      }

      const val = data.setting_value as { start_date?: string; end_date?: string; enabled?: boolean };
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
      const { error } = await supabase
        .from('application_settings')
        .upsert(
          {
            setting_category: 'referee_polls',
            setting_name: settingName,
            setting_value: {
              start_date: range.start_date,
              end_date: range.end_date,
              enabled: !!range.enabled,
            },
          },
          { onConflict: 'setting_category,setting_name' }
        );
      return !error;
    } catch (error) {
      console.error('Error saving active range:', error);
      return false;
    }
  },

  // Toggle poll system
  async togglePollSystem(enabled: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('application_settings')
        .upsert(
          {
            setting_category: 'referee_polls',
            setting_name: 'system_enabled',
            setting_value: { enabled },
          },
          {
            onConflict: 'setting_category,setting_name'
          }
        );

      return !error;
    } catch (error) {
      console.error('Error toggling poll system:', error);
      return false;
    }
  },

  // Get monthly poll data
  async getMonthlyPollData(month: string): Promise<PollGroup[]> {
    try {
      // Determine date range for the month using string boundaries to match DB filtering
      const [year, mon] = month.split('-').map(Number);
      const nextYear = mon === 12 ? year + 1 : year;
      const nextMonth = mon === 12 ? 1 : mon + 1;
      const startStr = `${year.toString().padStart(4, '0')}-${mon.toString().padStart(2, '0')}-01`;
      const nextStr = `${nextYear.toString().padStart(4, '0')}-${nextMonth.toString().padStart(2, '0')}-01`;

      const { data: matches, error } = await supabase
        .from('matches')
        .select(`
          match_id,
          unique_number,
          match_date,
          location,
          assigned_referee_id,
          referee,
          home_team_id,
          away_team_id
        `)
        .gte('match_date', startStr)
        .lt('match_date', nextStr)
        .order('match_date');

      if (error || !matches) return [];

      // Build teamId -> team_name map (limited to used ids)
      const usedTeamIds = Array.from(new Set((matches as any[]).flatMap(m => [m.home_team_id, m.away_team_id]).filter(Boolean)));
      const teamIdToName = new Map<number, string>();
      if (usedTeamIds.length > 0) {
        try {
          const { data: teamsData } = await supabase
            .from('teams')
            .select('team_id, team_name')
            .in('team_id', usedTeamIds as number[]);
          (teamsData || []).forEach((t: any) => teamIdToName.set(t.team_id, t.team_name));
        } catch (_) {
          // ignore, fallback to 'Onbekend'
        }
      }

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
      const { error } = await supabase
        .from('referee_matches' as any)
        .upsert({
          referee_id: userId,
          poll_group_id: pollGroupId,
          poll_month: month,
          is_available: isAvailable,
        } as any, {
          onConflict: 'referee_id,poll_group_id,poll_month',
        } as any);

      return !error;
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
    const { data, error } = await supabase
      .from('referee_matches' as any)
      .select('match_id, is_available')
      .eq('referee_id', userId)
      .in('match_id', matchIds)
      .not('match_id', 'is', null)
      .not('is_available', 'is', null);
    
    if (error) {
      console.error('Error fetching referee match availability:', error);
      return new Map();
    }
    
    const availabilityMap = new Map<number, boolean>();
    ((data as any[]) || []).forEach((item: any) => {
      if (item.match_id) {
        availabilityMap.set(item.match_id, item.is_available);
      }
    });
    
    return availabilityMap;
  },

  // Update match-level availability
  async updateMatchAvailability(userId: number, matchId: number, isAvailable: boolean, month: string): Promise<void> {
    const { error } = await supabase
      .from('referee_matches' as any)
      .upsert({
        referee_id: userId,
        match_id: matchId,
        is_available: isAvailable,
        poll_month: month,
        poll_group_id: null,
      } as any, {
        onConflict: 'referee_id,match_id',
      } as any);
    
    if (error) throw error;
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
      const { data, error } = await supabase
        .from('application_settings')
        .select('setting_value')
        .eq('setting_category', 'admin_notifications')
        .order('id', { ascending: false })
        .limit(limit);
      if (error || !data) return [];
      return data.map((row: any) => ({
        message: row.setting_value?.message || '',
        type: row.setting_value?.type,
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
      const { error } = await supabase
        .from('application_settings')
        .insert(applicationSettingInsert({
          setting_category: 'admin_notifications',
          setting_name: `notification_${Date.now()}`,
          setting_value: {
            message,
            target_roles: targetRoles,
            type: category,
          },
        }));

      return !error;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }
};