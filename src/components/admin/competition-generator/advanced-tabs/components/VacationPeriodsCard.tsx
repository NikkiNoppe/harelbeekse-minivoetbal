
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Plus, Edit, Trash2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { VacationPeriod } from "../../types-advanced";

interface VacationPeriodsCardProps {
  vacationPeriods: VacationPeriod[];
  setVacationPeriods: (periods: VacationPeriod[]) => void;
}

const VacationPeriodsCard: React.FC<VacationPeriodsCardProps> = ({
  vacationPeriods,
  setVacationPeriods
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [editingPeriod, setEditingPeriod] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: ''
  });

  // Fetch vacation periods from database
  const { data: dbVacationPeriods = [] } = useQuery({
    queryKey: ['vacation-periods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vacation_periods')
        .select('*')
        .eq('is_active', true)
        .order('start_date');
      
      if (error) throw error;
      return data as VacationPeriod[];
    }
  });

  const handleEdit = (period: VacationPeriod) => {
    setEditingPeriod(period);
    setFormData({
      name: period.name,
      start_date: period.start_date,
      end_date: period.end_date
    });
    setIsAddingNew(false);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingPeriod(null);
    setFormData({
      name: '',
      start_date: '',
      end_date: ''
    });
    setIsAddingNew(true);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.start_date || !formData.end_date) {
      toast({
        title: "Onvolledige gegevens",
        description: "Vul alle velden in",
        variant: "destructive",
      });
      return;
    }

    if (new Date(formData.start_date) >= new Date(formData.end_date)) {
      toast({
        title: "Ongeldige datums",
        description: "Einddatum moet na startdatum liggen",
        variant: "destructive",
      });
      return;
    }

    try {
      const periodData = {
        name: formData.name.trim(),
        start_date: formData.start_date,
        end_date: formData.end_date,
        is_active: true
      };

      if (isAddingNew) {
        const { error } = await supabase
          .from('vacation_periods')
          .insert(periodData);
        
        if (error) throw error;
        
        toast({
          title: "Verlofperiode toegevoegd",
          description: `${formData.name} is succesvol toegevoegd`,
        });
      } else {
        const { error } = await supabase
          .from('vacation_periods')
          .update(periodData)
          .eq('id', editingPeriod.id);
        
        if (error) throw error;
        
        toast({
          title: "Verlofperiode bijgewerkt",
          description: `${formData.name} is succesvol bijgewerkt`,
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['vacation-periods'] });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving vacation period:', error);
      toast({
        title: "Fout bij opslaan",
        description: "Er is een fout opgetreden bij het opslaan van de verlofperiode.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (period: VacationPeriod) => {
    if (!confirm(`Weet je zeker dat je ${period.name} wilt verwijderen?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('vacation_periods')
        .update({ is_active: false })
        .eq('id', period.id);
      
      if (error) throw error;
      
      toast({
        title: "Verlofperiode verwijderd",
        description: `${period.name} is succesvol verwijderd`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['vacation-periods'] });
    } catch (error) {
      console.error('Error deleting vacation period:', error);
      toast({
        title: "Fout bij verwijderen",
        description: "Er is een fout opgetreden bij het verwijderen van de verlofperiode.",
        variant: "destructive",
      });
    }
  };

  const addVacationPeriod = () => {
    const newPeriod: VacationPeriod = {
      id: Date.now(),
      name: '',
      start_date: '',
      end_date: ''
    };
    setVacationPeriods([...vacationPeriods, newPeriod]);
  };

  const removeVacationPeriod = (id: number) => {
    setVacationPeriods(vacationPeriods.filter(period => period.id !== id));
  };

  const updateVacationPeriod = (id: number, field: keyof VacationPeriod, value: string) => {
    setVacationPeriods(vacationPeriods.map(period =>
      period.id === id ? { ...period, [field]: value } : period
    ));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Verlofperiodes
            </CardTitle>
            <CardDescription>
              Periodes waarin geen wedstrijden gepland worden
            </CardDescription>
          </div>
          <Button onClick={handleAdd} size="sm" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nieuwe periode
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Database vacation periods */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Database verlofperiodes</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {dbVacationPeriods.map((period) => (
              <div key={period.id} className="p-3 border rounded-lg bg-muted relative group">
                <div className="font-medium">{period.name}</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(period.start_date).toLocaleDateString('nl-NL')} - {new Date(period.end_date).toLocaleDateString('nl-NL')}
                </div>
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(period)}
                    className="h-6 w-6 p-0"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(period)}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom vacation periods */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Extra verlofperiodes (tijdelijk)</Label>
          {vacationPeriods.map((period) => (
            <div key={period.id} className="flex items-center gap-2 p-3 border rounded mb-2">
              <Input
                placeholder="Naam periode (bijv. Kerstvakantie)"
                value={period.name}
                onChange={(e) => updateVacationPeriod(period.id, 'name', e.target.value)}
                className="flex-1"
              />
              <Input
                type="date"
                value={period.start_date}
                onChange={(e) => updateVacationPeriod(period.id, 'start_date', e.target.value)}
                className="w-36"
              />
              <Input
                type="date"
                value={period.end_date}
                onChange={(e) => updateVacationPeriod(period.id, 'end_date', e.target.value)}
                className="w-36"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeVacationPeriod(period.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          
          <Button
            variant="outline"
            onClick={addVacationPeriod}
            className="w-full flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Extra verlofperiode toevoegen
          </Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isAddingNew ? 'Nieuwe verlofperiode toevoegen' : 'Verlofperiode bewerken'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="period-name">Naam</Label>
                <Input
                  id="period-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Bijv. Kerstvakantie"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date">Start datum</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="end-date">Eind datum</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuleren
                </Button>
                <Button onClick={handleSave}>
                  {isAddingNew ? 'Toevoegen' : 'Opslaan'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default VacationPeriodsCard;
