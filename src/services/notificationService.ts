import { supabase } from '@/integrations/supabase/client';
import { withUserContext } from '@/lib/supabaseUtils';

export interface NotificationData {
  id?: number;
  setting_category: string;
  setting_name: string;
  setting_value: {
    title?: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'error';
    target_roles: string[];
    target_users?: number[];
    start_date?: string;
    end_date?: string;
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
    title?: string;
    message: string;
    type: string;
    target_roles: string[];
    target_users?: number[];
    start_date?: string;
    end_date?: string;
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
        title: settingValue?.title || '',
        message: settingValue?.message || '',
        type: settingValue?.type || 'info',
        target_roles: settingValue?.target_roles || [],
        target_users: settingValue?.target_users || [],
        start_date: settingValue?.start_date,
        end_date: settingValue?.end_date,
      },
      is_active: item.is_active,
      created_at: item.created_at,
      updated_at: item.updated_at
    };
  });
};

export const notificationService = {
  // Get all notifications (admin messages)
  async getAllNotifications(): Promise<Notification[]> {
    try {
      const { data, error } = await withUserContext(async () => {
        return await supabase
          .from('application_settings')
          .select('*')
          .eq('setting_category', 'admin_messages')
          .order('created_at', { ascending: false });
      });

      if (error) throw error;
      return transformNotificationData(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
      throw new Error('Kon berichten niet laden');
    }
  },

  // Create new notification
  async createNotification(notificationData: Omit<NotificationData, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    try {
      const data = {
        ...notificationData,
        setting_name: `message_${Date.now()}`,
        updated_at: new Date().toISOString()
      };

      const { error } = await withUserContext(async () => {
        return await supabase
          .from('application_settings')
          .insert([data]);
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new Error('Kon bericht niet aanmaken');
    }
  },

  // Update existing notification
  async updateNotification(id: number, notificationData: Partial<NotificationData>): Promise<void> {
    try {
      const data = {
        ...notificationData,
        updated_at: new Date().toISOString()
      };

      const { error } = await withUserContext(async () => {
        return await supabase
          .from('application_settings')
          .update(data)
          .eq('id', id);
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating notification:', error);
      throw new Error('Kon bericht niet bijwerken');
    }
  },

  // Delete notification
  async deleteNotification(id: number): Promise<void> {
    try {
      const { error } = await withUserContext(async () => {
        return await supabase
          .from('application_settings')
          .delete()
          .eq('id', id);
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw new Error('Kon bericht niet verwijderen');
    }
  },

  // Toggle notification active status
  async toggleNotificationStatus(id: number, isActive: boolean): Promise<void> {
    try {
      const { error } = await withUserContext(async () => {
        return await supabase
          .from('application_settings')
          .update({ 
            is_active: isActive,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error toggling notification status:', error);
      throw new Error('Kon status niet wijzigen');
    }
  },

  // Get active notifications for display
  async getActiveNotifications(): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('application_settings')
        .select('*')
        .eq('setting_category', 'admin_messages')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return transformNotificationData(data || []);
    } catch (error) {
      console.error('Error loading active notifications:', error);
      throw new Error('Kon actieve berichten niet laden');
    }
  },

  // Get all users for targeting (admin only)
  async getAllUsers(): Promise<Array<{ user_id: number; username: string; role: string }>> {
    try {
      const { data, error } = await withUserContext(async () => {
        return await supabase
          .from('users')
          .select('user_id, username, role')
          .order('username');
      });

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
