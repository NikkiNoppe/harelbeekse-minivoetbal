
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarDays, Clock, Palmtree } from "lucide-react";
import { AdvancedCompetitionConfig, VacationPeriod } from "../types-advanced";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface DurationTabProps {
  config: AdvancedCompetitionConfig;
  setConfig: (config: AdvancedCompetitionConfig) => void;
  vacationPeriods: VacationPeriod[];
  onNext: () => void;
  onPrevious: () => void;
}

const DurationTab: React.FC<DurationTabProps> = ({ 
  config, 
  setConfig, 
  vacationPeriods, 
  onNext, 
  onPrevious 
}) => {
  const handleConfigChange = (field: keyof AdvancedCompetitionConfig, value: any) => {
    setConfig({ ...config, [field]: value });
  };

  const handleVacationPeriodToggle = (periodId: number, checked: boolean) => {
    const currentPeriods = config.vacation_periods || [];
    if (checked) {
      setConfig({ 
        ...config, 
        vacation_periods: [...currentPeriods, periodId] 
      });
    } else {
      setConfig({ 
        ...config, 
        vacation_periods: currentPeriods.filter(id => id !== periodId) 
      });
    }
  };

  const isValid = config.start_date && config.end_date && config.start_date < config.end_date;

  const calculateDuration = () => {
    if (!config.start_date || !config.end_date) return null;
    
    const start = new Date(config.start_date);
    const end = new Date(config.end_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.round(diffDays / 7);
    
    return { days: diffDays, weeks: diffWeeks };
  };

  const duration = calculateDuration();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <CalendarDays className="w-5 h-5" />
        <h3 className="text-lg font-semibold">Competitie Planning</h3>
      </div>

      <div className="grid gap-6">
        {/* Datums */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Competitieperiode
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Startdatum</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={config.start_date}
                  onChange={(e) => handleConfigChange('start_date', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDate">Einddatum</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={config.end_date}
                  onChange={(e) => handleConfigChange('end_date', e.target.value)}
                />
              </div>
            </div>

            {duration && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm">
                  <strong>Competitieduur:</strong> {duration.days} dagen ({duration.weeks} weken)
                </p>
                <p className="text-sm text-muted-foreground">
                  Met {config.matches_per_week} wedstrijden per week kunnen er maximaal{' '}
                  {duration.weeks * config.matches_per_week} wedstrijden gespeeld worden
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Verlofperiodes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Palmtree className="w-4 h-4" />
              Verlofperiodes
            </CardTitle>
            <CardDescription>
              Selecteer periodes waarin geen wedstrijden gespeeld worden
            </CardDescription>
          </CardHeader>
          <CardContent>
            {vacationPeriods.length === 0 ? (
              <p className="text-muted-foreground">Geen verlofperiodes beschikbaar</p>
            ) : (
              <div className="space-y-3">
                {vacationPeriods.map((period) => (
                  <div key={period.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`vacation-${period.id}`}
                      checked={config.vacation_periods.includes(period.id)}
                      onCheckedChange={(checked) => 
                        handleVacationPeriodToggle(period.id, checked as boolean)
                      }
                    />
                    <Label htmlFor={`vacation-${period.id}`} className="flex-1">
                      <div>
                        <span className="font-medium">{period.name}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {format(new Date(period.start_date), 'dd MMM', { locale: nl })} -{' '}
                          {format(new Date(period.end_date), 'dd MMM yyyy', { locale: nl })}
                        </span>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          Vorige: Format
        </Button>
        <Button onClick={onNext} disabled={!isValid}>
          Volgende: Teams
        </Button>
      </div>
    </div>
  );
};

export default DurationTab;
