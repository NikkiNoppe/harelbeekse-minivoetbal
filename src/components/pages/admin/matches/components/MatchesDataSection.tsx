import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { MatchFormData } from "../types";
import { refereeService, type Referee } from "@/services/core";

interface MatchDataSectionProps {
  match: MatchFormData;
  selectedReferee: string;
  onRefereeChange: (value: string) => void;
  onMatchDataChange?: (field: string, value: string) => void;
  canEdit: boolean;
  canEditMatchData: boolean;
}

// Memoized input field component
const MatchInputField = React.memo<{
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}>(({ id, label, type = "text", value, onChange, disabled = false, placeholder }) => (
  <div className="space-y-2">
    <Label htmlFor={id} style={{ color: 'var(--accent)' }}>{label}</Label>
    <Input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder={placeholder}
      className="input-login-style h-8 text-sm"
    />
  </div>
));

// Memoized referee selector component
const RefereeSelector = React.memo<{
  referees: Referee[];
  selectedReferee: string;
  onRefereeChange: (value: string) => void;
  loading: boolean;
  disabled: boolean;
}>(({ referees, selectedReferee, onRefereeChange, loading, disabled }) => {
  // Check if selectedReferee exists in the referees list
  const selectedRefereeExists = referees.some(ref => ref.username === selectedReferee);
  // Use selectedReferee if it exists, otherwise undefined (will show placeholder)
  const selectValue = selectedReferee && (selectedRefereeExists || !loading) ? selectedReferee : undefined;
  
  return (
    <div className="space-y-2 w-full">
      <Label htmlFor="match-referee" style={{ color: 'var(--accent)' }}>Scheidsrechter</Label>
      <Select
        value={selectValue}
        onValueChange={onRefereeChange}
        disabled={disabled || loading}
      >
        <SelectTrigger className="dropdown-login-style h-8 text-sm w-full md:w-auto">
          <SelectValue placeholder={loading ? "Laden..." : selectedReferee || "Selecteer scheidsrechter"} />
        </SelectTrigger>
        <SelectContent className="dropdown-content-login-style z-modal bg-card" style={{ backgroundColor: 'white' }}>
          {/* Show selected referee even if not in list yet (during loading or mismatch) */}
          {selectedReferee && !selectedRefereeExists && (
            <SelectItem 
              value={selectedReferee} 
              className="dropdown-item-login-style opacity-75"
            >
              {selectedReferee}
            </SelectItem>
          )}
          {referees.map((referee) => (
            <SelectItem key={referee.user_id} value={referee.username} className="dropdown-item-login-style">
              {referee.username}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
});


export const MatchDataSection: React.FC<MatchDataSectionProps> = ({
  match,
  selectedReferee,
  onRefereeChange,
  onMatchDataChange,
  canEdit,
  canEditMatchData
}) => {
  const [referees, setReferees] = useState<Referee[]>([]);
  const [loadingReferees, setLoadingReferees] = useState(true);
  const [isGegevensOpen, setIsGegevensOpen] = useState(false);

  // Load referees from database
  useEffect(() => {
    const loadReferees = async () => {
      const startTime = Date.now();
      const MIN_LOADING_TIME = 250; // Minimum 250ms loading time for better UX
      
      try {
        setLoadingReferees(true);
        const refereesData = await refereeService.getReferees();
        setReferees(refereesData);
        console.log(`✅ Loaded ${refereesData.length} referees`);
      } catch (error) {
        console.error('Error loading referees:', error);
      } finally {
        // Ensure minimum loading time for better UX
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsed);
        if (remainingTime > 0) {
          setTimeout(() => {
            setLoadingReferees(false);
          }, remainingTime);
        } else {
          setLoadingReferees(false);
        }
      }
    };

    loadReferees();
  }, []);

  // Memoize handlers to prevent unnecessary re-renders
  const handleDateChange = useCallback((value: string) => {
    onMatchDataChange?.("date", value);
  }, [onMatchDataChange]);

  const handleTimeChange = useCallback((value: string) => {
    onMatchDataChange?.("time", value);
  }, [onMatchDataChange]);

  const handleLocationChange = useCallback((value: string) => {
    onMatchDataChange?.("location", value);
  }, [onMatchDataChange]);

  const handleMatchdayChange = useCallback((value: string) => {
    onMatchDataChange?.("matchday", value);
  }, [onMatchDataChange]);

  // Memoize the component to prevent unnecessary re-renders
  const memoizedReferees = useMemo(() => referees, [referees]);

  return (
    <div className="space-y-4">
      {/* Gegevens - Collapsible */}
      <Collapsible open={isGegevensOpen} onOpenChange={setIsGegevensOpen}>
        <Card className="bg-card border border-[var(--color-400)] rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 bg-white">
          <CollapsibleTrigger asChild>
            <CardHeader className="text-sm font-semibold px-5 hover:bg-[var(--color-50)] data-[state=open]:bg-[var(--color-100)] transition-colors duration-200 text-[var(--color-700)] hover:text-[var(--color-900)] gap-4" style={{ color: 'var(--color-700)', height: '61px', padding: 0, display: 'flex', alignItems: 'center', backgroundColor: isGegevensOpen ? 'var(--color-100)' : 'white' }}>
              <div className="flex items-center justify-between w-full px-5" style={{ marginTop: '21px', marginBottom: '21px' }}>
                <CardTitle className="flex items-center gap-2 text-sm m-0">
                  Gegevens
                </CardTitle>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform duration-200 [&[data-state=open]]:rotate-180 shrink-0",
                    isGegevensOpen && "transform rotate-180"
                  )}
                />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent className="border-t border-[var(--color-200)]">
            <CardContent className="pt-4 space-y-4">
              {/* First row: Date, Time (1/2 - 1/2 on mobile) */}
              <div className="grid grid-cols-2 md:grid-cols-2 gap-2 md:gap-4">
                <MatchInputField
                  id="match-date"
                  label="Datum"
                  type="date"
                  value={match.date}
                  onChange={handleDateChange}
                  disabled={!canEditMatchData}
                />
                
                <MatchInputField
                  id="match-time"
                  label="Tijd"
                  type="time"
                  value={match.time}
                  onChange={handleTimeChange}
                  disabled={!canEditMatchData}
                />
              </div>

              {/* Second row: Location full width */}
              <div className="grid grid-cols-1 gap-4">
                <MatchInputField
                  id="match-location"
                  label="Locatie"
                  value={match.location}
                  onChange={handleLocationChange}
                  disabled={!canEditMatchData}
                  placeholder="Wedstrijdlocatie"
                />
              </div>

              {/* Administratieve gegevens */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                <MatchInputField
                  id="match-matchday"
                  label="Speeldag"
                  value={match.matchday || ""}
                  onChange={handleMatchdayChange}
                  disabled={!canEditMatchData}
                  placeholder="Speeldag"
                />
                
                <div className="w-full md:w-auto">
                  <RefereeSelector
                    referees={memoizedReferees}
                    selectedReferee={selectedReferee}
                    onRefereeChange={onRefereeChange}
                    loading={loadingReferees}
                    disabled={!canEdit}
                  />
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
};

export default React.memo(MatchDataSection);
