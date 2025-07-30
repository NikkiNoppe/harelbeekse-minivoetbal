
import { supabase } from "@/integrations/supabase/client";

export interface CostSetting {
  id: number;
  name: string;
  description: string | null;
  amount: number;
  category: 'match_cost' | 'penalty' | 'other' | 'deposit';
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
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
  created_at?: string;
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
        .from('costs')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        category: item.category as 'match_cost' | 'penalty' | 'other' | 'deposit'
      }));
    } catch (error) {
      console.error('Error fetching cost settings:', error);
      return [];
    }
  },

  async getMatchCosts(): Promise<CostSetting[]> {
    try {
      const { data, error } = await supabase
        .from('costs')
        .select('*')
        .eq('category', 'match_cost')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        category: item.category as 'match_cost' | 'penalty' | 'other' | 'deposit'
      }));
    } catch (error) {
      console.error('Error fetching match costs:', error);
      return [];
    }
  },

  async getPenalties(): Promise<CostSetting[]> {
    try {
      const { data, error } = await supabase
        .from('costs')
        .select('*')
        .eq('category', 'penalty')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        category: item.category as 'match_cost' | 'penalty' | 'other' | 'deposit'
      }));
    } catch (error) {
      console.error('Error fetching penalties:', error);
      return [];
    }
  },

  async addCostSetting(setting: Omit<CostSetting, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('costs')
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
        .from('costs')
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
        .from('costs')
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
        .from('team_costs')
        .select(`
          *,
          costs(name, description, category),
          matches(unique_number, match_date)
        `)
        .eq('team_id', teamId)
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(transaction => ({
        id: transaction.id,
        team_id: transaction.team_id,
        transaction_type: transaction.costs?.category as 'deposit' | 'penalty' | 'match_cost' | 'adjustment' || 'adjustment',
        amount: transaction.amount || (transaction.costs as any)?.amount || 0, // Use individual amount or fallback to cost setting amount
        description: transaction.costs?.description || null,
        cost_setting_id: transaction.cost_setting_id,
        penalty_type_id: null,
        match_id: transaction.match_id,
        transaction_date: transaction.transaction_date,
        created_at: new Date().toISOString(),
        cost_settings: transaction.costs ? {
          name: transaction.costs.name,
          description: transaction.costs.description,
          category: transaction.costs.category
        } : undefined,
        matches: transaction.matches ? {
          unique_number: transaction.matches.unique_number,
          match_date: transaction.matches.match_date
        } : undefined
      }));
    } catch (error) {
      console.error('Error fetching team transactions:', error);
      return [];
    }
  },

  async addTransaction(transaction: Omit<TeamTransaction, 'id' | 'created_at'>): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Adding transaction:', transaction);
      
      // For deposits, create a simple cost entry and link it
      if (transaction.transaction_type === 'deposit') {
        // Create a deposit cost entry if it doesn't exist
        let depositCostId: number;
        
        const { data: existingDeposit } = await supabase
          .from('costs')
          .select('id')
          .eq('name', 'Storting')
          .eq('category', 'deposit')
          .single();

        if (existingDeposit) {
          depositCostId = existingDeposit.id;
        } else {
          // Create deposit cost entry
          const { data: newDeposit, error: costError } = await supabase
            .from('costs')
            .insert([{
              name: 'Storting',
              description: 'Storting van geld',
              amount: 0, // Will be overridden by individual amount
              category: 'deposit',
              is_active: true
            }])
            .select('id')
            .single();

          if (costError) throw costError;
          depositCostId = newDeposit.id;
        }

        // Link to team with individual amount
        const { error: linkError } = await supabase
          .from('team_costs')
          .insert([{
            team_id: transaction.team_id,
            cost_setting_id: depositCostId,
            amount: transaction.amount,
            transaction_date: transaction.transaction_date
          }]);

        if (linkError) throw linkError;
        return { success: true, message: 'Storting succesvol toegevoegd' };
      }

      // For penalties with cost_setting_id
      if (transaction.transaction_type === 'penalty' && transaction.cost_setting_id) {
        const { error } = await supabase
          .from('team_costs')
          .insert([{
            team_id: transaction.team_id,
            cost_setting_id: transaction.cost_setting_id,
            amount: transaction.amount,
            transaction_date: transaction.transaction_date
          }]);

        if (error) throw error;
        return { success: true, message: 'Boete succesvol toegevoegd' };
      }

      // For penalties without cost_setting_id, create new cost entry
      if (transaction.transaction_type === 'penalty') {
        const { data: costData, error: costError } = await supabase
          .from('costs')
          .insert([{
            name: transaction.description || `Boete ${new Date(transaction.transaction_date).toLocaleDateString('nl-NL')}`,
            description: transaction.description || 'Boete',
            amount: transaction.amount,
            category: 'penalty',
            is_active: true
          }])
          .select('id')
          .single();

        if (costError) throw costError;

        const { error: linkError } = await supabase
          .from('team_costs')
          .insert([{
            team_id: transaction.team_id,
            cost_setting_id: costData.id,
            amount: transaction.amount,
            transaction_date: transaction.transaction_date
          }]);

        if (linkError) throw linkError;
        return { success: true, message: 'Boete succesvol toegevoegd' };
      }

      // For adjustments, create new cost entry
      if (transaction.transaction_type === 'adjustment') {
        const { data: costData, error: costError } = await supabase
          .from('costs')
          .insert([{
            name: transaction.description || `Correctie ${new Date(transaction.transaction_date).toLocaleDateString('nl-NL')}`,
            description: transaction.description || 'Correctie',
            amount: transaction.amount,
            category: 'other',
            is_active: true
          }])
          .select('id')
          .single();

        if (costError) throw costError;

        const { error: linkError } = await supabase
          .from('team_costs')
          .insert([{
            team_id: transaction.team_id,
            cost_setting_id: costData.id,
            amount: transaction.amount,
            transaction_date: transaction.transaction_date
          }]);

        if (linkError) throw linkError;
        return { success: true, message: 'Correctie succesvol toegevoegd' };
      }

      // For other transaction types with cost_setting_id
      if (transaction.cost_setting_id) {
        const { error } = await supabase
          .from('team_costs')
          .insert([{
            team_id: transaction.team_id,
            cost_setting_id: transaction.cost_setting_id,
            amount: transaction.amount,
            transaction_date: transaction.transaction_date
          }]);

        if (error) throw error;
        return { success: true, message: 'Transactie succesvol toegevoegd' };
      }

      // For other transaction types without cost_setting_id
      const { data: costData, error: costError } = await supabase
        .from('costs')
        .insert([{
          name: transaction.description || `Transactie ${new Date(transaction.transaction_date).toLocaleDateString('nl-NL')}`,
          description: transaction.description || 'Transactie',
          amount: transaction.amount,
          category: 'other',
          is_active: true
        }])
        .select('id')
        .single();

      if (costError) throw costError;

      const { error: linkError } = await supabase
        .from('team_costs')
        .insert([{
          team_id: transaction.team_id,
          cost_setting_id: costData.id,
          amount: transaction.amount,
          transaction_date: transaction.transaction_date
        }]);

      if (linkError) throw linkError;
      return { success: true, message: 'Transactie succesvol toegevoegd' };
    } catch (error) {
      console.error('Error adding transaction:', error);
      return { success: false, message: 'Fout bij toevoegen transactie' };
    }
  },

  async deleteTransaction(transactionId: number): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('team_costs')
        .delete()
        .eq('id', transactionId);

      if (error) throw error;
      return { success: true, message: 'Transactie succesvol verwijderd' };
    } catch (error) {
      console.error('Error deleting transaction:', error);
      return { success: false, message: 'Fout bij verwijderen transactie' };
    }
  },

  async updateTransaction(
    transactionId: number, 
    updates: {
      amount?: number;
      description?: string;
      transaction_date?: string;
      cost_setting_id?: number;
    }
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('team_costs')
        .update(updates)
        .eq('id', transactionId);

      if (error) throw error;
      return { success: true, message: 'Transactie succesvol bijgewerkt' };
    } catch (error) {
      console.error('Error updating transaction:', error);
      return { success: false, message: 'Fout bij bijwerken transactie' };
    }
  }
};
