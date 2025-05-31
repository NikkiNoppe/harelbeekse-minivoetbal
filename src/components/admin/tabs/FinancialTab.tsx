
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingDown, TrendingUp, Calculator } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Team {
  team_id: number;
  team_name: string;
  balance: number;
}

interface MatchForm {
  form_id: number;
  team_id: number;
  match_id: number;
  is_submitted: boolean;
  teams: {
    team_name: string;
  };
  matches: {
    field_cost: number;
    referee_cost: number;
    match_date: string;
  };
}

const FinancialTab: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: teams, isLoading: loadingTeams } = useQuery({
    queryKey: ['teams-balance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('team_id, team_name, balance')
        .order('team_name');
      
      if (error) throw error;
      return data as Team[];
    }
  });

  const { data: submittedForms, isLoading: loadingForms } = useQuery({
    queryKey: ['submitted-match-forms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('match_forms')
        .select(`
          form_id,
          team_id,
          match_id,
          is_submitted,
          teams (team_name),
          matches (field_cost, referee_cost, match_date)
        `)
        .eq('is_submitted', true);
      
      if (error) throw error;
      return data as MatchForm[];
    }
  });

  const processPaymentsMutation = useMutation({
    mutationFn: async () => {
      if (!submittedForms || !teams) return;

      // Calculate costs per team
      const teamCosts = submittedForms.reduce((acc, form) => {
        const teamId = form.team_id;
        const fieldCost = form.matches.field_cost || 5;
        const refereeCost = form.matches.referee_cost || 6;
        const totalCost = fieldCost + refereeCost;

        if (!acc[teamId]) {
          acc[teamId] = 0;
        }
        acc[teamId] += totalCost;

        return acc;
      }, {} as Record<number, number>);

      // Update team balances
      for (const [teamIdStr, cost] of Object.entries(teamCosts)) {
        const teamId = parseInt(teamIdStr);
        const team = teams.find(t => t.team_id === teamId);
        
        if (team) {
          const newBalance = team.balance - cost;
          
          const { error } = await supabase
            .from('teams')
            .update({ balance: newBalance })
            .eq('team_id', teamId);
          
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams-balance'] });
      toast({
        title: "Betalingen verwerkt",
        description: "Alle wedstrijdkosten zijn verwerkt en van de teamsaldi afgetrokken."
      });
    },
    onError: () => {
      toast({
        title: "Fout bij verwerken",
        description: "Kon betalingen niet verwerken.",
        variant: "destructive"
      });
    }
  });

  // Calculate pending costs per team
  const getPendingCosts = (teamId: number) => {
    if (!submittedForms) return 0;
    
    return submittedForms
      .filter(form => form.team_id === teamId)
      .reduce((total, form) => {
        const fieldCost = form.matches.field_cost || 5;
        const refereeCost = form.matches.referee_cost || 6;
        return total + fieldCost + refereeCost;
      }, 0);
  };

  const totalPendingCosts = submittedForms?.reduce((total, form) => {
    const fieldCost = form.matches.field_cost || 5;
    const refereeCost = form.matches.referee_cost || 6;
    return total + fieldCost + refereeCost;
  }, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totaal Teams</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teams?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Openstaande Kosten</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">€{totalPendingCosts.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {submittedForms?.length || 0} ingediende formulieren
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gemiddeld Saldo</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{teams && teams.length > 0 ? (teams.reduce((sum, team) => sum + team.balance, 0) / teams.length).toFixed(2) : '0.00'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Teams Balance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Saldi</CardTitle>
          <CardDescription>
            Overzicht van alle teams en hun huidige saldi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team</TableHead>
                  <TableHead>Huidig Saldo</TableHead>
                  <TableHead>Openstaande Kosten</TableHead>
                  <TableHead>Nieuw Saldo</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingTeams ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Laden...
                    </TableCell>
                  </TableRow>
                ) : teams?.map((team) => {
                  const pendingCosts = getPendingCosts(team.team_id);
                  const newBalance = team.balance - pendingCosts;
                  
                  return (
                    <TableRow key={team.team_id}>
                      <TableCell className="font-medium">{team.team_name}</TableCell>
                      <TableCell>
                        <span className={team.balance >= 0 ? "text-green-600" : "text-red-600"}>
                          €{team.balance.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-red-600">
                          €{pendingCosts.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={newBalance >= 0 ? "text-green-600" : "text-red-600"}>
                          €{newBalance.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {pendingCosts > 0 ? (
                          <Badge variant="destructive">Openstaand</Badge>
                        ) : (
                          <Badge variant="default">Akkoord</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Submitted Match Forms */}
      <Card>
        <CardHeader>
          <CardTitle>Ingediende Wedstrijdformulieren</CardTitle>
          <CardDescription>
            Overzicht van alle ingediende formulieren die verwerkt moeten worden
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border max-h-64 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team</TableHead>
                  <TableHead>Wedstrijddatum</TableHead>
                  <TableHead>Veldkosten</TableHead>
                  <TableHead>Scheidsrechterkosten</TableHead>
                  <TableHead>Totaal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingForms ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Laden...
                    </TableCell>
                  </TableRow>
                ) : submittedForms && submittedForms.length > 0 ? (
                  submittedForms.map((form) => {
                    const fieldCost = form.matches.field_cost || 5;
                    const refereeCost = form.matches.referee_cost || 6;
                    const total = fieldCost + refereeCost;
                    
                    return (
                      <TableRow key={form.form_id}>
                        <TableCell className="font-medium">{form.teams.team_name}</TableCell>
                        <TableCell>{new Date(form.matches.match_date).toLocaleDateString('nl-NL')}</TableCell>
                        <TableCell>€{fieldCost.toFixed(2)}</TableCell>
                        <TableCell>€{refereeCost.toFixed(2)}</TableCell>
                        <TableCell className="font-medium">€{total.toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Geen ingediende formulieren gevonden
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {submittedForms && submittedForms.length > 0 && (
            <div className="flex justify-end pt-4">
              <Button 
                onClick={() => processPaymentsMutation.mutate()}
                disabled={processPaymentsMutation.isPending}
                className="flex items-center gap-2"
              >
                <TrendingDown className="h-4 w-4" />
                {processPaymentsMutation.isPending ? 'Verwerken...' : 'Betalingen Verwerken'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialTab;
