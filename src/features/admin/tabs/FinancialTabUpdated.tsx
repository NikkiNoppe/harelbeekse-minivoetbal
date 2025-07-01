
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@shared/components/ui/table";
import { Badge } from "@shared/components/ui/badge";
import { Button } from "@shared/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@shared/integrations/supabase/client";
import { DollarSign, TrendingUp, TrendingDown, Settings } from "lucide-react";
import EnhancedCostSettingsModal from "../financial/EnhancedCostSettingsModal";
import FinancialSettingsModal from "../financial/FinancialSettingsModal";
import TeamDetailModal from "../financial/TeamDetailModal";

const FinancialTabUpdated = () => {
  const [openCostSettings, setOpenCostSettings] = useState(false);
  const [openFinancialSettings, setOpenFinancialSettings] = useState(false);
  const [openTeamDetailModal, setOpenTeamDetailModal] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);

  const { data: transactions = [], isLoading, error } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_transactions')
        .select('*')
        .order('transaction_date', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }
      return data || [];
    }
  });

  const totalRevenue = Array.isArray(transactions) 
    ? transactions.reduce((sum, transaction) => {
        return sum + (transaction.amount > 0 ? transaction.amount : 0);
      }, 0) 
    : 0;

  const totalExpenses = Array.isArray(transactions) 
    ? transactions.reduce((sum, transaction) => {
        return sum + (transaction.amount < 0 ? Math.abs(transaction.amount) : 0);
      }, 0) 
    : 0;

  const netRevenue = totalRevenue - totalExpenses;

  const handleOpenTeamDetailModal = (teamId: number) => {
    setSelectedTeamId(teamId);
    setOpenTeamDetailModal(true);
  };

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Financiën</h2>
        <div className="flex gap-2">
          <Button onClick={() => setOpenFinancialSettings(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Algemene Instellingen
          </Button>
          <Button onClick={() => setOpenCostSettings(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Kosten Instellingen
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="mr-2 h-4 w-4 text-green-500" />
              Inkomsten
            </CardTitle>
            <CardDescription>Totaal ontvangen inkomsten</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalRevenue.toFixed(2)}</div>
            <Badge variant="secondary">+20% vergeleken met vorige maand</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="mr-2 h-4 w-4 text-red-500" />
              Uitgaven
            </CardTitle>
            <CardDescription>Totaal gemaakte kosten</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalExpenses.toFixed(2)}</div>
            <Badge variant="secondary">-15% vergeleken met vorige maand</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="mr-2 h-4 w-4 text-blue-500" />
              Netto Resultaat
            </CardTitle>
            <CardDescription>Huidige netto resultaat</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{netRevenue.toFixed(2)}</div>
            <Badge variant="secondary">Stabiel</Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transactie Overzicht</CardTitle>
          <CardDescription>Recente transacties en details</CardDescription>
        </CardHeader>
        <CardContent className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Omschrijving</TableHead>
                <TableHead>Bedrag</TableHead>
                <TableHead>Team</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    Laden...
                  </TableCell>
                </TableRow>
              )}
              {error && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-red-500">
                    Fout: {error.message}
                  </TableCell>
                </TableRow>
              )}
              {Array.isArray(transactions) && transactions.length === 0 && !isLoading && !error && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    Geen transacties gevonden.
                  </TableCell>
                </TableRow>
              )}
              {Array.isArray(transactions) && transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{new Date(transaction.transaction_date).toLocaleDateString()}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>€{transaction.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    {transaction.team_id ? (
                      <Button
                        variant="link"
                        onClick={() => handleOpenTeamDetailModal(transaction.team_id)}
                      >
                        Team {transaction.team_id}
                      </Button>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <EnhancedCostSettingsModal open={openCostSettings} onOpenChange={setOpenCostSettings} />
      <FinancialSettingsModal open={openFinancialSettings} onOpenChange={setOpenFinancialSettings} />
      {selectedTeamId && (
        <TeamDetailModal
          open={openTeamDetailModal}
          onOpenChange={setOpenTeamDetailModal}
          teamId={selectedTeamId}
        />
      )}
    </div>
  );
};

export default FinancialTabUpdated;
