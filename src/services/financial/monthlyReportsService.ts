import { supabase } from "@/integrations/supabase/client";
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
  uniqueMatches?: Set<number>; // Internal tracking for unique match IDs
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
  // Season runs from July to June
  const startDate = new Date(seasonData.startYear, 6, 1); // July 1st (month is 0-indexed)
  const endDate = new Date(seasonData.endYear, 5, 30); // June 30th
  return { startDate, endDate };
};

const getSeasonFromDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed
  // If month is July (6) or later, it's the start of a new season
  if (month >= 6) {
    return `${year}/${year + 1}`;
  } else {
    return `${year - 1}/${year}`;
  }
};

export const monthlyReportsService = {
  // Get available seasons based on actual transaction data
  async getAvailableSeasons(): Promise<SeasonData[]> {
    try {
      const { data: transactions, error } = await supabase
        .from('team_costs')
        .select('transaction_date')
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      if (!transactions || transactions.length === 0) return [];

      // Get unique season years from transaction dates
      const seasonYears = new Set<number>();
      
      transactions.forEach(transaction => {
        const date = new Date(transaction.transaction_date);
        const year = date.getFullYear();
        const month = date.getMonth(); // 0-indexed
        
        // If month is July (6) or later, it's the start of a new season
        const seasonStartYear = month >= 6 ? year : year - 1;
        seasonYears.add(seasonStartYear);
      });

      // Convert to array and sort descending (newest first)
      return Array.from(seasonYears)
        .sort((a, b) => b - a)
        .map(year => getSeasonFromYear(year));
    } catch (error) {
      console.error('Error fetching available seasons:', error);
      return [];
    }
  },

  async getSeasonReport(seasonYear: number, month?: number, year?: number): Promise<MonthlyReport> {
    try {
      const seasonData = getSeasonFromYear(seasonYear);
      const { startDate, endDate } = getSeasonDates(seasonData);
      
      // Adjust date range if month is specified  
      let filterStartDate = startDate;
      let filterEndDate = endDate;
      
      if (month && year) {
        filterStartDate = new Date(year, month - 1, 1);
        filterEndDate = new Date(year, month, 0, 23, 59, 59);
      }

      // Fetch all team_costs transactions for the season period
      const { data: transactions, error } = await supabase
        .from('team_costs')
        .select(`
          *,
          costs(name, description, category),
          matches(unique_number, match_date, referee)
        `)
        .gte('transaction_date', filterStartDate.toISOString().split('T')[0])
        .lte('transaction_date', filterEndDate.toISOString().split('T')[0]);

      if (error) throw error;

      // Also fetch match data for referee information
      const { data: allMatches, error: matchError } = await supabase
        .from('matches')
        .select('match_id, match_date, referee, is_submitted')
        .eq('is_submitted', true)
        .gte('match_date', filterStartDate.toISOString())
        .lte('match_date', filterEndDate.toISOString());

      if (matchError) throw matchError;

      // Create a map of match_id to referee for transactions that have match_id
      const matchRefereeMap = new Map();
      allMatches?.forEach(match => {
        matchRefereeMap.set(match.match_id, match.referee || 'Onbekend');
      });

      // Group data by month
      const fieldCostsByMonth: Record<string, MonthlyFieldCosts> = {};
      const refereeCostsByMonth: Record<string, MonthlyRefereeCosts> = {};
      const finesByMonth: Record<string, MonthlyFines> = {};
      const matchStatsByMonth: Record<string, MonthlyMatchStats> = {};

      // Process transactions based on transaction_date
      transactions?.forEach(transaction => {
        const date = new Date(transaction.transaction_date);
        const season = getSeasonFromDate(date);
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        const monthName = (month && year) ? 
          date.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' }) :
          `Seizoen ${season}`;

        const category = transaction.costs?.category;
        const costName = transaction.costs?.name?.toLowerCase() || '';
        const costDescription = transaction.costs?.description?.toLowerCase() || '';

        // Field costs
        if (category === 'match_cost' && (costName.includes('veld') || costDescription.includes('veld'))) {
          const key = (month && year) ? monthKey : 'season-total';
          if (!fieldCostsByMonth[key]) {
            fieldCostsByMonth[key] = {
              month: monthName,
              season,
              totalCost: 0,
              matchCount: 0
            };
          }
          fieldCostsByMonth[key].totalCost += Number(transaction.amount || 0);
          fieldCostsByMonth[key].matchCount++;
        }

        // Referee costs - Fix to count unique matches per referee
        if (category === 'match_cost' && (costName.includes('scheidsrechter') || costDescription.includes('scheidsrechter'))) {
          // Get referee from match if available, otherwise use 'Onbekend'
          const referee = transaction.match_id ? 
            matchRefereeMap.get(transaction.match_id) || 'Onbekend' : 
            'Onbekend';
          
          const refereeKey = (month && year) ? `${monthKey}-${referee}` : `season-${referee}`;
          
          if (!refereeCostsByMonth[refereeKey]) {
            refereeCostsByMonth[refereeKey] = {
              month: monthName,
              season,
              referee,
              totalCost: 0,
              matchCount: 0,
              uniqueMatches: new Set() // Track unique matches
            };
          }
          refereeCostsByMonth[refereeKey].totalCost += Number(transaction.amount || 0);
          // Only count unique matches
          if (transaction.match_id && !refereeCostsByMonth[refereeKey].uniqueMatches.has(transaction.match_id)) {
            refereeCostsByMonth[refereeKey].matchCount++;
            refereeCostsByMonth[refereeKey].uniqueMatches.add(transaction.match_id);
          }
        }

        // Penalties/Fines
        if (category === 'penalty') {
          const key = (month && year) ? monthKey : 'season-total';
          if (!finesByMonth[key]) {
            finesByMonth[key] = {
              month: monthName,
              season,
              totalFines: 0,
              fineCount: 0
            };
          }
          finesByMonth[key].totalFines += Number(transaction.amount || 0);
          finesByMonth[key].fineCount++;
        }
      });

      // Process match statistics based on submitted matches in the period
      allMatches?.forEach(match => {
        const date = new Date(match.match_date);
        const season = getSeasonFromDate(date);
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        const monthName = (month && year) ? 
          date.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' }) :
          `Seizoen ${season}`;

        const key = (month && year) ? monthKey : 'season-total';
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
      const refereeCosts = Object.values(refereeCostsByMonth).map(ref => ({
        month: ref.month,
        season: ref.season,
        referee: ref.referee,
        totalCost: ref.totalCost,
        matchCount: ref.matchCount
      }));
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
      console.error('Error fetching season report:', error);
      throw error;
    }
  },

  async getSeasonRefereePayments(seasonYear: number): Promise<MonthlyRefereeCosts[]> {
    try {
      const seasonData = getSeasonFromYear(seasonYear);
      const { startDate, endDate } = getSeasonDates(seasonData);
      
      // Fetch transactions based on transaction_date
      const { data: transactions, error } = await supabase
        .from('team_costs')
        .select(`
          *,
          costs(name, description, category),
          matches(unique_number, match_date, referee)
        `)
        .gte('transaction_date', startDate.toISOString().split('T')[0])
        .lte('transaction_date', endDate.toISOString().split('T')[0]);

      if (error) throw error;

      // Also fetch match data for referee information
      const { data: allMatches, error: matchError } = await supabase
        .from('matches')
        .select('match_id, referee')
        .eq('is_submitted', true);

      if (matchError) throw matchError;

      // Create a map of match_id to referee
      const matchRefereeMap = new Map();
      allMatches?.forEach(match => {
        matchRefereeMap.set(match.match_id, match.referee || 'Onbekend');
      });

      const refereePayments: Record<string, { 
        month: string; 
        season: string; 
        referee: string; 
        totalCost: number; 
        matchCount: number;
        uniqueMatches: Set<number>;
      }> = {};

      // Filter referee cost transactions
      transactions?.forEach((transaction: any) => {
        const isRefereeCost = transaction.costs?.category === 'match_cost' && 
          (transaction.costs?.name?.toLowerCase().includes('scheidsrechter') || 
           transaction.costs?.description?.toLowerCase().includes('scheidsrechter'));
        
        if (isRefereeCost) {
          const referee = transaction.match_id ? 
            matchRefereeMap.get(transaction.match_id) || 'Onbekend' : 
            'Onbekend';
          
          if (!refereePayments[referee]) {
            refereePayments[referee] = {
              month: 'Seizoen Totaal',
              season: seasonData.season,
              referee,
              totalCost: 0,
              matchCount: 0,
              uniqueMatches: new Set()
            };
          }
          refereePayments[referee].totalCost += Number(transaction.amount || 0);
          // Only count unique matches
          if (transaction.match_id && !refereePayments[referee].uniqueMatches.has(transaction.match_id)) {
            refereePayments[referee].matchCount++;
            refereePayments[referee].uniqueMatches.add(transaction.match_id);
          }
        }
      });

      return Object.values(refereePayments).map(ref => ({
        month: ref.month,
        season: ref.season,
        referee: ref.referee,
        totalCost: ref.totalCost,
        matchCount: ref.matchCount
      }));
    } catch (error) {
      console.error('Error fetching season referee payments:', error);
      throw error;
    }
  }
};