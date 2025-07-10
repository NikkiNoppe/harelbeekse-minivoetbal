import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CupDateSelectorProps {
  onDatesSelected: (dates: string[]) => void;
  onCancel: () => void;
}

const CupDateSelector: React.FC<CupDateSelectorProps> = ({ onDatesSelected, onCancel }) => {
  const [selectedDates, setSelectedDates] = useState<string[]>(['', '', '', '', '']);
  
  // Calculate minimum dates based on requirements
  const getMinimumDates = () => {
    const today = new Date();
    const twoWeeksFromNow = new Date(today);
    twoWeeksFromNow.setDate(today.getDate() + 14);
    
    const dates = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date(twoWeeksFromNow);
      date.setDate(twoWeeksFromNow.getDate() + (i * 7)); // Each week
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const minimumDates = getMinimumDates();

  const handleDateChange = (index: number, value: string) => {
    const newDates = [...selectedDates];
    newDates[index] = value;
    setSelectedDates(newDates);
  };

  const handleSubmit = () => {
    // Filter out empty dates and validate
    const validDates = selectedDates.filter(date => date !== '');
    if (validDates.length === 5) {
      onDatesSelected(validDates);
    }
  };

  const isValidSelection = selectedDates.every(date => date !== '') && 
                          selectedDates.every((date, index) => date >= minimumDates[index]);

  const rounds = [
    { name: "Achtste Finales", description: "8 wedstrijden, max 7 per speelmoment" },
    { name: "Kwartfinales", description: "4 wedstrijden" },
    { name: "Halve Finales", description: "2 wedstrijden" },
    { name: "Finale", description: "1 wedstrijd" },
    { name: "Reserve Week", description: "Voor inhaalwedstrijden" }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Speeldata Selecteren
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              De achtste finales moeten minimaal over 2 weken plaatsvinden. Per speelweek zijn er maximaal 7 speelmomenten beschikbaar, dus voor 8 wedstrijden in de achtste finale zijn 2 weken nodig.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {rounds.map((round, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center p-3 border rounded-lg">
                <div>
                  <Label className="font-medium">{round.name}</Label>
                  <p className="text-sm text-muted-foreground">{round.description}</p>
                </div>
                <div>
                  <Label htmlFor={`date-${index}`} className="text-sm">Speelweek {index + 1}</Label>
                  <Input
                    id={`date-${index}`}
                    type="date"
                    value={selectedDates[index]}
                    min={minimumDates[index]}
                    onChange={(e) => handleDateChange(index, e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  Minimaal: {new Date(minimumDates[index]).toLocaleDateString('nl-NL')}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Beschikbare Speelmomenten per Week:</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Maandag, Dinsdag, Woensdag, Donderdag, Vrijdag: 19:00-21:30</p>
              <p>• Zaterdag: 14:00-17:00</p>
              <p>• Zondag: 10:00-13:00</p>
              <p className="font-medium text-blue-700 mt-2">Totaal: 7 speelmomenten per week</p>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleSubmit}
              disabled={!isValidSelection}
              className="flex-1"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Data Bevestigen
            </Button>
            <Button 
              variant="outline" 
              onClick={onCancel}
            >
              Annuleren
            </Button>
          </div>

          {!isValidSelection && selectedDates.some(date => date !== '') && (
            <p className="text-sm text-destructive">
              Alle 5 speelweken moeten geselecteerd zijn en voldoen aan de minimum data.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CupDateSelector; 