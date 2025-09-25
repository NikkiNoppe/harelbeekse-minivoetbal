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
}

export interface RefereeAvailability {
  user_id: number;
  username: string;
  email?: string;
  availability: Record<string, boolean>; // poll_group_id -> available
}

export const pollService = {
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

  // Toggle poll system
  async togglePollSystem(enabled: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('application_settings')
        .upsert({
          setting_category: 'referee_polls',
          setting_name: 'system_enabled',
          setting_value: { enabled },
          is_active: true
        });

      return !error;
    } catch (error) {
      console.error('Error toggling poll system:', error);
      return false;
    }
  },

  // Get monthly poll data
  async getMonthlyPollData(month: string): Promise<PollGroup[]> {
    try {
      const { data: matches, error } = await supabase
        .from('matches')
        .select(`
          match_id,
          unique_number,
          match_date,
          location,
          poll_group_id,
          poll_month,
          assigned_referee_id,
          teams_home:teams!home_team_id(team_name),
          teams_away:teams!away_team_id(team_name),
          users:users!assigned_referee_id(username)
        `)
        .eq('poll_month', month)
        .not('poll_group_id', 'is', null)
        .order('match_date');

      if (error || !matches) return [];

      // Group matches by poll_group_id
      const groupMap = new Map<string, PollGroup>();

      matches.forEach((match: any) => {
        const groupId = match.poll_group_id;
        const timeSlot = new Date(match.match_date).toLocaleTimeString('nl-NL', {
          hour: '2-digit',
          minute: '2-digit'
        });

        if (!groupMap.has(groupId)) {
          groupMap.set(groupId, {
            poll_group_id: groupId,
            poll_month: month,
            location: match.location,
            time_slot: timeSlot,
            match_count: 0,
            matches: [],
            status: match.assigned_referee_id ? 'confirmed' : 'open'
          });
        }

        const group = groupMap.get(groupId)!;
        group.match_count++;
        group.matches.push({
          match_id: match.match_id,
          unique_number: match.unique_number || '',
          match_date: match.match_date,
          home_team_name: match.teams_home?.team_name || 'Onbekend',
          away_team_name: match.teams_away?.team_name || 'Onbekend',
          location: match.location,
          assigned_referee_id: match.assigned_referee_id,
          assigned_referee_name: match.users?.username
        });
      });

      return Array.from(groupMap.values());
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