import { supabase } from "@/integrations/supabase/client";

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
  matches?: RefereeMatchInfo[];
}

export interface RefereeMatchInfo {
  match_id: number;
  unique_number: string;
  match_date: string;
  home_team: string;
  away_team: string;
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
  // Get available seasons based on actual match data (not just transactions)
  async getAvailableSeasons(): Promise<SeasonData[]> {
    try {
      // Get seasons from both transactions AND matches for comprehensive coverage
      const [transactionResult, matchResult] = await Promise.all([
        supabase
          .from('team_costs')
          .select('transaction_date')
          .order('transaction_date', { ascending: false }),
        supabase
          .from('matches')
          .select('match_date')
          .eq('is_submitted', true)
          .order('match_date', { ascending: false })
      ]);

      const seasonYears = new Set<number>();
      
      // Process transaction dates
      transactionResult.data?.forEach(transaction => {
        const date = new Date(transaction.transaction_date);
        const year = date.getFullYear();
        const month = date.getMonth();
        const seasonStartYear = month >= 6 ? year : year - 1;
        seasonYears.add(seasonStartYear);
      });

      // Process match dates
      matchResult.data?.forEach(match => {
        const date = new Date(match.match_date);
        const year = date.getFullYear();
        const month = date.getMonth();
        const seasonStartYear = month >= 6 ? year : year - 1;
        seasonYears.add(seasonStartYear);
      });

      if (seasonYears.size === 0) return [];

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
          costs(name, category),
          matches(unique_number, match_date, referee)
        `)
        .gte('transaction_date', filterStartDate.toISOString().split('T')[0])
        .lte('transaction_date', filterEndDate.toISOString().split('T')[0]);

      if (error) throw error;

      // IMPORTANT: Fetch match data DIRECTLY for accurate referee information
      // This ensures we always have up-to-date referee data from the matches table
      const { data: allMatches, error: matchError } = await supabase
        .from('matches')
        .select(`
          match_id, 
          match_date, 
          referee, 
          unique_number,
          is_submitted,
          home_team_id,
          away_team_id,
          teams_home:teams!home_team_id(team_name),
          teams_away:teams!away_team_id(team_name)
        `)
        .eq('is_submitted', true)
        .gte('match_date', filterStartDate.toISOString())
        .lte('match_date', filterEndDate.toISOString())
        .order('match_date', { ascending: false });

      if (matchError) throw matchError;

      // Fetch cost settings for referee cost calculation
      const { data: costSettings } = await supabase
        .from('costs')
        .select('id, name, amount, category')
        .eq('category', 'match_cost')
        .eq('is_active', true);

      const refereeCostSetting = costSettings?.find(cs => 
        cs.name?.toLowerCase().includes('scheidsrechter') || 
        cs.name?.toLowerCase().includes('scheids')
      );
      const refereeCostPerMatch = refereeCostSetting?.amount || 0;

      // Group data by month
      const fieldCostsByMonth: Record<string, MonthlyFieldCosts> = {};
      const finesByMonth: Record<string, MonthlyFines> = {};
      const matchStatsByMonth: Record<string, MonthlyMatchStats> = {};

      // Process transactions for field costs and fines
      transactions?.forEach(transaction => {
        const date = new Date(transaction.transaction_date);
        const season = getSeasonFromDate(date);
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        const monthName = (month && year) ? 
          date.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' }) :
          `Seizoen ${season}`;

        const category = transaction.costs?.category;
        const costName = transaction.costs?.name?.toLowerCase() || '';

        // Field costs
        if (category === 'match_cost' && costName.includes('veld')) {
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

      // Build referee costs DIRECTLY from matches table
      // This ensures the data is always current and accurate
      const refereeCostsByReferee: Record<string, MonthlyRefereeCosts> = {};

      allMatches?.forEach(match => {
        const date = new Date(match.match_date);
        const season = getSeasonFromDate(date);
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        const monthName = (month && year) ? 
          date.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' }) :
          `Seizoen ${season}`;

        // Track match stats
        const statsKey = (month && year) ? monthKey : 'season-total';
        if (!matchStatsByMonth[statsKey]) {
          matchStatsByMonth[statsKey] = {
            month: monthName,
            season,
            totalMatches: 0
          };
        }
        matchStatsByMonth[statsKey].totalMatches++;

        // Track referee data directly from matches
        const referee = match.referee || 'Niet toegewezen';
        const refereeKey = (month && year) ? `${monthKey}-${referee}` : `season-${referee}`;
        
        if (!refereeCostsByReferee[refereeKey]) {
          refereeCostsByReferee[refereeKey] = {
            month: monthName,
            season,
            referee,
            totalCost: 0,
            matchCount: 0,
            matches: []
          };
        }
        
        // Add match info
        // Each team pays 7€, so per match it's 14€ total (7€ from home team + 7€ from away team)
        refereeCostsByReferee[refereeKey].matchCount++;
        refereeCostsByReferee[refereeKey].totalCost += refereeCostPerMatch * 2;
        refereeCostsByReferee[refereeKey].matches?.push({
          match_id: match.match_id,
          unique_number: match.unique_number || `#${match.match_id}`,
          match_date: match.match_date,
          home_team: (match.teams_home as any)?.team_name || 'Onbekend',
          away_team: (match.teams_away as any)?.team_name || 'Onbekend'
        });
      });

      const fieldCosts = Object.values(fieldCostsByMonth);
      const refereeCosts = Object.values(refereeCostsByReferee).sort((a, b) => b.matchCount - a.matchCount);
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
      
      // Fetch cost setting for referee payments
      const { data: costSettings } = await supabase
        .from('costs')
        .select('id, name, amount, category')
        .eq('category', 'match_cost')
        .eq('is_active', true);

      const refereeCostSetting = costSettings?.find(cs => 
        cs.name?.toLowerCase().includes('scheidsrechter') || 
        cs.name?.toLowerCase().includes('scheids')
      );
      const refereeCostPerMatch = refereeCostSetting?.amount || 0;

      // Get referee data DIRECTLY from matches table - this is the source of truth
      const { data: allMatches, error: matchError } = await supabase
        .from('matches')
        .select(`
          match_id, 
          match_date, 
          referee,
          unique_number,
          teams_home:teams!home_team_id(team_name),
          teams_away:teams!away_team_id(team_name)
        `)
        .eq('is_submitted', true)
        .gte('match_date', startDate.toISOString())
        .lte('match_date', endDate.toISOString())
        .order('match_date', { ascending: false });

      if (matchError) throw matchError;

      const refereePayments: Record<string, {
        month: string;
        season: string;
        referee: string;
        totalCost: number;
        matchCount: number;
        matches: RefereeMatchInfo[];
      }> = {};

      allMatches?.forEach(match => {
        const referee = match.referee || 'Niet toegewezen';
        
        if (!refereePayments[referee]) {
          refereePayments[referee] = {
            month: 'Seizoen Totaal',
            season: seasonData.season,
            referee,
            totalCost: 0,
            matchCount: 0,
            matches: []
          };
        }
        
        // Each team pays 7€, so per match it's 14€ total (7€ from home team + 7€ from away team)
        refereePayments[referee].matchCount++;
        refereePayments[referee].totalCost += refereeCostPerMatch * 2;
        refereePayments[referee].matches.push({
          match_id: match.match_id,
          unique_number: match.unique_number || `#${match.match_id}`,
          match_date: match.match_date,
          home_team: (match.teams_home as any)?.team_name || 'Onbekend',
          away_team: (match.teams_away as any)?.team_name || 'Onbekend'
        });
      });

      return Object.values(refereePayments)
        .sort((a, b) => b.matchCount - a.matchCount)
        .map(ref => ({
          month: ref.month,
          season: ref.season,
          referee: ref.referee,
          totalCost: ref.totalCost,
          matchCount: ref.matchCount,
          matches: ref.matches
        }));
    } catch (error) {
      console.error('Error fetching season referee payments:', error);
      throw error;
    }
  }
};