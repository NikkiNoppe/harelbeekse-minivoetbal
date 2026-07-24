import React, { useState, useEffect, useMemo } from "react";
import { AppModal, AppAlertModal, DestructiveConfirmDescription } from "@/components/modals/base";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { costSettingsService, invalidateFinancialTransactionQueries } from "@/services/financial";
import { computeCurrentBalance, amountToTopUp } from "@/services/financial/teamCostCategories";
import { useFinancialData } from "@/hooks/useFinancialData";
import { useTeamFinancialDetailModal } from "./useTeamFinancialDetailModal";
import { useToast } from "@/hooks/use-toast";
import { useOrgQueryScope } from "@/hooks/useOrganization";
import { withOrgQueryKey } from "@/lib/orgQueryKey";
import { Plus, Euro, TrendingDown, TrendingUp, Trash2, Edit2, ChevronDown, Loader2, CalendarIcon, RefreshCw, AlertCircle } from "lucide-react";
import { formatDateShort, getCurrentDate } from "@/lib/dateUtils";
import { TransactionEditModal } from "./transaction-edit-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Team {
  team_id: number;
  team_name: string;
}

interface FinancialTeamDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team | null;
}

export const FinancialTeamDetailModal: React.FC<FinancialTeamDetailModalProps> = ({ open, onOpenChange, team }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { organizationId, orgQueryEnabled } = useOrgQueryScope();
  const { calculateTeamFinances, formatCurrency } = useFinancialData({
    enableSync: false,
  });

  const {
    teamTransactions,
    isListLoading: loadingTransactions,
    isRefreshing: refreshingTransactions,
    showEmpty,
    hasError: transactionsLoadError,
    transactionsError,
    refetchTransactions,
    isFetched: transactionsFetched,
    isPlaceholderData: transactionsPlaceholder,
  } = useTeamFinancialDetailModal(team?.team_id, open);

  // State for transaction actions
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [selectedCost, setSelectedCost] = useState<any>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [transactionDate, setTransactionDate] = useState<Date>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  
  // State for delete confirmation modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<any>(null);


  const finances = team ? calculateTeamFinances(team.team_id) : null;

  const balanceFromTeamQuery = useMemo(() => {
    if (!transactionsFetched || transactionsPlaceholder) {
      return null;
    }
    return computeCurrentBalance(teamTransactions);
  }, [transactionsFetched, transactionsPlaceholder, teamTransactions]);

  const currentBalance = balanceFromTeamQuery ?? finances?.currentBalance ?? null;
  const isBalanceLoading =
    currentBalance === null && (loadingTransactions || (!finances && !transactionsFetched));

  const { data: costSettings, isLoading: loadingCostSettings } = useQuery({
    queryKey: withOrgQueryKey(["cost-settings"], organizationId),
    queryFn: costSettingsService.getCostSettings,
    enabled: open && orgQueryEnabled,
  });

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setShowAddTransaction(false);
      setSelectedCost(null);
      setCustomAmount('');
      setTransactionDate(new Date());
      setEditModalOpen(false);
      setSelectedTransaction(null);
      setDeleteModalOpen(false);
      setTransactionToDelete(null);
    }
  }, [open]);

  // Handle cost selection from dropdown
  const handleCostSelection = (cost: any) => {
    setSelectedCost(cost);
    setCustomAmount('');
    setTransactionDate(new Date());
    setShowAddTransaction(true);
  };

  // Handle transaction submission
  const handleAddTransaction = async () => {
    if (!team || !selectedCost) {
      toast({
        title: "Fout",
        description: "Team of kosten niet gevonden",
        variant: "destructive"
      });
      return;
    }

    let amount = selectedCost.amount;
    let description = selectedCost.name;

    // For deposits, use custom amount if provided
    if (selectedCost.category === 'deposit') {
      if (!customAmount || parseFloat(customAmount) <= 0) {
        toast({
          title: "Fout",
          description: "Vul een geldig bedrag in voor de storting",
          variant: "destructive"
        });
        return;
      }
      amount = parseFloat(customAmount);
      description = `Storting: €${amount.toFixed(2)}`;
    }

    setIsSubmitting(true);

    try {
      console.log('Adding transaction:', {
        team_id: team.team_id,
        transaction_type: selectedCost.category,
        amount: amount,
        description: description,
        cost_setting_id: selectedCost.id
      });

      const result = await costSettingsService.addTransaction({
        team_id: team.team_id,
        transaction_type: selectedCost.category as 'deposit' | 'penalty' | 'match_cost' | 'adjustment',
        amount: amount,
        description: description,
        cost_setting_id: selectedCost.id,
        penalty_type_id: null,
        match_id: null,
        transaction_date: format(transactionDate, 'yyyy-MM-dd')
      });

      console.log('Transaction result:', result);

      if (result.success) {
        toast({
          title: "Succes",
          description: `${description} toegevoegd voor ${team.team_name}`,
        });
        
        // Reset form and refresh data
        setShowAddTransaction(false);
        setSelectedCost(null);
        setCustomAmount('');
        setTransactionDate(new Date());
        
        await invalidateFinancialTransactionQueries(queryClient, team.team_id);
      } else {
        console.error('Transaction failed:', result.message);
        toast({
          title: "Fout",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het toevoegen van de transactie",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit transaction
  const handleEditTransaction = (transaction: any) => {
    setSelectedTransaction(transaction);
    setEditModalOpen(true);
  };

  // Handle delete transaction
  const handleDeleteTransaction = (transaction: any) => {
    setTransactionToDelete(transaction);
    setDeleteModalOpen(true);
  };

  const confirmDeleteTransaction = async () => {
    if (!team || !transactionToDelete) {
      toast({
        title: "Fout",
        description: "Team of transactie niet gevonden",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Deleting transaction:', transactionToDelete.id);
      const result = await costSettingsService.deleteTransaction(transactionToDelete.id);

      if (result.success) {
        toast({
          title: "Succesvol verwijderd",
          description: "De transactie is succesvol verwijderd uit de database."
        });
        await invalidateFinancialTransactionQueries(queryClient, team.team_id);
        setDeleteModalOpen(false);
        setTransactionToDelete(null);
      } else {
        toast({
          title: "Fout",
          description: result.message || "Er is een fout opgetreden bij het verwijderen van de transactie",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      const errorMessage = error instanceof Error ? error.message : 'Onbekende fout';
      toast({
        title: "Fout",
        description: `Er is een fout opgetreden: ${errorMessage}`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Utility functions
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <TrendingUp className="h-4 w-4" />;
      case 'penalty':
        return <TrendingDown className="h-4 w-4" />;
      case 'match_cost':
        return <Euro className="h-4 w-4" />;
      default:
        return <Euro className="h-4 w-4" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'bg-green-100 text-green-800';
      case 'penalty':
        return 'bg-destructive/10 text-destructive';
      case 'match_cost':
        return 'bg-brand-50 text-brand-dark';
      case 'adjustment':
        return 'bg-warning/10 text-warning-foreground';
      default:
        return 'bg-muted text-card-foreground';
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

  // Group transactions by match_id
  const groupTransactionsByMatch = () => {
    if (!teamTransactions.length) return [];
    
    const grouped: Array<{
      match_id: number | null;
      match_info?: { 
        unique_number: string; 
        match_date: string;
        home_team_id?: number;
        away_team_id?: number;
        teams_home?: { team_name: string };
        teams_away?: { team_name: string };
      };
      transactions: typeof teamTransactions;
      totalAmount: number;
      transaction_date: string;
    }> = [];
    
    const matchGroups = new Map<number | string, typeof teamTransactions>();
    const standaloneTransactions: typeof teamTransactions = [];
    
    // Separate transactions with match_id from those without
    teamTransactions.forEach(transaction => {
      if (transaction.match_id) {
        const key = transaction.match_id;
        if (!matchGroups.has(key)) {
          matchGroups.set(key, []);
        }
        matchGroups.get(key)!.push(transaction);
      } else {
        standaloneTransactions.push(transaction);
      }
    });
    
    // Create grouped entries for matches
    matchGroups.forEach((groupTx, matchId) => {
      const firstTransaction = groupTx[0];
      const totalAmount = computeCurrentBalance(groupTx);
      
      grouped.push({
        match_id: typeof matchId === 'number' ? matchId : null,
        match_info: firstTransaction.matches as any,
        transactions: groupTx.sort((a, b) => 
          (a.cost_settings?.name || '').localeCompare(b.cost_settings?.name || '')
        ),
        totalAmount,
        transaction_date: firstTransaction.transaction_date
      });
    });
    
    // Add standalone transactions as individual groups
    standaloneTransactions.forEach(transaction => {
      grouped.push({
        match_id: null,
        transactions: [transaction],
        totalAmount: computeCurrentBalance([transaction]),
        transaction_date: transaction.transaction_date
      });
    });
    
    // Sort by date (newest first), prefer match_date when available, tie-break on max transaction id
    const getSortDate = (g: any) => {
      const d = g?.match_info?.match_date || g?.transaction_date;
      return d ? new Date(d).getTime() : 0;
    };
    const getMaxId = (g: any) => {
      const ids = (g?.transactions || []).map((t: any) => Number(t?.id) || 0);
      return ids.length ? Math.max(...ids) : 0;
    };
    return grouped.sort((a, b) => {
      const diff = getSortDate(b) - getSortDate(a);
      if (diff !== 0) return diff;
      return getMaxId(b) - getMaxId(a);
    });
  };

  const groupedTransactions = groupTransactionsByMatch();

  if (!team) return null;

  return (
    <>
      <AppModal
        open={open}
        onOpenChange={onOpenChange}
        title={`${team.team_name} - Financieel Detail`}
        subtitle={`Financieel overzicht en transacties voor ${team.team_name}`}
        size="lg"
      >
        <div className="space-y-4">
          {/* Current Balance Card */}
          <Card className="bg-gradient-to-br from-brand-50 to-brand-100 border-primary/20">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-brand-900 mb-1">Huidig Saldo</h3>
                  <p className="text-sm text-brand-700 truncate">{team.team_name}</p>
                </div>
                {isBalanceLoading ? (
                  <Skeleton className="h-9 w-28" />
                ) : (
                  <div className="text-right">
                    <div
                      className={cn(
                        "text-2xl sm:text-3xl font-bold whitespace-nowrap",
                        (currentBalance ?? 0) >= 0 ? "text-green-600" : "text-red-600",
                      )}
                    >
                      {formatCurrency(currentBalance ?? 0)}
                    </div>
                    {amountToTopUp(currentBalance ?? 0) > 0 ? (
                      <p className="text-xs text-muted-foreground mt-1">
                        Nog te storten: {formatCurrency(amountToTopUp(currentBalance ?? 0))}
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Add Transaction Section */}
          <Card className="border-primary/20">
            <CardContent className="p-4 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h3 className="text-base font-semibold">Transactie Toevoegen</h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      className="btn btn--outline w-full sm:w-auto flex items-center justify-center gap-2"
                      disabled={loadingCostSettings || !costSettings || costSettings.length === 0}
                    >
                      {loadingCostSettings ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      <span>{loadingCostSettings ? 'Laden...' : 'Kosten Selecteren'}</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end"
                    className="w-[calc(100vw-2rem)] sm:w-80 max-h-96 overflow-y-auto"
                    style={{ zIndex: 1100 }}
                  >
                    {loadingCostSettings ? (
                      <div className="p-4 text-center text-muted-foreground">
                        Kosten laden...
                      </div>
                    ) : costSettings && costSettings.length > 0 ? (
                      costSettings.map((cost) => (
                        <DropdownMenuItem
                          key={cost.id}
                          onClick={() => handleCostSelection(cost)}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 cursor-pointer"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{cost.name}</div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge variant="outline" className="text-xs whitespace-nowrap">
                              {cost.category === 'match_cost' ? 'Wedstrijd' : 
                               cost.category === 'penalty' ? 'Boete' : 
                               cost.category === 'deposit' ? 'Storting' : 'Overig'}
                            </Badge>
                            <span className="font-semibold text-sm whitespace-nowrap">
                              {cost.category === 'deposit' ? 'Handmatig' : formatCurrency(cost.amount)}
                            </span>
                          </div>
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">
                        Geen kosten gevonden
                      </div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Transaction Form */}
              {showAddTransaction && selectedCost && (
                <Card className="border-primary/20">
                  <CardContent className="p-3">
                    <div className="space-y-3">
                      {/* Selected cost preview */}
                      <div>
                        <Label className="text-sm font-medium mb-1.5 block">Geselecteerde Kosten</Label>
                        <div className="p-3 rounded-lg border border-border bg-card flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Euro className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="font-medium text-sm truncate">{selectedCost.name}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge variant="outline" className="text-xs whitespace-nowrap">
                              {selectedCost.category === 'match_cost' ? 'Wedstrijd' : 
                               selectedCost.category === 'penalty' ? 'Boete' : 
                               selectedCost.category === 'deposit' ? 'Storting' : 'Overig'}
                            </Badge>
                            {selectedCost.category !== 'deposit' && (
                              <span className="text-sm font-semibold text-brand-dark tabular-nums">
                                {new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(selectedCost.amount)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Date picker */}
                      <div>
                        <Label className="text-sm font-medium mb-1.5 block">Datum</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !transactionDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {transactionDate ? format(transactionDate, "d MMMM yyyy", { locale: nl }) : <span>Kies een datum</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start" style={{ zIndex: 1100 }}>
                            <Calendar
                              mode="single"
                              selected={transactionDate}
                              onSelect={(date) => date && setTransactionDate(date)}
                              initialFocus
                              className={cn("p-3 pointer-events-auto")}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Custom amount for deposits */}
                      {selectedCost.category === 'deposit' && (
                        <div>
                          <Label htmlFor="custom-amount" className="text-sm font-medium mb-1.5 block">
                            Bedrag (€)
                          </Label>
                          <Input
                            id="custom-amount"
                            type="number"
                            step="0.01"
                            min="0"
                            value={customAmount}
                            onChange={(e) => setCustomAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full"
                          />
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-col gap-2 pt-1">
                        <button
                          onClick={handleAddTransaction}
                          className="btn btn--primary w-full flex items-center justify-center gap-2"
                          disabled={isSubmitting || (selectedCost.category === 'deposit' && (!customAmount || parseFloat(customAmount) <= 0))}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Bezig...
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4" />
                              Transactie Toevoegen
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setShowAddTransaction(false);
                            setSelectedCost(null);
                            setCustomAmount('');
                            setTransactionDate(new Date());
                          }}
                          disabled={isSubmitting}
                          className="btn btn--secondary w-full"
                        >
                          Annuleren
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card className="border-primary/20">
            <CardContent className="p-4">
              <h3 className="text-base font-semibold mb-3">Transactie Geschiedenis</h3>
              
              {transactionsLoadError ? (
                <Alert variant="destructive" className="my-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm">
                      {(transactionsError as Error | undefined)?.message ||
                        "Kon transacties niet laden."}
                    </span>
                    <Button
                      type="button"
                      className="btn btn--secondary"
                      onClick={() => void refetchTransactions()}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" aria-hidden />
                      Opnieuw
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : loadingTransactions ? (
                <div className="space-y-2 py-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="p-3 border border-border rounded-md">
                      <div className="flex justify-between gap-2 mb-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <Skeleton className="h-3 w-full" />
                    </div>
                  ))}
                </div>
              ) : showEmpty ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">Geen transacties gevonden</p>
                </div>
              ) : (
                <div className={`space-y-1.5 transition-opacity ${refreshingTransactions ? "opacity-80" : ""}`}>
                  {refreshingTransactions && (
                    <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground pb-1">
                      <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                      Vernieuwen…
                    </div>
                  )}
                  {groupedTransactions.map((group, groupIndex) => {
                    const isMatchGroup = group.match_id !== null;
                    
                    return (
                      <Card 
                        key={group.match_id || `standalone-${group.transactions[0].id}`}
                        className="border-primary/20 transition-all duration-150 hover:shadow-sm"
                      >
                        <CardContent className="p-3">
                          {/* Compact Match Header */}
                          {isMatchGroup && group.match_info && (() => {
                            // Determine opponent team name
                            const opponentTeam = team && group.match_info.home_team_id && group.match_info.away_team_id
                              ? (group.match_info.home_team_id === team.team_id 
                                  ? group.match_info.teams_away?.team_name 
                                  : group.match_info.teams_home?.team_name)
                              : null;
                            
                            return (
                            <div className="flex items-center justify-between gap-2 mb-1.5 pb-1.5 border-b border-border/60">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Badge 
                                  variant="outline" 
                                  className="text-[10px] px-1.5 py-0.5 shrink-0 bg-brand-50 text-brand-dark border-brand-200"
                                >
                                  {opponentTeam || `#${group.match_info.unique_number}`}
                                </Badge>
                                <span className="text-[11px] text-muted-foreground truncate">
                                  {formatDateShort(group.match_info.match_date || group.transaction_date)}
                                </span>
                              </div>
                              <div 
                                className={cn(
                                  "text-base font-semibold whitespace-nowrap shrink-0 tabular-nums",
                                  group.totalAmount >= 0 ? "text-green-600" : "text-brand-dark",
                                )}
                              >
                                {group.totalAmount >= 0 ? '+' : ''}{formatCurrency(Math.abs(group.totalAmount))}
                              </div>
                            </div>
                            );
                          })()}
                          
                          {/* Compact Transactions List */}
                          <div className="space-y-1">
                            {group.transactions.map((transaction, idx) => (
                              <div 
                                key={transaction.id}
                                className={cn(
                                  "flex items-center justify-between gap-2 py-1",
                                  isMatchGroup && idx < group.transactions.length - 1 && "border-b border-border/30"
                                )}
                              >
                                {/* Left: Type & Description */}
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <div className="flex flex-col min-w-0 flex-1">
                                    {!isMatchGroup && (
                                      <span className="text-[10px] text-muted-foreground leading-tight">
                                        {formatDateShort(transaction.transaction_date)}
                                      </span>
                                    )}
                                    <p className="text-xs font-medium truncate leading-tight">
                                      {transaction.description || 
                                       transaction.cost_settings?.name || 
                                       transaction.matches?.unique_number || 
                                       '-'}
                                    </p>
                                    {transaction.cost_settings?.name === 'Boete te laat ingevuld' && transaction.transaction_date && (() => {
                                      const d = new Date(transaction.transaction_date);
                                      // Display in Belgian timezone
                                      const timeStr = d.toLocaleTimeString('nl-BE', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit',
                                        timeZone: 'Europe/Brussels'
                                      });
                                      // Only show if not midnight (legacy records without time)
                                      if (timeStr !== '00:00:00') {
                                        return (
                                          <span className="text-[10px] text-muted-foreground italic leading-tight">
                                            Ingediend om {timeStr}
                                          </span>
                                        );
                                      }
                                      return null;
                                    })()}
                                  </div>
                                </div>

                                {/* Right: Amount & Actions */}
                                <div className="flex items-center gap-2 shrink-0">
                                  <div 
                                    className={cn(
                                      "text-sm font-semibold whitespace-nowrap tabular-nums",
                                      transaction.transaction_type === 'deposit'
                                        ? "text-green-600"
                                        : "text-brand-dark",
                                    )}
                                  >
                                    {transaction.transaction_type === 'deposit' ? '+' : '-'}
                                    {formatCurrency(Math.abs(transaction.amount))}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      type="button"
                                      onClick={() => handleEditTransaction(transaction)}
                                      className="btn btn--icon btn--edit"
                                      disabled={isSubmitting}
                                      aria-label="Bewerk transactie"
                                    >
                                      <Edit2 className="h-4 w-4" aria-hidden />
                                    </Button>
                                    <Button
                                      type="button"
                                      onClick={() => handleDeleteTransaction(transaction)}
                                      className="btn btn--icon btn--danger"
                                      disabled={isSubmitting}
                                      aria-label="Verwijder transactie"
                                    >
                                      <Trash2 className="h-4 w-4" aria-hidden />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AppModal>

      <TransactionEditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        transaction={selectedTransaction}
        teamId={team?.team_id || 0}
      />

      <AppAlertModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title="Transactie verwijderen"
        size="sm"
        description={
          <DestructiveConfirmDescription
            message={
              <>
                Weet je zeker dat je deze transactie wilt verwijderen?
                <br />
                <br />
                <strong>Bedrag:</strong> {transactionToDelete && formatCurrency(Math.abs(transactionToDelete.amount))}
                <br />
                <strong>Type:</strong> {transactionToDelete && (transactionToDelete.description || transactionToDelete.cost_settings?.name || 'Onbekend')}
              </>
            }
          />
        }
        confirmAction={{
          label: isSubmitting ? "Verwijderen..." : "Ja, verwijderen",
          onClick: confirmDeleteTransaction,
          variant: "destructive",
          disabled: isSubmitting,
          loading: isSubmitting,
        }}
        cancelAction={{
          label: "Annuleren",
          onClick: () => setDeleteModalOpen(false),
          disabled: isSubmitting,
        }}
      />
    </>
  );
};

