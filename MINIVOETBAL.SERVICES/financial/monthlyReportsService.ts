import { supabase } from "../../MINIVOETBAL.SDK/client";
import { costSettingsService } from "./costSettingsService";

export interface MonthlyFieldCosts {
  month: string;
  season: string;
  totalCost: number;
  matchCount: number;
}

export interface MonthlyRefereeCosts {
  month: string;
  season: string;
  referee: string;
  totalCost: number;
  matchCount: number;
}

export interface MonthlyFines {
  month: string;
  season: string;
  totalFines: number;
  fineCount: number;
}

export interface MonthlyMatchStats {
  month: string;
  season: string;
  totalMatches: number;
}

export interface SeasonData {
  season: string;
  startYear: number;
  endYear: number;
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

// Helper functions for season handling
const getSeasonFromYear = (year: number): SeasonData => {
  return {
    season: `${year}/${year + 1}`,
    startYear: year,
    endYear: year + 1
  };
};

const getSeasonDates = (seasonData: SeasonData) => {
  // Season runs from August to June
  const startDate = new Date(seasonData.startYear, 7, 1); // August 1st
  const endDate = new Date(seasonData.endYear, 5, 30); // June 30th
  return { startDate, endDate };
};

const getSeasonFromDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed
  // If month is August (7) or later, it's the start of a new season
  if (month >= 7) {
    return `${year}/${year + 1}`;
  } else {
    return `${year - 1}/${year}`;
  }
};

export const monthlyReportsService = {
  async getSeasonReport(seasonYear: number, month?: number): Promise<MonthlyReport> {
    try {
      const seasonData = getSeasonFromYear(seasonYear);
      const { startDate, endDate } = getSeasonDates(seasonData);
      
      // Adjust date range if month is specified
      const filterStartDate = month ? new Date(seasonYear, month - 1, 1) : startDate;
      const filterEndDate = month ? new Date(seasonYear, month, 0, 23, 59, 59) : endDate;

      // Fetch all transactions with related data using explicit type casting
      const { data: transactions, error } = await (supabase as any)
        .from('team_costs')
        .select(`
          *,
          costs(name, description, category),
          matches(unique_number, match_date, referee)
        `)
        .not('matches', 'is', null);

      if (error) throw error;

      const allTransactions: any[] = [];
      if (transactions) {
        allTransactions.push(...transactions);
      }

      // Filter transactions based on match_date from the season period
      const filteredTransactions = allTransactions.filter(transaction => {
        if (!transaction.matches?.match_date) return false;
        const matchDate = new Date(transaction.matches.match_date);
        return matchDate >= filterStartDate && matchDate <= filterEndDate && transaction.costs?.category === 'match_cost';
      });

      // Filter penalty transactions for the season period
      const filteredPenaltyTransactions = allTransactions.filter(transaction => {
        if (transaction.costs?.category !== 'penalty') return false;
        const transactionDate = new Date(transaction.transaction_date);
        return transactionDate >= filterStartDate && transactionDate <= filterEndDate;
      });

      // Fetch match statistics for the period
      const { data: matches, error: matchError } = await supabase
        .from('matches')
        .select('match_id, match_date, is_submitted')
        .eq('is_submitted', true);

      if (matchError) throw matchError;

      // Filter matches for the season period
      const filteredMatches = matches?.filter(match => {
        const matchDate = new Date(match.match_date);
        return matchDate >= filterStartDate && matchDate <= filterEndDate;
      });

      // Group data by month
      const fieldCostsByMonth: Record<string, MonthlyFieldCosts> = {};
      const refereeCostsByMonth: Record<string, MonthlyRefereeCosts> = {};
      const finesByMonth: Record<string, MonthlyFines> = {};
      const matchStatsByMonth: Record<string, MonthlyMatchStats> = {};

      // Process filtered transactions
      filteredTransactions.forEach(transaction => {
        const date = new Date(transaction.matches.match_date);
        const season = getSeasonFromDate(date);
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        const monthName = month ? 
          date.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' }) :
          `Seizoen ${season}`;

        const isFieldCost = transaction.costs?.name?.toLowerCase().includes('veld') || 
                           transaction.costs?.description?.toLowerCase().includes('veld');
        const isRefereeCost = transaction.costs?.name?.toLowerCase().includes('scheidsrechter') || 
                             transaction.costs?.description?.toLowerCase().includes('scheidsrechter');

        if (isFieldCost) {
          const key = month ? monthKey : 'season-total';
          if (!fieldCostsByMonth[key]) {
            fieldCostsByMonth[key] = {
              month: monthName,
              season,
              totalCost: 0,
              matchCount: 0
            };
          }
          fieldCostsByMonth[key].totalCost += Number(transaction.amount);
          fieldCostsByMonth[key].matchCount++;
        }

        if (isRefereeCost) {
          const referee = transaction.matches?.referee || 'Onbekend';
          const refereeKey = month ? `${monthKey}-${referee}` : `season-${referee}`;
          
          if (!refereeCostsByMonth[refereeKey]) {
            refereeCostsByMonth[refereeKey] = {
              month: monthName,
              season,
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
      filteredPenaltyTransactions.forEach(transaction => {
        const date = new Date(transaction.transaction_date);
        const season = getSeasonFromDate(date);
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        const monthName = month ? 
          date.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' }) :
          `Seizoen ${season}`;

        const key = month ? monthKey : 'season-total';
        if (!finesByMonth[key]) {
          finesByMonth[key] = {
            month: monthName,
            season,
            totalFines: 0,
            fineCount: 0
          };
        }
        finesByMonth[key].totalFines += Number(transaction.amount);
        finesByMonth[key].fineCount++;
      });

      // Process match statistics
      filteredMatches?.forEach(match => {
        const date = new Date(match.match_date);
        const season = getSeasonFromDate(date);
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        const monthName = month ? 
          date.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' }) :
          `Seizoen ${season}`;

        const key = month ? monthKey : 'season-total';
        if (!matchStatsByMonth[key]) {
          matchStatsByMonth[key] = {
            month: monthName,
            season,
            totalMatches: 0
          };
        }
        matchStatsByMonth[key].totalMatches++;
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

  async getSeasonRefereePayments(seasonYear: number): Promise<MonthlyRefereeCosts[]> {
    try {
      const seasonData = getSeasonFromYear(seasonYear);
      const { startDate, endDate } = getSeasonDates(seasonData);
      
      const { data: transactions, error } = await (supabase as any)
        .from('team_costs')
        .select(`
          *,
          costs(name, description, category),
          matches(unique_number, match_date, referee)
        `)
        .not('matches', 'is', null);

      if (error) throw error;

      // Filter by season based on match_date and only match_cost category
      const filteredTransactions = transactions?.filter((transaction: any) => {
        if (!transaction.matches?.match_date) return false;
        const matchDate = new Date(transaction.matches.match_date);
        return matchDate >= startDate && matchDate <= endDate && transaction.costs?.category === 'match_cost';
      });

      const refereePayments: Record<string, MonthlyRefereeCosts> = {};

      filteredTransactions?.forEach((transaction: any) => {
        const isRefereeCost = transaction.costs?.name?.toLowerCase().includes('scheidsrechter') || 
                             transaction.costs?.description?.toLowerCase().includes('scheidsrechter');
        
        if (isRefereeCost) {
          const referee = transaction.matches?.referee || 'Onbekend';
          
          if (!refereePayments[referee]) {
            refereePayments[referee] = {
              month: 'Seizoen Totaal',
              season: seasonData.season,
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