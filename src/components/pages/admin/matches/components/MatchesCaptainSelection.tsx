
import React, { useMemo, useCallback } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { PlayerSelection } from "../types";

interface MatchesCaptainSelectionProps {
  selections: PlayerSelection[];
  onCaptainChange: (playerId: number | null) => void;
  canEdit: boolean;
  teamLabel?: string;
}

const MatchesCaptainSelection: React.FC<MatchesCaptainSelectionProps> = ({
  selections,
  onCaptainChange,
  canEdit,
  teamLabel,
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
  const currentCaptainName = useMemo(() => currentCaptain?.playerName || null, [currentCaptain]);

  const hasPlayers = availablePlayers.length > 0;

  return (
    <div className="space-y-2">
      <Label htmlFor="captain-select">Aanvoerder{teamLabel ? ` — ${teamLabel}` : ''}</Label>
      <Select
        value={captainValue}
        onValueChange={handleCaptainChange}
        disabled={!canEdit || !hasPlayers}
      >
        <SelectTrigger className="w-full h-8 text-sm mt-1 dropdown-login-style">
          <SelectValue placeholder={hasPlayers ? "Selecteer aanvoerder" : "Geen spelers beschikbaar"} />
        </SelectTrigger>
        <SelectContent className="dropdown-content-login-style z-[1000] bg-white">
          {hasPlayers ? (
            <>
              <SelectItem value="no-captain" className="dropdown-item-login-style">
                Geen aanvoerder
              </SelectItem>
              {availablePlayers.map((selection) => (
                <SelectItem
                  key={selection.playerId}
                  value={selection.playerId!.toString()}
                  className="dropdown-item-login-style"
                >
                  {selection.playerName || `Speler #${selection.playerId}`}
                </SelectItem>
              ))}
            </>
          ) : (
            <SelectItem value="no-captain" disabled className="dropdown-item-login-style">
              Geen spelers geselecteerd
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default React.memo(MatchesCaptainSelection);
