import { supabase } from '@/integrations/supabase/client';
import { getRpcSessionArgs } from '@/lib/authSession';
import { withUserContext } from '@/lib/supabaseUtils';
import {
  deleteApplicationSettingForSession,
  insertApplicationSettingForSession,
  listApplicationSettingsForSession,
  updateApplicationSettingForSession,
} from '@/services/core/applicationSettingsSessionFetch';

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
}

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
    };
  });
};

export const notificationService = {
  async getAllNotifications(): Promise<Notification[]> {
    try {
      const data = await listApplicationSettingsForSession('admin_messages');
      const sorted = [...data].sort((a, b) => b.id - a.id);
      return transformNotificationData(sorted);
    } catch (error) {
      console.error('Error loading notifications:', error);
      throw new Error('Kon berichten niet laden');
    }
  },

  async createNotification(notificationData: Omit<NotificationData, 'id'>): Promise<void> {
    try {
      await insertApplicationSettingForSession({
        setting_category: notificationData.setting_category,
        setting_name: `message_${Date.now()}`,
        setting_value: notificationData.setting_value,
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new Error('Kon bericht niet aanmaken');
    }
  },

  async updateNotification(id: number, notificationData: Partial<NotificationData>): Promise<void> {
    try {
      const { setting_value } = notificationData;
      if (setting_value === undefined) return;

      await updateApplicationSettingForSession(id, {
        setting_value,
        setting_category: 'admin_messages',
      });
    } catch (error) {
      console.error('Error updating notification:', error);
      throw new Error('Kon bericht niet bijwerken');
    }
  },

  async deleteNotification(id: number): Promise<void> {
    try {
      await deleteApplicationSettingForSession(id, 'admin_messages');
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw new Error('Kon bericht niet verwijderen');
    }
  },

  /** @deprecated Use deleteNotification — rows are visible while they exist. */
  async toggleNotificationStatus(id: number, isActive: boolean): Promise<void> {
    if (!isActive) {
      await this.deleteNotification(id);
    }
  },

  async getActiveNotifications(): Promise<Notification[]> {
    return this.getAllNotifications();
  },

  async getAllUsers(): Promise<Array<{ user_id: number; username: string; role: string }>> {
    try {
      const { data, error } = await supabase.rpc(
        'get_all_users_for_admin',
        getRpcSessionArgs(),
      );

      if (error) throw error;

      return (data || []).map((user: { user_id: number; username: string; role: string }) => ({
        user_id: user.user_id,
        username: user.username,
        role: user.role,
      }));
    } catch (error) {
      console.error('Error loading users:', error);
      return [];
    }
  },

  async getAllTeams(): Promise<Array<{ team_id: number; team_name: string }>> {
    try {
      const { data, error } = await withUserContext(async () => {
        return await supabase
          .from('teams')
          .select('team_id, team_name')
          .order('team_name');
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading teams:', error);
      return [];
    }
  },
};
