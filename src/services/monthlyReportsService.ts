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

export interface MonthlyReport {
  fieldCosts: MonthlyFieldCosts[];
  refereeCosts: MonthlyRefereeCosts[];
  totalFieldCosts: number;
  totalRefereeCosts: number;
}

export const monthlyReportsService = {
  async getMonthlyReport(year: number, month?: number): Promise<MonthlyReport> {
    const { data: transactions, error } = await supabase
      .from('team_transactions')
      .select(`
        *,
        cost_settings(name, description, category),
        matches(unique_number, match_date, referee)
      `)
      .eq('transaction_type', 'match_cost')
      .gte('transaction_date', `${year}-${month ? month.toString().padStart(2, '0') : '01'}-01`)
      .lt('transaction_date', month ? 
        `${year}-${(month + 1).toString().padStart(2, '0')}-01` : 
        `${year + 1}-01-01`
      )
      .order('transaction_date', { ascending: false });

    if (error) throw error;

    // Group field costs by month
    const fieldCostsByMonth: Record<string, MonthlyFieldCosts> = {};
    
    // Group referee costs by month and referee
    const refereeCostsByMonth: Record<string, MonthlyRefereeCosts> = {};

    transactions?.forEach(transaction => {
      const date = new Date(transaction.transaction_date);
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

    const fieldCosts = Object.values(fieldCostsByMonth);
    const refereeCosts = Object.values(refereeCostsByMonth);

    return {
      fieldCosts,
      refereeCosts,
      totalFieldCosts: fieldCosts.reduce((sum, item) => sum + item.totalCost, 0),
      totalRefereeCosts: refereeCosts.reduce((sum, item) => sum + item.totalCost, 0)
    };
  },

  async getYearlyRefereePayments(year: number): Promise<MonthlyRefereeCosts[]> {
    const { data: transactions, error } = await supabase
      .from('team_transactions')
      .select(`
        *,
        cost_settings(name, description, category),
        matches(unique_number, match_date, referee)
      `)
      .eq('transaction_type', 'match_cost')
      .gte('transaction_date', `${year}-01-01`)
      .lt('transaction_date', `${year + 1}-01-01`)
      .order('transaction_date', { ascending: false });

    if (error) throw error;

    const refereePayments: Record<string, MonthlyRefereeCosts> = {};

    transactions?.forEach(transaction => {
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
  }
};