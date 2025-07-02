
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlayerSelection } from "../types";
import { TeamPlayer } from "./useTeamPlayers";

interface CaptainSelectionProps {
  selections: PlayerSelection[];
  players: TeamPlayer[] | undefined;
  canEdit: boolean;
  onChange: (playerId: string) => void;
}

const CaptainSelection: React.FC<CaptainSelectionProps> = ({
  selections,
  players,
  canEdit,
  onChange,
}) => {
  if (!canEdit) return null;

  // Only allow captain selection for selected players
  const selectedPlayers = selections.filter((sel) => sel.playerId !== null);
  const currentCaptain = selections.find((sel) => sel.isCaptain)?.playerId?.toString() || "no-captain";

  const handleCaptainChange = (value: string) => {
    console.log('Captain selection changed:', value);
    onChange(value);
  };

  return (
    <div className="mt-2 mb-2">
      <Label className="text-sm font-medium">Kapitein</Label>
      <Select
        value={currentCaptain}
        onValueChange={handleCaptainChange}
      >
        <SelectTrigger className="w-[180px] mt-1 dropdown-login-style">
          <SelectValue placeholder="Selecteer kapitein" />
        </SelectTrigger>
        <SelectContent className="dropdown-content-login-style">
          <SelectItem value="no-captain" className="dropdown-item-login-style">Geen kapitein</SelectItem>
          {selectedPlayers.map((sel) => {
            let name = sel.playerName;
            const dbPlayer = Array.isArray(players)
              ? players.find((p) => p.player_id === sel.playerId)
              : undefined;
            if (dbPlayer) {
              name = `${dbPlayer.first_name} ${dbPlayer.last_name}`;
            }
            return (
              <SelectItem key={sel.playerId!} value={sel.playerId?.toString() || "no-captain"} className="dropdown-item-login-style">
                {name}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CaptainSelection;
