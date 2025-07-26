
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { financialService } from "@/services/financial";
import { useToast } from "@/hooks/use-toast";
import { Settings, X } from "lucide-react";

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
      <DialogContent className="sm:max-w-md bg-purple-100 border-purple-light shadow-lg relative mx-4 sm:mx-auto">
        <button
          type="button"
          className="btn--close"
          aria-label="Sluiten"
          onClick={() => onOpenChange(false)}
        >
          <X size={20} />
        </button>
        <DialogHeader className="bg-purple-100">
          <DialogTitle className="text-2xl text-purple-light flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Financiële Instellingen
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 bg-purple-100">
          <div>
            <Label className="text-purple-dark font-medium">Veldkosten per wedstrijd (€)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.field_cost_per_match}
              onChange={(e) => setFormData({...formData, field_cost_per_match: e.target.value})}
              placeholder="5.00"
              className="bg-white border-gray-300 text-purple-dark"
            />
          </div>

          <div>
            <Label className="text-purple-dark font-medium">Scheidsrechterkosten per wedstrijd (€)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.referee_cost_per_match}
              onChange={(e) => setFormData({...formData, referee_cost_per_match: e.target.value})}
              placeholder="6.00"
              className="bg-white border-gray-300 text-purple-dark"
            />
          </div>

          <div className="flex gap-2 pt-4 bg-purple-100">
            <Button onClick={handleSave} disabled={isLoading} className="bg-purple-dark text-white hover:bg-purple-light">
              Opslaan
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="border-purple-light text-purple-dark hover:bg-purple-light hover:text-white">
              Annuleren
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FinancialSettingsModal;
