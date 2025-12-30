
import { supabase } from "@/integrations/supabase/client";

export interface CostSetting {
  id: number;
  name: string;
  amount: number;
  category: 'match_cost' | 'penalty' | 'other' | 'field_cost' | 'referee_cost';
  is_active: boolean;
}

export interface TeamTransaction {
  id: number;
  team_id: number;
  transaction_type: 'deposit' | 'penalty' | 'match_cost' | 'adjustment';
  amount: number;
  description: string | null;
  cost_setting_id: number | null;
  match_id: number | null;
  transaction_date: string;
  created_at: string;
  cost_settings?: {
    name: string;
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
  async getCostSettings(): Promise<CostSetting[]> {
    logOperation('getCostSettings - START');
    try {
      const { data, error } = await supabase
        .from('costs')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      logOperation('getCostSettings - QUERY RESULT', { data, error });

      if (error) {
        logOperation('getCostSettings - ERROR', { error });
        throw error;
      }
      
      const mappedData = (data || []).map(item => ({
        ...item,
        category: item.category as 'match_cost' | 'penalty' | 'other' | 'field_cost' | 'referee_cost'
      }));

      logOperation('getCostSettings - SUCCESS', { count: mappedData.length });
      return mappedData;
    } catch (error) {
      logOperation('getCostSettings - CATCH ERROR', { error });
      return [];
    }
  },

  async getMatchCosts(): Promise<CostSetting[]> {
    logOperation('getMatchCosts - START');
    try {
      const { data, error } = await supabase
        .from('costs')
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
        .from('costs')
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

  async addCostSetting(setting: Omit<CostSetting, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; message: string }> {
    logOperation('addCostSetting - START', { setting });
    try {
      const { data, error } = await supabase
        .from('costs')
        .insert([setting])
        .select();

      logOperation('addCostSetting - QUERY RESULT', { data, error });

      if (error) {
        logOperation('addCostSetting - ERROR', { error });
        throw error;
      }
      
      logOperation('addCostSetting - SUCCESS', { insertedData: data });
      return { success: true, message: 'Kostentarief succesvol toegevoegd' };
    } catch (error) {
      logOperation('addCostSetting - CATCH ERROR', { error });
      const errorMessage = error instanceof Error ? error.message : 
                          typeof error === 'string' ? error : 
                          JSON.stringify(error);
      return { success: false, message: `Fout bij toevoegen kostentarief: ${errorMessage}` };
    }
  },

  async updateCostSetting(id: number, setting: Partial<CostSetting>): Promise<{ success: boolean; message: string; affectedTransactions?: number }> {
    logOperation('updateCostSetting - START', { id, setting });
    try {
      // Check if amount is being changed
      const isAmountChange = setting.amount !== undefined;
      
      if (isAmountChange) {
        // Get current setting to compare amounts
        const { data: currentSetting } = await supabase
          .from('costs')
          .select('amount')
          .eq('id', id)
          .single();
        
        if (currentSetting && currentSetting.amount !== setting.amount) {
          // Get count of affected transactions
          const { count: affectedCount } = await supabase
            .from('team_costs')
            .select('*', { count: 'exact', head: true })
            .eq('cost_setting_id', id);
          
          logOperation('updateCostSetting - AMOUNT CHANGE DETECTED', { 
            oldAmount: currentSetting.amount, 
            newAmount: setting.amount, 
            affectedTransactions: affectedCount 
          });
        }
      }

      const updateData = {
        ...setting
      };

      // First, try to update without the trigger to avoid audit log issues
      const { data, error } = await supabase
        .from('costs')
        .update(updateData)
        .eq('id', id)
        .select();

      logOperation('updateCostSetting - QUERY RESULT', { data, error, updateData });

      if (error) {
        logOperation('updateCostSetting - ERROR', { error });
        throw error;
      }
      
      // If amount changed, manually update related transactions
      if (isAmountChange && setting.amount !== undefined) {
        try {
          // Update all team_costs that reference this cost_setting
          const { error: updateError } = await supabase
            .from('team_costs')
            .update({ amount: setting.amount })
            .eq('cost_setting_id', id);
          
          if (updateError) {
            logOperation('updateCostSetting - TRANSACTION UPDATE ERROR', { updateError });
            // Don't throw here, just log the error
          }
          
          // Note: Audit log functionality is temporarily disabled until database is fixed
          // TODO: Re-enable audit log after running the migration
          logOperation('updateCostSetting - AUDIT LOG DISABLED', { 
            message: 'Audit log temporarily disabled due to database issues' 
          });
        } catch (manualUpdateError) {
          logOperation('updateCostSetting - MANUAL UPDATE ERROR', { manualUpdateError });
          // Don't throw here, just log the error
        }
      }
      
      // Get updated count of affected transactions after the update
      const { count: finalAffectedCount } = await supabase
        .from('team_costs')
        .select('*', { count: 'exact', head: true })
        .eq('cost_setting_id', id);
      
      logOperation('updateCostSetting - SUCCESS', { 
        updatedData: data, 
        affectedTransactions: finalAffectedCount 
      });
      
      const message = isAmountChange && finalAffectedCount && finalAffectedCount > 0
        ? `Kostentarief bijgewerkt. ${finalAffectedCount} gerelateerde transactie(s) zijn automatisch aangepast.`
        : 'Kostentarief succesvol bijgewerkt';
      
      return { 
        success: true, 
        message,
        affectedTransactions: finalAffectedCount || 0
      };
    } catch (error) {
      logOperation('updateCostSetting - CATCH ERROR', { error });
      const errorMessage = error instanceof Error ? error.message : 
                          typeof error === 'string' ? error : 
                          JSON.stringify(error);
      return { success: false, message: `Fout bij bijwerken kostentarief: ${errorMessage}` };
    }
  },

  async deleteCostSetting(id: number): Promise<{ success: boolean; message: string }> {
    logOperation('deleteCostSetting - START', { id });
    try {
      const { data, error } = await supabase
        .from('costs')
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
      const errorMessage = error instanceof Error ? error.message : 
                          typeof error === 'string' ? error : 
                          JSON.stringify(error);
      return { success: false, message: `Fout bij verwijderen kostentarief: ${errorMessage}` };
    }
  },

  async getTeamTransactions(teamId: number): Promise<TeamTransaction[]> {
    logOperation('getTeamTransactions - START', { teamId });
    try {
      const { data, error } = await supabase
        .from('team_costs')
        .select(`
          *,
          costs(name, category),
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
        id: transaction.id,
        team_id: transaction.team_id,
        transaction_type: transaction.costs?.category as 'deposit' | 'penalty' | 'match_cost' | 'adjustment' || 'adjustment',
        amount: transaction.amount || (transaction.costs as any)?.amount || 0, // Use individual amount or fallback to cost setting amount
        description: transaction.costs?.name || null,
        cost_setting_id: transaction.cost_setting_id,
        match_id: transaction.match_id,
        transaction_date: transaction.transaction_date,
        created_at: new Date().toISOString(),
        cost_settings: transaction.costs ? {
          name: transaction.costs.name,
          category: transaction.costs.category
        } : undefined,
        matches: transaction.matches ? {
          unique_number: transaction.matches.unique_number,
          match_date: transaction.matches.match_date
        } : undefined
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
        .from('team_costs')
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
      const errorMessage = error instanceof Error ? error.message : 
                          typeof error === 'string' ? error : 
                          JSON.stringify(error);
      return { success: false, message: `Fout bij toevoegen transactie: ${errorMessage}` };
    }
  },

  // Get affected transactions for a specific cost setting
  async getAffectedTransactions(costSettingId: number): Promise<TeamTransaction[]> {
    logOperation('getAffectedTransactions - START', { costSettingId });
    try {
      const { data, error } = await supabase
        .from('team_costs')
        .select(`
          *,
          costs(name, category),
          matches(unique_number, match_date)
        `)
        .eq('cost_setting_id', costSettingId)
        .order('transaction_date', { ascending: false });

      logOperation('getAffectedTransactions - QUERY RESULT', { data, error, costSettingId });

      if (error) {
        logOperation('getAffectedTransactions - ERROR', { error });
        throw error;
      }
      
      const mappedData = (data || []).map(transaction => ({
        id: transaction.id,
        team_id: transaction.team_id,
        transaction_type: transaction.costs?.category as 'deposit' | 'penalty' | 'match_cost' | 'adjustment' || 'adjustment',
        amount: transaction.amount || (transaction.costs as any)?.amount || 0,
        description: transaction.costs?.name || null,
        cost_setting_id: transaction.cost_setting_id,
        match_id: transaction.match_id,
        transaction_date: transaction.transaction_date,
        created_at: new Date().toISOString(),
        cost_settings: transaction.costs ? {
          name: transaction.costs.name,
          category: transaction.costs.category
        } : undefined,
        matches: transaction.matches ? {
          unique_number: transaction.matches.unique_number,
          match_date: transaction.matches.match_date
        } : undefined
      }));

      logOperation('getAffectedTransactions - SUCCESS', { count: mappedData.length, costSettingId });
      return mappedData;
    } catch (error) {
      logOperation('getAffectedTransactions - CATCH ERROR', { error });
      return [];
    }
  }
};
