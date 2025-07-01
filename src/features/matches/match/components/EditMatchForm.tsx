
import React, { useState, useEffect } from "react";
import { MatchFormData } from "../types";
import { Label } from "@shared/components/ui/label";
import { Input } from "@shared/components/ui/input";
import { Textarea } from "@shared/components/ui/textarea";
import { Button } from "@shared/components/ui/button";
import { toast } from "@shared/hooks/use-toast";

interface EditMatchFormProps {
  initialData: Partial<MatchFormData>;
  onSave: (data: MatchFormData) => void;
  onCancel: () => void;
}

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select";

export const EditMatchForm: React.FC<EditMatchFormProps> = ({
  initialData,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<Partial<MatchFormData>>(initialData);

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date || !formData.time || !formData.homeTeam || !formData.awayTeam) {
      toast({
        title: "Validatiefout",
        description: "Vul alle verplichte velden in",
        variant: "destructive",
      });
      return;
    }

    onSave(formData as MatchFormData);
  };

  const handleInputChange = (field: keyof MatchFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="date">Datum</Label>
          <Input
            id="date"
            type="date"
            value={formData.date || ''}
            onChange={(e) => handleInputChange('date', e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="time">Tijd</Label>
          <Input
            id="time"
            type="time"
            value={formData.time || ''}
            onChange={(e) => handleInputChange('time', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="homeTeam">Thuisteam</Label>
          <Input
            id="homeTeam"
            value={formData.homeTeam || ''}
            onChange={(e) => handleInputChange('homeTeam', e.target.value)}
            placeholder="Thuisteam"
            required
          />
        </div>
        <div>
          <Label htmlFor="awayTeam">Uitteam</Label>
          <Input
            id="awayTeam"
            value={formData.awayTeam || ''}
            onChange={(e) => handleInputChange('awayTeam', e.target.value)}
            placeholder="Uitteam"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="location">Locatie</Label>
        <Input
          id="location"
          value={formData.location || ''}
          onChange={(e) => handleInputChange('location', e.target.value)}
          placeholder="Wedstrijdlocatie"
        />
      </div>

      <div>
        <Label htmlFor="referee">Scheidsrechter</Label>
        <Input
          id="referee"
          value={formData.referee || ''}
          onChange={(e) => handleInputChange('referee', e.target.value)}
          placeholder="Scheidsrechter"
        />
      </div>

      <div>
        <Label htmlFor="notes">Opmerkingen</Label>
        <Textarea
          id="notes"
          value={formData.notes || ''}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          placeholder="Eventuele opmerkingen"
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuleren
        </Button>
        <Button type="submit">
          Opslaan
        </Button>
      </div>
    </form>
  );
};
