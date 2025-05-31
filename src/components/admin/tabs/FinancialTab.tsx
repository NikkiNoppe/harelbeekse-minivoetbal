
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Calculator } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Team {
  team_id: number;
  team_name: string;
  balance: number;
}

interface MatchForm {
  form_id: number;
  match_id: number;
  team_id: number;
  is_submitted: boolean;
  created_at: string;
  team_name: string;
  match_date: string;
  home_team_name: string;
  away_team_name: string;
}

interface PaymentCalculation {
  team_id: number;
  team_name: string;
  submitted_forms: number;
  field_cost: number;
  referee_cost: number;
  total_cost: number;
}

const FinancialTab: React.FC = () => {
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [matchForms, setMatchForms] = useState<MatchForm[]>([]);
  const [paymentCalculations, setPaymentCalculations] = useState<PaymentCalculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('team_name');
      
      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast({
        title: "Fout",
        description: "Kon teams niet laden",
        variant: "destructive"
      });
    }
  };

  const fetchMatchForms = async () => {
    try {
      const { data, error } = await supabase
        .from('match_forms')
        .select(`
          *,
          teams!inner(team_name),
          matches!inner(
            match_date,
            teams!matches_home_team_id_fkey(team_name),
            away_team:teams!matches_away_team_id_fkey(team_name)
          )
        `)
        .eq('is_submitted', true);
      
      if (error) throw error;
      
      const formsWithTeamInfo = (data || []).map(form => ({
        form_id: form.form_id,
        match_id: form.match_id,
        team_id: form.team_id,
        is_submitted: form.is_submitted,
        created_at: form.created_at,
        team_name: form.teams.team_name,
        match_date: form.matches.match_date,
        home_team_name: form.matches.teams.team_name,
        away_team_name: form.matches.away_team.team_name
      }));
      
      setMatchForms(formsWithTeamInfo);
    } catch (error) {
      console.error('Error fetching match forms:', error);
      toast({
        title: "Fout",
        description: "Kon wedstrijdformulieren niet laden",
        variant: "destructive"
      });
    }
  };

  const calculatePayments = () => {
    const calculations: PaymentCalculation[] = teams.map(team => {
      const submittedForms = matchForms.filter(form => form.team_id === team.team_id);
      const fieldCost = submittedForms.length * 5; // 5 euro per wedstrijd voor veld
      const refereeCost = submittedForms.length * 6; // 6 euro per wedstrijd voor scheidsrechter
      const totalCost = fieldCost + refereeCost;
      
      return {
        team_id: team.team_id,
        team_name: team.team_name,
        submitted_forms: submittedForms.length,
        field_cost: fieldCost,
        referee_cost: refereeCost,
        total_cost: totalCost
      };
    });
    
    setPaymentCalculations(calculations);
  };

  const processPayments = async () => {
    setCalculating(true);
    try {
      for (const calculation of paymentCalculations) {
        if (calculation.total_cost > 0) {
          const team = teams.find(t => t.team_id === calculation.team_id);
          if (team) {
            const newBalance = team.balance - calculation.total_cost;
            
            const { error } = await supabase
              .from('teams')
              .update({ balance: newBalance })
              .eq('team_id', team.team_id);
            
            if (error) throw error;
          }
        }
      }
      
      toast({
        title: "Succes",
        description: "Betalingen zijn verwerkt en teamsaldi bijgewerkt"
      });
      
      // Refresh data
      await fetchTeams();
      calculatePayments();
      
    } catch (error) {
      console.error('Error processing payments:', error);
      toast({
        title: "Fout",
        description: "Kon betalingen niet verwerken",
        variant: "destructive"
      });
    } finally {
      setCalculating(false);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([fetchTeams(), fetchMatchForms()]);
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    if (teams.length > 0 && matchForms.length >= 0) {
      calculatePayments();
    }
  }, [teams, matchForms]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Financieel Overzicht</h2>
          <p className="text-muted-foreground">
            Team saldi en wedstrijdkosten berekeningen
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Vernieuwen
          </Button>
          <Button 
            onClick={processPayments} 
            disabled={calculating || paymentCalculations.every(p => p.total_cost === 0)}
            size="sm"
          >
            <Calculator className="h-4 w-4 mr-2" />
            {calculating ? "Verwerken..." : "Betalingen Verwerken"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Team Saldi</CardTitle>
            <CardDescription>
              Huidige financiële positie van alle teams
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((team) => (
                  <TableRow key={team.team_id}>
                    <TableCell className="font-medium">{team.team_name}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(team.balance)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={team.balance >= 0 ? "default" : "destructive"}>
                        {team.balance >= 0 ? "Positief" : "Negatief"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kosten Berekening</CardTitle>
            <CardDescription>
              Gebaseerd op ingediende wedstrijdformulieren
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team</TableHead>
                  <TableHead className="text-center">Wedstrijden</TableHead>
                  <TableHead className="text-right">Veldkosten</TableHead>
                  <TableHead className="text-right">Scheidsrechter</TableHead>
                  <TableHead className="text-right">Totaal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentCalculations.map((calc) => (
                  <TableRow key={calc.team_id}>
                    <TableCell className="font-medium">{calc.team_name}</TableCell>
                    <TableCell className="text-center">{calc.submitted_forms}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(calc.field_cost)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(calc.referee_cost)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      {formatCurrency(calc.total_cost)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ingediende Wedstrijdformulieren</CardTitle>
          <CardDescription>
            Overzicht van alle ingediende formulieren die kosten genereren
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team</TableHead>
                <TableHead>Wedstrijd</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead>Ingediend op</TableHead>
                <TableHead className="text-right">Kosten</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matchForms.map((form) => (
                <TableRow key={form.form_id}>
                  <TableCell className="font-medium">{form.team_name}</TableCell>
                  <TableCell>
                    {form.home_team_name} vs {form.away_team_name}
                  </TableCell>
                  <TableCell>
                    {new Date(form.match_date).toLocaleDateString('nl-NL')}
                  </TableCell>
                  <TableCell>
                    {new Date(form.created_at).toLocaleDateString('nl-NL')}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(11)} {/* 5 + 6 euro */}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {matchForms.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Geen ingediende wedstrijdformulieren gevonden
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialTab;
