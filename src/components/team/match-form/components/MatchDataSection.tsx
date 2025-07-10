import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MatchFormData } from "../types";
import { refereeService, type Referee } from "@/services/refereeService";

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

  return (
    <div className="space-y-4">
      <h3 className="text-2xl text-center text-purple-light">
        ⚽ Wedstrijdgegevens
      </h3>
      
      {/* Match Details - 2 rows layout */}
      <div className="space-y-4">
        {/* First row: Date, Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="match-date">Datum</Label>
            <Input
              id="match-date"
              type="date"
              value={match.date}
              onChange={(e) => onMatchDataChange?.("date", e.target.value)}
              disabled={!canEditMatchData}
              className="input-login-style"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="match-time">Tijd</Label>
            <Input
              id="match-time"
              type="time"
              value={match.time}
              onChange={(e) => onMatchDataChange?.("time", e.target.value)}
              disabled={!canEditMatchData}
              className="input-login-style"
            />
          </div>
        </div>

        {/* Second row: Location, Matchday, Referee */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="match-location">Locatie</Label>
            <Input
              id="match-location"
              value={match.location}
              onChange={(e) => onMatchDataChange?.("location", e.target.value)}
              disabled={!canEditMatchData}
              placeholder="Wedstrijdlocatie"
              className="input-login-style"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="match-matchday">Speeldag</Label>
            <Input
              id="match-matchday"
              value={match.matchday}
              onChange={(e) => onMatchDataChange?.("matchday", e.target.value)}
              disabled={!canEditMatchData}
              placeholder="bijv. 11"
              className="input-login-style text-center"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="match-referee">Scheidsrechter</Label>
            <Select
              value={selectedReferee}
              onValueChange={onRefereeChange}
              disabled={!canEdit || !canEditMatchData}
            >
              <SelectTrigger className="dropdown-login-style text-right">
                <SelectValue placeholder="Selecteer scheidsrechter" />
              </SelectTrigger>
              <SelectContent className="dropdown-content-login-style">
                {loadingReferees ? (
                  <SelectItem value="loading" disabled className="dropdown-item-login-style">
                    Laden...
                  </SelectItem>
                ) : referees.length === 0 ? (
                  <SelectItem value="no-referees" disabled className="dropdown-item-login-style">
                    Geen scheidsrechters beschikbaar
                  </SelectItem>
                ) : (
                  referees.map((referee) => (
                    <SelectItem
                      key={referee.user_id}
                      value={referee.username}
                      className="dropdown-item-login-style"
                    >
                      {referee.username}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Score Input */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="space-y-2">
          <Label htmlFor="homeScore" className="font-semibold">{match.homeTeamName}</Label>
          <Input
            id="homeScore"
            type="number"
            min="0"
            value={homeScore}
            onChange={(e) => {
              onHomeScoreChange(e.target.value);
            }}
            disabled={!canEdit || !canEditMatchData}
            className="text-center text-lg font-bold input-login-style"
          />
        </div>
        
        <div className="flex justify-center items-center">
          <span className="text-3xl font-bold text-[var(--main-color-dark)]">-</span>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="awayScore" className="font-semibold">{match.awayTeamName}</Label>
          <Input
            id="awayScore"
            type="number"
            min="0"
            value={awayScore}
            onChange={(e) => {
              onAwayScoreChange(e.target.value);
            }}
            disabled={!canEdit || !canEditMatchData}
            className="text-center text-lg font-bold input-login-style"
          />
        </div>
      </div>


    </div>
  );
};
