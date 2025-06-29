import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Euro, TrendingDown, TrendingUp, Settings } from "lucide-react";
import TeamDetailModal from "@/components/admin/financial/TeamDetailModal";
import CostSettingsModal from "@/components/admin/financial/CostSettingsModal";
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
const FinancialTabUpdated: React.FC = () => {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // Fetch teams with their balances
  const {
    data: teams,
    isLoading: loadingTeams
  } = useQuery({
    queryKey: ['teams-financial'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('teams').select('team_id, team_name, balance').order('team_name');
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
          created_at,
          match_date,
          unique_number,
          teams_home:teams!home_team_id(team_name),
          teams_away:teams!away_team_id(team_name)
        `).eq('is_submitted', true).order('created_at', {
        ascending: false
      });
      if (error) throw error;
      return data as SubmittedMatch[];
    }
  });

  // Calculate total costs per team
  const calculateTeamCosts = (teamId: number) => {
    if (!submittedMatches) return {
      fieldCosts: 0,
      refereeCosts: 0,
      totalMatches: 0
    };
    const teamMatches = submittedMatches.filter(match => match.home_team_id === teamId || match.away_team_id === teamId);
    const totalMatches = teamMatches.length;
    const fieldCosts = totalMatches * 5; // 5 euro per match for field
    const refereeCosts = totalMatches * 6; // 6 euro per match for referee

    return {
      fieldCosts,
      refereeCosts,
      totalMatches
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
  return <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5" />
                Teams Financieel Overzicht
              </CardTitle>
              <CardDescription>
                Overzicht van team saldi en kosten van gespeelde wedstrijden. Klik op een team voor details.
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => setSettingsModalOpen(true)} className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Kostentarieven
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team</TableHead>
                <TableHead className="text-center">Gespeelde Wedstrijden</TableHead>
                <TableHead className="text-center">Veldkosten</TableHead>
                <TableHead className="text-center">Scheidsrechterkosten</TableHead>
                <TableHead className="text-center">Totale Kosten</TableHead>
                <TableHead className="text-right">Huidig Saldo</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams?.map(team => {
              const costs = calculateTeamCosts(team.team_id);
              const totalCosts = costs.fieldCosts + costs.refereeCosts;
              const isNegative = team.balance < 0;
              return <TableRow key={team.team_id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleTeamClick(team)}>
                    <TableCell className="font-medium">{team.team_name}</TableCell>
                    <TableCell className="text-center">{costs.totalMatches}</TableCell>
                    <TableCell className="text-center">{formatCurrency(costs.fieldCosts)}</TableCell>
                    <TableCell className="text-center">{formatCurrency(costs.refereeCosts)}</TableCell>
                    <TableCell className="text-center font-semibold">{formatCurrency(totalCosts)}</TableCell>
                    <TableCell className={`text-right font-semibold ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
                      <div className="flex items-center justify-end gap-1">
                        {isNegative ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                        {formatCurrency(team.balance)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={isNegative ? "destructive" : "default"}>
                        {isNegative ? "Tekort" : "Positief"}
                      </Badge>
                    </TableCell>
                  </TableRow>;
            })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        
        
      </Card>

      <TeamDetailModal open={teamModalOpen} onOpenChange={setTeamModalOpen} team={selectedTeam} />

      <CostSettingsModal open={settingsModalOpen} onOpenChange={setSettingsModalOpen} />
    </div>;
};
export default FinancialTabUpdated;