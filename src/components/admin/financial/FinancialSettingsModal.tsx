
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { financialService } from "@/services/financialService";
import { useToast } from "@/hooks/use-toast";
import { Settings } from "lucide-react";

interface FinancialSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FinancialSettingsModal: React.FC<FinancialSettingsModalProps> = ({ open, onOpenChange }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    field_cost_per_match: '',
    referee_cost_per_match: ''
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ['financial-settings'],
    queryFn: financialService.getFinancialSettings
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        field_cost_per_match: settings.field_cost_per_match.toString(),
        referee_cost_per_match: settings.referee_cost_per_match.toString()
      });
    }
  }, [settings]);

  const handleSave = async () => {
    if (!formData.field_cost_per_match || !formData.referee_cost_per_match) {
      toast({
        title: "Fout",
        description: "Vul alle velden in",
        variant: "destructive"
      });
      return;
    }

    const result = await financialService.updateFinancialSettings({
      field_cost_per_match: parseFloat(formData.field_cost_per_match),
      referee_cost_per_match: parseFloat(formData.referee_cost_per_match)
    });

    if (result.success) {
      toast({
        title: "Succesvol",
        description: result.message
      });
      queryClient.invalidateQueries({ queryKey: ['financial-settings'] });
      onOpenChange(false);
    } else {
      toast({
        title: "Fout",
        description: result.message,
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Financiële Instellingen
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Veldkosten per wedstrijd (€)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.field_cost_per_match}
              onChange={(e) => setFormData({...formData, field_cost_per_match: e.target.value})}
              placeholder="5.00"
            />
          </div>

          <div>
            <Label>Scheidsrechterkosten per wedstrijd (€)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.referee_cost_per_match}
              onChange={(e) => setFormData({...formData, referee_cost_per_match: e.target.value})}
              placeholder="6.00"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} disabled={isLoading}>
              Opslaan
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuleren
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FinancialSettingsModal;
