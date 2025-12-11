import { supabase } from '@/integrations/supabase/client';

export interface NotificationData {
  id?: number;
  setting_category: string;
  setting_name: string;
  setting_value: {
    message: string;
    type: 'info' | 'warning' | 'success' | 'error';
    target_roles: string[];
    target_users?: number[];
    target_teams?: number[];
    player_manager_mode?: 'all' | 'specific_teams';
    player_manager_teams?: number[];
    start_date?: string;
    end_date?: string;
    duration?: number;
  };
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Notification {
  id: number;
  setting_category: string;
  setting_name: string;
  setting_value: {
    message: string;
    type: string;
    target_roles: string[];
    target_users?: number[];
    target_teams?: number[];
    player_manager_mode?: 'all' | 'specific_teams';
    player_manager_teams?: number[];
    start_date?: string;
    end_date?: string;
    duration?: number;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Transform raw data to Notification interface
const transformNotificationData = (data: any[]): Notification[] => {
  return data.map(item => {
    const settingValue = typeof item.setting_value === 'string' 
      ? JSON.parse(item.setting_value) 
      : item.setting_value;
      
    return {
      id: item.id,
      setting_category: item.setting_category,
      setting_name: item.setting_name,
      setting_value: {
        message: settingValue?.message || '',
        type: settingValue?.type || 'info',
        target_roles: settingValue?.target_roles || [],
        target_users: settingValue?.target_users || [],
        target_teams: settingValue?.target_teams || [],
        player_manager_mode: settingValue?.player_manager_mode || 'all',
        player_manager_teams: settingValue?.player_manager_teams || [],
        start_date: settingValue?.start_date,
        end_date: settingValue?.end_date,
        duration: settingValue?.duration || 8
      },
      is_active: item.is_active,
      created_at: item.created_at,
      updated_at: item.updated_at
    };
  });
};

export const notificationService = {
  // Get all notifications
  async getAllNotifications(): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('application_settings')
        .select('*')
        .in('setting_category', ['notifications', 'admin_notifications'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return transformNotificationData(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
      throw new Error('Kon notificaties niet laden');
    }
  },

  // Create new notification
  async createNotification(notificationData: Omit<NotificationData, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    try {
      const data = {
        ...notificationData,
        setting_name: `notification_${Date.now()}`,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('application_settings')
        .insert([data]);

      if (error) throw error;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new Error('Kon notificatie niet aanmaken');
    }
  },

  // Update existing notification
  async updateNotification(id: number, notificationData: Partial<NotificationData>): Promise<void> {
    try {
      const data = {
        ...notificationData,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('application_settings')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating notification:', error);
      throw new Error('Kon notificatie niet bijwerken');
    }
  },

  // Delete notification
  async deleteNotification(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('application_settings')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw new Error('Kon notificatie niet verwijderen');
    }
  },

  // Toggle notification active status
  async toggleNotificationStatus(id: number, isActive: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from('application_settings')
        .update({ 
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error toggling notification status:', error);
      throw new Error('Kon status niet wijzigen');
    }
  },

  // Get active notifications for popup display
  async getActiveNotifications(): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('application_settings')
        .select('*')
        .in('setting_category', ['notifications', 'admin_notifications'])
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return transformNotificationData(data || []);
    } catch (error) {
      console.error('Error loading active notifications:', error);
      throw new Error('Kon actieve notificaties niet laden');
    }
  },

  // Get all users for targeting (admin only)
  async getAllUsers(): Promise<Array<{ user_id: number; username: string; role: string }>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('user_id, username, role')
        .order('username');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading users:', error);
      return [];
    }
  },

  // Get all teams for targeting (admin only)
  async getAllTeams(): Promise<Array<{ team_id: number; team_name: string }>> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('team_id, team_name')
        .order('team_name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading teams:', error);
      return [];
    }
  }
};
