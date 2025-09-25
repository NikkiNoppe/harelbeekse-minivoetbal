import { supabase } from "@/integrations/supabase/client";

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
  // Get poll system status
  async isPollSystemEnabled(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('application_settings')
        .select('setting_value, is_active')
        .eq('setting_category', 'referee_polls')
        .eq('setting_name', 'system_enabled')
        .single();

      if (error || !data) return false;
      const settingValue = data.setting_value as any;
      return data.is_active && settingValue?.enabled === true;
    } catch (error) {
      console.error('Error checking poll system status:', error);
      return false;
    }
  },

  // Generate poll groups for a month via Edge Function
  async generateMonthlyPolls(month: string): Promise<{ success: boolean; groups_created?: number; message?: string }> {
    try {
      const { data, error } = await (supabase as any).functions.invoke('generate-monthly-polls', {
        body: { month }
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
        .select('setting_value, is_active')
        .eq('setting_category', 'referee_polls')
        .eq('setting_name', settingName)
        .single();

      if (error || !data) {
        return null;
      }

      const val = data.setting_value as any;
      return {
        month,
        start_date: val?.start_date ?? null,
        end_date: val?.end_date ?? null,
        enabled: data.is_active ?? false,
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
            },
            is_active: !!range.enabled,
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
            is_active: true
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
      const { data: referees, error: refError } = await supabase
        .from('users')
        .select('user_id, username, email')
        .eq('role', 'referee');

      if (refError || !referees) return [];

      const { data: availability, error: availError } = await supabase
        .from('referee_availability')
        .select('user_id, poll_group_id, is_available')
        .eq('poll_month', month);

      if (availError) return [];

      // Combine referee data with availability
      return referees.map(referee => {
        const refAvailability: Record<string, boolean> = {};
        
        availability?.forEach(avail => {
          if (avail.user_id === referee.user_id) {
            refAvailability[avail.poll_group_id] = avail.is_available;
          }
        });

        return {
          user_id: referee.user_id,
          username: referee.username,
          email: referee.email,
          availability: refAvailability
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
        .from('referee_availability')
        .upsert({
          user_id: userId,
          poll_group_id: pollGroupId,
          poll_month: month,
          is_available: isAvailable
        });

      return !error;
    } catch (error) {
      console.error('Error updating referee availability:', error);
      return false;
    }
  },

  // Assign referee to matches in a poll group
  async assignRefereeToGroup(pollGroupId: string, refereeId: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('matches')
        .update({ assigned_referee_id: refereeId })
        .eq('poll_group_id', pollGroupId);

      return !error;
    } catch (error) {
      console.error('Error assigning referee to group:', error);
      return false;
    }
  },

  // Assign referee to a single match
  async assignRefereeToMatch(matchId: number, refereeId: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('matches')
        .update({ assigned_referee_id: refereeId })
        .eq('match_id', matchId);
      return !error;
    } catch (error) {
      console.error('Error assigning referee to match:', error);
      return false;
    }
  },

  // Get latest announcements
  async getAnnouncements(limit: number = 5): Promise<{ message: string; created_at?: string; type?: string }[]> {
    try {
      const { data, error } = await supabase
        .from('application_settings')
        .select('setting_value, created_at')
        .eq('setting_category', 'admin_notifications')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error || !data) return [];
      return data.map((row: any) => ({
        message: row.setting_value?.message || '',
        created_at: row.created_at,
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
        .insert({
          setting_category: 'admin_notifications',
          setting_name: `notification_${Date.now()}`,
          setting_value: {
            message,
            target_roles: targetRoles,
            created_at: new Date().toISOString(),
            type: category
          },
          is_active: true
        });

      return !error;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }
};