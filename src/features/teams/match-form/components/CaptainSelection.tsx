import React from "react";
import { PlayerSelection } from "./types";
import { Label } from "@shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select";

interface CaptainSelectionProps {
  playerList: PlayerSelection[];
  selectedCaptainId: number | null;
  onCaptainChange: (playerId: number | null) => void;
  disabled?: boolean;
}

export const CaptainSelection: React.FC<CaptainSelectionProps> = ({
  playerList,
  selectedCaptainId,
  onCaptainChange,
  disabled
}) => {
  return (
    <div>
      <Label htmlFor="captain">Aanvoerder</Label>
      <Select
        value={selectedCaptainId ? selectedCaptainId.toString() : ""}
        onValueChange={(value) => onCaptainChange(value ? parseInt(value, 10) : null)}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecteer aanvoerder" />
        </SelectTrigger>
        <SelectContent>
          {playerList.map((player) => (
            <SelectItem key={player.playerId} value={player.playerId?.toString() || ""}>
              {player.playerName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
