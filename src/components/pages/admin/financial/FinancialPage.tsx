import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Euro, TrendingDown, TrendingUp, List, Calendar, ChevronRight, RefreshCw } from "lucide-react";
import { FinancialTeamDetailModal, FinancialSettingsModal } from "@/components/modals";
import { FinancialMonthlyReportsModal } from "@/components/modals";
import { costSettingsService } from "@/services/financial";
import { matchCostService } from "@/services/financial/matchCostService";
import { useToast } from "@/hooks/use-toast";

interface Team {
  team_id: number;
  team_name: string;
}

interface SubmittedMatch {
  match_id: number;
  home_team_id: number;
  away_team_id: number;
  is_submitted: boolean;
  teams_home: {
    team_name: string;
  };
  teams_away: {
    team_name: string;
  };
  match_date: string;
  unique_number: string;
}

const AdminFinancialPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [costListModalOpen, setCostListModalOpen] = useState(false);
  const [monthlyReportsModalOpen, setMonthlyReportsModalOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Fetch teams (without balance since we calculate it real-time)
  const {
    data: teams,
    isLoading: loadingTeams
  } = useQuery({
    queryKey: ['teams-financial'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('teams').select('team_id, team_name').order('team_name');
      if (error) throw error;
      return data as Team[];
    }
  });

  // Fetch submitted matches for financial calculations
  const {
    data: submittedMatches,
    isLoading: loadingMatches
  } = useQuery({
    queryKey: ['submitted-matches'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('matches').select(`
          match_id,
          home_team_id,
          away_team_id,
          is_submitted,
          match_date,
          unique_number,
          teams_home:teams!home_team_id(team_name),
          teams_away:teams!away_team_id(team_name)
        `).eq('is_submitted', true).order('match_date', {
        ascending: false
      });
      if (error) throw error;
      return data as SubmittedMatch[];
    }
  });

  // Fetch cost settings for dynamic calculations
  const {
    data: costSettings
  } = useQuery({
    queryKey: ['cost-settings'],
    queryFn: costSettingsService.getCostSettings
  });

  // Efficient: fetch alle transacties in één query, inclusief costs.amount
  const {
    data: allTransactions,
    isLoading: loadingTransactions
  } = useQuery({
    queryKey: ['all-team-transactions'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('team_costs').select('*, costs(name, description, category, amount), matches(unique_number, match_date)');
      if (error) throw error;
      return (data || []).map(transaction => ({
        id: transaction.id,
        team_id: transaction.team_id,
        amount: transaction.amount ?? (transaction.costs && typeof (transaction.costs as any).amount === 'number' ? (transaction.costs as any).amount : 0),
        cost_setting_id: transaction.cost_setting_id,
        match_id: transaction.match_id,
        transaction_date: transaction.transaction_date,
        description: transaction.costs?.description || null,
        cost_settings: transaction.costs ? {
          name: transaction.costs.name,
          description: transaction.costs.description,
          category: transaction.costs.category
        } : undefined,
        matches: transaction.matches ? {
          unique_number: transaction.matches.unique_number,
          match_date: transaction.matches.match_date
        } : undefined
      }));
    }
  });

  // Bereken per team de financiële data in-memory
  const calculateTeamFinances = (teamId: number) => {
    if (!allTransactions) return {
      startCapital: 0,
      fieldCosts: 0,
      refereeCosts: 0,
      fines: 0,
      currentBalance: 0
    };
    const teamTransactions = allTransactions.filter((t: any) => t.team_id === teamId);
    const startCapital = teamTransactions.filter(t => t.cost_settings?.category === 'deposit').reduce((sum, t) => sum + Number(t.amount), 0);
    const fieldCosts = teamTransactions.filter(t => t.cost_settings?.category === 'match_cost' && (t.cost_settings?.name?.toLowerCase().includes('veld') || t.cost_settings?.description?.toLowerCase().includes('veld') || (t.description?.toLowerCase() || '').includes('veld'))).reduce((sum, t) => sum + Number(t.amount), 0);
    const refereeCosts = teamTransactions.filter(t => t.cost_settings?.category === 'match_cost' && (t.cost_settings?.name?.toLowerCase().includes('scheids') || t.cost_settings?.description?.toLowerCase().includes('scheids') || (t.description?.toLowerCase() || '').includes('scheids'))).reduce((sum, t) => sum + Number(t.amount), 0);
    const fines = teamTransactions.filter(t => t.cost_settings?.category === 'penalty').reduce((sum, t) => sum + Number(t.amount), 0);
    const adjustments = teamTransactions.filter(t => t.cost_settings?.category === 'adjustment' || t.cost_settings?.category === 'other').reduce((sum, t) => sum + Number(t.amount), 0);
    const currentBalance = startCapital - fieldCosts - refereeCosts - fines + adjustments;
    return {
      startCapital,
      fieldCosts,
      refereeCosts,
      fines,
      currentBalance
    };
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const handleTeamClick = (team: Team) => {
    setSelectedTeam(team);
    setTeamModalOpen(true);
  };

  if (loadingTeams || loadingMatches || loadingTransactions) {
    return <div className="flex items-center justify-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>;
  }

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold flex items-center gap-2" style={{ color: 'var(--primary)' }}>
          <Euro className="h-5 w-5" />
          Financieel Beheer
        </h2>
      </div>

      <section>
        <Card>
          <CardHeader>
            <div className="flex flex-col justify-between gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg">
                  Teams Financieel Overzicht
                </CardTitle>
                <CardDescription>
                  Klik op een team voor details en transacties.
                </CardDescription>
              </div>
              <div className="flex gap-2 flex-shrink-0 w-full flex-wrap">
                <button 
                  onClick={async () => {
                    setSyncing(true);
                    const result = await matchCostService.syncAllMatchCosts();
                    setSyncing(false);
                    toast({
                      title: result.success ? "Synchronisatie voltooid" : "Fout bij synchroniseren",
                      description: result.message,
                      variant: result.success ? "default" : "destructive",
                    });
                    // Refresh data
                    queryClient.invalidateQueries({ queryKey: ['all-team-transactions'] });
                    queryClient.invalidateQueries({ queryKey: ['submitted-matches'] });
                  }}
                  disabled={syncing}
                  className="btn btn--outline flex items-center gap-2 flex-1 justify-center min-w-[120px]"
                >
                  {syncing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {syncing ? "Synchroniseren..." : "Sync Kosten"}
                </button>
                <button onClick={() => setCostListModalOpen(true)} className="btn btn--outline flex items-center gap-2 flex-1 justify-center min-w-[120px]">
                  <List className="h-4 w-4" />
                  Kostenlijst
                </button>
                <button onClick={() => setMonthlyReportsModalOpen(true)} className="btn btn--outline flex items-center gap-2 flex-1 justify-center min-w-[120px]">
                  <Calendar className="h-4 w-4" />
                  Maandrapport
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Mobile Card Layout - Always visible */}
            <div className="divide-y divide-border">
              {teams?.map(team => {
                const finances = calculateTeamFinances(team.team_id);
                const isNegative = finances.currentBalance < 0;
                return (
                  <div 
                    key={team.team_id}
                    className="p-4 cursor-pointer hover:bg-muted/50 active:bg-muted transition-colors"
                    onClick={() => handleTeamClick(team)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{team.team_name}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span>Veld: <span className="text-destructive">{formatCurrency(finances.fieldCosts)}</span></span>
                          <span>Scheids: <span className="text-destructive">{formatCurrency(finances.refereeCosts)}</span></span>
                          <span>Boetes: <span className="text-destructive">{formatCurrency(finances.fines)}</span></span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`text-right ${isNegative ? 'text-destructive' : 'text-green-600'}`}>
                          <div className="flex items-center gap-1">
                            {isNegative ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                            <span className="font-bold text-sm">{formatCurrency(finances.currentBalance)}</span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>

      <FinancialTeamDetailModal open={teamModalOpen} onOpenChange={setTeamModalOpen} team={selectedTeam} />

      <FinancialSettingsModal open={costListModalOpen} onOpenChange={setCostListModalOpen} />

      <FinancialMonthlyReportsModal open={monthlyReportsModalOpen} onOpenChange={setMonthlyReportsModalOpen} />
    </div>
  );
};

export default AdminFinancialPage;