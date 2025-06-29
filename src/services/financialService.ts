
import { supabase } from "@/integrations/supabase/client";

export interface TeamTransaction {
  id: number;
  team_id: number;
  transaction_type: 'deposit' | 'penalty' | 'match_cost' | 'adjustment';
  amount: number;
  description: string | null;
  penalty_type_id: number | null;
  match_id: number | null;
  transaction_date: string;
  created_at: string;
  penalty_types?: {
    name: string;
    description: string;
  };
  matches?: {
    unique_number: string;
    match_date: string;
  };
}

export interface PenaltyType {
  id: number;
  name: string;
  description: string | null;
  amount: number;
  is_active: boolean;
}

export interface FinancialSettings {
  id: number;
  field_cost_per_match: number;
  referee_cost_per_match: number;
  updated_at: string;
}

export const financialService = {
  async getTeamTransactions(teamId: number): Promise<TeamTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('team_transactions')
        .select(`
          *,
          penalty_types(name, description),
          matches(unique_number, match_date)
        `)
        .eq('team_id', teamId)
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      
      // Cast the transaction_type to the correct union type
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
  },

  async getPenaltyTypes(): Promise<PenaltyType[]> {
    try {
      const { data, error } = await supabase
        .from('penalty_types')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching penalty types:', error);
      return [];
    }
  },

  async getFinancialSettings(): Promise<FinancialSettings | null> {
    try {
      const { data, error } = await supabase
        .from('financial_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching financial settings:', error);
      return null;
    }
  },

  async updateFinancialSettings(settings: { field_cost_per_match: number; referee_cost_per_match: number }): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('financial_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', 1);

      if (error) throw error;
      return { success: true, message: 'Instellingen succesvol bijgewerkt' };
    } catch (error) {
      console.error('Error updating financial settings:', error);
      return { success: false, message: 'Fout bij bijwerken instellingen' };
    }
  }
};
