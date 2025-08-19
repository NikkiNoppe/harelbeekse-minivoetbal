import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { seasonService } from "@/services";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BekerDateSelectorProps {
  onDatesSelected: (dates: string[]) => void;
  onCancel: () => void;
  isLoading?: boolean;
  weeks?: 4 | 5; // default 5
  allowByeSelection?: boolean;
  teamsForBye?: Array<{ team_id: number; team_name: string }>;
  onByeSelected?: (teamId: number | null) => void;
}

// Memoized date input component
const BekerDateInput = React.memo<{
  id: string;
  label: string;
  value: string;
  minDate: string;
  onChange: (value: string) => void;
}>(({ id, label, value, minDate, onChange }) => (
  <div>
    <Label htmlFor={id} className="text-sm">{label}</Label>
    <Input
      id={id}
      type="date"
      value={value}
      min={minDate}
      onChange={(e) => onChange(e.target.value)}
      className="w-full"
    />
  </div>
));

// Memoized round component
const BekerRoundComponent = React.memo<{
  round: {
    type: "group" | "single";
    name: string;
    index?: number;
    subRounds?: Array<{ name: string; index: number }>;
  };
  selectedDates: string[];
  minimumDates: string[];
  onDateChange: (index: number, value: string) => void;
}>(({ round, selectedDates, minimumDates, onDateChange }) => {
  const handleDateChange = useCallback((index: number, value: string) => {
    onDateChange(index, value);
  }, [onDateChange]);

  if (round.type === "group") {
    return (
      <div className="space-y-2">
        <Label className="font-semibold text-sm">{round.name}</Label>
        <div className="ml-2 space-y-2">
          {round.subRounds?.map((subRound) => (
            <div key={subRound.index} className="grid grid-cols-1 gap-2 items-center">
              <BekerDateInput
                id={`beker-date-${subRound.index}`}
                label="Selecteer datum"
                value={selectedDates[subRound.index]}
                minDate={minimumDates[subRound.index]}
                onChange={(value) => handleDateChange(subRound.index, value)}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <Label className="font-semibold text-sm">{round.name}</Label>
      <BekerDateInput
        id={`beker-date-${round.index}`}
        label="Selecteer datum"
        value={selectedDates[round.index!]}
        minDate={minimumDates[round.index!]}
        onChange={(value) => handleDateChange(round.index!, value)}
      />
    </div>
  );
});

// Memoized loading component
const BekerLoadingComponent = React.memo(() => (
  <div className="flex justify-center items-center py-8">
    <div className="text-sm text-muted-foreground">Seizoensdata laden...</div>
  </div>
));

// Memoized validation error component
const BekerValidationError = React.memo<{
  isValidSelection: boolean;
  selectedDates: string[];
  seasonStartDate: string;
}>(({ isValidSelection, selectedDates, seasonStartDate }) => {
  if (isValidSelection || !selectedDates.some(date => date !== '')) {
    return null;
  }

  const formattedDate = useMemo(() => {
    if (!seasonStartDate) return 'onbekende datum';
    return new Date(seasonStartDate).toLocaleDateString('nl-NL');
  }, [seasonStartDate]);

  return (
    <div className="bg-red-50 p-3 rounded-lg border border-red-200">
      <p className="text-sm text-red-800">
        <strong>Ongeldige selectie:</strong> Alle 5 speelweken moeten geselecteerd zijn en 
        voldoen aan de seizoensdata (minimaal vanaf {formattedDate} 
        of 2 weken van vandaag).
      </p>
    </div>
  );
});

const BekerDateSelector: React.FC<BekerDateSelectorProps> = ({ onDatesSelected, onCancel, isLoading = false, weeks = 5, allowByeSelection = false, teamsForBye = [], onByeSelected }) => {
  const [selectedDates, setSelectedDates] = useState<string[]>(Array.from({ length: weeks }, () => ''));
  const [seasonStartDate, setSeasonStartDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [byeTeamId, setByeTeamId] = useState<number | null>(null);

  // Memoize rounds configuration to prevent unnecessary re-renders
  const bekerRounds = useMemo(() => {
    if (weeks === 4) {
      return [
        { type: "single" as const, name: "Achtste Finales", index: 0 },
        { type: "single" as const, name: "Kwart Finales", index: 1 },
        { type: "single" as const, name: "Halve Finales", index: 2 },
        { type: "single" as const, name: "Finale", index: 3 }
      ];
    }
    return [
      { type: "group" as const, name: "Achtste Finales", subRounds: [
        { name: "Speelweek 1", index: 0 },
        { name: "Speelweek 2", index: 1 }
      ]},
      { type: "single" as const, name: "Kwart Finales", index: 2 },
      { type: "single" as const, name: "Halve Finales", index: 3 },
      { type: "single" as const, name: "Finale", index: 4 }
    ];
  }, [weeks]);

  // Load season data on component mount
  useEffect(() => {
    const loadSeasonData = async () => {
      try {
        console.log('🔄 Loading season data for beker tournament...');
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
  
  // Memoize minimum dates calculation to prevent unnecessary recalculations
  const bekerMinimumDates = useMemo(() => {
    if (!seasonStartDate) {
      console.log('⏳ No season start date available yet, returning empty dates');
      return Array.from({ length: weeks }, () => '');
    }
    
    const seasonStart = new Date(seasonStartDate);
    const today = new Date();
    
    // Use the later of today + 2 weeks or season start date
    const twoWeeksFromNow = new Date(today);
    twoWeeksFromNow.setDate(today.getDate() + 14);
    
    const startDate = seasonStart > twoWeeksFromNow ? seasonStart : twoWeeksFromNow;
    
    console.log('📅 Calculating minimum dates for beker tournament:', {
      seasonStartDate,
      todayPlus2Weeks: twoWeeksFromNow.toISOString().split('T')[0],
      selectedStartDate: startDate.toISOString().split('T')[0],
      reason: seasonStart > twoWeeksFromNow ? 'Using season start date' : 'Using today + 2 weeks'
    });
    
    const dates = [];
    for (let i = 0; i < weeks; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + (i * 7)); // Each week
      dates.push(date.toISOString().split('T')[0]);
    }
    
    console.log('📋 Minimum dates for beker tournament:', dates);
    return dates;
  }, [seasonStartDate, weeks]);

  // Memoize date change handler
  const handleBekerDateChange = useCallback((index: number, value: string) => {
    setSelectedDates(prev => {
      const newDates = [...prev];
      newDates[index] = value;
      return newDates;
    });
  }, []);

  // Memoize submit handler
  const handleBekerSubmit = useCallback(() => {
    // Filter out empty dates and validate
    const validDates = selectedDates.filter(date => date !== '');
    if (validDates.length === weeks) {
      onDatesSelected(validDates);
    }
  }, [selectedDates, onDatesSelected, weeks]);

  // Memoize validation state
  const isBekerSelectionValid = useMemo(() => 
    selectedDates.length === weeks &&
    selectedDates.every(date => date !== '') && 
    selectedDates.every((date, index) => date >= bekerMinimumDates[index]),
    [selectedDates, bekerMinimumDates, weeks]
  );

  // Memoize button disabled state
  const isBekerSubmitDisabled = useMemo(() => 
    !isBekerSelectionValid || isLoading,
    [isBekerSelectionValid, isLoading]
  );

  return (
    <div className="modal">
      <div className="modal__title">Beker Speeldata Selecteren</div>
      <div className="space-y-3">
        {allowByeSelection && teamsForBye.length % 2 === 1 && (
          <div className="space-y-1">
            <Label>Bye team (stroomt door naar volgende ronde)</Label>
            <Select
              value={byeTeamId ? String(byeTeamId) : undefined}
              onValueChange={(val) => {
                const id = Number(val);
                setByeTeamId(id);
                onByeSelected && onByeSelected(id);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecteer bye team" />
              </SelectTrigger>
              <SelectContent>
                {teamsForBye.map((t) => (
                  <SelectItem key={t.team_id} value={String(t.team_id)}>{t.team_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground">Bij oneven aantal teams kan één team automatisch doorstromen.</div>
          </div>
        )}
      </div>
      <div className="bg-white rounded-lg p-4 mt-3">
        <div className="space-y-3">
          {loading ? (
            <BekerLoadingComponent />
          ) : (
            <div className="space-y-3">
              {bekerRounds.map((round, roundIndex) => (
                <div key={roundIndex}>
                  <BekerRoundComponent
                    round={round}
                    selectedDates={selectedDates}
                    minimumDates={bekerMinimumDates}
                    onDateChange={handleBekerDateChange}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-3">
            <button 
              onClick={handleBekerSubmit}
              disabled={isBekerSubmitDisabled}
              className="btn btn--primary flex-1"
            >
              {isLoading ? "Beker aanmaken..." : "Beker Data Bevestigen"}
            </button>
            <button 
              onClick={onCancel}
              disabled={isLoading}
              className="btn btn--secondary"
            >
              Annuleren
            </button>
          </div>

          <BekerValidationError
            isValidSelection={isBekerSelectionValid}
            selectedDates={selectedDates}
            seasonStartDate={seasonStartDate}
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(BekerDateSelector); 