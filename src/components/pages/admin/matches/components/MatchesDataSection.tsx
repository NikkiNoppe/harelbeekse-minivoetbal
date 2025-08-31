import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MatchFormData } from "../types";
import { refereeService, type Referee } from "@/services/core";

interface MatchDataSectionProps {
  match: MatchFormData;
  homeScore: string;
  awayScore: string;
  selectedReferee: string;
  onHomeScoreChange: (value: string) => void;
  onAwayScoreChange: (value: string) => void;
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
    <Label htmlFor={id}>{label}</Label>
    <Input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder={placeholder}
      className="input-login-style h-9"
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
}>(({ referees, selectedReferee, onRefereeChange, loading, disabled }) => (
  <div className="space-y-2">
    <Label htmlFor="match-referee">Scheidsrechter</Label>
    <Select
      value={selectedReferee}
      onValueChange={onRefereeChange}
      disabled={disabled || loading}
    >
      <SelectTrigger className="dropdown-login-style h-9">
        <SelectValue placeholder={loading ? "Laden..." : "Selecteer scheidsrechter"} />
      </SelectTrigger>
      <SelectContent className="dropdown-content-login-style z-[1000] bg-white">
        {referees.map((referee) => (
          <SelectItem key={referee.user_id} value={referee.username} className="dropdown-item-login-style">
            {referee.username}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
));

// Memoized score input component
const ScoreInput = React.memo<{
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}>(({ id, label, value, onChange, disabled }) => (
  <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    <Input
      id={id}
      type="number"
      min="0"
      max="99"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="input-login-style h-9 text-center"
    />
  </div>
));

export const MatchDataSection: React.FC<MatchDataSectionProps> = ({
  match,
  homeScore,
  awayScore,
  selectedReferee,
  onHomeScoreChange,
  onAwayScoreChange,
  onRefereeChange,
  onMatchDataChange,
  canEdit,
  canEditMatchData
}) => {
  const [referees, setReferees] = useState<Referee[]>([]);
  const [loadingReferees, setLoadingReferees] = useState(true);

  // Load referees from database
  useEffect(() => {
    const loadReferees = async () => {
      try {
        setLoadingReferees(true);
        const refereesData = await refereeService.getReferees();
        setReferees(refereesData);
      } catch (error) {
        console.error('Error loading referees:', error);
      } finally {
        setLoadingReferees(false);
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
      {/* Match Details - 2 rows layout */}
      <div className="space-y-4">
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

        {/* Second row: Location full width, then Matchday + Referee side by side */}
        <div className="grid grid-cols-1 gap-4">
          <MatchInputField
            id="match-location"
            label="Locatie"
            value={match.location}
            onChange={handleLocationChange}
            disabled={!canEditMatchData}
            placeholder="Wedstrijdlocatie"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
            <MatchInputField
              id="match-matchday"
              label="Speeldag"
              value={match.matchday || ""}
              onChange={handleMatchdayChange}
              disabled={!canEditMatchData}
              placeholder="Speeldag"
            />
            <RefereeSelector
              referees={memoizedReferees}
              selectedReferee={selectedReferee}
              onRefereeChange={onRefereeChange}
              loading={loadingReferees}
              disabled={!canEdit}
            />
          </div>
        </div>
      </div>

      {/* Score Section */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-2 gap-2 md:gap-4">
          <ScoreInput
            id="home-score"
            label={`${match.homeTeamName}`}
            value={homeScore}
            onChange={onHomeScoreChange}
            disabled={!canEdit}
          />
          <ScoreInput
            id="away-score"
            label={`${match.awayTeamName}`}
            value={awayScore}
            onChange={onAwayScoreChange}
            disabled={!canEdit}
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(MatchDataSection);
