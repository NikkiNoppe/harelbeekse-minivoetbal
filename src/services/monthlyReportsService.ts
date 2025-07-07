import { supabase } from "@/integrations/supabase/client";

export interface MonthlyFieldCosts {
  month: string;
  year: number;
  totalCost: number;
  matchCount: number;
}

export interface MonthlyRefereeCosts {
  month: string;
  year: number;
  referee: string;
  totalCost: number;
  matchCount: number;
}

export interface MonthlyFines {
  month: string;
  year: number;
  totalFines: number;
  fineCount: number;
}

export interface MonthlyMatchStats {
  month: string;
  year: number;
  totalMatches: number;
}

export interface MonthlyReport {
  fieldCosts: MonthlyFieldCosts[];
  refereeCosts: MonthlyRefereeCosts[];
  fines: MonthlyFines[];
  matchStats: MonthlyMatchStats[];
  totalFieldCosts: number;
  totalRefereeCosts: number;
  totalFines: number;
  totalMatches: number;
}

export const monthlyReportsService = {
  async getMonthlyReport(year: number, month?: number): Promise<MonthlyReport> {
    try {
      // Fetch all match_cost transactions with proper joins - filter by match_date instead of transaction_date
      const { data: allTransactions, error: transError } = await supabase
        .from('team_transactions')
        .select(`
          *,
          cost_settings(name, description, category),
          matches(unique_number, match_date, referee)
        `)
        .eq('transaction_type', 'match_cost')
        .not('matches', 'is', null);

      // Fetch penalty transactions  
      const { data: penaltyTransactions, error: penaltyError } = await supabase
        .from('team_transactions')
        .select(`
          *,
          cost_settings(name, description, category)
        `)
        .eq('transaction_type', 'penalty')
        .gte('transaction_date', `${year}-${month ? month.toString().padStart(2, '0') : '01'}-01`)
        .lt('transaction_date', month ? 
          `${year}-${(month + 1).toString().padStart(2, '0')}-01` : 
          `${year + 1}-01-01`
        );

      // Fetch match statistics for the period
      const { data: matches, error: matchError } = await supabase
        .from('matches')
        .select('match_id, match_date, is_submitted')
        .eq('is_submitted', true)
        .gte('match_date', `${year}-${month ? month.toString().padStart(2, '0') : '01'}-01`)
        .lt('match_date', month ? 
          `${year}-${(month + 1).toString().padStart(2, '0')}-01` : 
          `${year + 1}-01-01`
        );

      if (transError) throw transError;
      if (penaltyError) throw penaltyError;
      if (matchError) throw matchError;

      // Filter transactions based on match_date from the period
      const filteredTransactions = allTransactions?.filter(transaction => {
        if (!transaction.matches?.match_date) return false;
        const matchDate = new Date(transaction.matches.match_date);
        const startDate = new Date(`${year}-${month ? month.toString().padStart(2, '0') : '01'}-01`);
        const endDate = month ? 
          new Date(`${year}-${(month + 1).toString().padStart(2, '0')}-01`) :
          new Date(`${year + 1}-01-01`);
        return matchDate >= startDate && matchDate < endDate;
      });

      // Group data by month
      const fieldCostsByMonth: Record<string, MonthlyFieldCosts> = {};
      const refereeCostsByMonth: Record<string, MonthlyRefereeCosts> = {};
      const finesByMonth: Record<string, MonthlyFines> = {};
      const matchStatsByMonth: Record<string, MonthlyMatchStats> = {};

      // Process filtered transactions
      filteredTransactions?.forEach(transaction => {
        const date = new Date(transaction.matches.match_date);
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });

        const isFieldCost = transaction.cost_settings?.name?.toLowerCase().includes('veld') || 
                           transaction.description?.toLowerCase().includes('veld');
        const isRefereeCost = transaction.cost_settings?.name?.toLowerCase().includes('scheidsrechter') || 
                             transaction.description?.toLowerCase().includes('scheidsrechter');

        if (isFieldCost) {
          if (!fieldCostsByMonth[monthKey]) {
            fieldCostsByMonth[monthKey] = {
              month: monthName,
              year: date.getFullYear(),
              totalCost: 0,
              matchCount: 0
            };
          }
          fieldCostsByMonth[monthKey].totalCost += Number(transaction.amount);
          fieldCostsByMonth[monthKey].matchCount++;
        }

        if (isRefereeCost) {
          const referee = transaction.matches?.referee || 'Onbekend';
          const refereeKey = `${monthKey}-${referee}`;
          
          if (!refereeCostsByMonth[refereeKey]) {
            refereeCostsByMonth[refereeKey] = {
              month: monthName,
              year: date.getFullYear(),
              referee,
              totalCost: 0,
              matchCount: 0
            };
          }
          refereeCostsByMonth[refereeKey].totalCost += Number(transaction.amount);
          refereeCostsByMonth[refereeKey].matchCount++;
        }
      });

      // Process penalty transactions
      penaltyTransactions?.forEach(transaction => {
        const date = new Date(transaction.transaction_date);
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });

        if (!finesByMonth[monthKey]) {
          finesByMonth[monthKey] = {
            month: monthName,
            year: date.getFullYear(),
            totalFines: 0,
            fineCount: 0
          };
        }
        finesByMonth[monthKey].totalFines += Number(transaction.amount);
        finesByMonth[monthKey].fineCount++;
      });

      // Process match statistics
      matches?.forEach(match => {
        const date = new Date(match.match_date);
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });

        if (!matchStatsByMonth[monthKey]) {
          matchStatsByMonth[monthKey] = {
            month: monthName,
            year: date.getFullYear(),
            totalMatches: 0
          };
        }
        matchStatsByMonth[monthKey].totalMatches++;
      });

      const fieldCosts = Object.values(fieldCostsByMonth);
      const refereeCosts = Object.values(refereeCostsByMonth);
      const fines = Object.values(finesByMonth);
      const matchStats = Object.values(matchStatsByMonth);

      return {
        fieldCosts,
        refereeCosts,
        fines,
        matchStats,
        totalFieldCosts: fieldCosts.reduce((sum, item) => sum + item.totalCost, 0),
        totalRefereeCosts: refereeCosts.reduce((sum, item) => sum + item.totalCost, 0),
        totalFines: fines.reduce((sum, item) => sum + item.totalFines, 0),
        totalMatches: matchStats.reduce((sum, item) => sum + item.totalMatches, 0)
      };
    } catch (error) {
      console.error('Error fetching monthly report:', error);
      throw error;
    }
  },

  async getYearlyRefereePayments(year: number): Promise<MonthlyRefereeCosts[]> {
    try {
      const { data: transactions, error } = await supabase
        .from('team_transactions')
        .select(`
          *,
          cost_settings(name, description, category),
          matches(unique_number, match_date, referee)
        `)
        .eq('transaction_type', 'match_cost')
        .not('matches', 'is', null);

      if (error) throw error;

      // Filter by year based on match_date
      const filteredTransactions = transactions?.filter(transaction => {
        if (!transaction.matches?.match_date) return false;
        const matchDate = new Date(transaction.matches.match_date);
        return matchDate.getFullYear() === year;
      });

      const refereePayments: Record<string, MonthlyRefereeCosts> = {};

      filteredTransactions?.forEach(transaction => {
        const isRefereeCost = transaction.cost_settings?.name?.toLowerCase().includes('scheidsrechter') || 
                             transaction.description?.toLowerCase().includes('scheidsrechter');
        
        if (isRefereeCost) {
          const referee = transaction.matches?.referee || 'Onbekend';
          
          if (!refereePayments[referee]) {
            refereePayments[referee] = {
              month: 'Totaal',
              year,
              referee,
              totalCost: 0,
              matchCount: 0
            };
          }
          refereePayments[referee].totalCost += Number(transaction.amount);
          refereePayments[referee].matchCount++;
        }
      });

      return Object.values(refereePayments);
    } catch (error) {
      console.error('Error fetching yearly referee payments:', error);
      throw error;
    }
  }
};