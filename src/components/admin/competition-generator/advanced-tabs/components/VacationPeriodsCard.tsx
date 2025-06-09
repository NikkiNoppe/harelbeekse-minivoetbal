
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar, Plus, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { VacationPeriod } from "../../types-advanced";

interface VacationPeriodsCardProps {
  vacationPeriods: VacationPeriod[];
  setVacationPeriods: (periods: VacationPeriod[]) => void;
}

const VacationPeriodsCard: React.FC<VacationPeriodsCardProps> = ({
  vacationPeriods,
  setVacationPeriods
}) => {
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
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Verlofperiodes
        </CardTitle>
        <CardDescription>
          Periodes uit de database waarin geen wedstrijden gepland worden
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Database vacation periods */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Beschikbare verlofperiodes</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {dbVacationPeriods.map((period) => (
              <div key={period.id} className="p-3 border rounded-lg bg-muted">
                <div className="font-medium">{period.name}</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(period.start_date).toLocaleDateString('nl-NL')} - {new Date(period.end_date).toLocaleDateString('nl-NL')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom vacation periods */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Extra verlofperiodes</Label>
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
      </CardContent>
    </Card>
  );
};

export default VacationPeriodsCard;
