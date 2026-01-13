import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { costSettingsService } from "@/services/financial";

interface Team {
  team_id: number;
  team_name: string;
  balance: number;
}

interface SubmittedMatch {
  match_id: number;
  home_team_id: number;
  away_team_id: number;
  is_submitted: boolean;
  created_at: string;
  teams_home: {
    team_name: string;
  };
  teams_away: {
    team_name: string;
  };
  match_date: string;
  unique_number: string;
}

interface TeamTransaction {
  team_id: number;
  amount: number;
  transaction_type: string;
  description?: string;
  transaction_date: string;
  cost_settings?: {
    name?: string;
    category?: string;
  };
  matches?: {
    unique_number?: string;
    match_date?: string;
  };
}

export interface TeamFinances {
  startCapital: number;
  fieldCosts: number;
  refereeCosts: number;
  fines: number;
  currentBalance: number;
  adjustments: number;
}

export interface FinancialStatistics {
  totalTeams: number;
  totalBalance: number;
  averageBalance: number;
  positiveTeams: number;
  negativeTeams: number;
  totalRevenue: number;
  totalExpenses: number;
}

export const useFinancialData = () => {
  // Fetch teams with their balances
  const teamsQuery = useQuery({
    queryKey: ['teams-financial'],
    queryFn: async (): Promise<Team[]> => {
      const { data, error } = await supabase
        .from('teams')
        .select('team_id, team_name') // balance verwijderd
        .order('team_name');
      
      if (error) throw error;
      return ((data || []) as any[]).map(team => ({ 
        ...team, 
        preferred_play_moments: team.preferred_play_moments as any 
      })) as Team[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - financial data changes less frequently
    gcTime: 15 * 60 * 1000, // 15 minutes cache
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true
  });

  // Fetch submitted matches for financial calculations
  const submittedMatchesQuery = useQuery({
    queryKey: ['submitted-matches'],
    queryFn: async (): Promise<SubmittedMatch[]> => {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          match_id,
          home_team_id,
          away_team_id,
          is_submitted,
          match_date,
          unique_number,
          teams_home:teams!home_team_id(team_name),
          teams_away:teams!away_team_id(team_name)
        `)
        .eq('is_submitted', true)
        .order('match_date', { ascending: false });
      
      if (error) throw error;
      return (data as any) || [];
    },
    staleTime: 3 * 60 * 1000, // 3 minutes - match submissions change regularly
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true
  });

  // Fetch cost settings for dynamic calculations
  const costSettingsQuery = useQuery({
    queryKey: ['cost-settings'],
    queryFn: costSettingsService.getCostSettings,
    staleTime: 10 * 60 * 1000, // 10 minutes - cost settings rarely change
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true
  });

  // Fetch transactions for detailed calculations
  const transactionsQuery = useQuery({
    queryKey: ['all-team-transactions'],
    queryFn: async (): Promise<TeamTransaction[]> => {
      const { data, error } = await supabase
        .from('team_costs')
        .select(`
          *,
          costs(name, category),
          matches(unique_number, match_date)
        `)
        .order('transaction_date', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(transaction => ({
        id: transaction.id,
        team_id: transaction.team_id,
        transaction_type: transaction.costs?.category as 'deposit' | 'penalty' | 'match_cost' | 'adjustment' || 'adjustment',
        amount: transaction.amount !== null && transaction.amount !== undefined 
          ? transaction.amount 
          : ((transaction.costs as any)?.amount || 0),
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
          match_date: transaction.matches.match_date
        } : undefined
      }));
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - transactions change frequently
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true
  });

  // Calculate detailed financial breakdown per team
  const calculateTeamFinances = (teamId: number): TeamFinances => {
    if (!transactionsQuery.data) {
      return {
        startCapital: 0,
        fieldCosts: 0,
        refereeCosts: 0,
        fines: 0,
        currentBalance: 0,
        adjustments: 0
      };
    }
    
    const teamTransactions = transactionsQuery.data.filter(t => t.team_id === teamId);
    
    // Startkapitaal: alle stortingen (deposits)
    const startCapital = teamTransactions
      .filter(t => t.transaction_type === 'deposit')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    // Veldkosten: alle match_cost transacties met 'veld' in de naam
    const fieldCosts = teamTransactions
      .filter(t => t.transaction_type === 'match_cost' && 
        (t.cost_settings?.name?.toLowerCase().includes('veld') || 
         t.description?.toLowerCase().includes('veld')))
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
    
    // Scheidsrechterkosten: alle match_cost transacties met 'scheidsrechter' in de naam
    const refereeCosts = teamTransactions
      .filter(t => t.transaction_type === 'match_cost' && 
        (t.cost_settings?.name?.toLowerCase().includes('scheidsrechter') || 
         t.description?.toLowerCase().includes('scheidsrechter')))
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
    
    // Boetes: alle penalty transacties
    const fines = teamTransactions
      .filter(t => t.transaction_type === 'penalty')
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
    
    // Correcties: alle adjustment transacties
    const adjustments = teamTransactions
      .filter(t => t.transaction_type === 'adjustment')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    // Huidig saldo: startkapitaal - alle kosten + correcties
    const currentBalance = startCapital - fieldCosts - refereeCosts - fines + adjustments;

    return {
      startCapital,
      fieldCosts,
      refereeCosts,
      fines,
      currentBalance,
      adjustments
    };
  };

  // Calculate overall financial statistics
  const calculateFinancialStatistics = (): FinancialStatistics => {
    if (!teamsQuery.data || !transactionsQuery.data) {
      return {
        totalTeams: 0,
        totalBalance: 0,
        averageBalance: 0,
        positiveTeams: 0,
        negativeTeams: 0,
        totalRevenue: 0,
        totalExpenses: 0
      };
    }

    const teams = teamsQuery.data;
    const totalBalance = teams.reduce((sum, team) => sum + team.balance, 0);
    const positiveTeams = teams.filter(team => team.balance > 0).length;
    const negativeTeams = teams.filter(team => team.balance < 0).length;

    const totalRevenue = transactionsQuery.data
      .filter(t => t.transaction_type === 'deposit' || 
        (t.transaction_type === 'adjustment' && Number(t.amount) > 0))
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpenses = transactionsQuery.data
      .filter(t => t.transaction_type === 'match_cost' || 
        t.transaction_type === 'penalty' ||
        (t.transaction_type === 'adjustment' && Number(t.amount) < 0))
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

    return {
      totalTeams: teams.length,
      totalBalance,
      averageBalance: teams.length > 0 ? totalBalance / teams.length : 0,
      positiveTeams,
      negativeTeams,
      totalRevenue,
      totalExpenses
    };
  };

  // Currency formatter
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // Get teams with calculated finances
  const getTeamsWithFinances = () => {
    if (!teamsQuery.data) return [];
    
    return teamsQuery.data.map(team => ({
      ...team,
      finances: calculateTeamFinances(team.team_id)
    }));
  };

  // Sort teams by various financial criteria
  const sortTeamsByFinances = (
    teams: Team[], 
    sortBy: 'name' | 'balance' | 'balance_desc' | 'expenses' | 'revenue' = 'name'
  ) => {
    if (!teams) return [];
    
    return [...teams].sort((a, b) => {
      const aFinances = calculateTeamFinances(a.team_id);
      const bFinances = calculateTeamFinances(b.team_id);
      
      switch (sortBy) {
        case 'name':
          return a.team_name.localeCompare(b.team_name);
        case 'balance':
          return aFinances.currentBalance - bFinances.currentBalance;
        case 'balance_desc':
          return bFinances.currentBalance - aFinances.currentBalance;
        case 'expenses':
          const aExpenses = aFinances.fieldCosts + aFinances.refereeCosts + aFinances.fines;
          const bExpenses = bFinances.fieldCosts + bFinances.refereeCosts + bFinances.fines;
          return bExpenses - aExpenses;
        case 'revenue':
          return bFinances.startCapital - aFinances.startCapital;
        default:
          return 0;
      }
    });
  };

  return {
    // Raw data
    teams: teamsQuery.data || [],
    submittedMatches: submittedMatchesQuery.data || [],
    costSettings: costSettingsQuery.data,
    transactions: transactionsQuery.data || [],
    
    // Loading states
    teamsLoading: teamsQuery.isLoading,
    matchesLoading: submittedMatchesQuery.isLoading,
    costSettingsLoading: costSettingsQuery.isLoading,
    transactionsLoading: transactionsQuery.isLoading,
    isLoading: teamsQuery.isLoading || submittedMatchesQuery.isLoading || 
               costSettingsQuery.isLoading || transactionsQuery.isLoading,
    
    // Error states
    teamsError: teamsQuery.error,
    matchesError: submittedMatchesQuery.error,
    costSettingsError: costSettingsQuery.error,
    transactionsError: transactionsQuery.error,
    hasError: !!teamsQuery.error || !!submittedMatchesQuery.error || 
              !!costSettingsQuery.error || !!transactionsQuery.error,
    
    // Calculated data
    financialStatistics: calculateFinancialStatistics(),
    teamsWithFinances: getTeamsWithFinances(),
    
    // Utility functions
    calculateTeamFinances,
    formatCurrency,
    sortTeamsByFinances,
    
    // Query controls
    refetchTeams: teamsQuery.refetch,
    refetchMatches: submittedMatchesQuery.refetch,
    refetchCostSettings: costSettingsQuery.refetch,
    refetchTransactions: transactionsQuery.refetch,
    refetchAll: () => Promise.all([
      teamsQuery.refetch(),
      submittedMatchesQuery.refetch(),
      costSettingsQuery.refetch(),
      transactionsQuery.refetch()
    ])
  };
}; 