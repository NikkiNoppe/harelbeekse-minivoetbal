import { supabase } from '@/integrations/supabase/client';

export interface TeamFinancialBreakdown {
  team_id: number;
  team_name: string;
  start_capital: number;
  field_costs: number;
  referee_costs: number;
  penalties: number;
  other_costs: number;
  adjustments: number;
  current_balance: number;
  calculated_balance: number;
}

export const financialOverviewService = {
  async getTeamFinancialBreakdown(): Promise<TeamFinancialBreakdown[]> {
    try {
      // Get all teams first
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('team_id, team_name')
        .order('team_name');

      if (teamsError) throw teamsError;
      if (!teams) return [];

      // For now, return simplified data until the database view is properly set up
      return teams.map(team => ({
        team_id: team.team_id,
        team_name: team.team_name,
        start_capital: 0, // Will be calculated from transactions
        field_costs: 0, // Will be calculated from database
        referee_costs: 0, // Will be calculated from database
        penalties: 0, // Will be calculated from database
        other_costs: 0, // Will be calculated from database
        adjustments: 0, // Will be calculated from database
        current_balance: 0, // Will be calculated from transactions
        calculated_balance: 0 // Will be calculated from transactions
      }));
    } catch (error) {
      console.error('Error fetching team financial breakdown:', error);
      return [];
    }
  },

  async getTeamFinancialBreakdownById(teamId: number): Promise<TeamFinancialBreakdown | null> {
    try {
      const { data: team, error } = await supabase
        .from('teams')
        .select('team_id, team_name')
        .eq('team_id', teamId)
        .single();

      if (error) throw error;
      if (!team) return null;

      return {
        team_id: team.team_id,
        team_name: team.team_name,
        start_capital: 0, // Will be calculated from transactions
        field_costs: 0, // Will be calculated from database
        referee_costs: 0, // Will be calculated from database
        penalties: 0, // Will be calculated from database
        other_costs: 0, // Will be calculated from database
        adjustments: 0, // Will be calculated from database
        current_balance: 0, // Will be calculated from transactions
        calculated_balance: 0 // Will be calculated from transactions
      };
    } catch (error) {
      console.error('Error fetching team financial breakdown:', error);
      return null;
    }
  }
}; 