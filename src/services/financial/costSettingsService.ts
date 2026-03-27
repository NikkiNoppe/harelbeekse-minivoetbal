
import { supabase } from "@/integrations/supabase/client";

export interface CostSetting {
  id: number;
  name: string;
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

  async updateCostSetting(id: number, setting: Partial<CostSetting>): Promise<{ success: boolean; message: string; updatedTransactions?: number }> {
    try {
      const { error } = await supabase
        .from('costs')
        .update(setting)
        .eq('id', id);

      if (error) throw error;

      // Als het bedrag gewijzigd is, update ook alle bestaande team_costs records
      let updatedTransactions = 0;
      if (setting.amount !== undefined) {
        const { data, error: updateError } = await supabase
          .from('team_costs')
          .update({ amount: setting.amount })
          .eq('cost_setting_id', id)
          .select('id');

        if (updateError) {
          console.error('Error updating team_costs amounts:', updateError);
          return { 
            success: true, 
            message: `Tarief bijgewerkt, maar bestaande transacties konden niet worden aangepast: ${updateError.message}`,
            updatedTransactions: 0
          };
        }
        updatedTransactions = data?.length || 0;
      }

      const msg = updatedTransactions > 0
        ? `Kostentarief bijgewerkt en ${updatedTransactions} bestaande transacties aangepast`
        : 'Kostentarief succesvol bijgewerkt';

      return { success: true, message: msg, updatedTransactions };
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
          costs(name, category),
          matches(
            unique_number, 
            match_date,
            home_team_id,
            away_team_id,
            teams_home:teams!home_team_id(team_name),
            teams_away:teams!away_team_id(team_name)
          )
        `)
        .eq('team_id', teamId)
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(transaction => ({
        id: transaction.id,
        team_id: transaction.team_id,
        transaction_type: transaction.costs?.category as 'deposit' | 'penalty' | 'match_cost' | 'adjustment' || 'adjustment',
        amount: transaction.amount !== null ? transaction.amount : ((transaction.costs as any)?.amount || 0),
        description: transaction.costs?.name || null,
        cost_setting_id: transaction.cost_setting_id,
        penalty_type_id: null,
        match_id: transaction.match_id,
        transaction_date: transaction.transaction_date,
        created_at: new Date().toISOString(),
        cost_settings: transaction.costs ? {
          name: transaction.costs.name,
          category: transaction.costs.category
        } : undefined,
        matches: transaction.matches ? {
          unique_number: transaction.matches.unique_number,
          match_date: transaction.matches.match_date,
          home_team_id: transaction.matches.home_team_id,
          away_team_id: transaction.matches.away_team_id,
          teams_home: transaction.matches.teams_home,
          teams_away: transaction.matches.teams_away
        } : undefined
      }));
    } catch (error) {
      console.error('Error fetching team transactions:', error);
      return [];
    }
  },

  async addTransaction(transaction: Omit<TeamTransaction, 'id' | 'created_at'>): Promise<{ success: boolean; message: string }> {
    try {
      const { userId, role } = this._getUserContext();
      console.log('🔵 [FINANCIAL-CRUD] ADD request:', { 
        ...transaction, 
        userId, 
        role 
      });
      
      // For deposits, use the fixed "Storting" cost entry
      if (transaction.transaction_type === 'deposit') {
        // Get or create the fixed "Storting" cost entry
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
          // Use RPC for admin to create deposit cost
          console.log('🔵 [FINANCIAL-CRUD] Creating Storting cost entry via RPC');
          const { data: newDeposit, error: costError } = await supabase
            .from('costs')
            .insert([{
              name: 'Storting',
              amount: 0,
              category: 'deposit',
              is_active: true
            }])
            .select('id')
            .single();

          if (costError) {
            console.error('❌ [FINANCIAL-CRUD] Failed to create Storting cost:', costError);
            throw costError;
          }
          depositCostId = newDeposit.id;
        }

        // Use add_team_cost_as_admin RPC
        const { data, error } = await supabase.rpc('add_team_cost_as_admin', {
          p_user_id: userId,
          p_team_id: transaction.team_id,
          p_cost_setting_id: depositCostId,
          p_amount: transaction.amount,
          p_transaction_date: transaction.transaction_date,
          p_match_id: transaction.match_id || null
        });

        console.log('🔵 [FINANCIAL-CRUD] ADD deposit response:', { data, error });

        if (error) {
          console.error('❌ [FINANCIAL-CRUD] ADD deposit RPC error:', error);
          throw error;
        }

        const result = data as any;
        if (result && result.success === false) {
          return { success: false, message: result.error || 'Fout bij toevoegen storting' };
        }

        return { success: true, message: 'Storting succesvol toegevoegd' };
      }

      // For other transaction types with cost_setting_id - use RPC
      if (transaction.cost_setting_id) {
        const { data, error } = await supabase.rpc('add_team_cost_as_admin', {
          p_user_id: userId,
          p_team_id: transaction.team_id,
          p_cost_setting_id: transaction.cost_setting_id,
          p_amount: transaction.amount,
          p_transaction_date: transaction.transaction_date,
          p_match_id: transaction.match_id || null
        });

        console.log('🔵 [FINANCIAL-CRUD] ADD transaction response:', { data, error });

        if (error) {
          console.error('❌ [FINANCIAL-CRUD] ADD transaction RPC error:', error);
          throw error;
        }

        const result = data as any;
        if (result && result.success === false) {
          return { success: false, message: result.error || 'Fout bij toevoegen transactie' };
        }

        return { success: true, message: 'Transactie succesvol toegevoegd' };
      }

      // For transaction types without cost_setting_id, create new cost entry first
      console.log('🔵 [FINANCIAL-CRUD] Creating new cost entry for:', transaction.description);
      const { data: costData, error: costError } = await supabase
        .from('costs')
        .insert([{
          name: transaction.description || `Transactie ${new Date(transaction.transaction_date).toLocaleDateString('nl-NL')}`,
          amount: transaction.amount,
          category: transaction.transaction_type === 'penalty' ? 'penalty' : 
                   transaction.transaction_type === 'match_cost' ? 'match_cost' : 'other',
          is_active: true
        }])
        .select('id')
        .single();

      if (costError) {
        console.error('❌ [FINANCIAL-CRUD] Failed to create cost entry:', costError);
        throw costError;
      }

      const { data, error } = await supabase.rpc('add_team_cost_as_admin', {
        p_user_id: userId,
        p_team_id: transaction.team_id,
        p_cost_setting_id: costData.id,
        p_amount: transaction.amount,
        p_transaction_date: transaction.transaction_date,
        p_match_id: transaction.match_id || null
      });

      console.log('🔵 [FINANCIAL-CRUD] ADD custom transaction response:', { data, error });

      if (error) {
        console.error('❌ [FINANCIAL-CRUD] ADD custom transaction RPC error:', error);
        throw error;
      }

      const result = data as any;
      if (result && result.success === false) {
        return { success: false, message: result.error || 'Fout bij toevoegen transactie' };
      }

      return { success: true, message: 'Transactie succesvol toegevoegd' };
    } catch (error) {
      console.error('❌ [FINANCIAL-CRUD] ADD failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Onbekende fout';
      return { success: false, message: `Fout bij toevoegen transactie: ${errorMessage}` };
    }
  },

  async deleteTransaction(transactionId: number): Promise<{ success: boolean; message: string }> {
    const { userId, role } = this._getUserContext();
    console.log('🔵 [PENALTY-CRUD] DELETE request:', { costId: transactionId, userId, role });
    
    try {
      const { data, error } = await supabase.rpc('manage_team_cost_for_match', {
        p_user_id: userId,
        p_cost_id: transactionId,
        p_operation: 'delete'
      });

      if (error) {
        console.error('❌ [PENALTY-CRUD] DELETE RPC error:', { costId: transactionId, error });
        throw error;
      }
      
      const result = data as unknown as { success: boolean; message?: string; error?: string; deleted_id?: number };
      console.log('🔵 [PENALTY-CRUD] DELETE response:', { costId: transactionId, result });
      
      if (!result.success) {
        console.warn('⚠️ [PENALTY-CRUD] DELETE rejected by RPC:', { costId: transactionId, error: result.error });
        return { success: false, message: result.error || 'Fout bij verwijderen transactie' };
      }
      return { success: true, message: result.message || 'Transactie succesvol verwijderd' };
    } catch (error) {
      console.error('❌ [PENALTY-CRUD] DELETE failed:', { costId: transactionId, error });
      return { success: false, message: 'Fout bij verwijderen transactie' };
    }
  },

  async updateTransaction(
    transactionId: number, 
    updates: {
      amount?: number;
      transaction_date?: string;
      cost_setting_id?: number;
      team_id?: number;
    }
  ): Promise<{ success: boolean; message: string }> {
    const { userId, role } = this._getUserContext();
    console.log('🔵 [PENALTY-CRUD] UPDATE request:', { costId: transactionId, userId, role, updates });
    
    try {
      const { data, error } = await supabase.rpc('manage_team_cost_for_match', {
        p_user_id: userId,
        p_cost_id: transactionId,
        p_operation: 'update',
        p_amount: updates.amount ?? null,
        p_transaction_date: updates.transaction_date ?? null,
        p_cost_setting_id: updates.cost_setting_id ?? null,
        p_team_id: updates.team_id ?? null
      });

      if (error) {
        console.error('❌ [PENALTY-CRUD] UPDATE RPC error:', { costId: transactionId, error });
        throw error;
      }
      
      const result = data as unknown as { success: boolean; message?: string; error?: string };
      console.log('🔵 [PENALTY-CRUD] UPDATE response:', { costId: transactionId, result });
      
      if (!result.success) {
        console.warn('⚠️ [PENALTY-CRUD] UPDATE rejected by RPC:', { costId: transactionId, error: result.error });
        return { success: false, message: result.error || 'Fout bij bijwerken transactie' };
      }
      return { success: true, message: result.message || 'Transactie succesvol bijgewerkt' };
    } catch (error) {
      console.error('❌ [PENALTY-CRUD] UPDATE failed:', { costId: transactionId, error });
      return { success: false, message: 'Fout bij bijwerken transactie' };
    }
  },

  async addTransactionAsAdmin(
    teamId: number,
    costSettingId: number,
    amount: number,
    transactionDate: string,
    matchId?: number | null
  ): Promise<{ success: boolean; message: string }> {
    const { userId, role } = this._getUserContext();
    console.log('🔵 [PENALTY-CRUD] ADD request:', { teamId, costSettingId, amount, transactionDate, matchId, userId, role });
    
    try {
      const { data, error } = await supabase.rpc('add_team_cost_as_admin', {
        p_user_id: userId,
        p_team_id: teamId,
        p_cost_setting_id: costSettingId,
        p_amount: amount,
        p_transaction_date: transactionDate,
        p_match_id: matchId ?? null
      });

      if (error) {
        console.error('❌ [PENALTY-CRUD] ADD RPC error:', { teamId, error });
        throw error;
      }
      
      const result = data as unknown as { success: boolean; message?: string; error?: string };
      console.log('🔵 [PENALTY-CRUD] ADD response:', { teamId, result });
      
      if (!result.success) {
        return { success: false, message: result.error || 'Fout bij toevoegen transactie' };
      }
      return { success: true, message: result.message || 'Transactie succesvol toegevoegd' };
    } catch (error) {
      console.error('❌ [PENALTY-CRUD] ADD failed:', { teamId, error });
      return { success: false, message: 'Fout bij toevoegen transactie' };
    }
  },

  _getUserContext(): { userId: number; role: string } {
    const authDataString = localStorage.getItem('auth_data');
    if (authDataString) {
      try {
        const authData = JSON.parse(authDataString);
        return { 
          userId: authData?.user?.id, 
          role: authData?.user?.role || 'unknown' 
        };
      } catch (e) { /* ignore */ }
    }
    const legacyUserString = localStorage.getItem('user');
    if (legacyUserString) {
      try {
        const user = JSON.parse(legacyUserString);
        return { userId: user?.id, role: user?.role || 'unknown' };
      } catch (e) { /* ignore */ }
    }
    throw new Error('Gebruiker niet gevonden');
  },

  /** @deprecated Use _getUserContext instead */
  _getAdminUserId(): number {
    return this._getUserContext().userId;
  }
};
