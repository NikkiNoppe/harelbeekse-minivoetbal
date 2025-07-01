import { supabase } from "@/integrations/supabase/client";
import { costSettingsService, TeamTransaction as CostServiceTransaction } from "./costSettingsService";

// Keep existing interfaces for backward compatibility
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
  cost_setting_id?: number | null;
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

// Updated service to work with new cost_settings structure
export const financialService = {
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
    // Convert to the format expected by costSettingsService
    const costServiceTransaction: Omit<CostServiceTransaction, 'id' | 'created_at'> = {
      ...transaction,
      cost_setting_id: transaction.cost_setting_id || null
    };
    
    return costSettingsService.addTransaction(costServiceTransaction);
  },

  async getPenaltyTypes(): Promise<PenaltyType[]> {
    try {
      const costSettings = await costSettingsService.getPenalties();
      return costSettings.map(cs => ({
        id: cs.id,
        name: cs.name,
        description: cs.description,
        amount: cs.amount,
        is_active: cs.is_active
      }));
    } catch (error) {
      console.error('Error fetching penalty types:', error);
      return [];
    }
  },

  async getFinancialSettings(): Promise<FinancialSettings | null> {
    try {
      const matchCosts = await costSettingsService.getMatchCosts();
      const fieldCost = matchCosts.find(c => c.name.includes('Veld')) || { amount: 5 };
      const refereeCost = matchCosts.find(c => c.name.includes('Scheidsrechter')) || { amount: 6 };
      
      return {
        id: 1,
        field_cost_per_match: fieldCost.amount,
        referee_cost_per_match: refereeCost.amount,
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching financial settings:', error);
      return null;
    }
  },

  async updateFinancialSettings(settings: { field_cost_per_match: number; referee_cost_per_match: number }): Promise<{ success: boolean; message: string }> {
    try {
      const costSettings = await costSettingsService.getMatchCosts();
      
      // Update field cost
      const fieldCost = costSettings.find(c => c.name.includes('Veld'));
      if (fieldCost) {
        await costSettingsService.updateCostSetting(fieldCost.id, {
          amount: settings.field_cost_per_match
        });
      }
      
      // Update referee cost
      const refereeCost = costSettings.find(c => c.name.includes('Scheidsrechter'));
      if (refereeCost) {
        await costSettingsService.updateCostSetting(refereeCost.id, {
          amount: settings.referee_cost_per_match
        });
      }
      
      return { success: true, message: 'Instellingen succesvol bijgewerkt' };
    } catch (error) {
      console.error('Error updating financial settings:', error);
      return { success: false, message: 'Fout bij bijwerken instellingen' };
    }
  }
};
