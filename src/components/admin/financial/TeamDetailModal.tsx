
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { financialService, TeamTransaction, PenaltyType } from "@/services/financialService";
import { useToast } from "@/hooks/use-toast";
import { Plus, Euro, Calendar } from "lucide-react";

interface TeamDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: {
    team_id: number;
    team_name: string;
    balance: number;
  } | null;
}

const TeamDetailModal: React.FC<TeamDetailModalProps> = ({ open, onOpenChange, team }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    transaction_type: 'deposit' as 'deposit' | 'penalty' | 'adjustment',
    amount: '',
    description: '',
    penalty_type_id: '',
    transaction_date: new Date().toISOString().split('T')[0]
  });

  const { data: transactions, isLoading: loadingTransactions } = useQuery({
    queryKey: ['team-transactions', team?.team_id],
    queryFn: () => team ? financialService.getTeamTransactions(team.team_id) : Promise.resolve([]),
    enabled: !!team
  });

  const { data: penaltyTypes } = useQuery({
    queryKey: ['penalty-types'],
    queryFn: financialService.getPenaltyTypes
  });

  const handleAddTransaction = async () => {
    if (!team || !formData.amount) {
      toast({
        title: "Fout",
        description: "Vul alle verplichte velden in",
        variant: "destructive"
      });
      return;
    }

    const selectedPenalty = penaltyTypes?.find(p => p.id === parseInt(formData.penalty_type_id));
    const amount = formData.transaction_type === 'penalty' && selectedPenalty 
      ? selectedPenalty.amount 
      : parseFloat(formData.amount);

    const result = await financialService.addTransaction({
      team_id: team.team_id,
      transaction_type: formData.transaction_type,
      amount,
      description: formData.description || null,
      penalty_type_id: formData.penalty_type_id ? parseInt(formData.penalty_type_id) : null,
      match_id: null,
      transaction_date: formData.transaction_date
    });

    if (result.success) {
      toast({
        title: "Succesvol",
        description: result.message
      });
      queryClient.invalidateQueries({ queryKey: ['team-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['teams-financial'] });
      setShowAddForm(false);
      setFormData({
        transaction_type: 'deposit',
        amount: '',
        description: '',
        penalty_type_id: '',
        transaction_date: new Date().toISOString().split('T')[0]
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

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'deposit': return 'Storting';
      case 'penalty': return 'Boete';
      case 'match_cost': return 'Wedstrijdkosten';
      case 'adjustment': return 'Correctie';
      default: return type;
    }
  };

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case 'deposit': return <Badge className="bg-green-100 text-green-800">Storting</Badge>;
      case 'penalty': return <Badge variant="destructive">Boete</Badge>;
      case 'match_cost': return <Badge variant="secondary">Wedstrijdkosten</Badge>;
      case 'adjustment': return <Badge variant="outline">Correctie</Badge>;
      default: return <Badge variant="outline">{type}</Badge>;
    }
  };

  if (!team) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Euro className="h-5 w-5" />
            {team.team_name} - Financieel Detail
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Team Balance */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Huidig Saldo</h3>
              <div className={`text-2xl font-bold ${team.balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(team.balance)}
              </div>
            </div>
          </div>

          {/* Add Transaction Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Transacties</h3>
              <Button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Transactie Toevoegen
              </Button>
            </div>

            {showAddForm && (
              <div className="border rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Type Transactie</Label>
                    <Select value={formData.transaction_type} onValueChange={(value: any) => setFormData({...formData, transaction_type: value})}>
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
                    <Label>Datum</Label>
                    <Input
                      type="date"
                      value={formData.transaction_date}
                      onChange={(e) => setFormData({...formData, transaction_date: e.target.value})}
                    />
                  </div>
                </div>

                {formData.transaction_type === 'penalty' && (
                  <div>
                    <Label>Boete Type</Label>
                    <Select value={formData.penalty_type_id} onValueChange={(value) => setFormData({...formData, penalty_type_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer boete type" />
                      </SelectTrigger>
                      <SelectContent>
                        {penaltyTypes?.map((penalty) => (
                          <SelectItem key={penalty.id} value={penalty.id.toString()}>
                            {penalty.name} - {formatCurrency(penalty.amount)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formData.transaction_type !== 'penalty' && (
                  <div>
                    <Label>Bedrag (€)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      placeholder="0.00"
                    />
                  </div>
                )}

                <div>
                  <Label>Beschrijving</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Optionele beschrijving..."
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleAddTransaction}>Toevoegen</Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>Annuleren</Button>
                </div>
              </div>
            )}
          </div>

          {/* Transactions List */}
          <div>
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
                    <TableCell colSpan={4} className="text-center py-8">
                      Transacties laden...
                    </TableCell>
                  </TableRow>
                ) : transactions && transactions.length > 0 ? (
                  transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {new Date(transaction.transaction_date).toLocaleDateString('nl-NL')}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getTransactionBadge(transaction.transaction_type)}
                      </TableCell>
                      <TableCell>
                        <div>
                          {transaction.penalty_types?.name && (
                            <div className="font-medium">{transaction.penalty_types.name}</div>
                          )}
                          {transaction.description && (
                            <div className="text-sm text-muted-foreground">{transaction.description}</div>
                          )}
                          {transaction.matches?.unique_number && (
                            <div className="text-xs text-muted-foreground">
                              Wedstrijd: {transaction.matches.unique_number}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-semibold ${
                          transaction.transaction_type === 'deposit' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.transaction_type === 'deposit' ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Geen transacties gevonden
                    </TableCell>
                  </TableRow>
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
