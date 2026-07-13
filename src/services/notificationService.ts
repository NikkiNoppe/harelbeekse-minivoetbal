import { supabase } from '@/integrations/supabase/client';
import { getRpcSessionArgs, getEdgeFunctionHeaders } from '@/lib/authSession';
import { fetchTeamsForSession } from '@/services/core/teamsSessionFetch';
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
    send_email?: boolean;
    email_sent_at?: string;
    email_sent_count?: number;
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
    send_email?: boolean;
    email_sent_at?: string;
    email_sent_count?: number;
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
        send_email: settingValue?.send_email === true,
        email_sent_at: settingValue?.email_sent_at,
        email_sent_count: settingValue?.email_sent_count,
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

  async getAllUsers(): Promise<Array<{ user_id: number; username: string; role: string; email: string | null }>> {
    try {
      const { data, error } = await supabase.rpc(
        'get_all_users_for_admin',
        getRpcSessionArgs(),
      );

      if (error) throw error;

      return (data || []).map((user: { user_id: number; username: string; role: string; email?: string | null }) => ({
        user_id: user.user_id,
        username: user.username,
        role: user.role,
        email: user.email ?? null,
      }));
    } catch (error) {
      console.error('Error loading users:', error);
      return [];
    }
  },

  async sendAdminMessageEmails(input: {
    title?: string;
    message: string;
    target_roles?: string[];
    target_user_ids?: number[];
  }): Promise<{ queued: number; suppressed: number; failed: number; totalRecipients: number }> {
    const { data, error } = await supabase.functions.invoke('send-admin-message-emails', {
      body: input,
      headers: getEdgeFunctionHeaders(),
    });

    if (error) {
      throw new Error(error.message || 'Kon e-mails niet versturen');
    }

    if (data?.error) {
      throw new Error(String(data.error));
    }

    return {
      queued: Number(data?.queued ?? 0),
      suppressed: Number(data?.suppressed ?? 0),
      failed: Number(data?.failed ?? 0),
      totalRecipients: Number(data?.totalRecipients ?? 0),
    };
  },

  async getAllTeams(): Promise<Array<{ team_id: number; team_name: string }>> {
    try {
      const teams = await fetchTeamsForSession();
      return teams.map((t) => ({ team_id: t.team_id, team_name: t.team_name }));
    } catch (error) {
      console.error('Error loading teams:', error);
      return [];
    }
  },
};
