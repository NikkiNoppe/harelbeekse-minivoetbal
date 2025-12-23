import React, { useState, useEffect } from "react";
import { AppModal, AppModalHeader, AppModalTitle, AppModalFooter } from "@/components/ui/app-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { costSettingsService } from "@/services/financial";
import { useToast } from "@/hooks/use-toast";
import { formatDateShort, getCurrentDate } from "@/lib/dateUtils";

interface Transaction {
  id: number;
  team_id: number;
  transaction_type: 'deposit' | 'penalty' | 'match_cost' | 'adjustment';
  amount: number;
  description: string | null;
  penalty_type_id: number | null;
  match_id: number | null;
  transaction_date: string;
  created_at: string;
  cost_setting_id?: number | null;
  cost_settings?: {
    name: string;
    description: string;
    category: string;
  };
}

interface TransactionEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
  teamId: number;
}

const TransactionEditModal: React.FC<TransactionEditModalProps> = ({ 
  open, 
  onOpenChange, 
  transaction, 
  teamId 
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    cost_setting_id: '',
    amount: '',
    description: '',
    transaction_date: getCurrentDate()
  });

  const { data: costSettings } = useQuery({
    queryKey: ['cost-settings'],
    queryFn: costSettingsService.getCostSettings
  });

  // Initialize form when transaction changes
  useEffect(() => {
    if (transaction) {
      setFormData({
        cost_setting_id: transaction.cost_setting_id?.toString() || '',
        amount: transaction.amount.toString(),
        description: transaction.description || '',
        transaction_date: transaction.transaction_date
      });
    } else {
      setFormData({
        cost_setting_id: '',
        amount: '',
        description: '',
        transaction_date: getCurrentDate()
      });
    }
  }, [transaction]);

  const handleSave = async () => {
    if (!transaction) return;

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast({
        title: "Fout",
        description: "Vul een geldig bedrag in",
        variant: "destructive"
      });
      return;
    }

    if (!formData.transaction_date) {
      toast({
        title: "Fout",
        description: "Vul een datum in",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await costSettingsService.updateTransaction(transaction.id, {
        amount: parseFloat(formData.amount),
        transaction_date: formData.transaction_date,
        cost_setting_id: formData.cost_setting_id ? parseInt(formData.cost_setting_id) : null
      });

      if (result.success) {
        toast({
          title: "Succesvol",
          description: result.message
        });
        await queryClient.invalidateQueries({ queryKey: ['team-transactions'] });
        await queryClient.refetchQueries({ queryKey: ['team-transactions'], type: 'active' });
        onOpenChange(false);
      } else {
        toast({
          title: "Fout",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het bijwerken van de transactie",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  if (!transaction) return null;

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title="Transactie Bewerken"
      size="sm"
      primaryAction={{
        label: isSubmitting ? 'Bezig...' : 'Opslaan',
        onClick: handleSave,
        variant: "primary",
        disabled: isSubmitting,
        loading: isSubmitting,
      }}
      secondaryAction={{
        label: "Annuleren",
        onClick: () => onOpenChange(false),
        variant: "secondary",
        disabled: isSubmitting,
      }}
    >
      <div className="space-y-4">
        <div>
          <Label>Type Transactie</Label>
          <Select 
            value={formData.cost_setting_id} 
            onValueChange={(value) => {
              const selectedCost = costSettings?.find(cs => cs.id.toString() === value);
              setFormData({
                ...formData,
                cost_setting_id: value,
                amount: selectedCost?.amount?.toString() || formData.amount,
                description: selectedCost?.name || formData.description
              });
            }}
          >
            <SelectTrigger className="modal__input">
              <SelectValue placeholder="Selecteer transactie type" />
            </SelectTrigger>
            <SelectContent>
              {costSettings?.map((cost) => (
                <SelectItem key={cost.id} value={cost.id.toString()}>
                  {cost.name} - €{cost.amount || '0'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Bedrag (€)</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: e.target.value})}
            placeholder="0.00"
            className="modal__input"
          />
        </div>

        <div>
          <Label>Datum</Label>
          <Input
            type="date"
            value={formData.transaction_date}
            onChange={(e) => setFormData({...formData, transaction_date: e.target.value})}
            className="modal__input"
          />
        </div>

        <div>
          <Label>Beschrijving</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Optionele beschrijving..."
            rows={3}
            className="modal__input"
          />
        </div>
      </div>
    </AppModal>
  );
};

export default TransactionEditModal;