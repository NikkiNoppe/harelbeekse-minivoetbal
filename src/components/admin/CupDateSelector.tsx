import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { seasonService } from "@/services";

interface CupDateSelectorProps {
  onDatesSelected: (dates: string[]) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const CupDateSelector: React.FC<CupDateSelectorProps> = ({ onDatesSelected, onCancel, isLoading = false }) => {
  const [selectedDates, setSelectedDates] = useState<string[]>(['', '', '', '', '']);
  const [seasonStartDate, setSeasonStartDate] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Load season data on component mount
  useEffect(() => {
    const loadSeasonData = async () => {
      try {
        console.log('🔄 Loading season data for cup tournament...');
        const seasonData = await seasonService.getSeasonData();
        console.log('✅ Season data loaded:', { season_start_date: seasonData.season_start_date });
        
        if (seasonData.season_start_date) {
          setSeasonStartDate(seasonData.season_start_date);
        } else {
          console.warn('⚠️ No season_start_date found in season data');
          // Fallback to current date + 2 weeks if no season start date
          const fallbackDate = new Date();
          fallbackDate.setDate(fallbackDate.getDate() + 14);
          setSeasonStartDate(fallbackDate.toISOString().split('T')[0]);
        }
      } catch (error) {
        console.error('❌ Error loading season data:', error);
        // Fallback to current date + 2 weeks if season data not available
        const fallbackDate = new Date();
        fallbackDate.setDate(fallbackDate.getDate() + 14);
        setSeasonStartDate(fallbackDate.toISOString().split('T')[0]);
      } finally {
        setLoading(false);
      }
    };

    loadSeasonData();
  }, []);
  
  // Calculate minimum dates based on season start date
  const getMinimumDates = () => {
    if (!seasonStartDate) {
      console.log('⏳ No season start date available yet, returning empty dates');
      return ['', '', '', '', ''];
    }
    
    const seasonStart = new Date(seasonStartDate);
    const today = new Date();
    
    // Use the later of today + 2 weeks or season start date
    const twoWeeksFromNow = new Date(today);
    twoWeeksFromNow.setDate(today.getDate() + 14);
    
    const startDate = seasonStart > twoWeeksFromNow ? seasonStart : twoWeeksFromNow;
    
    console.log('📅 Calculating minimum dates:', {
      seasonStartDate,
      todayPlus2Weeks: twoWeeksFromNow.toISOString().split('T')[0],
      selectedStartDate: startDate.toISOString().split('T')[0],
      reason: seasonStart > twoWeeksFromNow ? 'Using season start date' : 'Using today + 2 weeks'
    });
    
    const dates = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + (i * 7)); // Each week
      dates.push(date.toISOString().split('T')[0]);
    }
    
    console.log('📋 Minimum dates for cup tournament:', dates);
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
    { type: "group", name: "Achtste Finales", subRounds: [
      { name: "Speelweek 1", index: 0 },
      { name: "Speelweek 2", index: 1 }
    ]},
    { type: "single", name: "Kwart Finales", index: 2 },
    { type: "single", name: "Halve Finales", index: 3 },
    { type: "single", name: "Finale", index: 4 }
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
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="text-sm text-muted-foreground">Seizoensdata laden...</div>
            </div>
          ) : (
            <>



                              <div className="space-y-4">
                  {rounds.map((round, roundIndex) => (
                    <div key={roundIndex}>
                                            {round.type === "group" ? (
                        <div className="space-y-3">
                          <Label className="font-medium text-base">{round.name}</Label>
                          <div className="border rounded-lg p-4 ml-4 bg-gray-50">
                            {round.subRounds?.map((subRound) => (
                              <div key={subRound.index} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center py-2">
                                <div>
                                  <Label className="font-medium">{subRound.name}</Label>
                                </div>
                                <div>
                                  <Label htmlFor={`date-${subRound.index}`} className="text-sm">Selecteer datum</Label>
                                  <Input
                                    id={`date-${subRound.index}`}
                                    type="date"
                                    value={selectedDates[subRound.index]}
                                    min={minimumDates[subRound.index]}
                                    onChange={(e) => handleDateChange(subRound.index, e.target.value)}
                                    className="w-full"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center p-3 border rounded-lg">
                          <div>
                            <Label className="font-medium">{round.name}</Label>
                          </div>
                          <div>
                            <Label htmlFor={`date-${round.index}`} className="text-sm">Selecteer datum</Label>
                            <Input
                              id={`date-${round.index}`}
                              type="date"
                              value={selectedDates[round.index!]}
                              min={minimumDates[round.index!]}
                              onChange={(e) => handleDateChange(round.index!, e.target.value)}
                              className="w-full"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
            </>
          )}

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleSubmit}
              disabled={!isValidSelection || isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Bezig met aanmaken...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Data Bevestigen
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={onCancel}
              disabled={isLoading}
            >
              Annuleren
            </Button>
          </div>

          {!isValidSelection && selectedDates.some(date => date !== '') && (
            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
              <p className="text-sm text-red-800">
                <strong>Ongeldige selectie:</strong> Alle 5 speelweken moeten geselecteerd zijn en 
                voldoen aan de seizoensdata (minimaal vanaf {seasonStartDate ? new Date(seasonStartDate).toLocaleDateString('nl-NL') : 'onbekende datum'} 
                of 2 weken van vandaag).
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CupDateSelector; 