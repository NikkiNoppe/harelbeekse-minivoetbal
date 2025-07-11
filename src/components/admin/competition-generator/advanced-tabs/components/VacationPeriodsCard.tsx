import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { VacationPeriod } from "../../types-advanced";
import { formatDateShort } from "@/lib/dateUtils";
import { competitionDataService } from "@/services";

interface VacationPeriodsCardProps {
  vacationPeriods: VacationPeriod[];
  setVacationPeriods: (periods: VacationPeriod[]) => void;
}

const VacationPeriodsCard: React.FC<VacationPeriodsCardProps> = ({
  vacationPeriods,
  setVacationPeriods
}) => {
  const { toast } = useToast();
  
  const [editingPeriod, setEditingPeriod] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: ''
  });
  const [dbVacationPeriods, setDbVacationPeriods] = useState<VacationPeriod[]>([]);

  // Load vacation periods from database
  useEffect(() => {
    const loadVacationPeriods = async () => {
      try {
        const periods = await competitionDataService.getVacationPeriods();
        setDbVacationPeriods(periods);
      } catch (error) {
        console.error('Error loading vacation periods:', error);
      }
    };
    
    loadVacationPeriods();
  }, []);

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
    toast({
      title: "Demo modus",
      description: "Wijzigingen worden niet opgeslagen in deze demo versie. Gebruik de Competitiedata tab voor echte bewerking.",
      variant: "destructive",
    });
    setIsDialogOpen(false);
  };

  const handleDelete = async (period: VacationPeriod) => {
    toast({
      title: "Demo modus",
      description: "Wijzigingen worden niet opgeslagen in deze demo versie. Gebruik de Competitiedata tab voor echte bewerking.",
      variant: "destructive",
    });
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
          <Label className="text-sm font-medium mb-2 block">Standaard verlofperiodes (hardcoded)</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {dbVacationPeriods.map((period) => (
              <div key={period.id} className="p-3 border rounded-lg bg-muted relative group">
                <div className="font-medium">{period.name}</div>
                <div className="text-sm text-muted-foreground">
                  {formatDateShort(period.start_date)} - {formatDateShort(period.end_date)}
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
