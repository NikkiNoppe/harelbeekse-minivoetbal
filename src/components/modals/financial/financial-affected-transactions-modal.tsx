import React, { useCallback, useMemo } from "react";
import { AppModal } from "@/components/modals/base/app-modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { enhancedCostSettingsService, type TeamTransaction } from "@/services/financial";

interface FinancialAffectedTransactionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  costSettingId: number;
  costSettingName: string;
  oldAmount: number;
  newAmount: number;
}

export const FinancialAffectedTransactionsModal: React.FC<FinancialAffectedTransactionsModalProps> = ({
  open,
  onOpenChange,
  costSettingId,
  costSettingName,
  oldAmount,
  newAmount
}) => {
  const [transactions, setTransactions] = React.useState<TeamTransaction[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (open && costSettingId) {
      loadAffectedTransactions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, costSettingId]);

  const loadAffectedTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await enhancedCostSettingsService.getAffectedTransactions(costSettingId);
      setTransactions(data);
    } catch (error) {
      console.error('Error loading affected transactions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [costSettingId]);

  const formatCurrency = useMemo(() => (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }, []);

  const formatDate = useMemo(() => (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL');
  }, []);

  const getTransactionTypeLabel = useMemo(() => (type: string) => {
    switch (type) {
      case 'match_cost': return 'Wedstrijdkosten';
      case 'penalty': return 'Boete';
      case 'deposit': return 'Storting';
      case 'adjustment': return 'Aanpassing';
      default: return type;
    }
  }, []);

  const getTransactionTypeColor = useMemo(() => (type: string) => {
    switch (type) {
      case 'match_cost': return 'bg-brand-100 text-brand-800 border-brand-200';
      case 'penalty': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'deposit': return 'bg-green-50 text-green-700 border-green-200';
      case 'adjustment': return 'bg-orange-50 text-orange-700 border-orange-200';
      default: return 'bg-muted text-card-foreground border-border';
    }
  }, []);

  const totalImpact = useMemo(() => transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0), [transactions]);
  const amountDifference = newAmount - oldAmount;

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title="Getroffen Transacties"
      subtitle={`Overzicht van transacties die automatisch zijn aangepast na wijziging van "${costSettingName}"`}
      size="lg"
    >
      <div className="space-y-4">
        {/* Summary Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Wijziging:</strong> {formatCurrency(oldAmount)} → {formatCurrency(newAmount)}
            ({amountDifference > 0 ? '+' : ''}{formatCurrency(amountDifference)})
            <br />
            <strong>Getroffen transacties:</strong> {transactions.length}
            <br />
            <strong>Totaal impact:</strong> <span className="text-brand-dark">{formatCurrency(totalImpact)}</span>
          </AlertDescription>
        </Alert>

        {/* Transactions Table */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" aria-hidden="true"></div>
            <p className="mt-2 text-sm text-muted-foreground">Laden van getroffen transacties...</p>
          </div>
        ) : transactions.length > 0 ? (
          <div className="border border-primary/20 rounded-lg overflow-x-auto">
            <Table className="table min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Team</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Oud Bedrag</TableHead>
                  <TableHead>Nieuw Bedrag</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Beschrijving</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium text-brand-dark">
                      Team {transaction.team_id}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("border", getTransactionTypeColor(transaction.transaction_type))}>
                        {getTransactionTypeLabel(transaction.transaction_type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-destructive font-medium">
                      {formatCurrency(oldAmount)}
                    </TableCell>
                    <TableCell className="text-brand-dark font-semibold">
                      {formatCurrency(newAmount)}
                    </TableCell>
                    <TableCell className="text-brand-dark">
                      {formatDate(transaction.transaction_date)}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-brand-dark">
                      {transaction.description || 'Geen beschrijving'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Info className="h-8 w-8 mx-auto mb-2" />
            <p>Geen getroffen transacties gevonden</p>
          </div>
        )}

        {/* Warning about balance impact */}
        {transactions.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Let op:</strong> Deze wijzigingen hebben invloed op de team balances.
              Alle getroffen teams hebben automatisch een aangepaste balans gekregen.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </AppModal>
  );
};

