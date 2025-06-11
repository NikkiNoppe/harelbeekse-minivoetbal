import React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Loader2, AlertCircle } from "lucide-react";
import { AvailableDate } from "@/components/admin/competition-generator/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface DatesSelectionTabProps {
  availableDates: AvailableDate[] | undefined;
  loadingDates: boolean;
  selectedDates: number[];
  toggleDate: (dateId: number) => void;
  onGenerateSchedule: () => void;
  minimumDatesRequired: number;
}

const DatesSelectionTab: React.FC<DatesSelectionTabProps> = ({
  availableDates,
  loadingDates,
  selectedDates,
  toggleDate,
  onGenerateSchedule,
  minimumDatesRequired
}) => {
  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Selecteer beschikbare speeldagen</h3>
      
      <Alert className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Minimale speeldagen vereist</AlertTitle>
        <AlertDescription>
          Selecteer ten minste {minimumDatesRequired} speeldagen om alle wedstrijden in te plannen.
          U heeft momenteel {selectedDates.length} speeldagen geselecteerd.
        </AlertDescription>
      </Alert>
      
      {loadingDates ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableDates?.map((date) => {
            const isSelected = selectedDates.includes(date.date_id);
            const formattedDate = new Date(date.available_date).toLocaleDateString('nl-NL', {
              weekday: 'short',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            });
            
            return (
              <div 
                key={date.date_id} 
                className={`border p-3 rounded-md flex items-center space-x-3 ${
                  isSelected ? 'border-primary bg-primary/5' : ''
                } ${date.is_cup_date ? 'bg-purple-50 dark:bg-purple-900/10' : ''}`}
                onClick={() => !date.is_cup_date && toggleDate(date.date_id)}
              >
                {!date.is_cup_date ? (
                  <Checkbox 
                    id={`date-${date.date_id}`}
                    checked={isSelected}
                    onCheckedChange={() => toggleDate(date.date_id)}
                  />
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                    Beker
                  </span>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{formattedDate}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <div className="mt-4 pt-4 border-t flex justify-end">
        <Button 
          variant="default" 
          onClick={onGenerateSchedule}
          disabled={selectedDates.length < minimumDatesRequired}
        >
          Schema Genereren
        </Button>
      </div>
    </div>
  );
};

export default DatesSelectionTab;
