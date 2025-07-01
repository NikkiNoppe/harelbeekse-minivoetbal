
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Euro, TrendingDown, TrendingUp } from "lucide-react";

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

const FinancialTab: React.FC = () => {
  // Fetch teams with their balances
  const { data: teams, isLoading: loadingTeams } = useQuery({
    queryKey: ['teams-financial'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('team_id, team_name, balance')
        .order('team_name');
      
      if (error) throw error;
      return data as Team[];
    }
  });

  // Fetch submitted matches for financial calculations
  const { data: submittedMatches, isLoading: loadingMatches } = useQuery({
    queryKey: ['submitted-matches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          match_id,
          home_team_id,
          away_team_id,
          is_submitted,
          created_at,
          match_date,
          unique_number,
          teams_home:teams!home_team_id(team_name),
          teams_away:teams!away_team_id(team_name)
        `)
        .eq('is_submitted', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SubmittedMatch[];
    }
  });

  // Calculate total costs per team
  const calculateTeamCosts = (teamId: number) => {
    if (!submittedMatches) return { fieldCosts: 0, refereeCosts: 0, totalMatches: 0 };
    
    const teamMatches = submittedMatches.filter(match => 
      match.home_team_id === teamId || match.away_team_id === teamId
    );
    const totalMatches = teamMatches.length;
    const fieldCosts = totalMatches * 5; // 5 euro per match for field
    const refereeCosts = totalMatches * 6; // 6 euro per match for referee
    
    return { fieldCosts, refereeCosts, totalMatches };
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (loadingTeams || loadingMatches) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Euro className="h-5 w-5" />
            Teams Financieel Overzicht
          </CardTitle>
          <CardDescription>
            Overzicht van team saldi en kosten van gespeelde wedstrijden
          </CardDescription>
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
              {teams?.map((team) => {
                const costs = calculateTeamCosts(team.team_id);
                const totalCosts = costs.fieldCosts + costs.refereeCosts;
                const isNegative = team.balance < 0;
                
                return (
                  <TableRow key={team.team_id}>
                    <TableCell className="font-medium">{team.team_name}</TableCell>
                    <TableCell className="text-center">{costs.totalMatches}</TableCell>
                    <TableCell className="text-center">{formatCurrency(costs.fieldCosts)}</TableCell>
                    <TableCell className="text-center">{formatCurrency(costs.refereeCosts)}</TableCell>
                    <TableCell className="text-center font-semibold">{formatCurrency(totalCosts)}</TableCell>
                    <TableCell className={`text-right font-semibold ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
                      <div className="flex items-center justify-end gap-1">
                        {isNegative ? (
                          <TrendingDown className="h-4 w-4" />
                        ) : (
                          <TrendingUp className="h-4 w-4" />
                        )}
                        {formatCurrency(team.balance)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={isNegative ? "destructive" : "default"}>
                        {isNegative ? "Tekort" : "Positief"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recente Wedstrijden</CardTitle>
          <CardDescription>
            Laatste ingediende wedstrijden die het saldo beïnvloeden
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Wedstrijd Nr.</TableHead>
                <TableHead>Thuis Team</TableHead>
                <TableHead>Uit Team</TableHead>
                <TableHead>Wedstrijddatum</TableHead>
                <TableHead>Ingediend Op</TableHead>
                <TableHead className="text-right">Kosten</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submittedMatches?.slice(0, 10).map((match) => (
                <TableRow key={match.match_id}>
                  <TableCell className="font-mono">{match.unique_number}</TableCell>
                  <TableCell>{match.teams_home?.team_name}</TableCell>
                  <TableCell>{match.teams_away?.team_name}</TableCell>
                  <TableCell>
                    {new Date(match.match_date).toLocaleDateString('nl-NL')}
                  </TableCell>
                  <TableCell>
                    {new Date(match.created_at).toLocaleDateString('nl-NL')}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(11)} {/* 5 + 6 euro per match */}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialTab;
