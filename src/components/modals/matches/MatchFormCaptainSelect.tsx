import React, { useCallback, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PlayerSelection } from "@/components/pages/admin/matches/types";

interface MatchFormCaptainSelectProps {
  selections: PlayerSelection[];
  canEditTeam: boolean;
  teamLabel: string;
  isHomeTeam: boolean;
  onCaptainChange: (captainPlayerId: string, isHomeTeam: boolean) => void;
}

export function MatchFormCaptainSelect({
  selections,
  canEditTeam,
  teamLabel,
  isHomeTeam,
  onCaptainChange,
}: MatchFormCaptainSelectProps) {
  const availablePlayers = useMemo(
    () => selections.filter((selection) => selection.playerId !== null),
    [selections],
  );

  const currentCaptain = useMemo(
    () => selections.find((selection) => selection.isCaptain),
    [selections],
  );

  const captainValue = useMemo(
    () => currentCaptain?.playerId?.toString() || "no-captain",
    [currentCaptain],
  );

  const hasPlayers = availablePlayers.length > 0;

  const handleCaptainChangeLocal = useCallback(
    (value: string) => {
      onCaptainChange(value, isHomeTeam);
    },
    [isHomeTeam, onCaptainChange],
  );

  return (
    <div className="space-y-2">
      <Label htmlFor={`captain-select-${isHomeTeam ? "home" : "away"}`}>
        Aanvoerder{teamLabel ? ` — ${teamLabel}` : ""}
      </Label>
      <Select
        value={captainValue}
        onValueChange={handleCaptainChangeLocal}
        disabled={!canEditTeam || !hasPlayers}
      >
        <SelectTrigger
          id={`captain-select-${isHomeTeam ? "home" : "away"}`}
          className="dropdown-login-style mt-1 h-8 w-full text-sm"
        >
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
                  {selection.jerseyNumber ? `${selection.jerseyNumber} - ` : ""}
                  {selection.playerName || `Speler ${selection.playerId}`}
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
}
