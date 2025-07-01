
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@shared/components/ui/table";
import { Badge } from "@shared/components/ui/badge";
import { Button } from "@shared/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@shared/integrations/supabase/client";
import { DollarSign, TrendingUp, TrendingDown, Settings } from "lucide-react";
import CostSettingsModal from "../financial/CostSettingsModal";
import FinancialSettingsModal from "../financial/FinancialSettingsModal";
import TeamDetailModal from "../financial/TeamDetailModal";

interface Cost {
  id: number;
  name: string;
  amount: number;
  category: string;
  team_id?: number;
  team_name?: string;
  created_at: string;
}

const FinancialTab: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [financialSettingsOpen, setFinancialSettingsOpen] = useState(false);
  const [teamDetailOpen, setTeamDetailOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);

  const { data: costs, isLoading, error } = useQuery({
    queryKey: ['cost_settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cost_settings')
        .select('id, name, description, amount, category, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data.map(cost => ({
        id: cost.id,
        name: cost.name,
        amount: cost.amount,
        category: cost.category,
        team_name: 'N/A',
        created_at: cost.created_at,
      }));
    }
  });

  const totalRevenue = costs?.filter(cost => cost.category === 'revenue').reduce((sum, cost) => sum + cost.amount, 0) || 0;
  const totalExpenses = costs?.filter(cost => cost.category === 'expense').reduce((sum, cost) => sum + cost.amount, 0) || 0;
  const balance = totalRevenue - totalExpenses;

  const handleOpenTeamDetail = (teamId: number) => {
    setSelectedTeamId(teamId);
    setTeamDetailOpen(true);
  };

  return (
    <div>
      <div className="flex justify-end pb-4">
        <Button onClick={() => setFinancialSettingsOpen(true)}>
          <Settings className="mr-2 h-4 w-4" />
          Financiële Instellingen
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Inkomsten</CardTitle>
            <CardDescription>Totaal ontvangen inkomsten</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalRevenue.toFixed(2)}</div>
            <Badge variant="secondary">
              <TrendingUp className="mr-2 h-4 w-4" />
              {balance > 0 ? ((totalRevenue / (balance + totalExpenses)) * 100).toFixed(2) : 0}% van totaal
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Uitgaven</CardTitle>
            <CardDescription>Totaal gemaakte uitgaven</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalExpenses.toFixed(2)}</div>
            <Badge variant="destructive">
              <TrendingDown className="mr-2 h-4 w-4" />
              {balance > 0 ? ((totalExpenses / (balance + totalExpenses)) * 100).toFixed(2) : 0}% van totaal
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Saldo</CardTitle>
            <CardDescription>Huidige financiële saldo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{balance.toFixed(2)}</div>
            <Badge variant={balance >= 0 ? "default" : "destructive"}>
              <DollarSign className="mr-2 h-4 w-4" />
              {balance >= 0 ? "Positief" : "Negatief"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Kosten Overzicht</h2>
          <Button onClick={() => setOpen(true)}>
            Nieuwe Kost Toevoegen
          </Button>
        </div>
        {isLoading ? (
          <div>Loading costs...</div>
        ) : error ? (
          <div>Error: {error.message}</div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Naam</TableHead>
                  <TableHead>Categorie</TableHead>
                  <TableHead>Bedrag</TableHead>
                  <TableHead>Datum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costs?.map((cost) => (
                  <TableRow key={cost.id}>
                    <TableCell className="font-medium">{cost.name}</TableCell>
                    <TableCell>{cost.category}</TableCell>
                    <TableCell>€{cost.amount.toFixed(2)}</TableCell>
                    <TableCell>{new Date(cost.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <CostSettingsModal open={open} onOpenChange={setOpen} />
      <FinancialSettingsModal open={financialSettingsOpen} onOpenChange={setFinancialSettingsOpen} />
      {selectedTeamId && (
        <TeamDetailModal open={teamDetailOpen} onOpenChange={setTeamDetailOpen} team={selectedTeamId} />
      )}
    </div>
  );
};

export default FinancialTab;
