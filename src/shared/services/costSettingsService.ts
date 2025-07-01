
import { supabase } from "@shared/integrations/supabase/client";

export interface CostSetting {
  id: number;
  name: string;
  description: string | null;
  amount: number;
  category: 'match_cost' | 'penalty' | 'other';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeamTransaction {
  id: number;
  team_id: number;
  transaction_type: 'deposit' | 'penalty' | 'match_cost' | 'adjustment';
  amount: number;
  description: string | null;
  cost_setting_id: number | null;
  penalty_type_id: number | null;
  match_id: number | null;
  transaction_date: string;
  created_at: string;
  cost_settings?: {
    name: string;
    description: string;
    category: string;
  };
  matches?: {
    unique_number: string;
    match_date: string;
  };
}

export const costSettingsService = {
  async getCostSettings(): Promise<CostSetting[]> {
    try {
      const { data, error } = await supabase
        .from('cost_settings')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        category: item.category as 'match_cost' | 'penalty' | 'other'
      }));
    } catch (error) {
      console.error('Error fetching cost settings:', error);
      return [];
    }
  },

  async getMatchCosts(): Promise<CostSetting[]> {
    try {
      const { data, error } = await supabase
        .from('cost_settings')
        .select('*')
        .eq('category', 'match_cost')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        category: item.category as 'match_cost' | 'penalty' | 'other'
      }));
    } catch (error) {
      console.error('Error fetching match costs:', error);
      return [];
    }
  },

  async getPenalties(): Promise<CostSetting[]> {
    try {
      const { data, error } = await supabase
        .from('cost_settings')
        .select('*')
        .eq('category', 'penalty')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        category: item.category as 'match_cost' | 'penalty' | 'other'
      }));
    } catch (error) {
      console.error('Error fetching penalties:', error);
      return [];
    }
  },

  async addCostSetting(setting: Omit<CostSetting, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('cost_settings')
        .insert([setting]);

      if (error) throw error;
      return { success: true, message: 'Kostentarief succesvol toegevoegd' };
    } catch (error) {
      console.error('Error adding cost setting:', error);
      return { success: false, message: 'Fout bij toevoegen kostentarief' };
    }
  },

  async updateCostSetting(id: number, setting: Partial<CostSetting>): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('cost_settings')
        .update({
          ...setting,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      return { success: true, message: 'Kostentarief succesvol bijgewerkt' };
    } catch (error) {
      console.error('Error updating cost setting:', error);
      return { success: false, message: 'Fout bij bijwerken kostentarief' };
    }
  },

  async deleteCostSetting(id: number): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('cost_settings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true, message: 'Kostentarief succesvol verwijderd' };
    } catch (error) {
      console.error('Error deleting cost setting:', error);
      return { success: false, message: 'Fout bij verwijderen kostentarief' };
    }
  },

  async getTeamTransactions(teamId: number): Promise<TeamTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('team_transactions')
        .select(`
          *,
          cost_settings(name, description, category),
          matches(unique_number, match_date)
        `)
        .eq('team_id', teamId)
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(transaction => ({
        ...transaction,
        transaction_type: transaction.transaction_type as 'deposit' | 'penalty' | 'match_cost' | 'adjustment'
      }));
    } catch (error) {
      console.error('Error fetching team transactions:', error);
      return [];
    }
  },

  async addTransaction(transaction: Omit<TeamTransaction, 'id' | 'created_at'>): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('team_transactions')
        .insert([transaction]);

      if (error) throw error;
      return { success: true, message: 'Transactie succesvol toegevoegd' };
    } catch (error) {
      console.error('Error adding transaction:', error);
      return { success: false, message: 'Fout bij toevoegen transactie' };
    }
  }
};
