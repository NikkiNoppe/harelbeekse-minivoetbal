
import { supabase } from "@/integrations/supabase/client";

export interface CostSetting {
  id: number;
  name: string;
  description: string | null;
  amount: number;
  category: 'match_cost' | 'penalty' | 'other' | 'field_cost' | 'referee_cost';
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

// Enhanced logging utility
const logOperation = (operation: string, data?: any, error?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] CostSettings ${operation}:`, { data, error });
};

export const enhancedCostSettingsService = {
  async getAllCostSettings(): Promise<CostSetting[]> {
    logOperation('getAllCostSettings - START');
    try {
      const { data, error } = await supabase
        .from('cost_settings')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      logOperation('getAllCostSettings - QUERY RESULT', { data, error });

      if (error) {
        logOperation('getAllCostSettings - ERROR', { error });
        throw error;
      }
      
      const mappedData = (data || []).map(item => ({
        ...item,
        category: item.category as 'match_cost' | 'penalty' | 'other' | 'field_cost' | 'referee_cost'
      }));

      logOperation('getAllCostSettings - SUCCESS', { count: mappedData.length });
      return mappedData;
    } catch (error) {
      logOperation('getAllCostSettings - CATCH ERROR', { error });
      return [];
    }
  },

  async getCostSettings(): Promise<CostSetting[]> {
    return this.getAllCostSettings();
  },

  async getMatchCosts(): Promise<CostSetting[]> {
    logOperation('getMatchCosts - START');
    try {
      const { data, error } = await supabase
        .from('cost_settings')
        .select('*')
        .eq('category', 'match_cost')
        .eq('is_active', true)
        .order('name');

      logOperation('getMatchCosts - QUERY RESULT', { data, error });

      if (error) {
        logOperation('getMatchCosts - ERROR', { error });
        throw error;
      }
      
      const mappedData = (data || []).map(item => ({
        ...item,
        category: item.category as 'match_cost' | 'penalty' | 'other' | 'field_cost' | 'referee_cost'
      }));

      logOperation('getMatchCosts - SUCCESS', { count: mappedData.length });
      return mappedData;
    } catch (error) {
      logOperation('getMatchCosts - CATCH ERROR', { error });
      return [];
    }
  },

  async getPenalties(): Promise<CostSetting[]> {
    logOperation('getPenalties - START');
    try {
      const { data, error } = await supabase
        .from('cost_settings')
        .select('*')
        .eq('category', 'penalty')
        .eq('is_active', true)
        .order('name');

      logOperation('getPenalties - QUERY RESULT', { data, error });

      if (error) {
        logOperation('getPenalties - ERROR', { error });
        throw error;
      }
      
      const mappedData = (data || []).map(item => ({
        ...item,
        category: item.category as 'match_cost' | 'penalty' | 'other' | 'field_cost' | 'referee_cost'
      }));

      logOperation('getPenalties - SUCCESS', { count: mappedData.length });
      return mappedData;
    } catch (error) {
      logOperation('getPenalties - CATCH ERROR', { error });
      return [];
    }
  },

  async createCostSetting(setting: Omit<CostSetting, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; message: string }> {
    logOperation('createCostSetting - START', { setting });
    try {
      const { data, error } = await supabase
        .from('cost_settings')
        .insert([setting])
        .select();

      logOperation('createCostSetting - QUERY RESULT', { data, error });

      if (error) {
        logOperation('createCostSetting - ERROR', { error });
        throw error;
      }
      
      logOperation('createCostSetting - SUCCESS', { insertedData: data });
      return { success: true, message: 'Kostentarief succesvol toegevoegd' };
    } catch (error) {
      logOperation('createCostSetting - CATCH ERROR', { error });
      return { success: false, message: `Fout bij toevoegen kostentarief: ${error}` };
    }
  },

  async addCostSetting(setting: Omit<CostSetting, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; message: string }> {
    return this.createCostSetting(setting);
  },

  async updateCostSetting(id: number, setting: Partial<CostSetting>): Promise<{ success: boolean; message: string }> {
    logOperation('updateCostSetting - START', { id, setting });
    try {
      const updateData = {
        ...setting,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('cost_settings')
        .update(updateData)
        .eq('id', id)
        .select();

      logOperation('updateCostSetting - QUERY RESULT', { data, error, updateData });

      if (error) {
        logOperation('updateCostSetting - ERROR', { error });
        throw error;
      }
      
      logOperation('updateCostSetting - SUCCESS', { updatedData: data });
      return { success: true, message: 'Kostentarief succesvol bijgewerkt' };
    } catch (error) {
      logOperation('updateCostSetting - CATCH ERROR', { error });
      return { success: false, message: `Fout bij bijwerken kostentarief: ${error}` };
    }
  },

  async deleteCostSetting(id: number): Promise<{ success: boolean; message: string }> {
    logOperation('deleteCostSetting - START', { id });
    try {
      const { data, error } = await supabase
        .from('cost_settings')
        .delete()
        .eq('id', id)
        .select();

      logOperation('deleteCostSetting - QUERY RESULT', { data, error });

      if (error) {
        logOperation('deleteCostSetting - ERROR', { error });
        throw error;
      }
      
      logOperation('deleteCostSetting - SUCCESS', { deletedData: data });
      return { success: true, message: 'Kostentarief succesvol verwijderd' };
    } catch (error) {
      logOperation('deleteCostSetting - CATCH ERROR', { error });
      return { success: false, message: `Fout bij verwijderen kostentarief: ${error}` };
    }
  },

  async getTeamTransactions(teamId: number): Promise<TeamTransaction[]> {
    logOperation('getTeamTransactions - START', { teamId });
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

      logOperation('getTeamTransactions - QUERY RESULT', { data, error, teamId });

      if (error) {
        logOperation('getTeamTransactions - ERROR', { error });
        throw error;
      }
      
      const mappedData = (data || []).map(transaction => ({
        ...transaction,
        transaction_type: transaction.transaction_type as 'deposit' | 'penalty' | 'match_cost' | 'adjustment'
      }));

      logOperation('getTeamTransactions - SUCCESS', { count: mappedData.length, teamId });
      return mappedData;
    } catch (error) {
      logOperation('getTeamTransactions - CATCH ERROR', { error });
      return [];
    }
  },

  async addTransaction(transaction: Omit<TeamTransaction, 'id' | 'created_at'>): Promise<{ success: boolean; message: string }> {
    logOperation('addTransaction - START', { transaction });
    try {
      const { data, error } = await supabase
        .from('team_transactions')
        .insert([transaction])
        .select();

      logOperation('addTransaction - QUERY RESULT', { data, error });

      if (error) {
        logOperation('addTransaction - ERROR', { error });
        throw error;
      }
      
      logOperation('addTransaction - SUCCESS', { insertedData: data });
      return { success: true, message: 'Transactie succesvol toegevoegd' };
    } catch (error) {
      logOperation('addTransaction - CATCH ERROR', { error });
      return { success: false, message: `Fout bij toevoegen transactie: ${error}` };
    }
  }
};
