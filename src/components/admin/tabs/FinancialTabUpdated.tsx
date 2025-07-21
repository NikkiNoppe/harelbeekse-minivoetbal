
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Euro, TrendingDown, TrendingUp, List, Calendar } from "lucide-react";
import TeamDetailModal from "@/components/admin/financial/TeamDetailModal";
import CostSettingsManagementModal from "@/components/admin/financial/CostSettingsManagementModal";
import MonthlyReportsModal from "@/components/admin/financial/MonthlyReportsModal";
import { costSettingsService } from "@/services/financial";
import { financialOverviewService } from "@/services/financial/financialOverviewService";

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

const FinancialTabUpdated: React.FC = () => {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [costListModalOpen, setCostListModalOpen] = useState(false);
  const [monthlyReportsModalOpen, setMonthlyReportsModalOpen] = useState(false);

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
  const { data: costSettings } = useQuery({
    queryKey: ['cost-settings'],
    queryFn: costSettingsService.getCostSettings
  });

  // Fetch transactions for detailed calculations using the service
  const { data: allTransactions } = useQuery({
    queryKey: ['all-team-transactions'],
    queryFn: async () => {
      // Get all teams first
      const { data: teams } = await supabase.from('teams').select('team_id');
      if (!teams) return [];
      
      // Get transactions for all teams
      const allTransactions = [];
      for (const team of teams) {
        const transactions = await costSettingsService.getTeamTransactions(team.team_id);
        allTransactions.push(...transactions);
      }
      
      return allTransactions;
    }
  });

  // Calculate detailed financial breakdown per team using transactions
  const calculateTeamFinances = (teamId: number) => {
    if (!allTransactions) return {
      startCapital: 0,
      fieldCosts: 0,
      refereeCosts: 0,
      fines: 0,
      currentBalance: 0
    };
    
    const teamTransactions = allTransactions.filter(t => t.team_id === teamId);
    
    // Startkapitaal: alle stortingen (deposits)
    const startCapital = teamTransactions
      .filter(t => t.transaction_type === 'deposit')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    // Veldkosten: alle match_cost transacties met 'veld' in de naam
    const fieldCosts = teamTransactions
      .filter(t => t.transaction_type === 'match_cost' && 
        (t.cost_settings?.name?.toLowerCase().includes('veld') || 
         t.description?.toLowerCase().includes('veld')))
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    // Scheidsrechterkosten: alle match_cost transacties met 'scheids' in de naam
    const refereeCosts = teamTransactions
      .filter(t => t.transaction_type === 'match_cost' && 
        (t.cost_settings?.name?.toLowerCase().includes('scheids') || 
         t.description?.toLowerCase().includes('scheids')))
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    // Boetes: alle penalty transacties
    const fines = teamTransactions
      .filter(t => t.transaction_type === 'penalty')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
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

  if (loadingTeams || loadingMatches) {
    return <div className="flex items-center justify-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>;
  }

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Euro className="h-5 w-5" />
          Financieel Beheer
        </h2>
      </div>

      <section>
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">
                  Teams Financieel Overzicht
                </CardTitle>
                <CardDescription>
                  Klik op een team voor details en transacties.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCostListModalOpen(true)}
                  className="btn-white"
                >
                  <List className="h-4 w-4 mr-2" />
                  Kostenlijst
                </button>
                <button
                  onClick={() => setMonthlyReportsModalOpen(true)}
                  className="btn-white"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Maandrapport
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team</TableHead>
                <TableHead className="text-center">Start Kapitaal</TableHead>
                <TableHead className="text-center">Veld</TableHead>
                <TableHead className="text-center">Scheids</TableHead>
                <TableHead className="text-center">Boetes</TableHead>
                <TableHead className="text-right">Huidig Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams?.map(team => {
              const finances = calculateTeamFinances(team.team_id);
              const isNegative = finances.currentBalance < 0;
              return <TableRow key={team.team_id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleTeamClick(team)}>
                    <TableCell className="font-medium text-responsive-team">{team.team_name}</TableCell>
                    <TableCell className="text-center text-green-600 font-semibold">
                      {formatCurrency(finances.startCapital)}
                    </TableCell>
                    <TableCell className="text-center text-red-600">
                      -{formatCurrency(finances.fieldCosts)}
                    </TableCell>
                    <TableCell className="text-center text-red-600">
                      -{formatCurrency(finances.refereeCosts)}
                    </TableCell>
                    <TableCell className="text-center text-red-600">
                      -{formatCurrency(finances.fines)}
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
                      <div className="flex items-center justify-end gap-1">
                        {isNegative ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                        {formatCurrency(finances.currentBalance)}
                      </div>
                    </TableCell>
                  </TableRow>;
            })}
            </TableBody>
          </Table>
          </CardContent>
        </Card>
      </section>

      <TeamDetailModal open={teamModalOpen} onOpenChange={setTeamModalOpen} team={selectedTeam} />

      <CostSettingsManagementModal open={costListModalOpen} onOpenChange={setCostListModalOpen} />

      <MonthlyReportsModal open={monthlyReportsModalOpen} onOpenChange={setMonthlyReportsModalOpen} />
    </div>
  );
};

export default FinancialTabUpdated;
