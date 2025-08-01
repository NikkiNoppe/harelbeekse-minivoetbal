
import React, { useMemo, useCallback } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { PlayerSelection } from "../types";

interface MatchesCaptainSelectionProps {
  selections: PlayerSelection[];
  onCaptainChange: (playerId: number | null) => void;
  canEdit: boolean;
}

const MatchesCaptainSelection: React.FC<MatchesCaptainSelectionProps> = ({
  selections,
  onCaptainChange,
  canEdit,
}) => {
  // Memoize available players (those with playerId)
  const availablePlayers = useMemo(() => {
    return selections.filter(selection => selection.playerId !== null);
  }, [selections]);

  // Memoize current captain
  const currentCaptain = useMemo(() => {
    return selections.find(selection => selection.isCaptain);
  }, [selections]);

  // Memoize captain change handler
  const handleCaptainChange = useCallback((value: string) => {
    if (value === "no-captain") {
      onCaptainChange(null);
    } else {
      onCaptainChange(parseInt(value));
    }
  }, [onCaptainChange]);

  // Memoize the component to prevent unnecessary re-renders
  const captainValue = useMemo(() => {
    return currentCaptain?.playerId?.toString() || "no-captain";
  }, [currentCaptain]);

  if (availablePlayers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="captain-select">Aanvoerder</Label>
      <Select
        value={captainValue}
        onValueChange={handleCaptainChange}
        disabled={!canEdit}
      >
        <SelectTrigger className="w-[180px] mt-1 dropdown-login-style">
          <SelectValue placeholder="Selecteer aanvoerder" />
        </SelectTrigger>
        <SelectContent className="dropdown-content-login-style">
          <SelectItem value="no-captain" className="dropdown-item-login-style">
            Geen aanvoerder
          </SelectItem>
          {availablePlayers.map((selection) => (
            <SelectItem
              key={selection.playerId}
              value={selection.playerId!.toString()}
              className="dropdown-item-login-style"
            >
              {selection.playerName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default React.memo(MatchesCaptainSelection);
