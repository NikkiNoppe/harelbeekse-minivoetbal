
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { costSettingsService } from "@/services/costSettingsService";
import { useToast } from "@/hooks/use-toast";
import { Plus, Euro, TrendingDown, TrendingUp } from "lucide-react";

interface Team {
  team_id: number;
  team_name: string;
  balance: number;
}

interface TeamDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team | null;
}

const TeamDetailModal: React.FC<TeamDetailModalProps> = ({ open, onOpenChange, team }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [transactionForm, setTransactionForm] = useState({
    type: 'deposit' as 'deposit' | 'penalty' | 'adjustment',
    amount: '',
    description: '',
    cost_setting_id: ''
  });

  const { data: transactions, isLoading: loadingTransactions } = useQuery({
    queryKey: ['team-transactions', team?.team_id],
    queryFn: () => team ? costSettingsService.getTeamTransactions(team.team_id) : Promise.resolve([]),
    enabled: !!team
  });

  const { data: costSettings } = useQuery({
    queryKey: ['cost-settings'],
    queryFn: costSettingsService.getCostSettings
  });

  const handleAddTransaction = async () => {
    if (!team || !transactionForm.amount) {
      toast({
        title: "Fout",
        description: "Vul alle verplichte velden in",
        variant: "destructive"
      });
      return;
    }

    const result = await costSettingsService.addTransaction({
      team_id: team.team_id,
      transaction_type: transactionForm.type,
      amount: parseFloat(transactionForm.amount),
      description: transactionForm.description || null,
      cost_setting_id: transactionForm.cost_setting_id ? parseInt(transactionForm.cost_setting_id) : null,
      penalty_type_id: null,
      match_id: null,
      transaction_date: new Date().toISOString().split('T')[0]
    });

    if (result.success) {
      toast({
        title: "Succesvol",
        description: result.message
      });
      queryClient.invalidateQueries({ queryKey: ['team-transactions', team.team_id] });
      queryClient.invalidateQueries({ queryKey: ['teams-financial'] });
      setShowAddTransaction(false);
      setTransactionForm({
        type: 'deposit',
        amount: '',
        description: '',
        cost_setting_id: ''
      });
    } else {
      toast({
        title: "Fout",
        description: result.message,
        variant: "destructive"
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'penalty':
      case 'match_cost':
      case 'adjustment':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Euro className="h-4 w-4" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'bg-green-100 text-green-800';
      case 'penalty':
        return 'bg-red-100 text-red-800';
      case 'match_cost':
        return 'bg-blue-100 text-blue-800';
      case 'adjustment':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'Storting';
      case 'penalty':
        return 'Boete';
      case 'match_cost':
        return 'Wedstrijdkosten';
      case 'adjustment':
        return 'Correctie';
      default:
        return type;
    }
  };

  if (!team) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Euro className="h-5 w-5" />
            {team.team_name} - Financieel Detail
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Team Balance Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Huidig Saldo</h3>
                <p className="text-sm text-gray-600">Team: {team.team_name}</p>
              </div>
              <div className={`text-2xl font-bold ${team.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(team.balance)}
              </div>
            </div>
          </div>

          {/* Add Transaction Section */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Transacties</h3>
              <Button 
                onClick={() => setShowAddTransaction(!showAddTransaction)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Nieuwe Transactie
              </Button>
            </div>

            {showAddTransaction && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Type Transactie</Label>
                    <Select 
                      value={transactionForm.type} 
                      onValueChange={(value: any) => setTransactionForm({...transactionForm, type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="deposit">Storting</SelectItem>
                        <SelectItem value="penalty">Boete</SelectItem>
                        <SelectItem value="adjustment">Correctie</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Bedrag (€)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={transactionForm.amount}
                      onChange={(e) => setTransactionForm({...transactionForm, amount: e.target.value})}
                      placeholder="0.00"
                    />
                  </div>

                  {(transactionForm.type === 'penalty') && (
                    <div>
                      <Label>Boete Type</Label>
                      <Select 
                        value={transactionForm.cost_setting_id} 
                        onValueChange={(value) => setTransactionForm({...transactionForm, cost_setting_id: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer boete type" />
                        </SelectTrigger>
                        <SelectContent>
                          {costSettings?.filter(cs => cs.category === 'penalty').map(cs => (
                            <SelectItem key={cs.id} value={cs.id.toString()}>
                              {cs.name} - {formatCurrency(cs.amount)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <Label>Beschrijving</Label>
                    <Textarea
                      value={transactionForm.description}
                      onChange={(e) => setTransactionForm({...transactionForm, description: e.target.value})}
                      placeholder="Optionele beschrijving..."
                      rows={2}
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button onClick={handleAddTransaction}>
                    Transactie Toevoegen
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAddTransaction(false)}
                  >
                    Annuleren
                  </Button>
                </div>
              </div>
            )}

            {/* Transactions Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Beschrijving</TableHead>
                  <TableHead className="text-right">Bedrag</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingTransactions ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">Laden...</TableCell>
                  </TableRow>
                ) : transactions?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500">
                      Geen transacties gevonden
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions?.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {new Date(transaction.transaction_date).toLocaleDateString('nl-NL')}
                      </TableCell>
                      <TableCell>
                        <Badge className={getTransactionColor(transaction.transaction_type)}>
                          <div className="flex items-center gap-1">
                            {getTransactionIcon(transaction.transaction_type)}
                            {getTransactionLabel(transaction.transaction_type)}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {transaction.description || 
                         transaction.cost_settings?.name || 
                         transaction.matches?.unique_number || 
                         '-'}
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${
                        transaction.transaction_type === 'deposit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.transaction_type === 'deposit' ? '+' : '-'}
                        {formatCurrency(Math.abs(transaction.amount))}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TeamDetailModal;
