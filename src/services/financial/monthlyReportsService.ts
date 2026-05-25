import { supabase } from "@/integrations/supabase/client";
import { resolveTeamCostAmount } from "./teamCostCategories";

/** Eén geboekte veldlijn (per ploeg); wedstrijdinfo uit join. */
export interface FieldCostLineDetail {
  matchId: number;
  uniqueNumber: string;
  matchDate: string | null;
  homeTeam: string;
  awayTeam: string;
  billedTeam: string;
  amount: number;
}

export interface MonthlyFieldCosts {
  month: string;
  season: string;
  totalCost: number;
  /** Aantal wedstrijden met minstens één geboekte veldtransactie (distinct match_id) */
  matchCount: number;
  /** Totaal aantal veld-boekingen (meestal 2× matchCount) */
  bookingLines?: number;
  /** Gedetailleerde boekingsregels (compact voor modal) */
  lines?: FieldCostLineDetail[];
}

/** Eén boete-regel in team_costs */
export interface FineLineDetail {
  amount: number;
  teamId: number | null;
  teamName: string;
  matchId: number | null;
  uniqueNumber: string;
  matchDate: string | null;
  homeTeam: string;
  awayTeam: string;
  costLabel: string;
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
  lines?: FineLineDetail[];
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
  adminCosts: MonthlyFieldCosts[];
  fines: MonthlyFines[];
  matchStats: MonthlyMatchStats[];
  totalFieldCosts: number;
  totalRefereeCosts: number;
  totalAdminCosts: number;
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
  // Season runs from July to June - use UTC to avoid timezone issues
  const startDate = new Date(Date.UTC(seasonData.startYear, 6, 1)); // July 1st (month is 0-indexed)
  const endDate = new Date(Date.UTC(seasonData.endYear, 5, 30, 23, 59, 59)); // June 30th
  return { startDate, endDate };
};

/** YYYY-MM uit DB-datum (YYYY-MM-DD of ISO) — voorkomt dat locale timezone de maand verschuift. */
function calendarMonthKeyFromDbDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const s = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 7);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function seasonFromCalendarMonthKey(monthKey: string): string {
  const [yStr, mStr] = monthKey.split('-');
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10);
  if (Number.isNaN(y) || Number.isNaN(m)) return '';
  if (m >= 7) return `${y}/${y + 1}`;
  return `${y - 1}/${y}`;
}

function nlMonthYearFromKey(monthKey: string): string {
  const [yStr, mStr] = monthKey.split('-');
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10);
  if (Number.isNaN(y) || Number.isNaN(m)) return monthKey;
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });
}

function expenseAmount(transaction: {
  amount?: number | string | null;
  team_id: number;
  costs?: { name?: string | null; category?: string | null; amount?: number | string | null } | null;
}): number {
  return Math.abs(
    resolveTeamCostAmount({
      amount: transaction.amount,
      team_id: transaction.team_id,
      cost_settings: transaction.costs
        ? {
            name: transaction.costs.name,
            category: transaction.costs.category,
            amount: transaction.costs.amount,
          }
        : undefined,
    }),
  );
}

/** Zelfde logica als sync-match-costs edge function */
function isFieldCostName(name: string | null | undefined): boolean {
  const n = (name || "").toLowerCase();
  return n.includes("veld") || n.includes("field");
}

function isAdminCostName(name: string | null | undefined): boolean {
  const n = (name || "").toLowerCase();
  return n.includes("administratie") || n.includes("admin");
}

type FieldAdminBucket = {
  month: string;
  season: string;
  totalCost: number;
  matchIds: Set<number>;
  lineCount: number;
  lines?: FieldCostLineDetail[];
};

function finalizeFieldAdminBucket(b: FieldAdminBucket): MonthlyFieldCosts {
  const matchCount =
    b.matchIds.size > 0
      ? b.matchIds.size
      : b.lineCount > 0
        ? Math.max(1, Math.ceil(b.lineCount / 2))
        : 0;
  const lines = [...(b.lines || [])].sort((a, b) => {
    const da = a.matchDate || "";
    const db = b.matchDate || "";
    if (da !== db) return da.localeCompare(db);
    return a.uniqueNumber.localeCompare(b.uniqueNumber, "nl");
  });
  return {
    month: b.month,
    season: b.season,
    totalCost: b.totalCost,
    matchCount,
    bookingLines: b.lineCount,
    lines
  };
}

function rowLabelFromMatchJoin(m: any): {
  uniqueNumber: string;
  matchDate: string | null;
  homeTeam: string;
  awayTeam: string;
} {
  if (!m) {
    return { uniqueNumber: "—", matchDate: null, homeTeam: "—", awayTeam: "—" };
  }
  const th = m.teams_home as { team_name?: string } | undefined;
  const ta = m.teams_away as { team_name?: string } | undefined;
  return {
    uniqueNumber: m.unique_number || "—",
    matchDate: m.match_date ?? null,
    homeTeam: th?.team_name || "—",
    awayTeam: ta?.team_name || "—"
  };
}

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
        // Use UTC dates to avoid timezone issues
        filterStartDate = new Date(Date.UTC(year, month - 1, 1));
        filterEndDate = new Date(Date.UTC(year, month, 0, 23, 59, 59));
      }

      // Fetch all team_costs transactions for the season period
      // IMPORTANT: Use a large range to avoid the default 1000-row Supabase limit
      const startDateStr = filterStartDate.toISOString().split('T')[0];
      const endDateStr = filterEndDate.toISOString().split('T')[0];

      const selectTeamCosts = `
            *,
            costs(name, category, amount),
            teams!team_costs_team_id_fkey(team_name),
            matches(
              unique_number,
              match_date,
              teams_home:teams!home_team_id(team_name),
              teams_away:teams!away_team_id(team_name)
            )
          `;

      const fetchTransactions = async () => {
        let allTransactions: any[] = [];
        let from = 0;
        const batchSize = 1000;

        while (true) {
          const { data: batch, error: batchError } = await supabase
            .from('team_costs')
            .select(selectTeamCosts)
            .gte('transaction_date', startDateStr)
            .lte('transaction_date', endDateStr)
            .range(from, from + batchSize - 1);

          if (batchError) throw batchError;
          if (!batch || batch.length === 0) break;

          allTransactions = allTransactions.concat(batch);
          if (batch.length < batchSize) break;
          from += batchSize;
        }

        return allTransactions;
      };

      const [transactions, matchesResult, costSettingsResult] = await Promise.all([
        fetchTransactions(),
        supabase
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
          .gte('match_date', startDateStr)
          .lte('match_date', endDateStr)
          .order('match_date', { ascending: false }),
        supabase
          .from('costs')
          .select('id, name, amount, category')
          .eq('category', 'match_cost'),
      ]);

      const { data: allMatches, error: matchError } = matchesResult;
      if (matchError) throw matchError;

      const { data: costSettings } = costSettingsResult;

      const refereeCostSetting = costSettings?.find(cs => 
        cs.name?.toLowerCase().includes('scheidsrechter') || 
        cs.name?.toLowerCase().includes('scheids')
      );
      const refereeCostPerMatch = refereeCostSetting?.amount || 0;

      // Group data by month
      const fieldCostsByMonth: Record<string, FieldAdminBucket> = {};
      const adminCostsByMonth: Record<string, FieldAdminBucket> = {};
      const finesByMonth: Record<string, MonthlyFines> = {};
      const matchStatsByMonth: Record<string, MonthlyMatchStats> = {};

      // Process transactions for field costs and fines
      transactions?.forEach(transaction => {
        const txMonthKey = calendarMonthKeyFromDbDate(transaction.transaction_date);
        if (!txMonthKey) return;

        const key = month && year ? txMonthKey : 'season-total';
        const monthName =
          month && year ? nlMonthYearFromKey(txMonthKey) : `Seizoen ${seasonData.season}`;
        const seasonLabel =
          month && year ? seasonFromCalendarMonthKey(txMonthKey) : seasonData.season;

        const category = transaction.costs?.category;
        const costNameRaw = transaction.costs?.name;

        // Field costs (zelfde detectie als sync-match-costs: veld / field)
        if (category === 'match_cost' && isFieldCostName(costNameRaw)) {
          if (!fieldCostsByMonth[key]) {
            fieldCostsByMonth[key] = {
              month: monthName,
              season: seasonLabel,
              totalCost: 0,
              matchIds: new Set(),
              lineCount: 0,
              lines: [],
            };
          }
          fieldCostsByMonth[key].totalCost += expenseAmount(transaction);
          fieldCostsByMonth[key].lineCount++;
          const mid = transaction.match_id;
          if (typeof mid === 'number' && mid > 0) {
            fieldCostsByMonth[key].matchIds.add(mid);
          }
          const m = transaction.matches as { unique_number?: string; match_date?: string; teams_home?: { team_name?: string }; teams_away?: { team_name?: string } } | null;
          const meta = rowLabelFromMatchJoin(m);
          const teamRow = transaction.teams as { team_name?: string } | null | undefined;
          const billedTeam =
            teamRow?.team_name ||
            (typeof transaction.team_id === "number" ? `Team ${transaction.team_id}` : "—");
          fieldCostsByMonth[key].lines!.push({
            matchId: typeof mid === "number" && mid > 0 ? mid : 0,
            uniqueNumber: meta.uniqueNumber,
            matchDate: meta.matchDate,
            homeTeam: meta.homeTeam,
            awayTeam: meta.awayTeam,
            billedTeam,
            amount: expenseAmount(transaction),
          });
        }

        // Admin costs
        if (category === 'match_cost' && isAdminCostName(costNameRaw)) {
          if (!adminCostsByMonth[key]) {
            adminCostsByMonth[key] = {
              month: monthName,
              season: seasonLabel,
              totalCost: 0,
              matchIds: new Set(),
              lineCount: 0,
              lines: [],
            };
          }
          adminCostsByMonth[key].totalCost += expenseAmount(transaction);
          adminCostsByMonth[key].lineCount++;
          const mid = transaction.match_id;
          if (typeof mid === 'number' && mid > 0) {
            adminCostsByMonth[key].matchIds.add(mid);
          }
        }

        // Penalties/Fines
        if (category === 'penalty') {
          if (!finesByMonth[key]) {
            finesByMonth[key] = {
              month: monthName,
              season: seasonLabel,
              totalFines: 0,
              fineCount: 0,
              lines: [],
            };
          }
          finesByMonth[key].totalFines += expenseAmount(transaction);
          finesByMonth[key].fineCount++;
          const m = transaction.matches as { unique_number?: string; match_date?: string; teams_home?: { team_name?: string }; teams_away?: { team_name?: string } } | null;
          const meta = rowLabelFromMatchJoin(m);
          const teamRow = transaction.teams as { team_name?: string } | null | undefined;
          const billedTeam =
            teamRow?.team_name ||
            (typeof transaction.team_id === "number" ? `Team ${transaction.team_id}` : "—");
          finesByMonth[key].lines!.push({
            amount: expenseAmount(transaction),
            teamId: typeof transaction.team_id === "number" ? transaction.team_id : null,
            teamName: billedTeam,
            matchId: typeof transaction.match_id === "number" ? transaction.match_id : null,
            uniqueNumber: meta.uniqueNumber,
            matchDate: meta.matchDate,
            homeTeam: meta.homeTeam,
            awayTeam: meta.awayTeam,
            costLabel: costNameRaw || "Boete",
          });
        }
      });

      // Build referee costs DIRECTLY from matches table (competitie + beker + play-offs)
      const refereeCostsByReferee: Record<string, MonthlyRefereeCosts> = {};

      allMatches?.forEach(match => {
        const mMonthKey = calendarMonthKeyFromDbDate(match.match_date);
        if (!mMonthKey) return;

        const seasonLabel =
          month && year ? seasonFromCalendarMonthKey(mMonthKey) : seasonData.season;
        const monthName =
          month && year ? nlMonthYearFromKey(mMonthKey) : `Seizoen ${seasonData.season}`;

        // Track match stats
        const statsKey = month && year ? mMonthKey : 'season-total';
        if (!matchStatsByMonth[statsKey]) {
          matchStatsByMonth[statsKey] = {
            month: monthName,
            season: seasonLabel,
            totalMatches: 0
          };
        }
        matchStatsByMonth[statsKey].totalMatches++;

        // Track referee data directly from matches
        const referee = match.referee || 'Niet toegewezen';
        const refereeKey = month && year ? `${mMonthKey}-${referee}` : `season-${referee}`;

        if (!refereeCostsByReferee[refereeKey]) {
          refereeCostsByReferee[refereeKey] = {
            month: monthName,
            season: seasonLabel,
            referee,
            totalCost: 0,
            matchCount: 0,
            matches: []
          };
        }

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

      const fieldCosts = Object.values(fieldCostsByMonth).map(finalizeFieldAdminBucket);
      const adminCosts = Object.values(adminCostsByMonth).map(finalizeFieldAdminBucket);
      const refereeCosts = Object.values(refereeCostsByReferee).sort((a, b) => b.matchCount - a.matchCount);
      const fines = Object.values(finesByMonth).map((f) => ({
        ...f,
        lines: f.lines
          ? [...f.lines].sort((a, b) => {
              const da = a.matchDate || "";
              const db = b.matchDate || "";
              if (da !== db) return da.localeCompare(db);
              const c = a.teamName.localeCompare(b.teamName, "nl");
              if (c !== 0) return c;
              return a.costLabel.localeCompare(b.costLabel, "nl");
            })
          : [],
      }));
      const matchStats = Object.values(matchStatsByMonth);

      return {
        fieldCosts,
        refereeCosts,
        adminCosts,
        fines,
        matchStats,
        totalFieldCosts: fieldCosts.reduce((sum, item) => sum + item.totalCost, 0),
        totalRefereeCosts: refereeCosts.reduce((sum, item) => sum + item.totalCost, 0),
        totalAdminCosts: adminCosts.reduce((sum, item) => sum + item.totalCost, 0),
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